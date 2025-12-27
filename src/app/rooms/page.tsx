import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAllRooms } from "@/lib/actions/rooms";
import { getProblems } from "@/lib/actions/problems";
import { RoomsClient } from "./rooms-client";

export default async function RoomsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const [rooms, problems] = await Promise.all([
    getAllRooms(),
    getProblems({ publishedOnly: true }),
  ]);

  return (
    <RoomsClient
      rooms={rooms.map((room) => ({
        id: room.id,
        name: room.name,
        code: room.code,
        language: room.language,
        createdAt: room.createdAt.toISOString(),
        problemTitle: room.problem?.title || null,
        participantCount: room.participants.length,
        isCreator: room.creatorId === userId,
        isJoined:
          room.creatorId === userId ||
          room.participants.some((p) => p.userId === userId),
        creatorName:
          room.creator.username ||
          room.creator.email.split("@")[0] ||
          "Unknown",
        creatorEmail: room.creator.email,
      }))}
      problems={problems.map((p) => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
      }))}
      userName={user?.firstName || user?.username || "User"}
    />
  );
}
