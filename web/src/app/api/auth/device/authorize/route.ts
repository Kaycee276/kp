import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { deviceCode } = await req.json();

    const code = await prisma.deviceCode.findUnique({
      where: { deviceCode },
    });

    if (!code || code.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    await prisma.deviceCode.update({
      where: { deviceCode },
      data: {
        status: "authorized",
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error authorizing device:", error);
    return NextResponse.json(
      { error: "Failed to authorize device" },
      { status: 500 },
    );
  }
}
