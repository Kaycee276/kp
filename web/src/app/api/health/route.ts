import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("KP Web App is healthy!\n", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
