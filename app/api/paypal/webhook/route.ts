import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const event = await req.json();
  // validate and handle event.type
  return NextResponse.json({ status: "ok" });
}
