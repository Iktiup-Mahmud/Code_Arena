"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RoomProvider,
  useRoom,
} from "@/components/collaboration/room-provider";
import { CollaborativeEditor } from "@/components/editor/collaborative-editor";
import { ProblemPanel } from "@/components/playground/problem-panel";
import { LanguageSelector } from "@/components/playground/language-selector";
import { PresenceAvatars } from "@/components/collaboration/presence-avatars";
import { SubmissionPanel } from "@/components/playground/submission-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  leaveRoom,
  updateRoomProblem,
  updateRoomCode,
} from "@/lib/actions/rooms";
import { createSubmission, runCode } from "@/lib/actions/submissions";
import {
  Play,
  Send,
  Copy,
  Check,
  LogOut,
  Loader2,
  Wifi,
  WifiOff,
  PanelLeftClose,
  PanelLeft,
  PanelBottomClose,
  PanelBottom,
  BookOpen,
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }>;
  constraints: string[];
  hints: string[];
  starterCode: Record<string, string>;
}

interface Room {
  id: string;
  name: string;
  code: string;
  language: string;
  currentCode: string | null;
}

interface User {
  id: string;
  name: string;
  imageUrl?: string | null;
}

interface PlaygroundClientProps {
  room: Room;
  problem: Problem | null;
  problems: Array<{
    id: string;
    title: string;
    slug: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  }>;
  user: User;
}

interface SubmissionResult {
  submissionId: string;
  status: string;
  testResults: Array<{
    index: number;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string | null;
    runtime: string | null;
    memory: number | null;
    error: string | null;
    isHidden: boolean;
  }>;
  totalTests: number;
  passedTests: number;
  runtime: number | null;
  memory: number | null;
  error: string | null;
}

interface RunResult {
  output: string | null;
  error: string | null;
  runtime: string | null;
  memory: number | null;
  status: string;
}

