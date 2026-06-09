-- Phase 9: header cover image + editor page background color on branding
alter table public.branding
  add column if not exists header_cover_path text,
  add column if not exists page_background text;
