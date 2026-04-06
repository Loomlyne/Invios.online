alter table public.user_settings
add column if not exists document_template text not null default 'classic';

alter table public.user_settings
drop constraint if exists user_settings_document_template_check;

alter table public.user_settings
add constraint user_settings_document_template_check
check (document_template in ('classic', 'executive', 'minimal'));
