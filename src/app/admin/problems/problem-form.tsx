"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createProblem, updateProblem } from "@/lib/actions/problems";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface StarterCode {
  [language: string]: string;
}

interface ProblemFormProps {
  initialData?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    testCases: TestCase[];
    starterCode: StarterCode;
    constraints: string[];
    hints: string[];
    isPublished: boolean;
  };
}

const DEFAULT_STARTER_CODE: StarterCode = {
  javascript: `/**
 * @param {any} input
 * @return {any}
 */
function solution(input) {
  // Your code here
  
}`,
  python: `class Solution:
    def solve(self, input):
        # Your code here
        pass`,
  java: `class Solution {
    public Object solve(Object input) {
        // Your code here
        return null;
    }
}`,
};

export function ProblemForm({ initialData }: ProblemFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    initialData?.difficulty || "EASY"
  );
  const [testCases, setTestCases] = useState<TestCase[]>(
    initialData?.testCases || [
      { input: "", expectedOutput: "", isHidden: false },
    ]
  );
  const [starterCode, setStarterCode] = useState<StarterCode>(
    initialData?.starterCode || DEFAULT_STARTER_CODE
  );
  const [constraints, setConstraints] = useState<string[]>(
    initialData?.constraints || [""]
  );
  const [hints, setHints] = useState<string[]>(initialData?.hints || [""]);
  const [isPublished, setIsPublished] = useState(
    initialData?.isPublished || false
  );

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!initialData) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
      );
    }
  };

  // Test case management
  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { input: "", expectedOutput: "", isHidden: false },
    ]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (
    index: number,
    field: keyof TestCase,
    value: string | boolean
  ) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  // Constraints management
  const addConstraint = () => setConstraints([...constraints, ""]);
  const removeConstraint = (index: number) =>
    setConstraints(constraints.filter((_, i) => i !== index));
  const updateConstraint = (index: number, value: string) => {
    const updated = [...constraints];
    updated[index] = value;
    setConstraints(updated);
  };

  // Hints management
  const addHint = () => setHints([...hints, ""]);
  const removeHint = (index: number) =>
    setHints(hints.filter((_, i) => i !== index));
  const updateHint = (index: number, value: string) => {
    const updated = [...hints];
    updated[index] = value;
    setHints(updated);
  };

  // Starter code management
  const updateStarterCode = (language: string, code: string) => {
    setStarterCode({ ...starterCode, [language]: code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = {
        title,
        slug,
        description,
        difficulty,
        testCases: testCases.filter((tc) => tc.input || tc.expectedOutput),
        starterCode,
        constraints: constraints.filter((c) => c.trim()),
        hints: hints.filter((h) => h.trim()),
        isPublished,
      };

      if (initialData) {
        await updateProblem(initialData.id, data);
      } else {
        await createProblem(data);
      }

      router.push("/admin/problems");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Two Sum"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-slate-300">
                Slug
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="two-sum"
                required
                className="bg-slate-800 border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as typeof difficulty)}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="EASY" className="text-emerald-400">
                    Easy
                  </SelectItem>
                  <SelectItem value="MEDIUM" className="text-amber-400">
                    Medium
                  </SelectItem>
                  <SelectItem value="HARD" className="text-rose-400">
                    Hard
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
              <Label htmlFor="published" className="text-slate-300">
                Published
              </Label>
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Description (HTML supported)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="<p>Given an array of integers...</p>"
              rows={8}
              required
              className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Cases */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Test Cases</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTestCase}
            className="border-slate-700 bg-slate-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Test Case
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {testCases.map((testCase, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">
                  Test Case {index + 1}
                </span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <Switch
                      checked={testCase.isHidden}
                      onCheckedChange={(v) =>
                        updateTestCase(index, "isHidden", v)
                      }
                    />
                    Hidden
                  </label>
                  {testCases.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTestCase(index)}
                      className="h-8 w-8 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Input</Label>
                  <Textarea
                    value={testCase.input}
                    onChange={(e) =>
                      updateTestCase(index, "input", e.target.value)
                    }
                    placeholder="[2,7,11,15]\n9"
                    rows={3}
                    className="bg-slate-900 border-slate-700 text-white font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">
                    Expected Output
                  </Label>
                  <Textarea
                    value={testCase.expectedOutput}
                    onChange={(e) =>
                      updateTestCase(index, "expectedOutput", e.target.value)
                    }
                    placeholder="[0,1]"
                    rows={3}
                    className="bg-slate-900 border-slate-700 text-white font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Starter Code */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-white">Starter Code</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="javascript">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="java">Java</TabsTrigger>
            </TabsList>
            {["javascript", "python", "java"].map((lang) => (
              <TabsContent key={lang} value={lang}>
                <Textarea
                  value={starterCode[lang] || ""}
                  onChange={(e) => updateStarterCode(lang, e.target.value)}
                  rows={10}
                  className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Constraints & Hints */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Constraints */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Constraints</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addConstraint}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {constraints.map((constraint, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={constraint}
                  onChange={(e) => updateConstraint(index, e.target.value)}
                  placeholder="2 <= nums.length <= 10^4"
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {constraints.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeConstraint(index)}
                    className="shrink-0 text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Hints */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Hints</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={addHint}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {hints.map((hint, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={hint}
                  onChange={(e) => updateHint(index, e.target.value)}
                  placeholder="Try using a hash map..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {hints.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHint(index)}
                    className="shrink-0 text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {initialData ? "Update Problem" : "Create Problem"}
        </Button>
      </div>
    </form>
  );
}
