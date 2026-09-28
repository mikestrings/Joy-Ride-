import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createJoyWalletAdmin } from "../../../../lib/joy-wallet/supabase-admin";
import { validateTelegramInitData } from "../../../../lib/joy-wallet/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { initData?: string; requestVar?: string };
    const telegramUser = validateTelegramInitData(body.initData ?? "");
    const supabase = createJoyWalletAdmin();

    const { data: profile } = await supabase
      .from("joy_wallet_users")
      .select("id, is_active")
      .eq("telegram_id", telegramUser.id)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Wallet profile is unavailable." }, { status: 403 });
    }

    const { data: limitSetting } = await supabase
      .from("joy_wallet_settings").select("value_text")
      .eq("key", "daily_ad_limit").maybeSingle();

    const dailyLimit = Math.max(1, Number(limitSetting?.value_text ?? "500"));
    const today = new Date().toISOString().slice(0, 10);

    const { data: daily } = await supabase
      .from("joy_wallet_daily_limits")
      .select("ads_started")
      .eq("user_id", profile.id)
      .eq("activity_date", today)
      .maybeSingle();

    if ((daily?.ads_started ?? 0) >= dailyLimit) {
      return NextResponse.json({ error: "Daily ad limit reached." }, { status: 429 });
    }

    const ymid = randomUUID();
    const requestVar = body.requestVar ?? "watch_earn";

    const { error: sessionError } = await supabase
      .from("joy_wallet_ad_sessions")
      .insert({
        user_id: profile.id,
        ymid,
        provider: "monetag",
        zone_id: process.env.MONETAG_TMA_ZONE_ID ?? null,
        request_var: requestVar,
      });

    if (sessionError) throw sessionError;

    const { error: limitError } = await supabase
      .from("joy_wallet_daily_limits")
      .upsert({
        user_id: profile.id,
        activity_date: today,
        ads_started: (daily?.ads_started ?? 0) + 1,
      }, { onConflict: "user_id,activity_date" });

    if (limitError) throw limitError;

    return NextResponse.json({
      ymid,
      requestVar,
      sdkFunction: process.env.NEXT_PUBLIC_MONETAG_SDK_FUNCTION ?? "",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start ad." },
      { status: 400 },
    );
  }
}
