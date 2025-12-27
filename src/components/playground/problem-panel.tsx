"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  testCases: TestCase[];
  constraints: string[];
  hints: string[];
}

interface ProblemPanelProps {
  problem: Problem | null;
}

const difficultyColors = {
  EASY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  HARD: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export function ProblemPanel({ problem }: ProblemPanelProps) {
  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <div className="text-center">
          <p className="text-lg font-medium">No problem selected</p>
          <p className="text-sm">Choose a problem to start coding</p>
        </div>
      </div>
    );
  }

  const visibleTestCases = problem.testCases.filter((tc) => !tc.isHidden);

  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="description" className="flex h-full flex-col">
        <TabsList className="mx-4 mt-4 grid w-auto grid-cols-3 bg-slate-800/80 border border-slate-700/50">
          <TabsTrigger value="description" className="text-xs">
            Description
          </TabsTrigger>
          <TabsTrigger value="testcases" className="text-xs">
            Test Cases
          </TabsTrigger>
          <TabsTrigger value="hints" className="text-xs">
            Hints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4 pb-4">
            <div className="space-y-4">
              {/* Title and Difficulty */}
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-white">
                  {problem.title}
                </h2>
                <Badge
                  variant="outline"
                  className={difficultyColors[problem.difficulty]}
                >
                  {problem.difficulty}
                </Badge>
              </div>

              <Separator className="bg-slate-700/50" />

              {/* Description */}
              <div
                className="prose text-white prose-invert prose-sm max-w-none prose-headings:text-slate-200 prose-p:text-slate-300 prose-strong:text-slate-200 prose-code:text-emerald-400 prose-code:bg-slate-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: problem.description }}
              />

              {/* Constraints */}
              {problem.constraints.length > 0 && (
                <>
                  <Separator className="bg-slate-700/50" />
                  <div>
                    <h3 className="mb-2 font-semibold text-slate-200">
                      Constraints
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                      {problem.constraints.map((constraint, i) => (
                        <li key={i}>{constraint}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="testcases" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4 pb-4">
            <div className="space-y-4">
              {visibleTestCases.length === 0 ? (
                <p className="text-sm text-slate-400">No visible test cases</p>
              ) : (
                visibleTestCases.map((testCase, index) => (
                  <Card
                    key={index}
                    className="bg-slate-800/80 border-slate-600/50 shadow-lg"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-200">
                        Case {index + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="mb-1 text-xs font-medium text-slate-400">
                          Input
                        </p>
                        <pre className="rounded bg-slate-950/50 p-3 text-xs text-slate-200 overflow-x-auto border border-slate-700/30">
                          {testCase.input}
                        </pre>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-slate-400">
                          Expected Output
                        </p>
                        <pre className="rounded bg-slate-950/50 p-3 text-xs text-emerald-400 overflow-x-auto border border-emerald-500/20">
                          {testCase.expectedOutput}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="hints" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4 pb-4">
            <div className="space-y-3">
              {problem.hints.length === 0 ? (
                <p className="text-sm text-slate-400">No hints available</p>
              ) : (
                problem.hints.map((hint, index) => (
                  <Card
                    key={index}
                    className="bg-slate-800/80 border-slate-600/50 shadow-lg"
                  >
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/30 text-xs font-medium text-amber-300 border border-amber-500/30">
                          {index + 1}
                        </span>
                        <p className="text-sm text-slate-200">{hint}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
