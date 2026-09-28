"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./wallet.css";

type TelegramWebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
  close: () => void;
  showAlert?: (message: string, callback?: () => void) => void;
  themeParams?: Record<string, string>;
};

type WalletData = {
  profile: {
    id: string;
    first_name: string;
    username?: string | null;
    photo_url?: string | null;
  };
  account: {
    balance_kobo: number;
    lifetime_earned_kobo: number;
    lifetime_withdrawn_kobo: number;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount_kobo: number;
    description?: string | null;
    created_at: string;
  }>;
  daily: {
    ads_started: number;
    ads_rewarded: number;
    earned_kobo: number;
  };
};

type Bank = { code: string; name: string };

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

function money(kobo: number) {
  return "₦" + (kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function WalletClient({
  monetagFunction,
  monetagConfigured,
}: {
  monetagFunction: string;
  monetagConfigured: boolean;
}) {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [watching, setWatching] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"home" | "withdraw" | "history">("home");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifiedAccount, setVerifiedAccount] = useState<{
    id: string; account_name: string; account_number: string;
  } | null>(null);
  const [amount, setAmount] = useState("");

  const tg = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return window.Telegram?.WebApp;
  }, []);

  const initData = tg?.initData ?? "";

  const loadWallet = useCallback(async () => {
    if (!initData) {
      setLoading(false);
      setMessage("Open Joy Wallet from Telegram to continue.");
      return;
    }

    const response = await fetch("/api/wallet/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Unable to load wallet.");
      setLoading(false);
      return;
    }

    setData(result);
    setLoading(false);
  }, [initData]);

  useEffect(() => {
    tg?.ready();
    tg?.expand();

    if (initData) {
      fetch("/api/wallet/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      })
        .then((r) => r.json())
        .then((result) => {
          if (result.error) setMessage(result.error);
          else loadWallet();
        })
        .catch(() => setMessage("Unable to connect to Joy Wallet."));
    } else {
      setLoading(false);
      setMessage("Open Joy Wallet from Telegram to continue.");
    }
  }, [tg, initData, loadWallet]);

  async function watchAd() {
    if (!initData) return setMessage("Open Joy Wallet inside Telegram first.");
    if (!monetagConfigured || !monetagFunction) {
      return setMessage("Monetag is not configured yet. Add the TMA SDK tag from Monetag.");
    }

    setWatching(true);
    setMessage("Preparing your ad…");

    try {
      const startResponse = await fetch("/api/wallet/ads/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, requestVar: "watch_earn" }),
      });
      const start = await startResponse.json();
      if (!startResponse.ok) throw new Error(start.error ?? "Unable to start ad.");

      const showAd = (window as unknown as Record<string, unknown>)[monetagFunction];
      if (typeof showAd !== "function") {
        throw new Error("Monetag SDK is not ready. Try again.");
      }

      await (showAd as (options: Record<string, unknown>) => Promise<unknown>)({
        type: "end",
        ymid: start.ymid,
        requestVar: start.requestVar,
      });

      setMessage("Ad finished. Verifying your reward…");

      for (let attempt = 0; attempt < 10; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const before = data?.account.balance_kobo ?? -1;
        await loadWallet();
        const next = await fetch("/api/wallet/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        }).then((r) => r.json());

        if (next.account && next.account.balance_kobo > before) {
          setMessage("Reward credited to your wallet.");
          break;
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The ad could not be shown.");
    } finally {
      setWatching(false);
    }
  }

  async function loadBanks() {
    if (banks.length || !initData) return;
    const response = await fetch("/api/wallet/banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    const result = await response.json();
    if (response.ok) setBanks(result.banks ?? []);
    else setMessage(result.error ?? "Unable to load banks.");
  }

  async function verifyAccount() {
    if (!bankCode || !accountNumber) return setMessage("Select a bank and enter your account number.");
    setMessage("Verifying bank account…");

    const response = await fetch("/api/wallet/withdraw/verify-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, accountNumber, bankCode, bankName }),
    });
    const result = await response.json();

    if (!response.ok) return setMessage(result.error ?? "Account verification failed.");
    setVerifiedAccount(result.account);
    setMessage("Account verified: " + result.account.account_name);
  }

  async function withdraw() {
    if (!verifiedAccount) return setMessage("Verify your bank account first.");
    const naira = Number(amount);
    if (!Number.isFinite(naira) || naira <= 0) return setMessage("Enter a valid withdrawal amount.");

    setMessage("Processing withdrawal…");
    const response = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData,
        accountId: verifiedAccount.id,
        amountKobo: Math.round(naira * 100),
      }),
    });
    const result = await response.json();

    if (!response.ok) return setMessage(result.error ?? "Withdrawal failed.");

    setAmount("");
    setMessage("Withdrawal submitted. Reference: " + result.reference);
    await loadWallet();
  }

  if (loading) {
    return <main className="jw-shell"><div className="jw-card jw-loading">Loading Joy Wallet…</div></main>;
  }

  const account = data?.account;
  const daily = data?.daily;

  return (
    <main className="jw-shell">
      <section className="jw-top">
        <div>
          <span className="jw-brand">JOY WALLET</span>
          <h1>Hello, {data?.profile.first_name ?? "there"} 👋</h1>
          <p>Watch. Earn. Withdraw.</p>
        </div>
        {data?.profile.photo_url ? <img className="jw-avatar" src={data.profile.photo_url} alt="" /> : null}
      </section>

      <section className="jw-balance">
        <span>Available balance</span>
        <strong>{money(account?.balance_kobo ?? 0)}</strong>
        <div className="jw-stats">
          <span>Earned {money(account?.lifetime_earned_kobo ?? 0)}</span>
          <span>Withdrawn {money(account?.lifetime_withdrawn_kobo ?? 0)}</span>
        </div>
      </section>

      {message ? <div className="jw-message" role="status">{message}</div> : null}

      {tab === "home" && (
        <>
          <button className="jw-earn" onClick={watchAd} disabled={watching}>
            <span>{watching ? "WATCHING…" : "▶ WATCH AD & EARN"}</span>
            <small>{daily?.ads_rewarded ?? 0} rewarded today</small>
          </button>

          {!monetagConfigured ? (
            <div className="jw-note">
              Monetag TMA setup is the last external configuration step. Add your Rewarded Interstitial SDK tag to Vercel.
            </div>
          ) : null}

          <div className="jw-grid">
            <button onClick={() => { setTab("withdraw"); loadBanks(); }} className="jw-action">
              <b>Withdraw</b><span>Send to your bank</span>
            </button>
            <button onClick={() => setTab("history")} className="jw-action">
              <b>History</b><span>View wallet activity</span>
            </button>
          </div>
        </>
      )}

      {tab === "withdraw" && (
        <section className="jw-panel">
          <div className="jw-panel-head">
            <button onClick={() => setTab("home")}>←</button>
            <h2>Withdraw</h2>
          </div>

          <label>Bank</label>
          <select value={bankCode} onChange={(e) => {
            const bank = banks.find((item) => item.code === e.target.value);
            setBankCode(e.target.value);
            setBankName(bank?.name ?? "");
          }}>
            <option value="">Select your bank</option>
            {banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
          </select>

          <label>Account number</label>
          <input
            inputMode="numeric"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit account number"
          />
          <button className="jw-secondary" onClick={verifyAccount}>Verify account</button>

          {verifiedAccount ? (
            <div className="jw-verified">
              <b>{verifiedAccount.account_name}</b>
              <span>{verifiedAccount.account_number}</span>
            </div>
          ) : null}

          <label>Amount (₦)</label>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
          />
          <button className="jw-primary" onClick={withdraw}>Withdraw funds</button>
        </section>
      )}

      {tab === "history" && (
        <section className="jw-panel">
          <div className="jw-panel-head">
            <button onClick={() => setTab("home")}>←</button>
            <h2>History</h2>
          </div>
          {(data?.transactions ?? []).length === 0 ? (
            <p className="jw-empty">No transactions yet.</p>
          ) : (
            <div className="jw-history">
              {data?.transactions.map((item) => (
                <div className="jw-history-row" key={item.id}>
                  <div>
                    <b>{item.description ?? item.type.replaceAll("_", " ")}</b>
                    <small>{new Date(item.created_at).toLocaleString()}</small>
                  </div>
                  <strong className={item.amount_kobo >= 0 ? "plus" : "minus"}>
                    {item.amount_kobo >= 0 ? "+" : ""}{money(item.amount_kobo)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <nav className="jw-nav">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}>Home</button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>History</button>
        <button className={tab === "withdraw" ? "active" : ""} onClick={() => { setTab("withdraw"); loadBanks(); }}>Withdraw</button>
      </nav>
    </main>
  );
}
