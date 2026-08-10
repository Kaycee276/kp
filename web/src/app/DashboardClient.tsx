"use client";

import { useState } from "react";
import {
  Key,
  CheckCircle2,
  Cpu,
  Bot,
  Activity,
  ExternalLink,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

export default function DashboardClient({
  initialKeeperhubKey,
}: {
  initialKeeperhubKey: string;
}) {
  const [keeperhubKey, setKeeperhubKey] = useState(initialKeeperhubKey);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keeperhubKey }),
      });
      if (res.ok) {
        setSaved(true);
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* API Key Vault Glass Card */}
      <div className="apple-glass-card rounded-2xl p-8 border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0ab955]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                API Vault
              </h2>
              <p className="text-xs text-white/50">
                Securely store your KeeperHub key to power CLI device pairing
                and Telegram bot execution.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* KeeperHub Key Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
              KeeperHub API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={keeperhubKey}
                onChange={(e) => setKeeperhubKey(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0ab955] focus:ring-2 focus:ring-[#0ab955]/20 transition-all font-mono placeholder:text-white/20"
                placeholder="kh_..."
              />
            </div>
            <p className="text-xs text-white/40">
              Executes onchain transactions. Get yours at{" "}
              <a
                href="https://app.keeperhub.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline"
              >
                KeeperHub Settings
              </a>
              .
            </p>
          </div>

          {/* Save Buttons & Confirmation */}
          <div className="pt-4 flex items-center justify-between border-t border-white/10">
            <p className="text-xs text-white/40 max-w-md">
              Keys are encrypted at rest and synced via authorized terminal
              device flow.
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-[#0ab955] to-[#10b981] text-white hover:opacity-90 px-6 py-2.5 rounded-full text-xs font-semibold apple-button disabled:opacity-50 transition-all shadow-lg shadow-[#0ab955]/20"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <span>{isSaving ? "Saving..." : "Save Key"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Connected Interfaces & Status Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="apple-glass-card rounded-2xl p-6 border border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Terminal CLI Device Flow
            </h3>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            Run{" "}
            <code className="px-1.5 py-0.5 rounded bg-black/60 font-mono text-emerald-300">
              kp
            </code>{" "}
            in your terminal. It will pair with this account and automatically
            pull your keys securely.
          </p>
        </div>

        <div className="apple-glass-card rounded-2xl p-6 border border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Telegram AI Bot</h3>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            Chat directly with{" "}
            <a
              href="https://t.me/keipee_bot"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline font-medium"
            >
              @keipee_bot
            </a>{" "}
            on Telegram to run onchain queries on mobile anytime.
          </p>
        </div>

        <div className="apple-glass-card rounded-2xl p-6 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">System Health</h3>
            </div>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            Live bot server uptime monitoring. Check status on{" "}
            <a
              href="https://stats.uptimerobot.com/SjyoYOBuNi/803699400"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>UptimeRobot</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
