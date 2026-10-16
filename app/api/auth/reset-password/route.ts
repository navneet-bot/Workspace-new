import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset link.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long.",
        },
        { status: 400 }
      );
    }

    // Hash the raw token exactly the same way as forgot-password.
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const now = new Date();

    /*
     * The generated Prisma client contains passwordResetToken,
     * but the adapter-based Prisma type exposed by lib/db.ts
     * currently does not expose that delegate to TypeScript.
     *
     * This cast only bypasses the TypeScript type mismatch.
     * It does not change the database or runtime connection.
     */
    const resetPrisma = prisma as any;

    const resetToken =
      await resetPrisma.passwordResetToken.findUnique({
        where: {
          tokenHash,
        },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,
        },
      });

    // Reject missing, already-used, or expired tokens.
    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt <= now
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset link.",
        },
        { status: 400 }
      );
    }

    // Hash the new password before storing it.
    const passwordHash = await bcrypt.hash(
      newPassword,
      12
    );

    /*
     * Consume the token and update the password
     * in the same transaction.
     */
    await prisma.$transaction(async (tx) => {
      const claimedToken =
        await (tx as any).passwordResetToken.updateMany({
          where: {
            id: resetToken.id,
            usedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
          data: {
            usedAt: new Date(),
          },
        });

      // Prevent the same reset token from being reused.
      if (claimedToken.count !== 1) {
        throw new Error(
          "RESET_TOKEN_ALREADY_USED"
        );
      }

      // Only the bcrypt hash is stored.
      await tx.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: passwordHash,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "RESET_TOKEN_ALREADY_USED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset link.",
        },
        { status: 400 }
      );
    }

    console.error(
      "[Reset Password] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to reset the password right now.",
      },
      { status: 500 }
    );
  }
}