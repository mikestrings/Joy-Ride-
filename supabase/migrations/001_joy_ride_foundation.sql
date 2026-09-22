-- ============================================================
-- JOY RIDE
-- MILESTONE 2: SECURE RIDE REQUEST FLOW
-- ============================================================

create or replace function public.request_ride(
  p_hub text,
  p_shared boolean default false
)
returns public.rides
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_ride public.rides;
  v_fare_kobo bigint;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to request a ride';
  end if;

  if p_hub not in ('mayfair', 'lagere', 'asherifa') then
    raise exception 'Invalid pickup hub';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and role = 'rider'
      and suspended = false
  ) then
    raise exception 'Your rider account is not active';
  end if;

  v_fare_kobo := case when p_shared then 30000 else 60000 end;

  insert into public.rides (
    rider_id,
    hub,
    direction,
    status,
    fare_kobo,
    driver_payout_kobo
  )
  values (
    v_user_id,
    p_hub,
    'outbound',
    'requested',
    v_fare_kobo,
    50000
  )
  returning * into v_ride;

  if p_shared then
    insert into public.ride_pair_requests (ride_id)
    values (v_ride.id);
  end if;

  return v_ride;
end;
$$;

revoke all on function public.request_ride(text, boolean) from public;
grant execute on function public.request_ride(text, boolean) to authenticated;

drop policy if exists "Riders can create rides" on public.rides;

-- Ride creation is now server-authoritative through request_ride().
-- Riders retain read access to their own rides.
