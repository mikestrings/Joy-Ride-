"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

const hubs = [
  {
    id: "mayfair",
    name: "Mayfair",
  },
  {
    id: "lagere",
    name: "Lagere",
  },
  {
    id: "asherifa",
    name: "Asherifa",
  },
] as const;

export default function RiderDashboard() {
  const supabase = createClient();

  const [selectedHub, setSelectedHub] =
    useState<
      "mayfair" | "lagere" | "asherifa"
    >("mayfair");

  const [shareRide, setShareRide] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function requestRide() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase
      .from("rides")
      .insert({
        rider_id: user.id,
        hub: selectedHub,
        direction: "outbound",
        status: "requested",
        fare_kobo: shareRide
          ? 30000
          : 60000,
        driver_payout_kobo: shareRide
          ? 50000
          : 50000,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Your ride request has been created. We're looking for a driver."
    );

    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="page">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div>
          <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "0.02em" }}>
            Joy Ride
          </Link>
          <p style={{ color: "var(--ink-dim)", fontSize: 13, marginTop: 4 }}>Ride. Earn. Repeat.</p>
        </div>
        <button className="btn btn-ghost" onClick={signOut}>
          Sign out
        </button>
      </header>

      <section className="container" style={{ padding: "40px 24px 20px" }}>
        <p style={{ color: "var(--electric)", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 12 }}>
          RIDER DASHBOARD
        </p>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 52px)", marginBottom: 12 }}>
          Where are you going?
        </h1>
        <p style={{ color: "var(--ink-dim)", fontSize: 17 }}>
          Choose your pickup hub and request a ride to OAU Campus Gate.
        </p>
      </section>

      <section className="container glass" style={{ padding: 32, marginBottom: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 20, marginBottom: 36 }}>
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--electric)", color: "#051018", display: "grid", placeItems: "center", fontWeight: 700 }}>1</span>
          <div>
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>Choose pickup hub</h2>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              {hubs.map((hub) => (
                <button
                  key={hub.id}
                  onClick={() => setSelectedHub(hub.id)}
                  style={{
                    textAlign: "left",
                    padding: 18,
                    borderRadius: 14,
                    border: selectedHub === hub.id ? "2px solid var(--electric)" : "1px solid rgba(255,255,255,0.12)",
                    background: selectedHub === hub.id ? "rgba(0,191,255,0.08)" : "rgba(255,255,255,0.03)",
                    color: "var(--ink)",
                  }}
                >
                  <strong style={{ display: "block" }}>{hub.name}</strong>
                  <small style={{ color: "var(--ink-dim)" }}>→ OAU Campus Gate</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 20, marginBottom: 36 }}>
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--electric)", color: "#051018", display: "grid", placeItems: "center", fontWeight: 700 }}>2</span>
          <div>
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>Destination</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
              <span>📍</span>
              <div>
                <strong style={{ display: "block" }}>OAU Campus Gate</strong>
                <small style={{ color: "var(--ink-dim)" }}>Obafemi Awolowo University</small>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 20, marginBottom: 36 }}>
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--electric)", color: "#051018", display: "grid", placeItems: "center", fontWeight: 700 }}>3</span>
          <div>
            <h2 style={{ fontSize: 19, marginBottom: 16 }}>Ride preference</h2>
            <button
              onClick={() => setShareRide(!shareRide)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 18,
                borderRadius: 14,
                border: shareRide ? "2px solid var(--electric)" : "1px solid rgba(255,255,255,0.12)",
                background: shareRide ? "rgba(0,191,255,0.08)" : "rgba(255,255,255,0.03)",
                color: "var(--ink)",
                textAlign: "left",
              }}
            >
              <div>
                <strong style={{ display: "block" }}>Share my ride</strong>
                <small style={{ color: "var(--ink-dim)" }}>Automatically match me with another rider going the same way.</small>
              </div>
              <span style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: shareRide ? "var(--electric)" : "rgba(255,255,255,0.1)", color: shareRide ? "#051018" : "var(--ink-dim)" }}>
                {shareRide ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "24px 0", borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 20 }}>
          <div>
            <span style={{ color: "var(--ink-dim)", fontSize: 13 }}>Your fare</span>
            <strong style={{ display: "block", fontSize: 28, fontFamily: "var(--font-display)" }}>₦{shareRide ? "300" : "600"}</strong>
          </div>
          <div>
            <span style={{ color: "var(--ink-dim)", fontSize: 13 }}>Driver receives</span>
            <strong style={{ display: "block", fontSize: 28, fontFamily: "var(--font-display)" }}>₦500</strong>
          </div>
        </div>

        {message && (
          <div style={{ marginBottom: 15, padding: 14, borderRadius: 10, background: "rgba(0,191,255,0.1)", border: "1px solid rgba(0,191,255,0.3)", color: "var(--electric)", fontSize: 14 }}>
            {message}
          </div>
        )}

        <button className="btn btn-primary" onClick={requestRide} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Requesting..." : "Request ride"}
        </button>
      </section>

      <section className="container" style={{ padding: "0 24px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 15 }}>
        {[
          { icon: "💰", title: "Wallet", body: "Ride credits & points" },
          { icon: "🎬", title: "Watch & Ride", body: "Earn rewards from ads" },
          { icon: "🎫", title: "Ride Passes", body: "Save with subscriptions" },
          { icon: "🚲", title: "My Rides", body: "View ride history" },
        ].map((f) => (
          <a key={f.title} href="#" className="glass" style={{ display: "block", padding: 22 }}>
            <span style={{ fontSize: 25, marginBottom: 15, display: "block" }}>{f.icon}</span>
            <strong style={{ display: "block" }}>{f.title}</strong>
            <small style={{ color: "var(--ink-dim)" }}>{f.body}</small>
          </a>
        ))}
      </section>
    </main>
  );
}
