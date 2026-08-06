import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-kp-bg text-white overflow-hidden relative">
        {/* Background Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-kp-accent/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto py-24 px-8 relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-kp-card border border-kp-border text-sm font-medium text-gray-300 mb-8">
              <span className="w-2 h-2 rounded-full bg-kp-accent animate-pulse" />
              KeeperHub x Gemini Hackathon
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold mb-8 tracking-tight">
              Build Onchain Agents <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-kp-accent to-emerald-300">
                in Minutes.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
              The zero-to-one starter template for building AI agents that
              execute onchain transactions using KeeperHub and Gemini.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/api/auth/signin"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-kp-accent hover:bg-kp-accent-hover transition-all shadow-[0_0_40px_-10px_rgba(10,185,85,0.5)] hover:shadow-[0_0_60px_-15px_rgba(10,185,85,0.7)] hover:-translate-y-1"
              >
                Get Started
              </Link>
              <a
                href="https://github.com/Kaycee276/kp"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-kp-card border border-kp-border hover:bg-gray-800 transition-all hover:-translate-y-1"
              >
                View on GitHub
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-kp-card/50 backdrop-blur-xl border border-kp-border rounded-2xl p-8 hover:border-kp-accent/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-kp-accent/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-kp-accent">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Install the CLI</h3>
              <p className="text-gray-400 mb-6">
                Clone the repository and link the CLI globally to your system.
              </p>
              <div className="bg-[#0b1120] rounded-xl p-4 font-mono text-sm text-gray-300 border border-kp-border/50">
                git clone https://github.com/Kaycee276/kp.git
                <br />
                cd kp
                <br />
                npm install
                <br />
                npm run build
                <br />
                npm link
              </div>
            </div>

            <div className="bg-kp-card/50 backdrop-blur-xl border border-kp-border rounded-2xl p-8 hover:border-kp-accent/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-kp-accent/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-kp-accent">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Run the Agent</h3>
              <p className="text-gray-400 mb-6">
                Start the agent. It will automatically direct you here to
                securely authorize your device.
              </p>
              <div className="bg-[#0b1120] rounded-xl p-4 font-mono text-sm text-gray-300 border border-kp-border/50">
                kp
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="min-h-screen bg-kp-bg text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-kp-accent">KP Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 font-medium">
              {session.user.email}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-sm bg-kp-card border border-kp-border text-gray-300 hover:bg-gray-800 px-4 py-2 rounded-md transition-colors shadow-sm"
            >
              Sign out
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <DashboardClient
              initialGeminiKey={user?.geminiKey || ""}
              initialKeeperhubKey={user?.keeperhubKey || ""}
            />
          </div>

          <div className="bg-kp-card border border-kp-border rounded-xl p-6 h-fit shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Quick Setup</h3>
            <ol className="space-y-4 text-sm text-gray-400 list-decimal list-inside">
              <li>Save your API keys here.</li>
              <li>Open your terminal.</li>
              <li>
                Run{" "}
                <code className="bg-kp-bg border border-kp-border text-kp-accent font-mono px-1.5 py-0.5 rounded">
                  kp
                </code>
              </li>
              <li>Click the link in your terminal to authorize the device.</li>
              <li>Start chatting with the agent!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
