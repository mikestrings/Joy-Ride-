"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase/client";

const POINTS_PER_AD = 1;
const POINTS_FOR_RIDE_CREDIT = 10;
const POINTS_FOR_FREE_RIDE = 100;
const POINTS_FOR_FOOD_REWARD = 500;
const MIN_WITHDRAWAL_KOBO = 50000;

type FoodReward = {
  id: string;
  item: string;
  description: string;
  stock: number;
};

export default function WatchAndRidePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [rideCreditKobo, setRideCreditKobo] = useState(0);
  const [foodRewards, setFoodRewards] = useState<FoodReward[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

      const { data: wallet } = await supabase
        .from("wallets")
        .select("reward_points, ride_credit_kobo")
        .eq("user_id", user.id)
        .maybeSingle();

      setPoints(wallet?.reward_points ?? 0);
      setRideCreditKobo(wallet?.ride_credit_kobo ?? 0);

      const { data: rewards } = await supabase
        .from("food_rewards")
        .select("id, item, description, stock")
        .eq("active", true);

      setFoodRewards(rewards ?? []);
      setLoading(false);
    }

    load();
  }, []);

  async function ensureWallet(uid: string) {
    await supabase
      .from("wallets")
      .upsert({ user_id: uid }, { onConflict: "user_id", ignoreDuplicates: true });
  }

  async function watchAd() {
    if (!userId) return;
    setBusy(true);
    setMessage("");

    await ensureWallet(userId);

    await supabase.from("ad_views").insert({
      user_id: userId,
      provider: "mock",
      provider_event_id: crypto.randomUUID(),
      points_awarded: POINTS_PER_AD,
    });

    const newPoints = points + POINTS_PER_AD;

    await supabase
      .from("wallets")
      .update({ reward_points: newPoints })
      .eq("user_id", userId);

    setPoints(newPoints);
    setMessage(`+${POINTS_PER_AD} point earned from watching an ad.`);
    setBusy(false);
  }

  async function redeemRideCredit() {
    if (!userId || points < POINTS_FOR_RIDE_CREDIT) return;
    setBusy(true);
    setMessage("");

    const newPoints = points - POINTS_FOR_RIDE_CREDIT;
    const newCredit = rideCreditKobo + 5000;

    await supabase
      .from("wallets")
      .update({ reward_points: newPoints, ride_credit_kobo: newCredit })
      .eq("user_id", userId);

    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      amount_kobo: 5000,
      transaction_type: "reward_ride_credit",
    });

    setPoints(newPoints);
    setRideCreditKobo(newCredit);
    setMessage("₦50 ride credit added to your wallet.");
    setBusy(false);
  }

  async function redeemFreeRide() {
    if (!userId || points < POINTS_FOR_FREE_RIDE) return;
    setBusy(true);
    setMessage("");

    const newPoints = points - POINTS_FOR_FREE_RIDE;
    const newCredit = rideCreditKobo + 60000;

    await supabase
      .from("wallets")
      .update({ reward_points: newPoints, ride_credit_kobo: newCredit })
      .eq("user_id", userId);

    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      amount_kobo: 60000,
      transaction_type: "reward_free_ride",
    });

    setPoints(newPoints);
    setRideCreditKobo(newCredit);
    setMessage("Free ride credit added to your wallet.");
    setBusy(false);
  }

  async function redeemFood(item: string) {
    if (!userId || points < POINTS_FOR_FOOD_REWARD) return;
    setBusy(true);
    setMessage("");

    const newPoints = points - POINTS_FOR_FOOD_REWARD;

    await supabase
      .from("wallets")
      .update({ reward_points: newPoints })
      .eq("user_id", userId);

    await supabase.from("reward_redemptions").insert({
      user_id: userId,
      reward_item: item,
      points_spent: POINTS_FOR_FOOD_REWARD,
      status: "pending",
    });

    setPoints(newPoints);
    setMessage(`Redemption requested: ${item}. We'll notify you when it's ready for pickup.`);
    setBusy(false);
  }

  async function requestWithdrawal() {
    if (!userId) return;

    const amountKobo = Math.round(parseFloat(withdrawAmount || "0") * 100);

    if (!bankName || !accountNumber || !accountName) {
      setMessage("Please fill in your bank details.");
      return;
    }

    if (amountKobo < MIN_WITHDRAWAL_KOBO) {
      setMessage("Minimum withdrawal is ₦500.");
      return;
    }

    if (amountKobo > rideCreditKobo) {
      setMessage("You don't have enough ride credit for this withdrawal.");
      return;
    }

    setBusy(true);
    setMessage("");

    const newCredit = rideCreditKobo - amountKobo;

    await supabase
      .from("wallets")
      .update({ ride_credit_kobo: newCredit })
      .eq("user_id", userId);

    await supabase.from("withdrawal_requests").insert({
      user_id: userId,
      amount_kobo: amountKobo,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
    });

    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      amount_kobo: -amountKobo,
      transaction_type: "withdrawal_request",
    });

    setRideCreditKobo(newCredit);
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setWithdrawAmount("");
    setMessage("Withdrawal request submitted. We'll process it within 24-48 hours.");
    setBusy(false);
  }

  if (loading) {
    return (
      <main className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--ink-dim)" }}>Loading...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/rider" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "0.02em" }}>
          ← Joy Ride
        </Link>
      </header>

      <section className="container" style={{ padding: "40px 24px 20px" }}>
        <p style={{ color: "var(--electric)", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 12 }}>
          WATCH & RIDE
        </p>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 52px)", marginBottom: 12 }}>
          Earn while you ride
        </h1>
        <p style={{ color: "var(--ink-dim)", fontSize: 17 }}>
          Watch ads to earn points, then redeem them for ride credit, food, or cash.
        </p>
      </section>

      <section className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, paddingBottom: 30 }}>
        <div className="glass" style={{ padding: 24 }}>
          <span style={{ color: "var(--ink-dim)", fontSize: 13 }}>Reward points</span>
          <strong style={{ display: "block", fontSize: 36, fontFamily: "var(--font-display)", color: "var(--gold)" }}>{points}</strong>
        </div>
        <div className="glass" style={{ padding: 24 }}>
          <span style={{ color: "var(--ink-dim)", fontSize: 13 }}>Ride credit balance</span>
          <strong style={{ display: "block", fontSize: 36, fontFamily: "var(--font-display)", color: "var(--electric)" }}>₦{(rideCreditKobo / 100).toFixed(0)}</strong>
        </div>
      </section>

      {message && (
        <div className="container" style={{ paddingBottom: 20 }}>
          <div style={{ padding: 14, borderRadius: 10, background: "rgba(0,191,255,0.1)", border: "1px solid rgba(0,191,255,0.3)", color: "var(--electric)", fontSize: 14 }}>
            {message}
          </div>
        </div>
      )}

      <section className="container glass" style={{ padding: 32, marginBottom: 30 }}>
        <h2 style={{ fontSize: 19, marginBottom: 8 }}>Watch an ad</h2>
        <p style={{ color: "var(--ink-dim)", marginBottom: 20 }}>Earn {POINTS_PER_AD} point every time you watch a short ad.</p>
        <button className="btn btn-primary" onClick={watchAd} disabled={busy}>
          {busy ? "Processing..." : "▶ Watch ad (+1 point)"}
        </button>
      </section>

      <section className="container" style={{ paddingBottom: 40 }}>
        <h2 style={{ fontSize: 22, marginBottom: 20 }}>Redeem your points</h2>
        <div style={{ display: "grid", gap: 15, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div className="glass" style={{ padding: 24 }}>
            <strong style={{ display: "block", fontSize: 18, marginBottom: 6 }}>₦50 ride credit</strong>
            <p style={{ color: "var(--ink-dim)", fontSize: 14, marginBottom: 16 }}>{POINTS_FOR_RIDE_CREDIT} points</p>
            <button className="btn btn-ghost" onClick={redeemRideCredit} disabled={busy || points < POINTS_FOR_RIDE_CREDIT} style={{ width: "100%" }}>
              Redeem
            </button>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <strong style={{ display: "block", fontSize: 18, marginBottom: 6 }}>Free ride</strong>
            <p style={{ color: "var(--ink-dim)", fontSize: 14, marginBottom: 16 }}>{POINTS_FOR_FREE_RIDE} points</p>
            <button className="btn btn-ghost" onClick={redeemFreeRide} disabled={busy || points < POINTS_FOR_FREE_RIDE} style={{ width: "100%" }}>
              Redeem
            </button>
          </div>
        </div>
      </section>

      <section className="container glass" style={{ padding: 32, marginBottom: 40 }}>
        <h2 style={{ fontSize: 19, marginBottom: 8 }}>Withdraw as cash</h2>
        <p style={{ color: "var(--ink-dim)", marginBottom: 20 }}>
          Cash out your ride credit balance to your bank account. Minimum ₦500, processed within 24-48 hours.
        </p>

        <div style={{ display: "grid", gap: 16, maxWidth: 420 }}>
          <div className="field">
            <label>Bank name</label>
            <input
              type="text"
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
              placeholder="e.g. GTBank"
            />
          </div>

          <div className="field">
            <label>Account number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="10-digit account number"
            />
          </div>

          <div className="field">
            <label>Account name</label>
            <input
              type="text"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Name on the account"
            />
          </div>

          <div className="field">
            <label>Amount (₦)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              placeholder={`Available: ₦${(rideCreditKobo / 100).toFixed(0)}`}
            />
          </div>

          <button className="btn btn-primary" onClick={requestWithdrawal} disabled={busy || rideCreditKobo < MIN_WITHDRAWAL_KOBO}>
            {busy ? "Processing..." : "Request withdrawal"}
          </button>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 80 }}>
        <h2 style={{ fontSize: 22, marginBottom: 20 }}>Food rewards ({POINTS_FOR_FOOD_REWARD} points)</h2>
        {foodRewards.length === 0 ? (
          <p style={{ color: "var(--ink-dim)" }}>No food rewards available right now.</p>
        ) : (
          <div style={{ display: "grid", gap: 15, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {foodRewards.map((reward) => (
              <div key={reward.id} className="glass" style={{ padding: 22 }}>
                <strong style={{ display: "block", textTransform: "capitalize", marginBottom: 6 }}>{reward.item.replace("_", " ")}</strong>
                <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 16 }}>{reward.description}</p>
                <button
                  className="btn btn-ghost"
                  onClick={() => redeemFood(reward.item)}
                  disabled={busy || points < POINTS_FOR_FOOD_REWARD || reward.stock <= 0}
                  style={{ width: "100%" }}
                >
                  {reward.stock <= 0 ? "Out of stock" : "Redeem"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
