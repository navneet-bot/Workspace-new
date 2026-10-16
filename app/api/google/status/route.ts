import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const userEmail = request.nextUrl.searchParams.get("user_email");
  if (!userEmail) {
    return NextResponse.json({ error: "user_email is required" }, { status: 400 });
  }

  const token = await prisma.gmailToken.findUnique({ where: { userEmail } });
  if (!token) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    connectedAt: token.connectedAt.toISOString(),
    userEmail: token.userEmail,
  });
}
