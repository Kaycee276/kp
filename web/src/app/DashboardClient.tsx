"use client";

import { useState } from "react";
import { Key, Save, CheckCircle2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

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

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl");

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
    <div className="bg-kp-card p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Key className="w-6 h-6 text-kp-accent" />
        <h2 className="text-xl font-bold text-white">API Keys</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
            Gemini API Key
          </label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className="w-full bg-kp-bg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-kp-accent/50 focus:border-kp-accent transition-all shadow-sm"
            placeholder="AIzaSy..."
          />
          <p className="mt-2 text-xs text-gray-500">
            Used to power the agent&apos;s reasoning. Get it free from Google AI
            Studio.
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
            KeeperHub API Key
          </label>
          <input
            type="password"
            value={keeperhubKey}
            onChange={(e) => setKeeperhubKey(e.target.value)}
            className="w-full bg-kp-bg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-kp-accent/50 focus:border-kp-accent transition-all shadow-sm"
            placeholder="kh_..."
          />
          <p className="mt-2 text-xs text-gray-500">
            Used to execute onchain transactions. Get it from your KeeperHub
            dashboard.
          </p>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            These keys are stored securely and only accessible by your CLI via
            the device flow.
          </p>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-kp-accent text-white hover:bg-kp-accent-hover px-6 py-2.5 font-medium transition-colors disabled:opacity-50 shadow-sm"
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
