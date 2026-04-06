create extension if not exists moddatetime with schema extensions;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'signature_mode'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.signature_mode as enum ('none', 'upload', 'draw', 'typed');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  onboarding_step text not null default 'business-profile',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint profiles_onboarding_step_check check (
    onboarding_step in ('business-profile', 'branding', 'defaults', 'preview')
  )
);

create table if not exists public.branding (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  business_name text,
  business_email text,
  phone text,
  website text,
  address text,
  trn text,
  bank_details text,
  footer_text text,
  logo_path text,
  primary_color text,
  secondary_color text,
  signature_mode public.signature_mode not null default 'none',
  signature_path text,
  signature_text text,
  signature_font text,
  invoice_prefix text not null default 'INV',
  quotation_prefix text not null default 'QUO',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  default_currency text not null default 'AED',
  default_language text not null default 'en',
  default_tax_rate numeric(6,2) not null default 5,
  tax_enabled boolean not null default true,
  default_terms text not null default 'Payment due within 7 days of issue.',
  default_notes text not null default 'Thank you for your business.',
  timezone text not null default 'Asia/Dubai',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;
alter table public.branding enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles are viewable by owner" on public.profiles;
create policy "profiles are viewable by owner"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles are insertable by owner" on public.profiles;
create policy "profiles are insertable by owner"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles are updatable by owner" on public.profiles;
create policy "profiles are updatable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "branding is viewable by owner" on public.branding;
create policy "branding is viewable by owner"
on public.branding for select
using (auth.uid() = user_id);

drop policy if exists "branding is insertable by owner" on public.branding;
create policy "branding is insertable by owner"
on public.branding for insert
with check (auth.uid() = user_id);

drop policy if exists "branding is updatable by owner" on public.branding;
create policy "branding is updatable by owner"
on public.branding for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user settings are viewable by owner" on public.user_settings;
create policy "user settings are viewable by owner"
on public.user_settings for select
using (auth.uid() = user_id);

drop policy if exists "user settings are insertable by owner" on public.user_settings;
create policy "user settings are insertable by owner"
on public.user_settings for insert
with check (auth.uid() = user_id);

drop policy if exists "user settings are updatable by owner" on public.user_settings;
create policy "user settings are updatable by owner"
on public.user_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
before update on public.profiles
for each row
execute function extensions.moddatetime(updated_at);

drop trigger if exists handle_branding_updated_at on public.branding;
create trigger handle_branding_updated_at
before update on public.branding
for each row
execute function extensions.moddatetime(updated_at);

drop trigger if exists handle_user_settings_updated_at on public.user_settings;
create trigger handle_user_settings_updated_at
before update on public.user_settings
for each row
execute function extensions.moddatetime(updated_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('branding-assets', 'branding-assets', false)
on conflict (id) do nothing;

drop policy if exists "branding assets readable by owner" on storage.objects;
create policy "branding assets readable by owner"
on storage.objects for select
using (
  bucket_id = 'branding-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "branding assets writable by owner" on storage.objects;
create policy "branding assets writable by owner"
on storage.objects for insert
with check (
  bucket_id = 'branding-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "branding assets update by owner" on storage.objects;
create policy "branding assets update by owner"
on storage.objects for update
using (
  bucket_id = 'branding-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'branding-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "branding assets delete by owner" on storage.objects;
create policy "branding assets delete by owner"
on storage.objects for delete
using (
  bucket_id = 'branding-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
