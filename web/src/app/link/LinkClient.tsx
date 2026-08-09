"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
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
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white">Device Pair Approved!</h3>
        <p className="text-xs text-white/60 max-w-xs leading-relaxed">
          Your terminal CLI is now connected. You can close this browser window
          and return to your terminal.
        </p>
      </div>
    );
  }

  if (!hasKeys) {
    return (
      <div className="flex flex-col items-center space-y-6">
        <div className="bg-black/60 border border-white/10 px-8 py-3.5 rounded-2xl font-mono text-2xl tracking-[0.25em] text-emerald-300 shadow-inner">
          {deviceCode}
        </div>

        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-left space-y-2 w-full">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Missing KeeperHub API Key</span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            You must configure your KeeperHub API key in your dashboard before
            authorizing a CLI device.
          </p>
        </div>

        <Link
          href={`/?callbackUrl=/link?code=${deviceCode}`}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0ab955] to-[#10b981] text-white hover:opacity-90 px-6 py-3 rounded-xl text-xs font-semibold apple-button transition-all shadow-lg shadow-[#0ab955]/20"
        >
          <span>Configure Keys in Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Device Code Badge */}
      <div className="bg-black/60 border border-emerald-500/30 px-8 py-4 rounded-2xl font-mono text-2xl font-bold tracking-[0.25em] text-emerald-300 shadow-inner">
        {deviceCode}
      </div>

      {status === "error" && (
        <p className="text-red-400 text-xs font-medium bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
          Authorization failed or expired. Please try again.
        </p>
      )}

      <button
        onClick={handleAuthorize}
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0ab955] to-[#10b981] text-white hover:opacity-90 px-6 py-3.5 rounded-xl text-sm font-semibold apple-button transition-all disabled:opacity-50 shadow-lg shadow-[#0ab955]/25 border border-emerald-400/30"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Approving Connection...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Approve CLI Terminal Device</span>
          </>
        )}
      </button>
    </div>
  );
}
