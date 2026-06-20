-- Add Creem-specific columns to the subscriptions table
alter table public.subscriptions
  add column if not exists creem_customer_id     text,
  add column if not exists creem_subscription_id text,
  add column if not exists creem_checkout_id      text;

create unique index if not exists subscriptions_creem_sub_id
  on public.subscriptions(creem_subscription_id)
  where creem_subscription_id is not null;
