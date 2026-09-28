import { NextRequest, NextResponse } from "next/server";
import { createJoyWalletAdmin } from "@/app/lib/joy-wallet/supabase-admin";
import { validateTelegramInitData } from "@/app/lib/joy-wallet/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      initData?: string;
      accountNumber?: string;
      bankCode?: string;
      bankName?: string;
    };

    const telegramUser = validateTelegramInitData(body.initData ?? "");
    const accountNumber = (body.accountNumber ?? "").replace(/\D/g, "");

    if (!/^\d{10}$/.test(accountNumber) || !body.bankCode || !body.bankName) {
      return NextResponse.json({ error: "Enter a valid 10-digit account number and bank." }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured.");

    const resolveResponse = await fetch(
      "https://api.paystack.co/bank/resolve?account_number=" +
      encodeURIComponent(accountNumber) +
      "&bank_code=" + encodeURIComponent(body.bankCode),
      { headers: { Authorization: "Bearer " + secret }, cache: "no-store" },
    );
    const resolved = await resolveResponse.json();

    if (!resolveResponse.ok || !resolved.status) {
      return NextResponse.json({ error: resolved.message ?? "Account could not be verified." }, { status: 400 });
    }

    const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name: resolved.data.account_name,
        account_number: accountNumber,
        bank_code: body.bankCode,
        currency: "NGN",
      }),
    });
    const recipient = await recipientResponse.json();

    if (!recipientResponse.ok || !recipient.status) {
      return NextResponse.json(
        { error: recipient.message ?? "Unable to create transfer recipient." },
        { status: 502 },
      );
    }

    const supabase = createJoyWalletAdmin();
    const { data: profile } = await supabase
      .from("joy_wallet_users")
      .select("id")
      .eq("telegram_id", telegramUser.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Wallet profile not found." }, { status: 404 });

    const { data: saved, error } = await supabase
      .from("joy_wallet_withdrawal_accounts")
      .insert({
        user_id: profile.id,
        bank_code: body.bankCode,
        bank_name: body.bankName,
        account_number: accountNumber,
        account_name: resolved.data.account_name,
        paystack_recipient_code: recipient.data.recipient_code,
        is_verified: true,
        is_default: true,
      })
      .select("id, bank_code, bank_name, account_number, account_name, paystack_recipient_code, is_verified")
      .single();

    if (error) throw error;

    return NextResponse.json({ account: saved });
  } catch (error) {
    console.error("Account verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Account verification failed." },
      { status: 400 },
    );
  }
}
