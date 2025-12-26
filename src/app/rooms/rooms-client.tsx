"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LanguageSelector } from "@/components/playground/language-selector";
import { createRoom, joinRoom } from "@/lib/actions/rooms";
import {
  Plus,
  Users,
  Code2,
  ArrowRight,
  Loader2,
  LogIn,
  Sparkles,
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  code: string;
  language: string;
  createdAt: string;
  problemTitle: string | null;
  participantCount: number;
  isCreator: boolean;
}

interface Problem {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

interface RoomsClientProps {
  rooms: Room[];
  problems: Problem[];
  userName: string;
}

export function RoomsClient({ rooms, problems, userName }: RoomsClientProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  // Create room form state
  const [roomName, setRoomName] = useState("");
  const [roomLanguage, setRoomLanguage] = useState("javascript");
  const [selectedProblemId, setSelectedProblemId] = useState<string | undefined>(undefined);

  // Join room form state
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;

    setIsCreating(true);
    try {
      const room = await createRoom({
        name: roomName,
        language: roomLanguage,
        problemId: selectedProblemId,
      });
      setCreateDialogOpen(false);
      router.push(`/playground/${room.code}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setJoinError("");
    try {
      const room = await joinRoom(joinCode.trim());
      setJoinDialogOpen(false);
      router.push(`/playground/${room.code}`);
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : "Failed to join room"
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleEnterRoom = (code: string) => {
    router.push(`/playground/${code}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CodeArena</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Welcome, {userName}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold text-white">
            Collaborative Coding Rooms
          </h1>
          <p className="text-lg text-slate-400">
            Create a room or join one to code together in real-time
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-10 flex flex-wrap justify-center gap-4">
          {/* Create Room Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Create a New Room
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Set up a collaborative coding session
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name" className="text-slate-300">
                    Room Name
                  </Label>
                  <Input
                    id="room-name"
                    placeholder="e.g., LeetCode Practice"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Default Language</Label>
                  <LanguageSelector
                    value={roomLanguage}
                    onChange={setRoomLanguage}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem-select" className="text-slate-300">
                    Problem (Optional)
                  </Label>
                  <select
                    id="problem-select"
                    value={selectedProblemId || ""}
                    onChange={(e) => setSelectedProblemId(e.target.value || undefined)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Sandbox Mode (No Problem)</option>
                    {problems.map((problem) => (
                      <option key={problem.id} value={problem.id}>
                        {problem.title} ({problem.difficulty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setCreateDialogOpen(false)}
                  className="text-slate-400"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRoom}
                  disabled={isCreating || !roomName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Join Room Dialog */}
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Join Room
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Join a Room</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Enter the room code shared with you
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="room-code" className="text-slate-300">
                    Room Code
                  </Label>
                  <Input
                    id="room-code"
                    placeholder="e.g., abc123xy"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value);
                      setJoinError("");
                    }}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono"
                  />
                  {joinError && (
                    <p className="text-sm text-rose-400">{joinError}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setJoinDialogOpen(false)}
                  className="text-slate-400"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleJoinRoom}
                  disabled={isJoining || !joinCode.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isJoining ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Join
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rooms List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Your Rooms</h2>

          {rooms.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-slate-800 p-4">
                  <Code2 className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-white">
                  No rooms yet
                </h3>
                <p className="mb-4 text-sm text-slate-400">
                  Create your first room to start coding with others
                </p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Room
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className="group cursor-pointer border-slate-800 bg-slate-900/50 transition-all hover:border-emerald-500/50 hover:bg-slate-900"
                  onClick={() => handleEnterRoom(room.code)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-white">
                        {room.name}
                      </CardTitle>
                      {room.isCreator && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs"
                        >
                          Owner
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-slate-500">
                      {room.problemTitle || "Sandbox Mode"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {room.participantCount}
                        </div>
                        <Badge
                          variant="outline"
                          className="border-slate-700 text-slate-400 font-mono text-xs"
                        >
                          {room.language}
                        </Badge>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

