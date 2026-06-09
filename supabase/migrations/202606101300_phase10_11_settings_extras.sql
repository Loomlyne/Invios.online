-- Phase 10: hourly rate on profiles
-- Phase 11: date format + email notification toggles on user_settings
alter table public.profiles
  add column if not exists hourly_rate numeric(10, 2);

alter table public.user_settings
  add column if not exists date_format text default 'd MMM yyyy',
  add column if not exists notify_quote_accepted boolean default true,
  add column if not exists notify_payment_received boolean default true,
  add column if not exists notify_project_activity boolean default false,
  add column if not exists notify_chat_from_customer boolean default true,
  add column if not exists notify_chat_to_customer boolean default true;
