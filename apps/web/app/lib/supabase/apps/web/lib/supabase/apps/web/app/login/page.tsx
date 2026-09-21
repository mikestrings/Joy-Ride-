"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

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

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/rider";
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <a href="/" className="brand">
          JOY RIDE
        </a>

        <h1>Welcome back</h1>

        <p>
          Sign in to continue your journey.
        </p>

        <form onSubmit={handleLogin}>
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Your password"
              required
            />
          </label>

          {message && (
            <div className="error">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="switch">
          Don't have an account?{" "}
          <a href="/signup">
            Create one
          </a>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 30px;
          background: #0b172a;
        }

        .auth-card {
          width: 100%;
          max-width: 450px;
          padding: 40px;
          border-radius: 24px;
          background: white;
        }

        .brand {
          display: inline-block;
          margin-bottom: 45px;
          color: #0b172a;
          text-decoration: none;
          font-weight: 900;
          letter-spacing: 2px;
        }

        h1 {
          font-size: 40px;
          margin-bottom: 10px;
        }

        .auth-card > p {
          color: #64748b;
          margin-bottom: 30px;
        }

        form {
          display: grid;
          gap: 20px;
        }

        label {
          display: grid;
          gap: 8px;
          font-weight: 700;
        }

        input {
          width: 100%;
          padding: 14px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          outline: none;
        }

        input:focus {
          border-color: #0b172a;
        }

        button {
          padding: 15px;
          border: 0;
          border-radius: 10px;
          background: #0b172a;
          color: white;
          font-weight: 800;
        }

        button:disabled {
          opacity: 0.6;
        }

        .error {
          padding: 12px;
          border-radius: 8px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 14px;
        }

        .switch {
          margin-top: 25px;
          text-align: center;
          color: #64748b;
        }

        .switch a {
          color: #0b172a;
          font-weight: 800;
        }
      `}</style>
    </main>
  );
          }
