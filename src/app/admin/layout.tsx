import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Code2,
  LayoutDashboard,
  FileCode,
  BarChart3,
  Users,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user exists in database
  let user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // If user doesn't exist, create them from Clerk data
  if (!user) {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      redirect("/sign-in");
    }

    user = await prisma.user.create({
      data: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        username: clerkUser.username || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    });
  }

  // Verify admin role
  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
            <Code2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-white">CodeArena</span>
            <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-400">
              Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/problems"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <FileCode className="h-4 w-4" />
            Problems
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <Users className="h-4 w-4" />
            Users
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/rooms"
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
