import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { deviceCode } = await req.json();

    const code = await prisma.deviceCode.findUnique({
      where: { deviceCode },
      include: { user: true },
    });

    if (!code || code.expiresAt < new Date()) {
      return NextResponse.json({ status: "expired" });
    }

    if (code.status === "authorized" && code.user) {
      // Return server environment GEMINI_API_KEY (from Vercel)
      const geminiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        "";

      return NextResponse.json({
        status: "authorized",
        geminiKey,
        keeperhubKey: code.user.keeperhubKey || "",
      });
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    console.error("Error polling device status:", error);
    return NextResponse.json(
      { error: "Failed to poll device status" },
      { status: 500 },
    );
  }
}
