import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";
import DashboardClient from "./DashboardClient";
import CopyButton from "./CopyButton";
import TerminalPlayground from "./TerminalPlayground";
import { Suspense } from "react";
import { Zap, Bot } from "lucide-react";

async function getGithubStars() {
  try {
    const res = await fetch("https://api.github.com/repos/Kaycee276/kp", {
      headers: { "User-Agent": "KP-App" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.stargazers_count || 0;
  } catch {
    return 0;
  }
}

function AppleHeader({
  stars,
  userEmail,
}: {
  stars: number;
  userEmail?: string | null;
}) {
  return (
    <header className="w-full bg-[#0a0a0c]/70 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white tracking-tight leading-none">
              KP
            </span>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-4">
          <a
            href="https://t.me/keipee_bot"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition-all apple-button"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telegram Bot</span>
          </a>

          <a
            href="https://github.com/Kaycee276/kp"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-all apple-button"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 fill-current"
              aria-hidden="true"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>Star</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-white/10 rounded-full font-mono text-white/90">
              {stars}
            </span>
          </a>

          {userEmail ? (
            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              <span className="hidden md:inline text-xs font-medium text-white/60 font-mono">
                {userEmail}
              </span>
              <LogoutButton />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const stars = await getGithubStars();

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white overflow-x-hidden relative flex flex-col selection:bg-[#0ab955]/30">
        <AppleHeader stars={stars} />

        {/* Ambient Glow Orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#0ab955]/20 via-[#10b981]/15 to-transparent rounded-full blur-[140px] pointer-events-none animate-apple-glow" />
        <div className="absolute top-96 left-1/4 w-[400px] h-[300px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

        <main className="max-w-6xl mx-auto pt-16 pb-24 px-6 relative z-10 flex-1 w-full">
          {/* Hero Header */}
          <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
              Build Autonomous <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ab955] via-emerald-300 to-teal-200">
                Onchain AI Agents.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed font-normal">
              Execute transactions seamlessly from your CLI or Telegram using
              KeeperHub smart tools and Gemini fallback AI intelligence.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <LoginButton />
              <a
                href="https://github.com/Kaycee276/kp"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-full text-xs font-semibold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all apple-button backdrop-blur-md"
              >
                Explore GitHub Repository &rarr;
              </a>
            </div>
          </div>

          {/* Interactive Web Terminal Playground */}
          <TerminalPlayground />

          {/* 3-Step Setup Cards */}
          <div className="mt-20">
            <div className="text-center mb-12 space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Get Started in Seconds
              </h2>
              <p className="text-xs text-white/50">
                Install globally, authorize your terminal device flow, and chat
                with your agent.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="apple-glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#0ab955]/10 text-emerald-400 font-bold flex items-center justify-center text-lg mb-4 border border-[#0ab955]/20">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Install CLI
                  </h3>
                  <p className="text-xs text-white/50 mb-6 leading-relaxed">
                    Install globally on macOS, Linux, or Windows with one
                    terminal command.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="bg-black/60 p-3.5 rounded-xl font-mono text-xs text-white/80 relative group border border-white/5">
                    <CopyButton text="curl -fsSL https://kp-three-mu.vercel.app/install.sh | bash" />
                    <span className="text-white/40 block mb-1">
                      # macOS / Linux
                    </span>
                    curl -fsSL ... | bash
                  </div>
                  <div className="bg-black/60 p-3.5 rounded-xl font-mono text-xs text-white/80 relative group border border-white/5">
                    <CopyButton text="iwr https://kp-three-mu.vercel.app/install.ps1 -useb | iex" />
                    <span className="text-white/40 block mb-1"># Windows</span>
                    iwr ... -useb | iex
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="apple-glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#0ab955]/10 text-emerald-400 font-bold flex items-center justify-center text-lg mb-4 border border-[#0ab955]/20">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Run Agent
                  </h3>
                  <p className="text-xs text-white/50 mb-6 leading-relaxed">
                    Launch the agent. It automatically pairs with your account
                    securely.
                  </p>
                </div>
                <div className="bg-black/60 p-3.5 rounded-xl font-mono text-xs text-white/90 relative group border border-white/5">
                  <CopyButton text="kp" />
                  <span className="text-white/40 block mb-1"># Launch CLI</span>
                  kp
                </div>
              </div>

              {/* Step 3 */}
              <div className="apple-glass-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#0ab955]/10 text-emerald-400 font-bold flex items-center justify-center text-lg mb-4 border border-[#0ab955]/20">
                    3
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Telegram AI Bot
                  </h3>
                  <p className="text-xs text-white/50 mb-6 leading-relaxed">
                    Connect Telegram bot to run balance checks and transfers on
                    mobile.
                  </p>
                </div>
                <div className="bg-black/60 p-3.5 rounded-xl font-mono text-xs text-emerald-300 relative group border border-white/5">
                  <CopyButton text="/start" />
                  <span className="text-white/40 block mb-1">
                    # Telegram Command
                  </span>
                  /start @keipee_bot
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Apple Footer */}
        <footer className="w-full border-t border-white/10 py-8 bg-[#0a0a0c]/80 backdrop-blur-md text-xs text-white/40">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              &copy; 2026 KP Onchain AI Agent Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://app.keeperhub.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                KeeperHub
              </a>
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Google AI Studio
              </a>
              <a
                href="https://t.me/keipee_bot"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Telegram Bot
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Dashboard for Authenticated Users
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col selection:bg-[#0ab955]/30">
      <AppleHeader stars={stars} userEmail={session.user.email} />

      <main className="max-w-5xl mx-auto pt-10 pb-20 px-6 flex-1 w-full">
        {/* Dashboard Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              KP Dashboard
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Manage API key vault, CLI pairings, and Telegram bot
              authentication.
            </p>
          </div>
        </div>

        {/* Dashboard Components */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Suspense
              fallback={
                <div className="text-xs text-white/50 p-8">
                  Loading API Vault...
                </div>
              }
            >
              <DashboardClient
                initialGeminiKey={user?.geminiKey || ""}
                initialKeeperhubKey={user?.keeperhubKey || ""}
              />
            </Suspense>
          </div>

          {/* Quick Setup Card */}
          <div className="apple-glass-card rounded-2xl p-6 border border-white/10 space-y-4 h-fit shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Quick Instructions
            </h3>
            <ol className="space-y-3 text-xs text-white/60 list-decimal list-inside leading-relaxed">
              <li>Save your Gemini &amp; KeeperHub keys in the vault.</li>
              <li>Open your terminal on desktop.</li>
              <li>
                Run{" "}
                <code className="bg-black/60 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-white/10">
                  kp
                </code>
              </li>
              <li>Click the terminal pairing link to approve device auth.</li>
              <li>Start querying balances and executing transactions!</li>
            </ol>

            <div className="pt-3 border-t border-white/10">
              <a
                href="https://t.me/keipee_bot"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 apple-button transition-all"
              >
                <Bot className="w-4 h-4 text-blue-400" />
                <span>Launch Telegram Bot</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-white/10 py-6 bg-[#0a0a0c]/80 text-xs text-white/40 text-center">
        <p>&copy; 2026 KP Onchain AI Agent Platform.</p>
      </footer>
    </div>
  );
}
