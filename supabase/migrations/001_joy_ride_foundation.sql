-- ============================================================
-- JOY RIDE
-- DATABASE FOUNDATION
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- ENUM TYPES
-- ============================================================

create type public.app_role as enum (
  'rider',
  'driver',
  'admin'
);

create type public.admin_role as enum (
  'super_admin',
  'operations',
  'finance',
  'support'
);

create type public.ride_status as enum (
  'requested',
  'matched',
  'accepted',
  'arriving',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.ride_direction as enum (
  'outbound',
  'return'
);

create type public.subscription_kind as enum (
  'weekly',
  'monthly'
);

create type public.subscription_mode as enum (
  'one_way',
  'to_and_fro'
);

create type public.reward_item as enum (
  'rice',
  'beans',
  'garri',
  'indomie',
  'cooking_oil'
);


-- ============================================================
-- PROFILES
-- ============================================================

create table public.profiles (

  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text not null default '',

  phone text,

  role public.app_role
    not null default 'rider',

  suspended boolean
    not null default false,

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now()
);


-- ============================================================
-- ADMIN PROFILES
-- ============================================================

create table public.admin_profiles (

  user_id uuid primary key
    references public.profiles(id)
    on delete cascade,

  admin_role public.admin_role
    not null
);


-- ============================================================
-- DRIVERS
-- ============================================================

create table public.drivers (

  id uuid primary key
    default gen_random_uuid(),

  user_id uuid unique not null
    references public.profiles(id)
    on delete cascade,

  status text not null default 'pending',

  phone text not null,

  passport_photo_path text,

  nin text,

  driver_photo_path text,

  motorcycle_photo_path text,

  is_online boolean
    not null default false,

  current_lat numeric(9,6),

  current_lng numeric(9,6),

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now(),

  constraint drivers_status_check
    check (
      status in (
        'pending',
        'approved',
        'rejected',
        'suspended'
      )
    )
);


-- ============================================================
-- WALLETS
-- ============================================================

create table public.wallets (

  user_id uuid primary key
    references public.profiles(id)
    on delete cascade,

  ride_credit_kobo bigint
    not null default 0,

  reward_points integer
    not null default 0,

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now(),

  constraint wallet_credit_positive
    check (ride_credit_kobo >= 0),

  constraint wallet_points_positive
    check (reward_points >= 0)
);


-- ============================================================
-- WALLET TRANSACTIONS
-- ============================================================

create table public.wallet_transactions (

  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  amount_kobo bigint not null,

  transaction_type text not null,

  reference text unique,

  metadata jsonb
    not null default '{}'::jsonb,

  created_at timestamptz
    not null default now()
);


-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================

create table public.subscription_plans (

  id uuid primary key
    default gen_random_uuid(),

  kind public.subscription_kind
    not null,

  mode public.subscription_mode
    not null,

  price_kobo bigint
    not null,

  rides_per_day smallint
    not null,

  active boolean
    not null default true,

  unique(kind, mode),

  constraint subscription_price_positive
    check (price_kobo > 0),

  constraint subscription_rides_valid
    check (rides_per_day in (1,2))
);


-- ============================================================
-- INSERT JOY RIDE SUBSCRIPTION PLANS
-- ============================================================

insert into public.subscription_plans
(
  kind,
  mode,
  price_kobo,
  rides_per_day
)

values

(
  'weekly',
  'one_way',
  250000,
  1
),

(
  'weekly',
  'to_and_fro',
  500000,
  2
),

(
  'monthly',
  'one_way',
  1000000,
  1
),

(
  'monthly',
  'to_and_fro',
  2000000,
  2
);


-- ============================================================
-- USER SUBSCRIPTIONS
-- ============================================================

create table public.subscriptions (

  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  plan_id uuid not null
    references public.subscription_plans(id),

  starts_on date not null,

  ends_on date not null,

  status text
    not null default 'pending',

  payment_reference text unique,

  created_at timestamptz
    not null default now(),

  constraint subscription_status_check
    check (
      status in (
        'pending',
        'active',
        'expired',
        'cancelled'
      )
    ),

  constraint subscription_dates_valid
    check (ends_on >= starts_on)
);


-- ============================================================
-- RIDES
-- ============================================================

create table public.rides (

  id uuid primary key
    default gen_random_uuid(),

  rider_id uuid not null
    references public.profiles(id),

  driver_id uuid
    references public.drivers(id),

  paired_ride_id uuid
    references public.rides(id),

  hub text not null,

  direction public.ride_direction
    not null,

  status public.ride_status
    not null default 'requested',

  fare_kobo bigint
    not null default 60000,

  driver_payout_kobo bigint
    not null default 50000,

  pickup_lat numeric(9,6),

  pickup_lng numeric(9,6),

  destination_lat numeric(9,6),

  destination_lng numeric(9,6),

  requested_at timestamptz
    not null default now(),

  accepted_at timestamptz,

  started_at timestamptz,

  completed_at timestamptz,

  cancelled_at timestamptz,

  cancellation_reason text,

  constraint ride_hub_check
    check (
      hub in (
        'mayfair',
        'lagere',
        'asherifa'
      )
    ),

  constraint ride_fare_valid
    check (fare_kobo >= 0),

  constraint driver_payout_valid
    check (driver_payout_kobo >= 0)
);


-- ============================================================
-- AUTOMATIC PAIRING REQUESTS
-- ============================================================

create table public.ride_pair_requests (

  id uuid primary key
    default gen_random_uuid(),

  ride_id uuid unique not null
    references public.rides(id)
    on delete cascade,

  matched_at timestamptz,

  expires_at timestamptz
    not null default (
      now() + interval '10 minutes'
    ),

  created_at timestamptz
    not null default now()
);


-- ============================================================
-- PAYMENTS
-- ============================================================

create table public.payments (

  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id),

  ride_id uuid
    references public.rides(id),

  subscription_id uuid
    references public.subscriptions(id),

  provider text
    not null default 'paystack',

  reference text unique not null,

  amount_kobo bigint not null,

  status text
    not null default 'pending',

  metadata jsonb
    not null default '{}'::jsonb,

  created_at timestamptz
    not null default now(),

  constraint payment_amount_positive
    check (amount_kobo > 0),

  constraint payment_status_check
    check (
      status in (
        'pending',
        'success',
        'failed',
        'refunded'
      )
    )
);


