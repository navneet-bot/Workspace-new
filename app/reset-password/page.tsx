"use client";

import { FormEvent, useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("Invalid or missing reset link.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError("Invalid or missing reset link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to reset password.");
        return;
      }

      setSuccess(true);
      setMessage(data.message);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main
        style={{
          maxWidth: "420px",
          margin: "80px auto",
          padding: "24px",
        }}
      >
        <h1>Password Reset Successful</h1>

        <p style={{ marginTop: "16px" }}>
          Your password has been changed successfully.
        </p>

        <a
          href="/login"
          style={{
            display: "inline-block",
            marginTop: "20px",
          }}
        >
          Go to Login
        </a>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "420px",
        margin: "80px auto",
        padding: "24px",
      }}
    >
      <h1>Reset Password</h1>

      <p style={{ marginTop: "8px", marginBottom: "24px" }}>
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="password">
            New Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            style={{
              display: "block",
              width: "100%",
              marginTop: "6px",
              padding: "10px",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="confirmPassword">
            Confirm Password
          </label>

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            style={{
              display: "block",
              width: "100%",
              marginTop: "6px",
              padding: "10px",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: "16px" }}>
            {error}
          </p>
        )}

        {message && (
          <p style={{ marginBottom: "16px" }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </main>
  );
}