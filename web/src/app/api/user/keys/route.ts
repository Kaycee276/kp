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
    const { keeperhubKey } = await req.json();

    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {
        keeperhubKey,
      },
      create: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        keeperhubKey,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving keys:", error);
    return NextResponse.json({ error: "Failed to save keys" }, { status: 500 });
  }
}
