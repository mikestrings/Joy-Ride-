"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/rider";
  }

  return (
    <main className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="glass" style={{ width: "100%", maxWidth: 440, padding: 44 }}>
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "0.02em" }}>
          Joy Ride
        </Link>

        <h1 style={{ fontSize: 34, margin: "28px 0 8px" }}>Welcome back</h1>

        <p style={{ color: "var(--ink-dim)", marginBottom: 32 }}>
          Sign in to continue your journey.
        </p>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 20 }}>
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
              placeholder="Your password"
              required
            />
          </div>

          {message && (
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff9d9d", fontSize: 14 }}>
              {message}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signi

