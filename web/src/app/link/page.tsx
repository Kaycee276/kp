import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LinkClient from "./LinkClient";

export default async function LinkPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const session = await getServerSession(authOptions);
  const code = searchParams.code;

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kp-bg text-white">
        <p>Invalid device code.</p>
      </div>
    );
  }

  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=/link?code=${code}`);
  }

  return (
    <div className="min-h-screen bg-kp-bg text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-kp-card p-8 shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-2 text-white">Authorize CLI</h1>
        <p className="text-gray-400 mb-8">
          The KP CLI is requesting access to your API keys.
        </p>
        <LinkClient deviceCode={code} />
      </div>
    </div>
  );
}
