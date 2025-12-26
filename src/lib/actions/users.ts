"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

// Helper function to ensure user exists in database
async function ensureUserExists() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

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
 * Get all users with stats
 */
export async function getAllUsers() {
  await verifyAdmin();

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      username: true,
      imageUrl: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          submissions: true,
          createdRooms: true,
        },
      },
    },
  });

  return users;
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, role: "USER" | "ADMIN") {
  await verifyAdmin();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin/users");

  return user;
}

/**
 * Get user statistics
 */
export async function getUserStatistics(userId: string) {
  await verifyAdmin();

  const [user, submissions, rooms, acceptedSubmissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            submissions: true,
            createdRooms: true,
            participatedRooms: true,
          },
        },
      },
    }),
    prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
    }),
    prisma.collaborationRoom.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        problem: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.submission.count({
      where: {
        userId,
        status: "ACCEPTED",
      },
    }),
  ]);

  return {
    user,
    submissions,
    rooms,
    acceptedSubmissions,
  };
}
