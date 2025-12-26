"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  MemoryStick,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface RunResult {
  output: string | null;
  error: string | null;
  runtime: string | null;
  memory: number | null;
  status: string;
}

interface SubmissionPanelProps {
  submissionResult: SubmissionResult | null;
  runResult: RunResult | null;
  isSubmitting: boolean;
  isRunning: boolean;
  customInput: string;
  onCustomInputChange: (value: string) => void;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  ACCEPTED: {
    label: "Accepted",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  WRONG_ANSWER: {
    label: "Wrong Answer",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    icon: <XCircle className="h-4 w-4" />,
  },
  TIME_LIMIT_EXCEEDED: {
    label: "Time Limit Exceeded",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    icon: <Clock className="h-4 w-4" />,
  },
  MEMORY_LIMIT_EXCEEDED: {
    label: "Memory Limit Exceeded",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    icon: <MemoryStick className="h-4 w-4" />,
  },
  RUNTIME_ERROR: {
    label: "Runtime Error",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  COMPILATION_ERROR: {
    label: "Compilation Error",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  PENDING: {
    label: "Pending",
    color: "text-slate-400 bg-slate-500/10 border-slate-500/30",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  RUNNING: {
    label: "Running",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
};

export function SubmissionPanel({
  submissionResult,
  runResult,
  isSubmitting,
  isRunning,
  customInput,
  onCustomInputChange,
}: SubmissionPanelProps) {
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());

  const toggleTest = (index: number) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTests(newExpanded);
  };

  return (
    <div className="flex h-full flex-col bg-slate-900/50">
      <Tabs defaultValue="testcases" className="flex h-full flex-col">
        <TabsList className="mx-2 mt-2 grid w-auto grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="testcases" className="text-xs">
            Test Cases
          </TabsTrigger>
          <TabsTrigger value="result" className="text-xs">
            Result
          </TabsTrigger>
          <TabsTrigger value="console" className="text-xs">
            Console
          </TabsTrigger>
        </TabsList>

        {/* Test Cases Tab - Custom Input */}
        <TabsContent value="testcases" className="flex-1 overflow-hidden p-2">
          <div className="flex h-full flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Custom Input
              </span>
            </div>
            <textarea
              value={customInput}
              onChange={(e) => onCustomInputChange(e.target.value)}
              placeholder="Enter your test input here..."
              className="flex-1 resize-none rounded-md border border-slate-700 bg-slate-800 p-3 font-mono text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            {/* Run Result */}
            {(isRunning || runResult) && (
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5" />
                    Output
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running...
                    </div>
                  ) : runResult ? (
                    <div className="space-y-2">
                      {runResult.error ? (
                        <pre className="text-xs text-rose-400 whitespace-pre-wrap">
                          {runResult.error}
                        </pre>
                      ) : (
                        <pre className="text-xs text-emerald-400 whitespace-pre-wrap">
                          {runResult.output || "(No output)"}
                        </pre>
                      )}
                      {runResult.runtime && (
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {runResult.runtime}s
                          </span>
                          {runResult.memory && (
                            <span className="flex items-center gap-1">
                              <Cpu className="h-3 w-3" />
                              {(runResult.memory / 1024).toFixed(1)} MB
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Result Tab - Submission Results */}
        <TabsContent value="result" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-2">
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <p className="text-sm">Running test cases...</p>
              </div>
            ) : submissionResult ? (
              <div className="space-y-4">
                {/* Status Header */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1",
                      statusConfig[submissionResult.status]?.color ||
                        statusConfig.PENDING.color
                    )}
                  >
                    {statusConfig[submissionResult.status]?.icon}
                    {statusConfig[submissionResult.status]?.label ||
                      submissionResult.status}
                  </Badge>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      {submissionResult.passedTests}/
                      {submissionResult.totalTests}
                    </span>
                    {submissionResult.runtime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {submissionResult.runtime}ms
                      </span>
                    )}
                    {submissionResult.memory && (
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3.5 w-3.5" />
                        {(submissionResult.memory / 1024).toFixed(1)} MB
                      </span>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {submissionResult.error && (
                  <Card className="border-rose-500/30 bg-rose-500/5">
                    <CardContent className="py-3">
                      <pre className="text-xs text-rose-400 whitespace-pre-wrap">
                        {submissionResult.error}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                <Separator className="bg-slate-700" />

                {/* Test Case Results */}
                <div className="space-y-2">
                  {submissionResult.testResults.map((test) => (
                    <Card
                      key={test.index}
                      className={cn(
                        "border-slate-700 bg-slate-800/50 transition-all",
                        test.passed && "border-emerald-500/20",
                        !test.passed && "border-rose-500/20"
                      )}
                    >
                      <button
                        onClick={() => toggleTest(test.index)}
                        className="w-full"
                      >
                        <CardHeader className="py-2 px-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {test.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-rose-400" />
                              )}
                              <span className="text-sm font-medium text-slate-200">
                                Case {test.index + 1}
                                {test.isHidden && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs border-slate-600 text-slate-500"
                                  >
                                    Hidden
                                  </Badge>
                                )}
                              </span>
                            </div>
                            {expandedTests.has(test.index) ? (
                              <ChevronUp className="h-4 w-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                        </CardHeader>
                      </button>

                      {expandedTests.has(test.index) && !test.isHidden && (
                        <CardContent className="pt-0 pb-3 px-3 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Input
                            </p>
                            <pre className="rounded bg-slate-900 p-2 text-xs text-slate-300 overflow-x-auto">
                              {test.input}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Expected
                            </p>
                            <pre className="rounded bg-slate-900 p-2 text-xs text-emerald-400 overflow-x-auto">
                              {test.expectedOutput}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Your Output
                            </p>
                            <pre
                              className={cn(
                                "rounded bg-slate-900 p-2 text-xs overflow-x-auto",
                                test.passed
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              )}
                            >
                              {test.actualOutput || "(No output)"}
                            </pre>
                          </div>
                          {test.error && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">
                                Error
                              </p>
                              <pre className="rounded bg-slate-900 p-2 text-xs text-rose-400 overflow-x-auto">
                                {test.error}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Terminal className="h-8 w-8 mb-3" />
                <p className="text-sm">Submit your code to see results</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Console Tab - Debug Output */}
        <TabsContent value="console" className="flex-1 overflow-hidden p-2">
          <div className="h-full rounded-md border border-slate-700 bg-slate-800 p-3">
            <pre className="text-xs text-slate-400 font-mono">
              {`// Console output will appear here
// Use console.log() in your code to debug

> Ready`}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
