import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/app/lib/joy-wallet/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { initData?: string };
    validateTelegramInitData(body.initData ?? "");

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured.");

    const response = await fetch(
      "https://api.paystack.co/bank?country=nigeria&currency=NGN&perPage=100",
      { headers: { Authorization: "Bearer " + secret }, cache: "no-store" },
    );
    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json({ error: data.message ?? "Unable to load banks." }, { status: 502 });
    }

    return NextResponse.json({ banks: data.data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load banks." },
      { status: 401 },
    );
  }
}
