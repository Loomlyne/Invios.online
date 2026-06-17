-- Polar.sh subscription state per user
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  polar_customer_id       text,
  polar_subscription_id   text unique,
  polar_order_id          text,
  status                  text not null default 'inactive',
  -- status values: inactive | trialing | active | past_due | canceled | revoked
  current_period_end      timestamptz,
  access_key              text unique,
  plan                    text,
  -- plan values: monthly | annual
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription row only
create policy "owner select"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role handles all writes via webhooks (no client-side write policies)

-- One subscription row per user
create unique index subscriptions_user_id_unique on public.subscriptions(user_id);

-- Auto-update updated_at on row changes
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function update_updated_at_column();
