-- Remove Page Background, Header Cover, and Invoice Layout (document_template)
-- features and their storage: settings UI no longer exposes any of these.
alter table public.branding
  drop column if exists page_background,
  drop column if exists header_cover_path;

alter table public.user_settings
  drop constraint if exists user_settings_document_template_check;

alter table public.user_settings
  drop column if exists document_template;