-- ============================================================
-- WATCH & RIDE
-- ============================================================

create table public.ad_views (

  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  provider text,

  provider_event_id text unique,

  points_awarded integer
    not null default 1,

  viewed_at timestamptz
    not null default now(),

  constraint ad_points_check
    check (points_awarded = 1)
);


-- ============================================================
-- FOOD REWARDS
-- ============================================================

create table public.food_rewards (

  id uuid primary key
    default gen_random_uuid(),

  item public.reward_item
    unique not null,

  description text not null,

  active boolean
    not null default true,

  stock integer
    not null default 0
);


insert into public.food_rewards
(
  item,
  description
)

values

(
  'rice',
  '1 Congo'
),

(
  'beans',
  '1 Congo'
),

(
  'garri',
  '2 Congos'
),

(
  'indomie',
  'Quarter'
),

(
  'cooking_oil',
  '1 bottle of vegetable oil or palm oil'
);


-- ============================================================
-- REWARD REDEMPTIONS
-- ============================================================

create table public.reward_redemptions (

  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id),

  reward_item public.reward_item,

  points_spent integer not null,

  ride_id uuid
    references public.rides(id),

  status text
    not null default 'pending',

  created_at timestamptz
    not null default now(),

  constraint reward_points_positive
    check (points_spent > 0),

  constraint reward_status_check
    check (
      status in (
        'pending',
        'approved',
        'fulfilled',
        'cancelled'
      )
    )
);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table public.notifications (

  id uuid primary key
    default gen_random_uuid(),

  user_id uuid
    references public.profiles(id)
    on delete cascade,

  title text not null,

  body text not null,

  read_at timestamptz,

  created_at timestamptz
    not null default now()
);


