import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST() {
  try {
    const deviceCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    await prisma.deviceCode.create({
      data: {
        deviceCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    return NextResponse.json({ deviceCode });
  } catch (error) {
    console.error("Error initializing device flow:", error);
    return NextResponse.json(
      { error: "Failed to initialize device flow" },
      { status: 500 },
    );
  }
}
