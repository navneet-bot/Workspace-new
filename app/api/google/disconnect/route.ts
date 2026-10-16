import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const userEmail = body.userEmail;

  if (!userEmail) {
    return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
  }

  await prisma.gmailToken.deleteMany({ where: { userEmail } });
  return NextResponse.json({ success: true });
}
