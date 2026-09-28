import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createJoyWalletAdmin } from "../../../lib/joy-wallet/supabase-admin";
import { validateTelegramInitData } from "../../../lib/joy-wallet/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      initData?: string;
      accountId?: string;
      amountKobo?: number;
    };

    const telegramUser = validateTelegramInitData(body.initData ?? "");
    const amountKobo = Math.floor(Number(body.amountKobo ?? 0));
    const supabase = createJoyWalletAdmin();

    const { data: minimumSetting } = await supabase
      .from("joy_wallet_settings").select("value_text")
      .eq("key", "minimum_withdrawal_kobo").maybeSingle();
    const minimum = Math.max(100, Number(minimumSetting?.value_text ?? "50000"));

    if (amountKobo < minimum) {
      return NextResponse.json(
        { error: "Minimum withdrawal is ₦" + (minimum / 100).toLocaleString() + "." },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from("joy_wallet_users").select("id")
      .eq("telegram_id", telegramUser.id).single();

    if (!profile) return NextResponse.json({ error: "Wallet profile not found." }, { status: 404 });

    const { data: account } = await supabase
      .from("joy_wallet_withdrawal_accounts")
      .select("id, paystack_recipient_code, is_verified")
      .eq("id", body.accountId)
      .eq("user_id", profile.id)
      .single();

    if (!account?.is_verified || !account.paystack_recipient_code) {
      return NextResponse.json({ error: "Verify a withdrawal account first." }, { status: 400 });
    }

    const reference = "jw_" + randomUUID().replace(/-/g, "").slice(0, 30);

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("joy_wallet_withdrawals")
      .insert({
        user_id: profile.id,
        account_id: account.id,
        amount_kobo: amountKobo,
        status: "pending",
        paystack_reference: reference,
      })
      .select("id")
      .single();

    if (withdrawalError) throw withdrawalError;

    const { data: reserved, error: reserveError } = await supabase.rpc(
      "joy_wallet_reserve_withdrawal",
      {
        p_user_id: profile.id,
        p_amount_kobo: amountKobo,
        p_reference: "withdrawal:" + withdrawal.id,
      },
    );

    if (reserveError || !reserved) {
      await supabase.from("joy_wallet_withdrawals")
        .update({ status: "failed", failure_reason: "Insufficient wallet balance." })
        .eq("id", withdrawal.id);
      return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured.");

    const transferResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amountKobo,
        recipient: account.paystack_recipient_code,
        reference,
        reason: "Joy Wallet withdrawal",
        currency: "NGN",
      }),
    });

    const transfer = await transferResponse.json();

    if (!transferResponse.ok || !transfer.status) {
      await supabase.from("joy_wallet_withdrawals").update({
        status: "failed",
        failure_reason: transfer.message ?? "Paystack transfer failed.",
      }).eq("id", withdrawal.id);

      await supabase.rpc("joy_wallet_refund_withdrawal", {
        p_user_id: profile.id,
        p_amount_kobo: amountKobo,
        p_reference: "refund:" + withdrawal.id,
      });

      return NextResponse.json({ error: transfer.message ?? "Transfer failed." }, { status: 502 });
    }

    await supabase.from("joy_wallet_withdrawals").update({
      status: transfer.data.status === "success" ? "successful" : "processing",
      paystack_transfer_code: transfer.data.transfer_code ?? null,
      processed_at: transfer.data.status === "success" ? new Date().toISOString() : null,
    }).eq("id", withdrawal.id);

    return NextResponse.json({
      success: true,
      status: transfer.data.status,
      reference,
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Withdrawal failed." },
      { status: 500 },
    );
  }
}
