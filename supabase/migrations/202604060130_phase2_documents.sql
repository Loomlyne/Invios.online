create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'client_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.client_status as enum ('lead', 'active');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'invoice_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.invoice_status as enum ('draft', 'sent', 'partial_paid', 'paid', 'overdue');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'invoice_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.invoice_type as enum ('invoice', 'tax_invoice');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'quotation_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.quotation_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'document_language'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.document_language as enum ('en', 'ar', 'bilingual');
  end if;
end $$;

create table if not exists public.document_counters (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('invoice', 'quotation')),
  current_value bigint not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, kind)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  status public.client_status not null default 'lead',
  slug text not null,
  trn text,
  tax_code text,
  portal_token text not null default encode(extensions.gen_random_bytes(18), 'hex'),
  logo_path text,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint clients_slug_per_user_unique unique (user_id, slug),
  constraint clients_portal_token_unique unique (portal_token)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  invoice_number text not null,
  slug text not null,
  status public.invoice_status not null default 'draft',
  invoice_type public.invoice_type not null default 'invoice',
  issue_date date not null,
  due_date date not null,
  currency text not null default 'AED',
  tax_rate numeric(8,2) not null default 0,
  discount numeric(8,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  line_items jsonb not null default '[]'::jsonb,
  notes text,
  terms text,
  language public.document_language not null default 'en',
  trn text,
  share_token text not null default encode(extensions.gen_random_bytes(18), 'hex'),
  pdf_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint invoices_user_number_unique unique (user_id, invoice_number),
  constraint invoices_user_slug_unique unique (user_id, slug),
  constraint invoices_share_token_unique unique (share_token)
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  quotation_number text not null,
  slug text not null,
  status public.quotation_status not null default 'draft',
  quotation_date date not null,
  expiry_date date not null,
  validity_days integer not null default 30,
  currency text not null default 'AED',
  tax_rate numeric(8,2) not null default 0,
  discount numeric(8,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  line_items jsonb not null default '[]'::jsonb,
  notes text,
  terms text,
  language public.document_language not null default 'en',
  share_token text not null default encode(extensions.gen_random_bytes(18), 'hex'),
  converted_to_invoice_id uuid references public.invoices (id) on delete set null,
  conversion_date timestamptz,
  sent_date timestamptz,
  accepted_date timestamptz,
  rejected_date timestamptz,
  rejection_reason text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint quotations_user_number_unique unique (user_id, quotation_number),
  constraint quotations_user_slug_unique unique (user_id, slug),
  constraint quotations_share_token_unique unique (share_token)
);

create index if not exists clients_user_id_idx on public.clients (user_id, created_at desc);
create index if not exists invoices_user_id_idx on public.invoices (user_id, created_at desc);
create index if not exists invoices_client_id_idx on public.invoices (client_id, created_at desc);
create index if not exists quotations_user_id_idx on public.quotations (user_id, created_at desc);
create index if not exists quotations_client_id_idx on public.quotations (client_id, created_at desc);

alter table public.document_counters enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.quotations enable row level security;

drop policy if exists "document counters are viewable by owner" on public.document_counters;
create policy "document counters are viewable by owner"
on public.document_counters for select
using (auth.uid() = user_id);

drop policy if exists "document counters are insertable by owner" on public.document_counters;
create policy "document counters are insertable by owner"
on public.document_counters for insert
with check (auth.uid() = user_id);

drop policy if exists "document counters are updatable by owner" on public.document_counters;
create policy "document counters are updatable by owner"
on public.document_counters for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "clients are viewable by owner" on public.clients;
create policy "clients are viewable by owner"
on public.clients for select
using (auth.uid() = user_id);

drop policy if exists "clients are insertable by owner" on public.clients;
create policy "clients are insertable by owner"
on public.clients for insert
with check (auth.uid() = user_id);

drop policy if exists "clients are updatable by owner" on public.clients;
create policy "clients are updatable by owner"
on public.clients for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "invoices are viewable by owner" on public.invoices;
create policy "invoices are viewable by owner"
on public.invoices for select
using (auth.uid() = user_id);

drop policy if exists "invoices are insertable by owner" on public.invoices;
create policy "invoices are insertable by owner"
on public.invoices for insert
with check (auth.uid() = user_id);

drop policy if exists "invoices are updatable by owner" on public.invoices;
create policy "invoices are updatable by owner"
on public.invoices for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "quotations are viewable by owner" on public.quotations;
create policy "quotations are viewable by owner"
on public.quotations for select
using (auth.uid() = user_id);

drop policy if exists "quotations are insertable by owner" on public.quotations;
create policy "quotations are insertable by owner"
on public.quotations for insert
with check (auth.uid() = user_id);

drop policy if exists "quotations are updatable by owner" on public.quotations;
create policy "quotations are updatable by owner"
on public.quotations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists handle_document_counters_updated_at on public.document_counters;
create trigger handle_document_counters_updated_at
before update on public.document_counters
for each row
execute function extensions.moddatetime(updated_at);

drop trigger if exists handle_clients_updated_at on public.clients;
create trigger handle_clients_updated_at
before update on public.clients
for each row
execute function extensions.moddatetime(updated_at);

drop trigger if exists handle_invoices_updated_at on public.invoices;
create trigger handle_invoices_updated_at
before update on public.invoices
for each row
execute function extensions.moddatetime(updated_at);

drop trigger if exists handle_quotations_updated_at on public.quotations;
create trigger handle_quotations_updated_at
before update on public.quotations
for each row
execute function extensions.moddatetime(updated_at);

create or replace function public.next_document_number(
  p_kind text,
  p_prefix text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_kind text := lower(trim(p_kind));
  v_prefix text;
  v_next_value bigint;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_kind not in ('invoice', 'quotation') then
    raise exception 'Unsupported document kind: %', p_kind;
  end if;

  v_prefix := upper(
    coalesce(
      nullif(trim(p_prefix), ''),
      case
        when v_kind = 'invoice' then 'INV'
        else 'QUO'
      end
    )
  );

  insert into public.document_counters (user_id, kind, current_value)
  values (v_user_id, v_kind, 1)
  on conflict (user_id, kind)
  do update set current_value = public.document_counters.current_value + 1
  returning current_value into v_next_value;

  return v_prefix || '-' || lpad(v_next_value::text, 4, '0');
end;
$$;
