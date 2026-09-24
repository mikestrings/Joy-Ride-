"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Account created. Check your email to confirm your account."
    );

    setLoading(false);
  }

  return (
    <main className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="glass" style={{ width: "100%", maxWidth: 440, padding: 44 }}>
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "0.02em" }}>
          Joy Ride
        </Link>

        <h1 style={{ fontSize: 34, margin: "28px 0 8px" }}>Create account</h1>

        <p style={{ color: "var(--ink-dim)", marginBottom: 32 }}>
          Join Joy Ride and start your journey.
        </p>

        <form onSubmit={handleSignup} style={{ display: "grid", gap: 20 }}>
          <div className="field">
            <label>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="Your full name"
              required
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Create a password"
              required
            />
          </div>

          {message && (
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(0,191,255,0.1)", border: "1px solid rgba(0,191,255,0.3)", color: "var(--electric)", fontSize: 14 }}>
              {message}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: "center", color: "var(--ink-dim)", fontSize: 14 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--electric)", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
