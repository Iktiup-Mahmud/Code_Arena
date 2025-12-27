import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getRoomByCode } from "@/lib/actions/rooms";
import { getProblems } from "@/lib/actions/problems";
import { PlaygroundClient } from "./playground-client";

interface PlaygroundPageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function PlaygroundPage({ params }: PlaygroundPageProps) {
  const { roomCode } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const [room, problems] = await Promise.all([
    getRoomByCode(roomCode),
    getProblems({ publishedOnly: true }),
  ]);

  if (!room) {
    notFound();
  }

  if (!room.isActive) {
    redirect("/rooms?error=room-closed");
  }

  // Transform problem data for client
  const problemData = room.problem
    ? {
        id: room.problem.id,
        title: room.problem.title,
        slug: room.problem.slug,
        description: room.problem.description,
        difficulty: room.problem.difficulty,
        testCases: room.problem.testCases as Array<{
          input: string;
          expectedOutput: string;
          isHidden?: boolean;
        }>,
        constraints: room.problem.constraints,
        hints: room.problem.hints,
        starterCode: room.problem.starterCode as Record<string, string>,
      }
    : null;

  return (
    <PlaygroundClient
      room={{
        id: room.id,
        name: room.name,
        code: room.code,
        language: room.language,
        currentCode: room.currentCode,
      }}
      problem={problemData}
      problems={problems.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
      }))}
      user={{
        id: userId,
        name: user?.firstName || user?.username || "Anonymous",
        imageUrl: user?.imageUrl,
      }}
    />
  );
}
