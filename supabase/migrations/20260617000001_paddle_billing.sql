-- Add Paddle-specific columns to the subscriptions table
alter table public.subscriptions
  add column if not exists paddle_subscription_id text,
  add column if not exists paddle_customer_id     text,
  add column if not exists paddle_transaction_id  text;

create unique index if not exists subscriptions_paddle_sub_id
  on public.subscriptions(paddle_subscription_id)
  where paddle_subscription_id is not null;
