import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LinkClient from "./LinkClient";
import { Terminal } from "lucide-react";

export default async function LinkPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const code = params.code;

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] text-white">
        <div className="apple-glass-card rounded-2xl p-8 border border-white/10 text-center max-w-sm">
          <p className="text-sm font-semibold text-red-400">
            Invalid or missing device code.
          </p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=/link?code=${code}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const hasKeys = !!user?.keeperhubKey;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-[#0ab955]/30">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0ab955]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full apple-glass-heavy rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10 text-center space-y-6">
        {/* Apple Terminal Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0ab955] to-[#10b981] mx-auto flex items-center justify-center text-white shadow-lg shadow-[#0ab955]/30 border border-emerald-400/30">
          <Terminal className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Authorize Terminal Device
          </h1>
          <p className="text-xs text-white/50 mt-1">
            The KP CLI agent is requesting permission to pair with your API
            keys.
          </p>
        </div>

        <LinkClient deviceCode={code} hasKeys={hasKeys} />
      </div>
    </div>
  );
}