// Inner component that uses the room context
function PlaygroundInner({
  room,
  problem,
  problems,
  user,
}: PlaygroundClientProps) {
  const router = useRouter();
  const { doc, awareness, isConnected, isSynced, setCurrentUser } = useRoom();
  const [language, setLanguage] = useState(room.language);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showProblemPanel, setShowProblemPanel] = useState(true);
  const [showOutputPanel, setShowOutputPanel] = useState(true);
  const [customInput, setCustomInput] = useState("");
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isChangingProblem, setIsChangingProblem] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ref to get current code from editor
  const currentCodeRef = useRef<string>("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedCodeRef = useRef<string>("");

  // Set current user in room context
  useEffect(() => {
    setCurrentUser({
      id: user.id,
      name: user.name,
      color: `hsl(${(user.id.charCodeAt(0) * 137.5) % 360}, 70%, 60%)`,
    });
  }, [user, setCurrentUser]);

  // Debounced save to database
  const saveCodeToDatabase = useCallback(
    async (code: string) => {
      if (code === lastSavedCodeRef.current) return;

      setIsSaving(true);
      try {
        await updateRoomCode(room.id, code);
        lastSavedCodeRef.current = code;
        console.log("[Playground] Code saved to database");
      } catch (error) {
        console.error("[Playground] Failed to save code:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [room.id]
  );

  // Auto-save code changes with debouncing
  useEffect(() => {
    return () => {
      // Save on unmount
      if (
        currentCodeRef.current &&
        currentCodeRef.current !== lastSavedCodeRef.current
      ) {
        saveCodeToDatabase(currentCodeRef.current);
      }
    };
  }, [saveCodeToDatabase]);

  // Get starter code for current language
  const getStarterCode = useCallback(() => {
    if (room.currentCode) return room.currentCode;
    if (problem?.starterCode?.[language]) return problem.starterCode[language];
    return getDefaultStarterCode(language);
  }, [room.currentCode, problem, language]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = async () => {
    await leaveRoom(room.id);
    router.push("/rooms");
  };

  const handleProblemChange = async (problemId: string) => {
    if (problemId === (problem?.id || "")) return;

    setIsChangingProblem(true);
    try {
      await updateRoomProblem(room.id, problemId || null);
      // Refresh the page to load new problem
      router.refresh();
    } catch (error) {
      console.error("Failed to change problem:", error);
    } finally {
      setIsChangingProblem(false);
    }
  };

  const handleCodeChange = useCallback(
    (code: string) => {
      currentCodeRef.current = code;

      // Debounce save to database (save after 2 seconds of no changes)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveCodeToDatabase(code);
      }, 2000);
    },
    [saveCodeToDatabase]
  );

  // Run code against custom input
  const handleRun = async () => {
    if (!currentCodeRef.current) return;

    setIsRunning(true);
    setRunResult(null);

    try {
      const result = await runCode({
        code: currentCodeRef.current,
        language,
        input: customInput,
      });
      setRunResult(result);
    } catch (error) {
      setRunResult({
        output: null,
        error: error instanceof Error ? error.message : "Run failed",
        runtime: null,
        memory: null,
        status: "Error",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit code for full evaluation
  const handleSubmit = async () => {
    if (!problem) {
      alert("No problem selected. This is sandbox mode.");
      return;
    }

    if (!currentCodeRef.current) return;

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const result = await createSubmission({
        problemId: problem.id,
        code: currentCodeRef.current,
        language,
        roomId: room.id,
      });
      setSubmissionResult(result);
    } catch (error) {
      setSubmissionResult({
        submissionId: "",
        status: "RUNTIME_ERROR",
        testResults: [],
        totalTests: problem.testCases.length,
        passedTests: 0,
        runtime: null,
        memory: null,
        error: error instanceof Error ? error.message : "Submission failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!doc || !awareness) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Connecting to room...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-sm px-4 shadow-lg">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{room.name}</h1>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 text-slate-400 hover:text-white"
                >
                  <Badge
                    variant="outline"
                    className="font-mono text-white text-xs border-slate-600/50 bg-slate-800/50"
                  >
                    {room.code}
                  </Badge>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy room code to share</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Problem Selector */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/80 px-3 py-1.5">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <select
              value={problem?.id || ""}
              onChange={(e) => handleProblemChange(e.target.value)}
              disabled={isChangingProblem}
              className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
            >
              <option value="">Sandbox Mode</option>
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.difficulty})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-700/30 bg-slate-800/50 px-3 py-1.5">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-rose-400" />
            )}
            <span className="text-xs text-slate-400">
              {isConnected ? "Connected" : "Reconnecting..."}
            </span>
          </div>

          {/* Save Status Indicator */}
          {isSaving && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/30 bg-slate-800/50 px-3 py-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
              <span className="text-xs text-slate-400">Saving...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <PresenceAvatars />

          <div className="flex items-center gap-2">
            <LanguageSelector value={language} onChange={setLanguage} />

            <Button
              variant="outline"
              onClick={handleRun}
              disabled={isRunning}
              className="border-slate-600/50 bg-slate-800/80 hover:bg-slate-700/80 hover:border-slate-500 text-white"
            >
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !problem}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLeaveRoom}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Leave room</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Problem Panel */}
        {showProblemPanel && (
          <div className="w-[400px] shrink-0 border-r border-slate-700/50 bg-slate-900/70 backdrop-blur-sm">
            <ProblemPanel problem={problem} />
          </div>
        )}

        {/* Editor + Output Panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Editor Toolbar */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm px-2">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowProblemPanel(!showProblemPanel)}
                    >
                      {showProblemPanel ? (
                        <PanelLeftClose className="h-4 w-4 text-slate-400" />
                      ) : (
                        <PanelLeft className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showProblemPanel ? "Hide" : "Show"} problem panel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span className="text-xs text-slate-500">
                {problem ? problem.title : "Sandbox Mode"}
              </span>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowOutputPanel(!showOutputPanel)}
                  >
                    {showOutputPanel ? (
                      <PanelBottomClose className="h-4 w-4 text-slate-400" />
                    ) : (
                      <PanelBottom className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showOutputPanel ? "Hide" : "Show"} output panel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Editor */}
          <div className="flex-1 p-2 overflow-hidden bg-[#0d1117]">
            <CollaborativeEditor
              doc={doc}
              awareness={awareness}
              language={language}
              userId={user.id}
              userName={user.name}
              defaultValue={getStarterCode()}
              onChange={handleCodeChange}
              isSynced={isSynced}
            />
          </div>

          {/* Output Panel */}
          {showOutputPanel && (
            <div className="h-64 shrink-0 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
              <SubmissionPanel
                submissionResult={submissionResult}
                runResult={runResult}
                isSubmitting={isSubmitting}
                isRunning={isRunning}
                customInput={customInput}
                onCustomInputChange={setCustomInput}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main export with provider wrapper
export function PlaygroundClient(props: PlaygroundClientProps) {
  return (
    <RoomProvider roomId={props.room.id}>
      <PlaygroundInner {...props} />
    </RoomProvider>
  );
}

// Default starter code templates
function getDefaultStarterCode(language: string): string {
  const templates: Record<string, string> = {
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solution(nums, target) {
  // Your code here
  
}`,
    python: `class Solution:
    def solve(self, nums: list[int], target: int) -> list[int]:
        # Your code here
        pass`,
    java: `class Solution {
    public int[] solve(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }
}`,
    cpp: `class Solution {
public:
    vector<int> solve(vector<int>& nums, int target) {
        // Your code here
        return {};
    }
};`,
    typescript: `function solution(nums: number[], target: number): number[] {
  // Your code here
  
}`,
    go: `func solution(nums []int, target int) []int {
    // Your code here
    return []int{}
}`,
    rust: `impl Solution {
    pub fn solve(nums: Vec<i32>, target: i32) -> Vec<i32> {
        // Your code here
        vec![]
    }
}`,
  };

  return templates[language] || "// Start coding here...";
}
