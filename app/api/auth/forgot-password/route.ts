import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/resend";

const RESET_TOKEN_EXPIRY_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    // Always return the same response so we don't reveal
    // whether an account exists with this email.
    const genericResponse = () =>
      NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });

    if (!email) {
      return genericResponse();
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Do not reveal whether the email exists.
    if (!user) {
      return genericResponse();
    }

    // Generate a cryptographically secure random token.
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only the SHA-256 hash in the database.
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Token is valid for 15 minutes.
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    /*
     * Prisma generated client contains passwordResetToken,
     * but the PrismaNeon adapter type currently exposed by
     * lib/db.ts does not expose this delegate to TypeScript.
     *
     * This cast only bypasses the TypeScript type mismatch.
     * It does not change the database connection or schema.
     */
    const resetPrisma = prisma as any;

    await resetPrisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL || "http://localhost:3000";

    const resetLink =
      `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    // Useful for local development.
    // The raw token is NOT stored in the database.
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "🔐 [DEV] Password reset link:",
        resetLink
      );
    }

    await sendPasswordResetEmail(
      user.email,
      resetLink
    );

    return genericResponse();
  } catch (error) {
    console.error(
      "[Forgot Password] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process the password reset request right now.",
      },
      { status: 500 }
    );
  }
}