import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-5xl mx-auto py-16 px-8">
          <div className="text-center mb-20">
            <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-transparent bg-clip-text">
              KP Agent
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              The zero-to-one starter template for building AI agents that
              execute onchain transactions using KeeperHub and Gemini.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xl">
              <h2 className="text-2xl font-bold mb-4">Get Started</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Sign in to manage your API keys and link your CLI. Your keys are
                stored securely and only accessible via the device authorization
                flow.
              </p>
              <Link
                href="/api/auth/signin"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-sm"
              >
                Sign in with GitHub
              </Link>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-slate-800">
                  <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    1
                  </span>
                  Install the CLI
                </h3>
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-5 font-mono text-sm text-slate-700 leading-loose shadow-inner">
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

              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-slate-800">
                  <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    2
                  </span>
                  Run the Agent
                </h3>
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-5 font-mono text-sm text-slate-700 shadow-inner">
                  kp
                </div>
                <p className="text-sm text-slate-500 mt-3">
                  The CLI will automatically generate a device code and direct
                  you here to authorize it.
                </p>
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
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-transparent bg-clip-text">
            KP Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-medium">
              {session.user.email}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-md transition-colors shadow-sm"
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

          <div className="bg-white border border-slate-200 rounded-xl p-6 h-fit shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Quick Setup
            </h3>
            <ol className="space-y-4 text-sm text-slate-600 list-decimal list-inside">
              <li>Save your API keys here.</li>
              <li>Open your terminal.</li>
              <li>
                Run{" "}
                <code className="bg-slate-100 border border-slate-200 text-emerald-700 font-mono px-1.5 py-0.5 rounded">
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
