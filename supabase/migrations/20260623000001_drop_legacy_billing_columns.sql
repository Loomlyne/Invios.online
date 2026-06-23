-- M2: Consolidate billing on Creem. Paddle and Polar were superseded; their
-- columns are unused by application code and the table holds 0 rows. Dropping a
-- column also drops the indexes/constraints that depend solely on it
-- (subscriptions_paddle_sub_id, the polar_subscription_id unique constraint).
--
-- Retained intentionally: access_key (unprefixed, Polar-era but kept pending a
-- separate decision) and plan (actively written by the Creem webhook).
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS polar_customer_id,
  DROP COLUMN IF EXISTS polar_subscription_id,
  DROP COLUMN IF EXISTS polar_order_id,
  DROP COLUMN IF EXISTS paddle_subscription_id,
  DROP COLUMN IF EXISTS paddle_customer_id,
  DROP COLUMN IF EXISTS paddle_transaction_id;
