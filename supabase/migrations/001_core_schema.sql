-- ============================================================
-- PtoPRO-ERP: Core schema for multi-tenant SaaS
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── organizations ───────────────────────────────────────────
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text,
  logo_url    text,
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── profiles (1:1 with auth.users) ─────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id)
);

-- ─── groups ──────────────────────────────────────────────────
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  description text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── group_members ───────────────────────────────────────────
create table public.group_members (
  group_id    uuid not null references public.groups(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (group_id, profile_id)
);

-- ─── permissions ─────────────────────────────────────────────
-- section values: 'dashboard','contracts','invoices','acts','finance','letters','parties','settings'
create table public.permissions (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.groups(id) on delete cascade,
  section        text not null,
  can_view       boolean not null default false,
  can_create     boolean not null default false,
  can_edit       boolean not null default false,
  can_delete     boolean not null default false,
  hidden_fields  text[] not null default '{}',
  unique (group_id, section)
);

-- ─── org_details (requisites, 1:1 per org) ──────────────────
create table public.org_details (
  org_id        uuid primary key references public.organizations(id) on delete cascade,
  full_name     text default '',
  short_name    text default '',
  inn           text default '',
  address       text default '',
  phone         text default '',
  email         text default '',
  website       text default '',
  bank          text default '',
  corr_account  text default '',
  bik           text default '',
  account       text default '',
  director      text default '',
  updated_at    timestamptz not null default now()
);

-- ─── parties (counterparties) ────────────────────────────────
create table public.parties (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  inn         text default '',
  person      text default '',
  bank        text default '',
  bik         text default '',
  account     text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── contracts ───────────────────────────────────────────────
create table public.contracts (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  number          text not null,
  counterparty_id uuid references public.parties(id) on delete set null,
  subject         text not null default '',
  kind            text not null default 'income' check (kind in ('income', 'expense')),
  planned_income  numeric not null default 0,
  planned_expense numeric not null default 0,
  actual_income   numeric not null default 0,
  actual_expense  numeric not null default 0,
  status          text not null default 'active' check (status in ('active', 'completed', 'terminated')),
  start_date      date not null,
  end_date        date not null,
  parent_id       uuid references public.contracts(id) on delete set null,
  description     text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── documents ───────────────────────────────────────────────
create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  number          integer not null,
  type            text not null check (type in ('invoice', 'act')),
  status          text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'paid_partial', 'paid')),
  date            date not null,
  counterparty_id uuid references public.parties(id) on delete set null,
  contract_id     uuid references public.contracts(id) on delete set null,
  vat             boolean not null default false,
  note            text default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── document_items (line items) ─────────────────────────────
create table public.document_items (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  name        text not null,
  qty         numeric not null default 1,
  unit        text not null default 'шт',
  price       numeric not null default 0,
  sort_order  integer not null default 0
);

-- ─── payments ────────────────────────────────────────────────
create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  doc_id      uuid references public.documents(id) on delete set null,
  date        date not null,
  amount      numeric not null default 0,
  method      text not null default 'Банковский перевод',
  name        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── letters ─────────────────────────────────────────────────
create table public.letters (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  number          text not null,
  date            date not null,
  counterparty_id uuid references public.parties(id) on delete set null,
  direction       text not null check (direction in ('in', 'out')),
  subject         text not null default '',
  body            text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_profiles_org     on public.profiles(org_id);
create index idx_groups_org       on public.groups(org_id);
create index idx_group_members_p  on public.group_members(profile_id);
create index idx_permissions_g    on public.permissions(group_id);
create index idx_parties_org      on public.parties(org_id);
create index idx_contracts_org    on public.contracts(org_id);
create index idx_documents_org    on public.documents(org_id);
create index idx_doc_items_doc    on public.document_items(document_id);
create index idx_payments_org     on public.payments(org_id);
create index idx_payments_doc     on public.payments(doc_id);
create index idx_letters_org      on public.letters(org_id);
