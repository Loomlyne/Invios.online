-- Phase 5: Automation & Recovery
-- Tables: invoice_versions, recurring_schedules, reminder_logs
-- Also: reminder settings columns on user_settings (ADD IF NOT EXISTS — already live in DB)

-- ─── invoice_versions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoice_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot     jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS invoice_versions_invoice_id_idx
  ON public.invoice_versions (invoice_id, user_id, created_at DESC);

ALTER TABLE public.invoice_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice versions are viewable by owner"
  ON public.invoice_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "invoice versions are insertable by owner"
  ON public.invoice_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoice versions are deletable by owner"
  ON public.invoice_versions FOR DELETE
  USING (auth.uid() = user_id);

-- ─── recurring_schedules ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recurring_schedules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  frequency         text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
  next_due_date     date NOT NULL,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at        timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS recurring_schedules_cron_idx
  ON public.recurring_schedules (is_active, next_due_date)
  WHERE is_active = true;

ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring schedules are viewable by owner"
  ON public.recurring_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "recurring schedules are insertable by owner"
  ON public.recurring_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring schedules are updatable by owner"
  ON public.recurring_schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring schedules are deletable by owner"
  ON public.recurring_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- ─── reminder_logs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('before', 'due_date', 'after', 'second')),
  sent_at       timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS reminder_logs_dedup_idx
  ON public.reminder_logs (invoice_id, reminder_type, sent_at DESC);

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminder logs are viewable by owner"
  ON public.reminder_logs FOR SELECT
  USING (auth.uid() = user_id);

-- No UPDATE or DELETE policies — rows are write-once (cron uses admin client which bypasses RLS)

-- ─── Reminder settings columns on user_settings ─────────────────────────────
-- These columns are already live in the database but have no migration file.
-- ADD COLUMN IF NOT EXISTS is idempotent and safe for existing data.

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS reminder_days_before integer NOT NULL DEFAULT 3;
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS reminder_days_after integer NOT NULL DEFAULT 7;
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS remind_on_due_date boolean NOT NULL DEFAULT true;
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS second_reminder_days integer NOT NULL DEFAULT 14;
