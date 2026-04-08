-- payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12,2) not null,
  date_paid date not null,
  method text not null default 'other'
    check (method in ('cash', 'bank_transfer', 'cheque', 'other')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12,2) not null,
  date date not null,
  description text not null,
  vendor text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Indexes
create index if not exists payments_invoice_id_idx on public.payments (invoice_id, user_id);
create index if not exists expenses_invoice_id_idx on public.expenses (invoice_id, user_id);

-- RLS
alter table public.payments enable row level security;
alter table public.expenses enable row level security;

-- RLS policies: payments (owner-only)
create policy "payments are viewable by owner" on public.payments
  for select using (auth.uid() = user_id);
create policy "payments are insertable by owner" on public.payments
  for insert with check (auth.uid() = user_id);
create policy "payments are deletable by owner" on public.payments
  for delete using (auth.uid() = user_id);

-- RLS policies: expenses (owner-only)
create policy "expenses are viewable by owner" on public.expenses
  for select using (auth.uid() = user_id);
create policy "expenses are insertable by owner" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "expenses are deletable by owner" on public.expenses
  for delete using (auth.uid() = user_id);
