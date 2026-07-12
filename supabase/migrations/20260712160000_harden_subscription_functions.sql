-- Security hardening (advisor warnings, 2026-07-12):
-- 1) Pin search_path on trigger functions flagged as "role mutable search_path".
--    Both bodies already schema-qualify all references, so '' is safe.
alter function public.handle_new_user_subscription() set search_path = '';
alter function public.update_subscriptions_updated_at() set search_path = '';

-- 2) handle_new_user_subscription is SECURITY DEFINER and was executable by
--    anon/authenticated via PostgREST RPC. It is only ever invoked as a trigger
--    (runs with table-owner privileges), so direct EXECUTE is unnecessary
--    attack surface. Mirrors 20260623000000_security_hardening.sql.
revoke execute on function public.handle_new_user_subscription() from public, anon, authenticated;

-- update_subscriptions_updated_at is SECURITY INVOKER; revoke for parity.
revoke execute on function public.update_subscriptions_updated_at() from public, anon, authenticated;

-- NOTE: applied live to production on 2026-07-12 via MCP apply_migration.
