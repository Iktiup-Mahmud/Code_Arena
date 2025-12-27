"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

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

export async function createRoom(data: {
  name: string;
  problemId?: string;
  language?: string;
}) {
  const userId = await ensureUserExists();

  // Check if user already has a room with this name
  const existingRoom = await prisma.collaborationRoom.findFirst({
    where: {
      creatorId: userId,
      name: data.name,
      isActive: true,
    },
  });

  if (existingRoom) {
    throw new Error(
      "You already have a room with this name. Please choose a different name."
    );
  }

  const room = await prisma.collaborationRoom.create({
    data: {
      name: data.name,
      code: nanoid(8), // Short shareable code
      language: data.language || "javascript",
      creatorId: userId,
      problemId: data.problemId || null,
    },
    include: {
      problem: true,
    },
  });

  // Add creator as first participant
  await prisma.roomParticipant.create({
    data: {
      userId,
      roomId: room.id,
    },
  });

  revalidatePath("/rooms");
  return room;
}

export async function joinRoom(roomCode: string) {
  const userId = await ensureUserExists();

  const room = await prisma.collaborationRoom.findUnique({
    where: { code: roomCode },
    include: {
      problem: true,
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!room) {
    throw new Error("Room not found");
  }

  if (!room.isActive) {
    throw new Error("Room is no longer active");
  }

  // Check if user is already a participant
  const existingParticipant = await prisma.roomParticipant.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId: room.id,
      },
    },
  });

  if (!existingParticipant) {
    await prisma.roomParticipant.create({
      data: {
        userId,
        roomId: room.id,
      },
    });
  } else if (existingParticipant.leftAt) {
    // User is rejoining
    await prisma.roomParticipant.update({
      where: { id: existingParticipant.id },
      data: { leftAt: null, joinedAt: new Date() },
    });
  }

  return room;
}

export async function leaveRoom(roomId: string) {
  const userId = await ensureUserExists();

  await prisma.roomParticipant.updateMany({
    where: {
      userId,
      roomId,
    },
    data: {
      leftAt: new Date(),
    },
  });

  revalidatePath("/rooms");
}

export async function getRoomByCode(code: string) {
  const room = await prisma.collaborationRoom.findUnique({
    where: { code },
    include: {
      problem: true,
      creator: true,
      participants: {
        where: { leftAt: null },
        include: {
          user: true,
        },
      },
    },
  });

  return room;
}

export async function getUserRooms() {
  const userId = await ensureUserExists();

  const rooms = await prisma.collaborationRoom.findMany({
    where: {
      OR: [
        { creatorId: userId },
        {
          participants: {
            some: {
              userId,
              leftAt: null,
            },
          },
        },
      ],
      isActive: true,
    },
    include: {
      problem: true,
      creator: true,
      participants: {
        where: { leftAt: null },
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return rooms;
}

export async function getAllRooms() {
  await ensureUserExists();

  const rooms = await prisma.collaborationRoom.findMany({
    where: {
      isActive: true,
    },
    include: {
      problem: true,
      creator: true,
      participants: {
        where: { leftAt: null },
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return rooms;
}

export async function updateRoomCode(roomId: string, code: string) {
  await ensureUserExists();

  await prisma.collaborationRoom.update({
    where: { id: roomId },
    data: {
      currentCode: code,
      updatedAt: new Date(),
    },
  });
}

export async function updateRoomProblem(
  roomId: string,
  problemId: string | null
) {
  await ensureUserExists();

  await prisma.collaborationRoom.update({
    where: { id: roomId },
    data: {
      problemId: problemId,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/playground/[roomCode]", "page");
}

export async function closeRoom(roomId: string) {
  const userId = await ensureUserExists();

  const room = await prisma.collaborationRoom.findUnique({
    where: { id: roomId },
  });

  if (!room || room.creatorId !== userId) {
    throw new Error("Only the room creator can close the room");
  }

  await prisma.collaborationRoom.update({
    where: { id: roomId },
    data: { isActive: false },
  });

  revalidatePath("/rooms");
}
