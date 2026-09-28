import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      { configured: false, error: "TELEGRAM_BOT_TOKEN is missing" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getMe`,
      { cache: "no-store" }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      return NextResponse.json(
        { configured: true, telegramAcceptedToken: false },
        { status: 502 }
      );
    }

    return NextResponse.json({
      configured: true,
      telegramAcceptedToken: true,
      botUsername: result.result?.username ?? null,
      botName: result.result?.first_name ?? null,
    });
  } catch {
    return NextResponse.json(
      { configured: true, telegramAcceptedToken: false },
      { status: 502 }
    );
  }
}
