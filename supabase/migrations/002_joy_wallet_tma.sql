-- ============================================================
-- JOY WALLET - TELEGRAM MINI APP MVP
-- ============================================================

create extension if not exists pgcrypto;

create table public.joy_wallet_users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.joy_wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.joy_wallet_users(id) on delete cascade,
  balance_kobo bigint not null default 0 check (balance_kobo >= 0),
  lifetime_earned_kobo bigint not null default 0 check (lifetime_earned_kobo >= 0),
  lifetime_withdrawn_kobo bigint not null default 0 check (lifetime_withdrawn_kobo >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.joy_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.joy_wallet_accounts(id) on delete cascade,
  user_id uuid not null references public.joy_wallet_users(id) on delete cascade,
  type text not null check (type in ('ad_reward','referral_reward','bonus','withdrawal','withdrawal_reversal','admin_adjustment')),
  amount_kobo bigint not null,
  reference text unique not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.joy_wallet_ad_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.joy_wallet_users(id) on delete cascade,
  ymid text unique not null,
  provider text not null default 'monetag',
  zone_id text,
  request_var text,
  status text not null default 'started' check (status in ('started','completed','rewarded','rejected','expired')),
  reward_kobo bigint not null default 0 check (reward_kobo >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.joy_wallet_ad_postbacks (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'monetag',
  ymid text,
  zone_id text,
  sub_zone_id text,
  request_var text,
  telegram_id bigint,
  event_type text,
  reward_event_type text,
  estimated_price numeric,
  raw_payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.joy_wallet_withdrawal_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.joy_wallet_users(id) on delete cascade,
  bank_code text not null,
  bank_name text not null,
  account_number text not null,
  account_name text,
  paystack_recipient_code text,
  is_verified boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.joy_wallet_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.joy_wallet_users(id),
  account_id uuid not null references public.joy_wallet_withdrawal_accounts(id),
  amount_kobo bigint not null check (amount_kobo > 0),
  fee_kobo bigint not null default 0 check (fee_kobo >= 0),
  status text not null default 'pending' check (status in ('pending','processing','successful','failed','cancelled','reversed')),
  paystack_transfer_code text,
  paystack_reference text unique,
  failure_reason text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.joy_wallet_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.joy_wallet_users(id) on delete cascade,
  referred_id uuid unique not null references public.joy_wallet_users(id) on delete cascade,
  referral_code text not null,
  status text not null default 'registered' check (status in ('registered','qualified','rewarded')),
  created_at timestamptz not null default now()
);

create table public.joy_wallet_daily_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.joy_wallet_users(id) on delete cascade,
  activity_date date not null,
  ads_started integer not null default 0 check (ads_started >= 0),
  ads_rewarded integer not null default 0 check (ads_rewarded >= 0),
  earned_kobo bigint not null default 0 check (earned_kobo >= 0),
  unique(user_id, activity_date)
);

create table public.joy_wallet_settings (
  key text primary key,
  value_text text not null,
  updated_at timestamptz not null default now()
);

insert into public.joy_wallet_settings(key, value_text)
values
  ('ad_reward_kobo', '500'),
  ('minimum_withdrawal_kobo', '50000'),
  ('daily_ad_limit', '500')
on conflict (key) do nothing;

create index joy_wallet_ledger_user_idx on public.joy_wallet_ledger(user_id, created_at desc);
create index joy_wallet_ad_sessions_user_idx on public.joy_wallet_ad_sessions(user_id, started_at desc);
create index joy_wallet_postbacks_ymid_idx on public.joy_wallet_ad_postbacks(ymid);
create index joy_wallet_withdrawals_user_idx on public.joy_wallet_withdrawals(user_id, created_at desc);

create or replace function public.joy_wallet_credit_ad_reward(
  p_ymid text,
  p_reward_kobo bigint,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.joy_wallet_ad_sessions%rowtype;
  v_account_id uuid;
begin
  select * into v_session
  from public.joy_wallet_ad_sessions
  where ymid = p_ymid
  for update;

  if not found or v_session.status = 'rewarded' or p_reward_kobo <= 0 then
    return false;
  end if;

  select id into v_account_id
  from public.joy_wallet_accounts
  where user_id = v_session.user_id
  for update;

  if not found then
    return false;
  end if;

  update public.joy_wallet_ad_sessions
  set status = 'rewarded', reward_kobo = p_reward_kobo, completed_at = now()
  where id = v_session.id;

  insert into public.joy_wallet_ledger(
    account_id, user_id, type, amount_kobo, reference, description, metadata
  )
  values (
    v_account_id, v_session.user_id, 'ad_reward', p_reward_kobo,
    'monetag:' || p_ymid, 'Verified Monetag ad reward', p_metadata
  )
  on conflict (reference) do nothing;

  if not found then
    return false;
  end if;

  update public.joy_wallet_accounts
  set balance_kobo = balance_kobo + p_reward_kobo,
      lifetime_earned_kobo = lifetime_earned_kobo + p_reward_kobo,
      updated_at = now()
  where id = v_account_id;

  insert into public.joy_wallet_daily_limits(user_id, activity_date, ads_rewarded, earned_kobo)
  values (v_session.user_id, current_date, 1, p_reward_kobo)
  on conflict (user_id, activity_date)
  do update set
    ads_rewarded = joy_wallet_daily_limits.ads_rewarded + 1,
    earned_kobo = joy_wallet_daily_limits.earned_kobo + excluded.earned_kobo;

  return true;
end;
$$;

create or replace function public.joy_wallet_reserve_withdrawal(
  p_user_id uuid,
  p_amount_kobo bigint,
  p_reference text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.joy_wallet_accounts%rowtype;
begin
  select * into v_account
  from public.joy_wallet_accounts
  where user_id = p_user_id
  for update;

  if not found or p_amount_kobo <= 0 or v_account.balance_kobo < p_amount_kobo then
    return false;
  end if;

  update public.joy_wallet_accounts
  set balance_kobo = balance_kobo - p_amount_kobo,
      lifetime_withdrawn_kobo = lifetime_withdrawn_kobo + p_amount_kobo,
      updated_at = now()
  where id = v_account.id;

  insert into public.joy_wallet_ledger(
    account_id, user_id, type, amount_kobo, reference, description
  )
  values (
    v_account.id, p_user_id, 'withdrawal', -p_amount_kobo,
    p_reference, 'Joy Wallet withdrawal'
  );

  return true;
end;
$$;

create or replace function public.joy_wallet_refund_withdrawal(
  p_user_id uuid,
  p_amount_kobo bigint,
  p_reference text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.joy_wallet_accounts%rowtype;
begin
  select * into v_account
  from public.joy_wallet_accounts
  where user_id = p_user_id
  for update;

  if not found or p_amount_kobo <= 0 then
    return false;
  end if;

  update public.joy_wallet_accounts
  set balance_kobo = balance_kobo + p_amount_kobo,
      lifetime_withdrawn_kobo = greatest(0, lifetime_withdrawn_kobo - p_amount_kobo),
      updated_at = now()
  where id = v_account.id;

  insert into public.joy_wallet_ledger(
    account_id, user_id, type, amount_kobo, reference, description
  )
  values (
    v_account.id, p_user_id, 'withdrawal_reversal', p_amount_kobo,
    p_reference, 'Failed withdrawal refund'
  )
  on conflict (reference) do nothing;

  return true;
end;
$$;

alter table public.joy_wallet_users enable row level security;
alter table public.joy_wallet_accounts enable row level security;
alter table public.joy_wallet_ledger enable row level security;
alter table public.joy_wallet_ad_sessions enable row level security;
alter table public.joy_wallet_ad_postbacks enable row level security;
alter table public.joy_wallet_withdrawal_accounts enable row level security;
alter table public.joy_wallet_withdrawals enable row level security;
alter table public.joy_wallet_referrals enable row level security;
alter table public.joy_wallet_daily_limits enable row level security;
alter table public.joy_wallet_settings enable row level security;

-- No client policies are created. All wallet mutations happen server-side.
