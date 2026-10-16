"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to process your request."
        );
        return;
      }

      setMessage(
        data.message ||
          "If an account exists with this email, a password reset link has been sent."
      );

      setEmail("");
    } catch (error) {
      console.error(
        "[Forgot Password Page]",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#080d1a",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "32px",
          borderRadius: "18px",
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "#f59e0b",
              color: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "18px",
            }}
          >
            JJ
          </div>

          <span
            style={{
              color: "#e5e7eb",
              fontSize: "22px",
              fontWeight: 600,
            }}
          >
            Job{" "}
            <span style={{ color: "#f59e0b" }}>
              Jockey
            </span>
          </span>
        </div>

        <h1
          style={{
            color: "#f3f4f6",
            fontSize: "28px",
            margin: 0,
          }}
        >
          Forgot Password?
        </h1>

        <p
          style={{
            color: "#9ca3af",
            marginTop: "10px",
            lineHeight: 1.6,
          }}
        >
          Enter your registered email address and
          we'll send you a password reset link.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ marginTop: "28px" }}
        >
          <label
            htmlFor="email"
            style={{
              display: "block",
              color: "#d1d5db",
              marginBottom: "8px",
              fontSize: "14px",
            }}
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              borderRadius: "10px",
              border:
                "1px solid rgba(255,255,255,0.12)",
              background: "#1a2540",
              color: "#f3f4f6",
              outline: "none",
              fontSize: "15px",
            }}
          />

          {error && (
            <p
              style={{
                color: "#f87171",
                marginTop: "14px",
                fontSize: "14px",
              }}
            >
              {error}
            </p>
          )}

          {message && (
            <p
              style={{
                color: "#4ade80",
                marginTop: "14px",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "13px 16px",
              border: "none",
              borderRadius: "10px",
              background: "#f59e0b",
              color: "#111827",
              fontWeight: 700,
              fontSize: "15px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Sending..."
              : "Send Reset Link →"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "22px",
          }}
        >
          <Link
            href="/login"
            style={{
              color: "#f59e0b",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}