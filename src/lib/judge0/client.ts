// Judge0 API Client for code execution
// Using RapidAPI's Judge0 CE (Community Edition)

const JUDGE0_API_URL =
  process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "judge0-ce.p.rapidapi.com";

// Language ID mappings for Judge0
// Full list: https://ce.judge0.com/languages
export const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63, // Node.js 12.14.0
  python: 71, // Python 3.8.1
  java: 62, // Java (OpenJDK 13.0.1)
  cpp: 54, // C++ (GCC 9.2.0)
  c: 50, // C (GCC 9.2.0)
  typescript: 74, // TypeScript 3.7.4
  go: 60, // Go 1.13.5
  rust: 73, // Rust 1.40.0
  ruby: 72, // Ruby 2.7.0
  csharp: 51, // C# (Mono 6.6.0.161)
  php: 68, // PHP 7.4.1
  swift: 83, // Swift 5.2.3
  kotlin: 78, // Kotlin 1.3.70
};

export const LANGUAGE_NAMES: Record<string, string> = {
  javascript: "JavaScript (Node.js)",
  python: "Python 3",
  java: "Java",
  cpp: "C++",
  c: "C",
  typescript: "TypeScript",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  csharp: "C#",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
};

// Judge0 submission status codes
export const STATUS_CODES = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
} as const;

// Map Judge0 status to our submission status
export function mapJudge0Status(
  statusId: number
): "PENDING" | "RUNNING" | "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "MEMORY_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "COMPILATION_ERROR" {
  switch (statusId) {
    case STATUS_CODES.IN_QUEUE:
    case STATUS_CODES.PROCESSING:
      return "RUNNING";
    case STATUS_CODES.ACCEPTED:
      return "ACCEPTED";
    case STATUS_CODES.WRONG_ANSWER:
      return "WRONG_ANSWER";
    case STATUS_CODES.TIME_LIMIT_EXCEEDED:
      return "TIME_LIMIT_EXCEEDED";
    case STATUS_CODES.COMPILATION_ERROR:
      return "COMPILATION_ERROR";
    case STATUS_CODES.RUNTIME_ERROR_SIGSEGV:
    case STATUS_CODES.RUNTIME_ERROR_SIGXFSZ:
    case STATUS_CODES.RUNTIME_ERROR_SIGFPE:
    case STATUS_CODES.RUNTIME_ERROR_SIGABRT:
    case STATUS_CODES.RUNTIME_ERROR_NZEC:
    case STATUS_CODES.RUNTIME_ERROR_OTHER:
    case STATUS_CODES.INTERNAL_ERROR:
    case STATUS_CODES.EXEC_FORMAT_ERROR:
      return "RUNTIME_ERROR";
    default:
      return "PENDING";
  }
}

export interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number; // seconds
  memory_limit?: number; // KB
}

export interface Judge0Result {
  token: string;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null; // seconds
  memory: number | null; // KB
}

export interface Judge0SubmissionResponse {
  token: string;
}

class Judge0Client {
  private headers: HeadersInit;

  constructor() {
    this.headers = {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    };
  }

  /**
   * Submit code for execution
   */
  async createSubmission(
    submission: Judge0Submission
  ): Promise<Judge0SubmissionResponse> {
    const response = await fetch(
      `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=false`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          ...submission,
          source_code: Buffer.from(submission.source_code).toString("base64"),
          stdin: submission.stdin
            ? Buffer.from(submission.stdin).toString("base64")
            : undefined,
          expected_output: submission.expected_output
            ? Buffer.from(submission.expected_output).toString("base64")
            : undefined,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Judge0 submission failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get submission result by token
   */
  async getSubmission(token: string): Promise<Judge0Result> {
    const response = await fetch(
      `${JUDGE0_API_URL}/submissions/${token}?base64_encoded=true&fields=token,stdout,stderr,compile_output,message,status,time,memory`,
      {
        method: "GET",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Judge0 fetch failed: ${error}`);
    }

    const result = await response.json();

    // Decode base64 fields
    return {
      ...result,
      stdout: result.stdout
        ? Buffer.from(result.stdout, "base64").toString("utf-8")
        : null,
      stderr: result.stderr
        ? Buffer.from(result.stderr, "base64").toString("utf-8")
        : null,
      compile_output: result.compile_output
        ? Buffer.from(result.compile_output, "base64").toString("utf-8")
        : null,
    };
  }

  /**
   * Create batch submissions (for multiple test cases)
   */
  async createBatchSubmissions(
    submissions: Judge0Submission[]
  ): Promise<Judge0SubmissionResponse[]> {
    const response = await fetch(
      `${JUDGE0_API_URL}/submissions/batch?base64_encoded=true`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          submissions: submissions.map((sub) => ({
            ...sub,
            source_code: Buffer.from(sub.source_code).toString("base64"),
            stdin: sub.stdin
              ? Buffer.from(sub.stdin).toString("base64")
              : undefined,
            expected_output: sub.expected_output
              ? Buffer.from(sub.expected_output).toString("base64")
              : undefined,
          })),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Judge0 batch submission failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get batch submission results
   */
  async getBatchSubmissions(tokens: string[]): Promise<Judge0Result[]> {
    const response = await fetch(
      `${JUDGE0_API_URL}/submissions/batch?tokens=${tokens.join(",")}&base64_encoded=true&fields=token,stdout,stderr,compile_output,message,status,time,memory`,
      {
        method: "GET",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Judge0 batch fetch failed: ${error}`);
    }

    const results = await response.json();

    // Decode base64 fields for each result
    return results.submissions.map((result: Judge0Result) => ({
      ...result,
      stdout: result.stdout
        ? Buffer.from(result.stdout, "base64").toString("utf-8")
        : null,
      stderr: result.stderr
        ? Buffer.from(result.stderr, "base64").toString("utf-8")
        : null,
      compile_output: result.compile_output
        ? Buffer.from(result.compile_output, "base64").toString("utf-8")
        : null,
    }));
  }
}

// Export singleton instance
export const judge0Client = new Judge0Client();

