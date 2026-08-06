import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
        <div className="max-w-md w-full space-y-8 p-8 bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-white">
              Welcome to KP Agent
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Sign in to manage your API keys and link your CLI.
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <Link
              href="/api/auth/signin"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
            >
              Sign in with GitHub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">KP Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">{session.user.email}</span>
            <Link
              href="/api/auth/signout"
              className="text-sm bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>

        <DashboardClient
          initialGeminiKey={user?.geminiKey || ""}
          initialKeeperhubKey={user?.keeperhubKey || ""}
        />
      </div>
    </div>
  );
}
