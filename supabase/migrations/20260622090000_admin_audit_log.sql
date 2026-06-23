-- Admin audit log — records every operator action taken through the /admin area.
-- RLS is enabled with NO policies for anon/authenticated, so the table is only
-- ever readable/writable by the service-role client (used exclusively server-side
-- behind requireAdmin()). This keeps the audit trail invisible to normal users.

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,                  -- e.g. 'subscription.set_status'
  target_user_id uuid,                   -- account acted upon (nullable)
  target_resource text,                  -- e.g. 'subscriptions:<id>' / 'invoice:<id>'
  metadata jsonb not null default '{}'::jsonb,  -- params / before-after snapshot
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists admin_audit_log_target_user_idx
  on public.admin_audit_log (target_user_id);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
-- Intentionally no policies: only the service-role key bypasses RLS, so only
-- server-side admin code can read or write this table.
