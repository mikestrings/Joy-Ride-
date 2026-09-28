import { createHmac, timingSafeEqual } from "node:crypto";

export type TelegramMiniAppUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

export function validateTelegramInitData(initData: string): TelegramMiniAppUser {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  if (!initData) {
    throw new Error("Telegram initData is missing.");
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date") ?? 0);

  if (!receivedHash || !authDate) {
    throw new Error("Invalid Telegram initData.");
  }

  if (Math.floor(Date.now() / 1000) - authDate > 86400) {
    throw new Error("Telegram initData has expired.");
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const received = Buffer.from(receivedHash, "hex");
  const calculated = Buffer.from(calculatedHash, "hex");

  if (
    received.length !== calculated.length ||
    !timingSafeEqual(received, calculated)
  ) {
    throw new Error("Telegram initData signature is invalid.");
  }

  const userRaw = params.get("user");

  if (!userRaw) {
    throw new Error("Telegram user data is missing.");
  }

  let user: TelegramMiniAppUser;

  try {
    user = JSON.parse(userRaw) as TelegramMiniAppUser;
  } catch {
    throw new Error("Telegram user data is invalid.");
  }

  if (!user.id || !user.first_name) {
    throw new Error("Telegram user data is incomplete.");
  }

  return user;
}
