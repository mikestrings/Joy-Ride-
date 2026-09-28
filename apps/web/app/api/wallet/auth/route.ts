import { NextRequest, NextResponse } from "next/server";
import { createJoyWalletAdmin } from "../../../lib/joy-wallet/supabase-admin";
import { validateTelegramInitData } from "../../../lib/joy-wallet/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { initData?: string };
    const user = validateTelegramInitData(body.initData ?? "");
    const supabase = createJoyWalletAdmin();

    const { data: profile, error: profileError } = await supabase
      .from("joy_wallet_users")
      .upsert({
        telegram_id: user.id,
        username: user.username ?? null,
        first_name: user.first_name,
        last_name: user.last_name ?? null,
        photo_url: user.photo_url ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "telegram_id" })
      .select("id, telegram_id, username, first_name, last_name, photo_url, is_active")
      .single();

    if (profileError) throw profileError;
    if (!profile.is_active) {
      return NextResponse.json({ error: "Wallet account is suspended." }, { status: 403 });
    }

    const { data: account, error: accountError } = await supabase
      .from("joy_wallet_accounts")
      .upsert({ user_id: profile.id }, { onConflict: "user_id" })
      .select("id, balance_kobo, lifetime_earned_kobo, lifetime_withdrawn_kobo")
      .single();

    if (accountError) throw accountError;

    return NextResponse.json({ profile, account });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication failed." },
      { status: 401 },
    );
  }
}
