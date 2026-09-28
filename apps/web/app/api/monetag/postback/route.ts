import { NextRequest, NextResponse } from "next/server";
import { createJoyWalletAdmin } from "../../../lib/joy-wallet/supabase-admin";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const ymid = p.get("ymid");
  const eventType = p.get("event") ?? p.get("event_type");
  const rewardEventType = p.get("value") ?? p.get("reward_event_type");

  if (!ymid || !rewardEventType) {
    return NextResponse.json({ ok: false, error: "Missing postback fields." }, { status: 400 });
  }

  try {
    const supabase = createJoyWalletAdmin();

    const { data: session } = await supabase
      .from("joy_wallet_ad_sessions")
      .select("id, user_id, status")
      .eq("ymid", ymid)
      .maybeSingle();

    const rawPayload = Object.fromEntries(p.entries());

    const { data: postback } = await supabase
      .from("joy_wallet_ad_postbacks")
      .insert({
        provider: "monetag",
        ymid,
        zone_id: p.get("zone") ?? p.get("zone_id"),
        sub_zone_id: p.get("sub") ?? p.get("sub_zone_id"),
        request_var: p.get("source") ?? p.get("request_var"),
        telegram_id: p.get("telegram_id") ? Number(p.get("telegram_id")) : null,
        event_type: eventType,
        reward_event_type: rewardEventType,
        estimated_price: p.get("price") ? Number(p.get("price")) : null,
        raw_payload: rawPayload,
      })
      .select("id")
      .maybeSingle();

    if (!session || rewardEventType !== "valued") {
      if (postback?.id) {
        await supabase.from("joy_wallet_ad_postbacks")
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq("id", postback.id);
      }
      return NextResponse.json({ ok: true, processed: false });
    }

    const { data: setting } = await supabase
      .from("joy_wallet_settings").select("value_text")
      .eq("key", "ad_reward_kobo").maybeSingle();

    const rewardKobo = Math.max(1, Number(setting?.value_text ?? "500"));

    const { data: rewarded, error: rewardError } = await supabase.rpc(
      "joy_wallet_credit_ad_reward",
      {
        p_ymid: ymid,
        p_reward_kobo: rewardKobo,
        p_metadata: {
          event_type: eventType,
          zone_id: p.get("zone") ?? p.get("zone_id"),
          sub_zone_id: p.get("sub") ?? p.get("sub_zone_id"),
          request_var: p.get("source") ?? p.get("request_var"),
          estimated_price: p.get("price") ? Number(p.get("price")) : null,
        },
      },
    );

    if (rewardError) throw rewardError;

    if (postback?.id) {
      await supabase.from("joy_wallet_ad_postbacks")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", postback.id);
    }

    return NextResponse.json({ ok: true, processed: Boolean(rewarded) });
  } catch (error) {
    console.error("Monetag postback error:", error);
    return NextResponse.json({ ok: false, error: "Postback processing failed." }, { status: 500 });
  }
}
