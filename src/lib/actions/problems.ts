"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface StarterCode {
  [language: string]: string;
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

// Helper to verify admin access
async function verifyAdmin() {
  const userId = await ensureUserExists();

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user?.role !== "ADMIN") {
    throw new Error("Admin access required");
  }

  return userId;
}

/**
 * Get all problems (with optional filters)
 */
export async function getProblems(options?: {
  publishedOnly?: boolean;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}) {
  const problems = await prisma.problem.findMany({
    where: {
      ...(options?.publishedOnly ? { isPublished: true } : {}),
      ...(options?.difficulty ? { difficulty: options.difficulty } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      isPublished: true,
      createdAt: true,
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  return problems;
}

/**
 * Get a single problem by slug
 */
export async function getProblemBySlug(slug: string) {
  const problem = await prisma.problem.findUnique({
    where: { slug },
  });

  return problem;
}

/**
 * Get a single problem by ID (admin)
 */
export async function getProblemById(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user?.role !== "ADMIN") {
    throw new Error("Admin access required");
  }

  const problem = await prisma.problem.findUnique({
    where: { id },
  });

  return problem;
}

/**
 * Create a new problem (admin only)
 */
export async function createProblem(data: {
  title: string;
  slug: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  testCases: TestCase[];
  starterCode: StarterCode;
  solution?: StarterCode;
  constraints?: string[];
  hints?: string[];
  isPublished?: boolean;
}) {
  await verifyAdmin();

  // Check if slug already exists
  const existingProblem = await prisma.problem.findUnique({
    where: { slug: data.slug },
  });

  if (existingProblem) {
    throw new Error("A problem with this slug already exists");
  }

  const problem = await prisma.problem.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      difficulty: data.difficulty,
      testCases: data.testCases as unknown as Prisma.InputJsonValue,
      starterCode: data.starterCode as unknown as Prisma.InputJsonValue,
      solution: (data.solution || null) as unknown as Prisma.InputJsonValue,
      constraints: data.constraints || [],
      hints: data.hints || [],
      isPublished: data.isPublished || false,
    },
  });

  revalidatePath("/admin/problems");
  revalidatePath("/problems");

  return problem;
}

/**
 * Update a problem (admin only)
 */
export async function updateProblem(
  id: string,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    testCases?: TestCase[];
    starterCode?: StarterCode;
    solution?: StarterCode | null;
    constraints?: string[];
    hints?: string[];
    isPublished?: boolean;
  }
) {
  await verifyAdmin();

  // If slug is being changed, check for conflicts
  if (data.slug) {
    const existingProblem = await prisma.problem.findFirst({
      where: {
        slug: data.slug,
        NOT: { id },
      },
    });

    if (existingProblem) {
      throw new Error("A problem with this slug already exists");
    }
  }

  const problem = await prisma.problem.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.slug && { slug: data.slug }),
      ...(data.description && { description: data.description }),
      ...(data.difficulty && { difficulty: data.difficulty }),
      ...(data.testCases && {
        testCases: data.testCases as unknown as Prisma.InputJsonValue,
      }),
      ...(data.starterCode && {
        starterCode: data.starterCode as unknown as Prisma.InputJsonValue,
      }),
      ...(data.solution !== undefined && {
        solution: data.solution as unknown as Prisma.InputJsonValue,
      }),
      ...(data.constraints && { constraints: data.constraints }),
      ...(data.hints && { hints: data.hints }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    },
  });

  revalidatePath("/admin/problems");
  revalidatePath(`/problems/${problem.slug}`);
  revalidatePath("/problems");

  return problem;
}

/**
 * Delete a problem (admin only)
 */
export async function deleteProblem(id: string) {
  await verifyAdmin();

  await prisma.problem.delete({
    where: { id },
  });

  revalidatePath("/admin/problems");
  revalidatePath("/problems");
}

/**
 * Toggle problem published status (admin only)
 */
export async function toggleProblemPublished(id: string) {
  await verifyAdmin();

  const problem = await prisma.problem.findUnique({
    where: { id },
  });

  if (!problem) {
    throw new Error("Problem not found");
  }

  const updated = await prisma.problem.update({
    where: { id },
    data: {
      isPublished: !problem.isPublished,
    },
  });

  revalidatePath("/admin/problems");
  revalidatePath("/problems");

  return updated;
}
