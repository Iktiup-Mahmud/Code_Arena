import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Users,
  Zap,
  Trophy,
  ArrowRight,
  Sparkles,
  Terminal,
  Shield,
  Clock,
  CheckCircle2,
  Play,
  BookOpen,
  Target,
} from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CodeArena</span>
          </div>

          <div className="flex items-center gap-4">
            {userId ? (
              <Link href="/rooms">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                  Go to Rooms
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    className="text-slate-300 hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                    Get Started
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 mb-6">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">
              Real-time Multiplayer Coding
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
            Code Together,{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Grow Together
            </span>
          </h1>

          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Practice coding challenges with friends in real-time. Share your
            screen, sync your code, and level up your skills together.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href={userId ? "/rooms" : "/sign-up"}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-base px-7"
              >
                Start Coding
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 bg-slate-900/50 text-white hover:bg-slate-800 text-base px-7"
            >
              <Terminal className="mr-2 h-4 w-4" />
              View Demo
            </Button>
          </div>
        </div>

        {/* Code Preview */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur overflow-hidden shadow-2xl shadow-emerald-500/5">
            {/* Window Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs text-slate-500 ml-2">
                two-sum.js — CodeArena
              </span>
            </div>

            {/* Code Content */}
            <div className="p-6 font-mono text-sm">
              <pre className="text-slate-300">
                <code>
                  <span className="text-slate-500">{"// "}</span>
                  <span className="text-emerald-400">Alice</span>
                  <span className="text-slate-500">{" and "}</span>
                  <span className="text-cyan-400">Bob</span>
                  <span className="text-slate-500">
                    {" are coding together..."}
                  </span>
                  {"\n\n"}
                  <span className="text-violet-400">function</span>
                  <span className="text-white">{" twoSum"}</span>
                  <span className="text-slate-400">{"("}</span>
                  <span className="text-amber-300">nums</span>
                  <span className="text-slate-400">{", "}</span>
                  <span className="text-amber-300">target</span>
                  <span className="text-slate-400">{")"}</span>
                  <span className="text-white">{" {"}</span>
                  {"\n"}
                  {"  "}
                  <span className="text-violet-400">const</span>
                  <span className="text-white">{" map "}</span>
                  <span className="text-slate-400">{"= "}</span>
                  <span className="text-violet-400">new</span>
                  <span className="text-cyan-300">{" Map"}</span>
                  <span className="text-slate-400">{"();"}</span>
                  {"\n"}
                  {"  "}
                  <span className="text-violet-400">for</span>
                  <span className="text-slate-400">{" ("}</span>
                  <span className="text-violet-400">let</span>
                  <span className="text-white">{" i "}</span>
                  <span className="text-slate-400">{"= "}</span>
                  <span className="text-amber-300">0</span>
                  <span className="text-slate-400">{"; "}</span>
                  <span className="text-white">i </span>
                  <span className="text-slate-400">{"< "}</span>
                  <span className="text-white">nums</span>
                  <span className="text-slate-400">{"."}</span>
                  <span className="text-white">length</span>
                  <span className="text-slate-400">{"; "}</span>
                  <span className="text-white">i</span>
                  <span className="text-slate-400">{"++) {"}</span>
                  {"\n"}
                  {"    "}
                  <span className="text-violet-400">const</span>
                  <span className="text-white">{" complement "}</span>
                  <span className="text-slate-400">{"= "}</span>
                  <span className="text-white">target </span>
                  <span className="text-slate-400">{"- "}</span>
                  <span className="text-white">nums</span>
                  <span className="text-slate-400">{"["}</span>
                  <span className="text-white">i</span>
                  <span className="text-slate-400">{"];"}</span>
                  <span className="bg-emerald-500/30 text-emerald-300 px-0.5 rounded animate-pulse">
                    |
                  </span>
                  {"\n"}
                  {"    "}
                  <span className="text-violet-400">if</span>
                  <span className="text-slate-400">{" ("}</span>
                  <span className="text-white">map</span>
                  <span className="text-slate-400">{"."}</span>
                  <span className="text-cyan-300">has</span>
                  <span className="text-slate-400">{"("}</span>
                  <span className="text-white">complement</span>
                  <span className="text-slate-400">{")) {"}</span>
                  {"\n"}
                  {"      "}
                  <span className="text-violet-400">return</span>
                  <span className="text-slate-400">{" ["}</span>
                  <span className="text-white">map</span>
                  <span className="text-slate-400">{"."}</span>
                  <span className="text-cyan-300">get</span>
                  <span className="text-slate-400">{"("}</span>
                  <span className="text-white">complement</span>
                  <span className="text-slate-400">{"), "}</span>
                  <span className="text-white">i</span>
                  <span className="text-slate-400">{"];"}</span>
                  {"\n"}
                  {"    "}
                  <span className="text-slate-400">{"}"}</span>
                  {"\n"}
                  {"    "}
                  <span className="text-white">map</span>
                  <span className="text-slate-400">{"."}</span>
                  <span className="text-cyan-300">set</span>
                  <span className="text-slate-400">{"("}</span>
                  <span className="text-white">nums</span>
                  <span className="text-slate-400">{"["}</span>
                  <span className="text-white">i</span>
                  <span className="text-slate-400">{"], "}</span>
                  <span className="text-white">i</span>
                  <span className="text-slate-400">{");"}</span>
                  {"\n"}
                  {"  "}
                  <span className="text-slate-400">{"}"}</span>
                  {"\n"}
                  <span className="text-white">{"}"}</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 border-t border-slate-800 bg-slate-900/30">
        <div className="container mx-auto px-4 py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Everything you need to practice
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Built for developers who want to level up their coding skills
              together
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-emerald-500/30">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                <Users className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Real-time Collaboration
              </h3>
              <p className="text-slate-400 text-xs">
                See your teammates&apos; cursors and edits in real-time. No lag,
                no conflicts, just seamless coding together.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-cyan-500/30">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
                <Zap className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Instant Execution
              </h3>
              <p className="text-slate-400 text-xs">
                Run your code against test cases instantly. Support for
                JavaScript, Python, Java, C++, and more.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-violet-500/30">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                <Trophy className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Curated Problems
              </h3>
              <p className="text-slate-400 text-xs">
                Practice with hand-picked problems ranging from easy to hard.
                Perfect for interview prep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 border-t border-slate-800 bg-slate-950/50">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              How It Works
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xl font-bold text-emerald-400">1</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Create a Room
              </h3>
              <p className="text-xs text-slate-400">
                Set up a collaborative coding room with a unique code
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-xl font-bold text-cyan-400">2</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Invite Friends
              </h3>
              <p className="text-xs text-slate-400">
                Share the room code and start coding together in real-time
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20">
                <span className="text-xl font-bold text-violet-400">3</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Solve & Submit
              </h3>
              <p className="text-xs text-slate-400">
                Write code together and submit to see instant results
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Categories Section */}
      <section className="relative z-10 border-t border-slate-800 bg-slate-900/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Problem Categories
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Master different types of coding challenges
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:border-emerald-500/30 transition-all">
              <Target className="h-5 w-5 text-emerald-400 mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">
                Arrays & Strings
              </h3>
              <p className="text-xs text-slate-500">15+ problems</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:border-cyan-500/30 transition-all">
              <Target className="h-5 w-5 text-cyan-400 mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">
                Data Structures
              </h3>
              <p className="text-xs text-slate-500">12+ problems</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:border-violet-500/30 transition-all">
              <Target className="h-5 w-5 text-violet-400 mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">
                Algorithms
              </h3>
              <p className="text-xs text-slate-500">18+ problems</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:border-pink-500/30 transition-all">
              <Target className="h-5 w-5 text-pink-400 mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">
                Dynamic Programming
              </h3>
              <p className="text-xs text-slate-500">10+ problems</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="relative z-10 border-t border-slate-800 bg-slate-950/50">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Why Choose CodeArena
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              The best platform for collaborative coding practice
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Free to Use
                </h3>
                <p className="text-xs text-slate-400">
                  No credit card required. Start practicing immediately with
                  unlimited sessions.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
              <CheckCircle2 className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Real-time Sync
                </h3>
                <p className="text-xs text-slate-400">
                  Experience zero-lag collaboration with our advanced
                  synchronization technology.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
              <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Multi-language Support
                </h3>
                <p className="text-xs text-slate-400">
                  Code in JavaScript, Python, Java, C++, and more programming
                  languages.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
              <CheckCircle2 className="h-5 w-5 text-pink-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Instant Feedback
                </h3>
                <p className="text-xs text-slate-400">
                  Get immediate results with comprehensive test case execution
                  and error handling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 border-t border-slate-800">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to code together?
          </h2>
          <p className="text-sm text-slate-400 mb-7 max-w-xl mx-auto">
            Join thousands of developers practicing and improving their skills
            in real-time collaborative sessions.
          </p>
          <Link href={userId ? "/rooms" : "/sign-up"}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-base px-7"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-slate-500">
                CodeArena © {new Date().getFullYear()}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Built with Next.js, Prisma & Yjs
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
