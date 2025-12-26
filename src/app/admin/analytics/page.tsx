import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileCode,
  CheckCircle2,
} from "lucide-react";

export default async function AdminAnalyticsPage() {
  // Fetch comprehensive analytics
  const [
    // Problem stats
    problemsByDifficulty,
    topProblems,
    // Submission stats
    submissionsByStatus,
    submissionsByLanguage,
    recentSubmissionTrend,
    // User stats
    topUsers,
    activeRooms,
  ] = await Promise.all([
    // Problems by difficulty
    prisma.problem.groupBy({
      by: ["difficulty"],
      _count: true,
    }),
    // Top problems by submissions
    prisma.problem.findMany({
      take: 10,
      orderBy: {
        submissions: {
          _count: "desc",
        },
      },
      select: {
        id: true,
        title: true,
        difficulty: true,
        _count: {
          select: { submissions: true },
        },
      },
    }),
    // Submissions by status
    prisma.submission.groupBy({
      by: ["status"],
      _count: true,
    }),
    // Submissions by language
    prisma.submission.groupBy({
      by: ["language"],
      _count: true,
      orderBy: {
        _count: {
          language: "desc",
        },
      },
      take: 5,
    }),
    // Recent submissions (last 7 days)
    prisma.submission.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    // Top users by accepted submissions
    prisma.user.findMany({
      take: 10,
      orderBy: {
        submissions: {
          _count: "desc",
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    }),
    // Active rooms
    prisma.collaborationRoom.count({
      where: { isActive: true },
    }),
  ]);

  // Calculate totals
  const totalSubmissions = submissionsByStatus.reduce(
    (acc, s) => acc + s._count,
    0
  );
  const acceptedCount =
    submissionsByStatus.find((s) => s.status === "ACCEPTED")?._count || 0;
  const acceptanceRate =
    totalSubmissions > 0
      ? Math.round((acceptedCount / totalSubmissions) * 100)
      : 0;

  const difficultyColors = {
    EASY: "text-emerald-400 bg-emerald-500/10",
    MEDIUM: "text-amber-400 bg-amber-500/10",
    HARD: "text-rose-400 bg-rose-500/10",
  };

  const statusColors: Record<string, string> = {
    ACCEPTED: "text-emerald-400",
    WRONG_ANSWER: "text-rose-400",
    TIME_LIMIT_EXCEEDED: "text-amber-400",
    RUNTIME_ERROR: "text-rose-400",
    COMPILATION_ERROR: "text-rose-400",
    PENDING: "text-slate-400",
    RUNNING: "text-blue-400",
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400">Platform statistics and insights</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Weekly Submissions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {recentSubmissionTrend}
            </div>
            <p className="text-xs text-slate-500">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Acceptance Rate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {acceptanceRate}%
            </div>
            <p className="text-xs text-slate-500">
              {acceptedCount} / {totalSubmissions} accepted
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Active Rooms
            </CardTitle>
            <Users className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeRooms}</div>
            <p className="text-xs text-slate-500">Collaboration sessions</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Problems
            </CardTitle>
            <FileCode className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {problemsByDifficulty.reduce((acc, p) => acc + p._count, 0)}
            </div>
            <p className="text-xs text-slate-500">
              {problemsByDifficulty
                .map((p) => `${p._count} ${p.difficulty.toLowerCase()}`)
                .join(", ")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Submissions by Status */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              Submissions by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissionsByStatus.map((stat) => {
                const percentage =
                  totalSubmissions > 0
                    ? Math.round((stat._count / totalSubmissions) * 100)
                    : 0;
                return (
                  <div key={stat.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={
                          statusColors[stat.status] || "text-slate-400"
                        }
                      >
                        {stat.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-400">
                        {stat._count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          stat.status === "ACCEPTED"
                            ? "bg-emerald-500"
                            : stat.status === "WRONG_ANSWER"
                            ? "bg-rose-500"
                            : "bg-slate-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submissions by Language */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileCode className="h-5 w-5 text-cyan-400" />
              Popular Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissionsByLanguage.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No data yet</p>
              ) : (
                submissionsByLanguage.map((stat, index) => {
                  const maxCount = submissionsByLanguage[0]._count;
                  const percentage = Math.round((stat._count / maxCount) * 100);
                  const colors = [
                    "bg-emerald-500",
                    "bg-cyan-500",
                    "bg-violet-500",
                    "bg-amber-500",
                    "bg-rose-500",
                  ];
                  return (
                    <div key={stat.language} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white capitalize">
                          {stat.language}
                        </span>
                        <span className="text-slate-400">{stat._count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            colors[index % colors.length]
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Problems */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-amber-400" />
              Most Attempted Problems
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProblems.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No data yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Problem</TableHead>
                    <TableHead className="text-slate-400">Difficulty</TableHead>
                    <TableHead className="text-slate-400 text-right">
                      Attempts
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProblems.map((problem) => (
                    <TableRow
                      key={problem.id}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell className="font-medium text-white">
                        {problem.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${
                            difficultyColors[problem.difficulty]
                          } border-0`}
                        >
                          {problem.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-slate-400">
                        {problem._count.submissions}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-violet-400" />
              Most Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No data yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400 text-right">
                      Submissions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell className="font-medium text-white">
                        {user.username || user.email}
                      </TableCell>
                      <TableCell className="text-right text-slate-400">
                        {user._count.submissions}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