-- ============================================================
-- COMPLAINTS
-- ============================================================

create table public.complaints (

  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id),

  ride_id uuid
    references public.rides(id),

  subject text not null,

  message text not null,

  status text
    not null default 'open',

  created_at timestamptz
    not null default now(),

  constraint complaint_status_check
    check (
      status in (
        'open',
        'investigating',
        'resolved',
        'closed'
      )
    )
);


-- ============================================================
-- AUTOMATIC PROFILE + WALLET CREATION
-- ============================================================

create or replace function public.handle_new_user()

returns trigger

language plpgsql

security definer

set search_path = public

as $$

begin

  insert into public.profiles (
    id,
    full_name
  )

  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      ''
    )
  );


  insert into public.wallets (
    user_id
  )

  values (
    new.id
  );


  return new;

end;

$$;


create trigger on_auth_user_created

after insert on auth.users

for each row

execute procedure public.handle_new_user();


-- ============================================================
-- INDEXES
-- ============================================================

create index ad_views_user_day_idx
on public.ad_views(user_id, viewed_at);

create index rides_status_idx
on public.rides(status);

create index rides_hub_direction_idx
on public.rides(
  hub,
  direction,
  status
);

create index drivers_online_idx
on public.drivers(
  is_online,
  status
);

create index payments_user_idx
on public.payments(user_id);

create index subscriptions_user_idx
on public.subscriptions(user_id);


-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles
enable row level security;

alter table public.wallets
enable row level security;

alter table public.wallet_transactions
enable row level security;

alter table public.rides
enable row level security;

alter table public.subscriptions
enable row level security;

alter table public.payments
enable row level security;

alter table public.ad_views
enable row level security;

alter table public.reward_redemptions
enable row level security;

alter table public.notifications
enable row level security;

alter table public.complaints
enable row level security;

alter table public.drivers
enable row level security;


-- ============================================================
-- BASIC USER POLICIES
-- ============================================================

create policy "Users can view own profile"

on public.profiles

for select

using (
  auth.uid() = id
);


create policy "Users can update own profile"

on public.profiles

for update

using (
  auth.uid() = id
);


create policy "Users can view own wallet"

on public.wallets

for select

using (
  auth.uid() = user_id
);


create policy "Riders can create rides"

on public.rides

for insert

with check (
  auth.uid() = rider_id
);


create policy "Riders can view own rides"

on public.rides

for select

using (
  auth.uid() = rider_id
);


create policy "Users can view own subscriptions"

on public.subscriptions

for select

using (
  auth.uid() = user_id
);


create policy "Users can view own payments"

on public.payments

for select

using (
  auth.uid() = user_id
);


create policy "Users can view own notifications"

on public.notifications

for select

using (
  auth.uid() = user_id
);


create policy "Users can mark own notifications read"

on public.notifications

for update

using (
  auth.uid() = user_id
);


create policy "Users can view own complaints"

on public.complaints

for select

using (
  auth.uid() = user_id
);


create policy "Users can create complaints"

on public.complaints

for insert

with check (
  auth.uid() = user_id
);


-- ============================================================
-- IMPORTANT SECURITY NOTE
-- ============================================================
--
-- Ad rewards MUST NOT be awarded directly by the client.
--
-- A server-side Edge Function will:
--
-- 1. Validate the advertising provider event.
-- 2. Check the user's daily ad count.
-- 3. Enforce the 500-ad daily limit.
-- 4. Award exactly one point.
-- 5. Prevent duplicate events.
--
-- Payment verification will also happen server-side.
--
-- ============================================================
