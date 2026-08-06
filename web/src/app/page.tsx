import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";
import DashboardClient from "./DashboardClient";
import CopyButton from "./CopyButton";
import { Suspense } from "react";

async function getGithubStars() {
  try {
    const res = await fetch("https://api.github.com/repos/Kaycee276/kp", {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return data.stargazers_count || 0;
  } catch {
    return 0;
  }
}

function Header({ stars }: { stars: number }) {
  return (
    <header className="w-full bg-kp-bg/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-end">
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Kaycee276/kp"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors bg-kp-card px-3 py-1.5"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-current"
              aria-hidden="true"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star on GitHub
            <span className="ml-2 pl-2 text-gray-400">{stars}</span>
          </a>
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
      <div className="min-h-screen bg-kp-bg text-white overflow-x-hidden relative flex flex-col">
        <Header stars={stars} />
        {/* Background Glow */}

        <div className="max-w-6xl mx-auto py-24 px-8 relative z-10 flex-1">
          <div className="text-center mb-24">
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
              <LoginButton />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-kp-card/50 backdrop-blur-xl p-8 hover:bg-kp-card transition-colors">
              <div className="w-12 h-12 bg-kp-accent/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-kp-accent">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Install the CLI</h3>
              <p className="text-gray-400 mb-6">
                Clone the repository and link the CLI globally to your system.
              </p>
              <div className="space-y-4">
                <div className="bg-kp-copy/70 p-4 font-mono text-sm text-gray-300 relative group">
                  <CopyButton
                    text={`curl -fsSL https://kp-three-mu.vercel.app/install.sh | bash`}
                  />
                  <span className="text-black"># Mac/Linux</span>
                  <br />
                  curl -fsSL https://kp-three-mu.vercel.app/install.sh | bash
                </div>

                <div className="bg-kp-copy/70 p-4 font-mono text-sm text-gray-300 relative group">
                  <CopyButton
                    text={`iwr https://kp-three-mu.vercel.app/install.ps1 -useb | iex`}
                  />
                  <span className="text-black"># Windows (PowerShell)</span>
                  <br />
                  iwr https://kp-three-mu.vercel.app/install.ps1 -useb | iex
                </div>
              </div>
            </div>

            <div className="bg-kp-card/50 backdrop-blur-xl p-8 hover:bg-kp-card transition-colors">
              <div className="w-12 h-12 bg-kp-accent/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-kp-accent">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Run the Agent</h3>
              <p className="text-gray-400 mb-6">
                Start the agent. It will automatically direct you here to
                securely authorize your device.
              </p>
              <div className="bg-kp-copy/70 p-4 font-mono text-sm text-gray-300 relative group">
                <CopyButton text="kp" />
                kp
              </div>
            </div>

            <div className="bg-kp-card/50 backdrop-blur-xl p-8 hover:bg-kp-card transition-colors">
              <div className="w-12 h-12 bg-kp-accent/10 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-kp-accent">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Uninstall</h3>
              <p className="text-gray-400 mb-6">
                Remove the CLI and clean up your local configuration.
              </p>
              <div className="bg-kp-copy/70 p-4 font-mono text-sm text-gray-300 relative group">
                <CopyButton text={`npm unlink\nrm ~/.kp-config.json`} />
                npm unlink
                <br />
                rm ~/.kp-config.json
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
    <div className="min-h-screen bg-kp-bg text-white flex flex-col">
      <Header stars={stars} />
      <div className="max-w-5xl mx-auto p-8 flex-1 w-full">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-kp-accent">KP Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 font-medium">
              {session.user.email}
            </span>
            <LogoutButton />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Suspense fallback={<div>Loading dashboard...</div>}>
              <DashboardClient
                initialGeminiKey={user?.geminiKey || ""}
                initialKeeperhubKey={user?.keeperhubKey || ""}
              />
            </Suspense>
          </div>

          <div className="bg-kp-card p-6 h-fit shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Quick Setup</h3>
            <ol className="space-y-4 text-sm text-gray-400 list-decimal list-inside">
              <li>Save your API keys here.</li>
              <li>Open your terminal.</li>
              <li>
                Run{" "}
                <code className="bg-kp-bg text-kp-accent font-mono px-1.5 py-0.5">
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
