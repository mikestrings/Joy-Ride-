# Joy Wallet MVP Setup

Joy Wallet is the Telegram Mini App route at:

https://joy-ride-joy-ride.vercel.app/wallet

## 1. Supabase

Run:

supabase/migrations/002_joy_wallet_tma.sql

The migration creates a separate cash wallet ledger, Monetag ad sessions/postbacks, withdrawals, referral records, daily limits, and server-side RPCs.

## 2. Vercel environment variables

Add these to the web project:

NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
PAYSTACK_SECRET_KEY
MONETAG_TMA_ZONE_ID
NEXT_PUBLIC_MONETAG_SDK_SRC
NEXT_PUBLIC_MONETAG_SDK_FUNCTION

Optional:

JOY_WALLET_AD_REWARD_KOBO=500
JOY_WALLET_MIN_WITHDRAWAL_KOBO=50000
JOY_WALLET_DAILY_AD_LIMIT=500

Never expose SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, or PAYSTACK_SECRET_KEY to the browser.

## 3. Telegram

Create the bot with @BotFather, configure a Main Mini App, and point it at:

https://joy-ride-joy-ride.vercel.app/wallet

Telegram initData is validated server-side before a wallet account is created or used.

## 4. Monetag

In Monetag, create a Telegram Mini App entry for Joy Wallet and create a Rewarded Interstitial SDK tag.

Copy the exact SDK script from Monetag "Get instructions" into:

NEXT_PUBLIC_MONETAG_SDK_SRC

If Monetag gives you a global such as show_123456, set:

NEXT_PUBLIC_MONETAG_SDK_FUNCTION=show_123456

Set:

MONETAG_TMA_ZONE_ID=<your TMA SDK main zone>

The old website Direct Link zone is not automatically the TMA rewarded zone. A TMA SDK zone must be created in the Monetag Telegram Mini Apps area.

Configure the Monetag postback URL as:

https://joy-ride-joy-ride.vercel.app/api/monetag/postback?ymid={ymid}&zone={zone_id}&sub={sub_zone_id}&event={event_type}&value={reward_event_type}&price={estimated_price}&source={request_var}&telegram_id={telegram_id}

Only postbacks with reward_event_type=valued can credit the server-side wallet, and each ymid is processed once.

## 5. Paystack

The withdrawal flow:
1. Loads Nigerian banks.
2. Resolves the 10-digit account number.
3. Creates a Paystack nuban transfer recipient.
4. Reserves wallet funds atomically.
5. Initiates a NGN transfer.
6. Refunds the reservation if Paystack rejects the transfer.

Use a Paystack business account with Transfers enabled.

## 6. Current MVP economics

The migration starts with:

- Ad reward: ₦5 per valued Monetag event
- Minimum withdrawal: ₦500
- Daily ad starts: 500

These are configuration defaults, not Monetag payout promises. Change them in joy_wallet_settings after the business model is finalized.

## 7. Important

Do not award money from the frontend Monetag Promise alone. The frontend uses the Promise only to update UI; the database reward is triggered by the Monetag server-side postback.
