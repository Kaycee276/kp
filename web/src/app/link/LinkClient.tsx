"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function LinkClient({
  deviceCode,
  hasKeys,
}: {
  deviceCode: string;
  hasKeys: boolean;
}) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleAuthorize = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/device/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-kp-accent">
        <CheckCircle2 className="w-12 h-12 mb-4" />
        <p className="font-medium">Successfully authorized!</p>
        <p className="text-sm text-gray-400 mt-2">
          You can close this window and return to your terminal.
        </p>
      </div>
    );
  }

  if (!hasKeys) {
    return (
      <div className="flex flex-col items-center">
        <div className="bg-kp-bg px-6 py-3 font-mono text-xl tracking-widest mb-8 text-white shadow-inner">
          {deviceCode}
        </div>
        <div className="bg-red-500/10 border border-red-500/50 p-4 mb-6 text-left">
          <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
            <AlertTriangle className="w-5 h-5" />
            Missing API Keys
          </div>
          <p className="text-sm text-gray-300">
            You cannot authorize this device because you haven&apos;t set your
            Gemini and KeeperHub API keys yet.
          </p>
        </div>
        <Link
          href={`/?callbackUrl=/link?code=${deviceCode}`}
          className="w-full flex items-center justify-center gap-2 bg-kp-accent text-white hover:bg-kp-accent-hover px-6 py-3 font-medium transition-colors shadow-sm"
        >
          Go to Dashboard to set keys
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-kp-bg px-6 py-3 font-mono text-xl tracking-widest mb-8 text-white shadow-inner">
        {deviceCode}
      </div>

      {status === "error" && (
        <p className="text-red-500 text-sm mb-4">
          Failed to authorize. Please try again.
        </p>
      )}

      <button
        onClick={handleAuthorize}
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 bg-kp-accent text-white hover:bg-kp-accent-hover px-6 py-3 font-medium transition-colors disabled:opacity-50 shadow-sm"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Authorizing...
          </>
        ) : (
          "Authorize Device"
        )}
      </button>
    </div>
  );
}
