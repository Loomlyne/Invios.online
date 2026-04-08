-- Allow users to permanently dismiss the setup checklist after completing onboarding.
alter table profiles
  add column setup_checklist_dismissed_at timestamptz;
