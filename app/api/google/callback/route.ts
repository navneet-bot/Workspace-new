import { NextRequest, NextResponse } from "next/server";
import { verifyState, fetchTokens, getUserEmail } from "@/lib/email/google-oauth";
import prisma from "@/lib/db";

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const oauthState = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${FRONTEND_URL}/dashboard/settings?gmail_connected=0&error=${error}`);
  }

  if (!code || !oauthState) {
    return NextResponse.redirect(`${FRONTEND_URL}/dashboard/settings?gmail_connected=0&error=missing_params`);
  }

  try {
    const userEmail = verifyState(oauthState);
    const tokens = await fetchTokens(code);

    if (!tokens.refresh_token) {
      const existing = await prisma.gmailToken.findUnique({ where: { userEmail } });
      if (!existing || !existing.refreshToken) {
        return NextResponse.redirect(
          `${FRONTEND_URL}/dashboard/settings?gmail_connected=0&error=no_refresh_token`
        );
      }
    }

    await prisma.gmailToken.upsert({
      where: { userEmail },
      update: {
        refreshToken: tokens.refresh_token || undefined,
        accessToken: tokens.access_token || null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      create: {
        userEmail,
        refreshToken: tokens.refresh_token!,
        accessToken: tokens.access_token || null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    return NextResponse.redirect(`${FRONTEND_URL}/dashboard/settings?gmail_connected=1`);
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      `${FRONTEND_URL}/dashboard/settings?gmail_connected=0&error=${encodeURIComponent(err.message)}`
    );
  }
}
