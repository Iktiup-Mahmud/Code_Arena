// Submission service with exponential backoff polling
// Saves API quota by intelligently spacing out polling requests

import {
  judge0Client,
  LANGUAGE_IDS,
  mapJudge0Status,
  STATUS_CODES,
  type Judge0Result,
} from "./client";
import prisma from "@/lib/prisma";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface SubmissionResult {
  submissionId: string;
  status: string;
  testResults: TestCaseResult[];
  totalTests: number;
  passedTests: number;
  runtime: number | null;
  memory: number | null;
  error: string | null;
}

interface TestCaseResult {
  index: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  runtime: string | null;
  memory: number | null;
  error: string | null;
  isHidden: boolean;
}

// Polling configuration
const INITIAL_DELAY = 1000; // 1 second
const MAX_DELAY = 10000; // 10 seconds
const MAX_ATTEMPTS = 20; // Maximum polling attempts
const BACKOFF_MULTIPLIER = 1.5;

/**
 * Wait with exponential backoff
 */
async function waitWithBackoff(attempt: number): Promise<void> {
  const delay = Math.min(
    INITIAL_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt),
    MAX_DELAY
  );
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Check if submission is still processing
 */
function isProcessing(statusId: number): boolean {
  return (
    statusId === STATUS_CODES.IN_QUEUE || statusId === STATUS_CODES.PROCESSING
  );
}

/**
 * Poll for single submission result with exponential backoff
 */
async function pollSubmissionResult(token: string): Promise<Judge0Result> {
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    const result = await judge0Client.getSubmission(token);

    if (!isProcessing(result.status.id)) {
      return result;
    }

    await waitWithBackoff(attempt);
    attempt++;
  }

  throw new Error("Submission polling timed out");
}

/**
 * Poll for batch submission results with exponential backoff
 */
async function pollBatchResults(tokens: string[]): Promise<Judge0Result[]> {
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    const results = await judge0Client.getBatchSubmissions(tokens);

    // Check if all submissions are done
    const allDone = results.every((result) => !isProcessing(result.status.id));

    if (allDone) {
      return results;
    }

    await waitWithBackoff(attempt);
    attempt++;
  }

  throw new Error("Batch submission polling timed out");
}

/**
 * Execute code against all test cases and save results
 */
export async function executeSubmission(
  submissionId: string,
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<SubmissionResult> {
  const languageId = LANGUAGE_IDS[language];

  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // Update submission status to RUNNING
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "RUNNING" },
  });

  try {
    // Create batch submissions for all test cases
    const submissions = testCases.map((testCase) => ({
      source_code: code,
      language_id: languageId,
      stdin: testCase.input,
      expected_output: testCase.expectedOutput,
      cpu_time_limit: 5, // 5 seconds
      memory_limit: 128000, // 128 MB
    }));

    // Submit all test cases
    const tokenResponses = await judge0Client.createBatchSubmissions(
      submissions
    );
    const tokens = tokenResponses.map((r) => r.token);

    // Poll for results with exponential backoff
    const results = await pollBatchResults(tokens);

    // Process results
    const testResults: TestCaseResult[] = results.map((result, index) => {
      const testCase = testCases[index];
      const passed = result.status.id === STATUS_CODES.ACCEPTED;

      return {
        index,
        passed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.stdout?.trim() || null,
        runtime: result.time,
        memory: result.memory,
        error:
          result.stderr ||
          result.compile_output ||
          (result.status.id !== STATUS_CODES.ACCEPTED
            ? result.status.description
            : null),
        isHidden: testCase.isHidden || false,
      };
    });

    const passedTests = testResults.filter((r) => r.passed).length;
    const totalTests = testResults.length;

    // Calculate average runtime and max memory
    const runtimes = results
      .map((r) => (r.time ? parseFloat(r.time) * 1000 : null))
      .filter((r): r is number => r !== null);
    const memories = results
      .map((r) => r.memory)
      .filter((m): m is number => m !== null);

    const avgRuntime =
      runtimes.length > 0
        ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length)
        : null;
    const maxMemory = memories.length > 0 ? Math.max(...memories) : null;

    // Determine final status
    let finalStatus:
      | "ACCEPTED"
      | "WRONG_ANSWER"
      | "TIME_LIMIT_EXCEEDED"
      | "MEMORY_LIMIT_EXCEEDED"
      | "RUNTIME_ERROR"
      | "COMPILATION_ERROR";

    if (passedTests === totalTests) {
      finalStatus = "ACCEPTED";
    } else {
      // Find the first failing test case status
      const firstFailure = results.find(
        (r) => r.status.id !== STATUS_CODES.ACCEPTED
      );
      if (firstFailure) {
        const mappedStatus = mapJudge0Status(firstFailure.status.id);
        if (mappedStatus === "RUNNING" || mappedStatus === "PENDING") {
          finalStatus = "WRONG_ANSWER";
        } else {
          finalStatus = mappedStatus;
        }
      } else {
        finalStatus = "WRONG_ANSWER";
      }
    }

    // Get first error message
    const firstError = testResults.find((r) => r.error)?.error || null;

    // Save results to database
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: finalStatus,
        runtime: avgRuntime,
        memory: maxMemory,
        result: {
          testResults: testResults.map((r) => ({
            ...r,
            // Don't expose hidden test case details in stored results
            input: r.isHidden ? "[Hidden]" : r.input,
            expectedOutput: r.isHidden ? "[Hidden]" : r.expectedOutput,
          })),
          passedTests,
          totalTests,
          error: firstError,
        },
      },
    });

    return {
      submissionId,
      status: finalStatus,
      testResults,
      totalTests,
      passedTests,
      runtime: avgRuntime,
      memory: maxMemory,
      error: firstError,
    };
  } catch (error) {
    // Update submission with error status
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "RUNTIME_ERROR",
        result: {
          error: errorMessage,
          testResults: [],
          passedTests: 0,
          totalTests: testCases.length,
        },
      },
    });

    return {
      submissionId,
      status: "RUNTIME_ERROR",
      testResults: [],
      totalTests: testCases.length,
      passedTests: 0,
      runtime: null,
      memory: null,
      error: errorMessage,
    };
  }
}

/**
 * Run code against a single test case (for "Run" button, not full submission)
 */
export async function runSingleTest(
  code: string,
  language: string,
  input: string
): Promise<{
  output: string | null;
  error: string | null;
  runtime: string | null;
  memory: number | null;
  status: string;
}> {
  const languageId = LANGUAGE_IDS[language];

  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // Submit single test
  const { token } = await judge0Client.createSubmission({
    source_code: code,
    language_id: languageId,
    stdin: input,
    cpu_time_limit: 5,
    memory_limit: 128000,
  });

  // Poll for result
  const result = await pollSubmissionResult(token);

  return {
    output: result.stdout?.trim() || null,
    error: result.stderr || result.compile_output || null,
    runtime: result.time,
    memory: result.memory,
    status: result.status.description,
  };
}
