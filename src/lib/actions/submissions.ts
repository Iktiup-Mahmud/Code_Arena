"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import {
  executeSubmission,
  runSingleTest,
} from "@/lib/judge0/submission-service";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

// Helper function to ensure user exists in database
async function ensureUserExists() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check if user exists in database
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  // If user doesn't exist, create them from Clerk data
  if (!existingUser) {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      throw new Error("Unable to fetch user data");
    }

    await prisma.user.create({
      data: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        username: clerkUser.username || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    });
  }

  return userId;
}

/**
 * Create a new submission and execute it
 */
export async function createSubmission(data: {
  problemId: string;
  code: string;
  language: string;
  roomId?: string;
}) {
  const userId = await ensureUserExists();

  // Get problem with test cases
  const problem = await prisma.problem.findUnique({
    where: { id: data.problemId },
  });

  if (!problem) {
    throw new Error("Problem not found");
  }

  // Create submission record
  const submission = await prisma.submission.create({
    data: {
      code: data.code,
      language: data.language,
      status: "PENDING",
      userId,
      problemId: data.problemId,
      roomId: data.roomId || null,
    },
  });

  // Execute submission asynchronously
  // Note: In production, you might want to use a queue (like BullMQ)
  const testCases = problem.testCases as unknown as TestCase[];

  try {
    const result = await executeSubmission(
      submission.id,
      data.code,
      data.language,
      testCases
    );

    revalidatePath(`/submissions/${submission.id}`);
    revalidatePath(`/problems/${problem.slug}`);

    return result;
  } catch (error) {
    // Update submission with error
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: "RUNTIME_ERROR",
        result: {
          error: error instanceof Error ? error.message : "Execution failed",
        },
      },
    });

    throw error;
  }
}

/**
 * Run code against custom input (for testing without submitting)
 */
export async function runCode(data: {
  code: string;
  language: string;
  input: string;
}) {
  await ensureUserExists();

  try {
    const result = await runSingleTest(data.code, data.language, data.input);
    return result;
  } catch (error) {
    return {
      output: null,
      error: error instanceof Error ? error.message : "Execution failed",
      runtime: null,
      memory: null,
      status: "Error",
    };
  }
}

/**
 * Get submission by ID
 */
export async function getSubmission(submissionId: string) {
  const userId = await ensureUserExists();

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      problem: true,
      user: true,
    },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  // Users can only see their own submissions (unless admin)
  if (submission.userId !== userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }
  }

  return submission;
}

/**
 * Get user's submissions for a problem
 */
export async function getUserSubmissions(problemId?: string) {
  const userId = await ensureUserExists();

  const submissions = await prisma.submission.findMany({
    where: {
      userId,
      ...(problemId ? { problemId } : {}),
    },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return submissions;
}

/**
 * Get all submissions for a problem (admin only)
 */
export async function getProblemSubmissions(problemId: string) {
  const userId = await ensureUserExists();

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user?.role !== "ADMIN") {
    throw new Error("Admin access required");
  }

  const submissions = await prisma.submission.findMany({
    where: { problemId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return submissions;
}

/**
 * Get submission statistics for a user
 */
export async function getUserStats() {
  const userId = await ensureUserExists();

  const [totalSubmissions, acceptedSubmissions, problemsSolved] =
    await Promise.all([
      prisma.submission.count({
        where: { userId },
      }),
      prisma.submission.count({
        where: { userId, status: "ACCEPTED" },
      }),
      prisma.submission.groupBy({
        by: ["problemId"],
        where: { userId, status: "ACCEPTED" },
      }),
    ]);

  // Get submissions by difficulty
  const solvedProblems = await prisma.problem.findMany({
    where: {
      id: { in: problemsSolved.map((p) => p.problemId) },
    },
    select: {
      difficulty: true,
    },
  });

  const byDifficulty = {
    EASY: solvedProblems.filter((p) => p.difficulty === "EASY").length,
    MEDIUM: solvedProblems.filter((p) => p.difficulty === "MEDIUM").length,
    HARD: solvedProblems.filter((p) => p.difficulty === "HARD").length,
  };

  return {
    totalSubmissions,
    acceptedSubmissions,
    problemsSolved: problemsSolved.length,
    acceptanceRate:
      totalSubmissions > 0
        ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
        : 0,
    byDifficulty,
  };
}
