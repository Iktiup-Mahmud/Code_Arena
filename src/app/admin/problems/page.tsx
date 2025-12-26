import Link from "next/link";
import { getProblems } from "@/lib/actions/problems";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, EyeOff } from "lucide-react";
import { ProblemsTableActions } from "./problems-table-actions";

const difficultyColors = {
  EASY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  HARD: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default async function AdminProblemsPage() {
  const problems = await getProblems();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Problems</h1>
          <p className="text-slate-400">Manage coding challenges</p>
        </div>
        <Link href="/admin/problems/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            New Problem
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Title</TableHead>
              <TableHead className="text-slate-400">Slug</TableHead>
              <TableHead className="text-slate-400">Difficulty</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Submissions</TableHead>
              <TableHead className="text-slate-400 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-slate-500"
                >
                  No problems yet. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              problems.map((problem) => (
                <TableRow
                  key={problem.id}
                  className="border-slate-800 hover:bg-slate-800/50"
                >
                  <TableCell className="font-medium text-white">
                    {problem.title}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-400">
                    {problem.slug}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={difficultyColors[problem.difficulty]}
                    >
                      {problem.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {problem.isPublished ? (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Eye className="h-3.5 w-3.5" />
                        Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <EyeOff className="h-3.5 w-3.5" />
                        Draft
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {problem._count.submissions}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProblemsTableActions problem={problem} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
