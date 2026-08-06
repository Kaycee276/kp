"use client";

import { useState } from "react";
import { Key, Save, CheckCircle2 } from "lucide-react";

export default function DashboardClient({
  initialGeminiKey,
  initialKeeperhubKey,
}: {
  initialGeminiKey: string;
  initialKeeperhubKey: string;
}) {
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey);
  const [keeperhubKey, setKeeperhubKey] = useState(initialKeeperhubKey);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiKey, keeperhubKey }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Key className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold">API Keys</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Gemini API Key
          </label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            placeholder="AIzaSy..."
          />
          <p className="mt-2 text-xs text-zinc-500">
            Used to power the agent&apos;s reasoning. Get it free from Google AI
            Studio.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            KeeperHub API Key
          </label>
          <input
            type="password"
            value={keeperhubKey}
            onChange={(e) => setKeeperhubKey(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            placeholder="kh_..."
          />
          <p className="mt-2 text-xs text-zinc-500">
            Used to execute onchain transactions. Get it from your KeeperHub
            dashboard.
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            These keys are stored securely and only accessible by your CLI via
            the device flow.
          </p>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />{" "}
                {isSaving ? "Saving..." : "Save Keys"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
