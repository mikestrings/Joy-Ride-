import { NextRequest, NextResponse } from "next/server";
import { createJoyWalletAdmin } from "../../../../lib/joy-wallet/supabase-admin";
import { validateTelegramInitData } from "../../../../lib/joy-wallet/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { initData?: string };
    const telegramUser = validateTelegramInitData(body.initData ?? "");
    const supabase = createJoyWalletAdmin();

    const { data: profile } = await supabase
      .from("joy_wallet_users")
      .select("id, telegram_id, username, first_name, last_name, photo_url, is_active")
      .eq("telegram_id", telegramUser.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Wallet profile not found." }, { status: 404 });

    const [{ data: account }, { data: transactions }, { data: daily }] = await Promise.all([
      supabase.from("joy_wallet_accounts")
        .select("balance_kobo, lifetime_earned_kobo, lifetime_withdrawn_kobo")
        .eq("user_id", profile.id).single(),
      supabase.from("joy_wallet_ledger")
        .select("id, type, amount_kobo, description, created_at")
        .eq("user_id", profile.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("joy_wallet_daily_limits")
        .select("ads_started, ads_rewarded, earned_kobo")
        .eq("user_id", profile.id)
        .eq("activity_date", new Date().toISOString().slice(0, 10))
        .maybeSingle(),
    ]);

    return NextResponse.json({
      profile,
      account,
      transactions: transactions ?? [],
      daily: daily ?? { ads_started: 0, ads_rewarded: 0, earned_kobo: 0 },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load wallet." },
      { status: 401 },
    );
  }
}
