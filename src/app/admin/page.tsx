import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileCode,
  Users,
  Send,
  CheckCircle2,
  TrendingUp,
  Activity,
} from "lucide-react";

export default async function AdminDashboardPage() {
  // Fetch dashboard stats
  const [
    totalProblems,
    publishedProblems,
    totalUsers,
    totalSubmissions,
    acceptedSubmissions,
    recentSubmissions,
  ] = await Promise.all([
    prisma.problem.count(),
    prisma.problem.count({ where: { isPublished: true } }),
    prisma.user.count(),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: "ACCEPTED" } }),
    prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true, email: true } },
        problem: { select: { title: true } },
      },
    }),
  ]);

  const acceptanceRate =
    totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
      : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Overview of your coding platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Problems
            </CardTitle>
            <FileCode className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalProblems}</div>
            <p className="text-xs text-slate-500">
              {publishedProblems} published
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalUsers}</div>
            <p className="text-xs text-slate-500">Registered users</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Submissions
            </CardTitle>
            <Send className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {totalSubmissions}
            </div>
            <p className="text-xs text-slate-500">
              {acceptedSubmissions} accepted
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Acceptance Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{acceptanceRate}%</div>
            <p className="text-xs text-slate-500">Overall success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-emerald-400" />
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No submissions yet
            </p>
          ) : (
            <div className="space-y-4">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        submission.status === "ACCEPTED"
                          ? "bg-emerald-500/20"
                          : "bg-rose-500/20"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          submission.status === "ACCEPTED"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {submission.problem?.title || "Unknown Problem"}
                      </p>
                      <p className="text-sm text-slate-500">
                        by {submission.user?.username || submission.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${
                        submission.status === "ACCEPTED"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {submission.status.replace(/_/g, " ")}
                    </span>
                    <p className="text-xs text-slate-500">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

