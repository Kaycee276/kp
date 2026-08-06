"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function LinkClient({ deviceCode }: { deviceCode: string }) {
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
      <div className="flex flex-col items-center text-emerald-600">
        <CheckCircle2 className="w-12 h-12 mb-4" />
        <p className="font-medium">Successfully authorized!</p>
        <p className="text-sm text-slate-500 mt-2">
          You can close this window and return to your terminal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-slate-50 px-6 py-3 rounded-lg font-mono text-xl tracking-widest border border-slate-200 mb-8 text-slate-800 shadow-inner">
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
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
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
