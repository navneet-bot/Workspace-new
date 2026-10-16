import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/email/google-oauth";

export async function GET(request: NextRequest) {
  const userEmail = request.nextUrl.searchParams.get("user_email");
  if (!userEmail) {
    return NextResponse.json({ error: "user_email is required" }, { status: 400 });
  }

  const { authorizationUrl } = getAuthUrl(userEmail);
  return NextResponse.json({ auth_url: authorizationUrl });
}
