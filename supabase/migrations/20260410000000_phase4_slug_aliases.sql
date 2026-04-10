-- Phase 4: Slug alias tracking for permanent redirects (D-13)
create table public.document_slug_aliases (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('invoice', 'quotation')),
  old_slug text not null,
  document_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_slug_aliases_lookup on public.document_slug_aliases (kind, old_slug);

-- RLS: only the owner can read their own aliases
alter table public.document_slug_aliases enable row level security;

create policy "Users can read own slug aliases"
  on public.document_slug_aliases for select
  using (auth.uid() = user_id);

create policy "Users can insert own slug aliases"
  on public.document_slug_aliases for insert
  with check (auth.uid() = user_id);
