-- ============================================================
-- PtoPRO-ERP: ALL MIGRATIONS (001 + 002 + 003 + 004)
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 001: Core schema
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text,
  logo_url    text,
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id)
);

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  description text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id    uuid not null references public.groups(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table if not exists public.permissions (
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

create table if not exists public.org_details (
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

create table if not exists public.parties (
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

create table if not exists public.contracts (
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

create table if not exists public.documents (
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

create table if not exists public.document_items (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  name        text not null,
  qty         numeric not null default 1,
  unit        text not null default 'шт',
  price       numeric not null default 0,
  sort_order  integer not null default 0
);

create table if not exists public.payments (
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

create table if not exists public.letters (
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

-- Indexes
create index if not exists idx_profiles_org     on public.profiles(org_id);
create index if not exists idx_groups_org       on public.groups(org_id);
create index if not exists idx_group_members_p  on public.group_members(profile_id);
create index if not exists idx_permissions_g    on public.permissions(group_id);
create index if not exists idx_parties_org      on public.parties(org_id);
create index if not exists idx_contracts_org    on public.contracts(org_id);
create index if not exists idx_documents_org    on public.documents(org_id);
create index if not exists idx_doc_items_doc    on public.document_items(document_id);
create index if not exists idx_payments_org     on public.payments(org_id);
create index if not exists idx_payments_doc     on public.payments(doc_id);
create index if not exists idx_letters_org      on public.letters(org_id);


-- ═══════════════════════════════════════════════════════════════
-- 002: RLS policies, triggers, helper functions
-- ═══════════════════════════════════════════════════════════════

alter table public.organizations  enable row level security;
alter table public.profiles       enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.permissions    enable row level security;
alter table public.org_details    enable row level security;
alter table public.parties        enable row level security;
alter table public.contracts      enable row level security;
alter table public.documents      enable row level security;
alter table public.document_items enable row level security;
alter table public.payments       enable row level security;
alter table public.letters        enable row level security;

-- Helper functions
create or replace function public.get_user_org_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select role = 'admin' from public.profiles where id = auth.uid();
$$;

create or replace function public.get_user_permissions(p_section text)
returns table (
  can_view      boolean,
  can_create    boolean,
  can_edit      boolean,
  can_delete    boolean,
  hidden_fields text[]
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(bool_or(p.can_view), false),
    coalesce(bool_or(p.can_create), false),
    coalesce(bool_or(p.can_edit), false),
    coalesce(bool_or(p.can_delete), false),
    coalesce(array_agg(distinct f) filter (where f is not null), '{}')
  from public.group_members gm
  join public.permissions p on p.group_id = gm.group_id and p.section = p_section
  left join lateral unnest(p.hidden_fields) as f on true
  where gm.profile_id = auth.uid()
  group by p_section;
$$;

create or replace function public.get_all_user_permissions()
returns table (
  section       text,
  can_view      boolean,
  can_create    boolean,
  can_edit      boolean,
  can_delete    boolean,
  hidden_fields text[]
)
language sql
security definer
set search_path = public
as $$
  select
    p.section,
    coalesce(bool_or(p.can_view), false),
    coalesce(bool_or(p.can_create), false),
    coalesce(bool_or(p.can_edit), false),
    coalesce(bool_or(p.can_delete), false),
    coalesce(array_agg(distinct f) filter (where f is not null), '{}')
  from public.group_members gm
  join public.permissions p on p.group_id = gm.group_id
  left join lateral unnest(p.hidden_fields) as f on true
  where gm.profile_id = auth.uid()
  group by p.section;
$$;

-- RLS Policies
drop policy if exists "org_select" on public.organizations;
create policy "org_select" on public.organizations
  for select using (id = public.get_user_org_id());

drop policy if exists "org_update" on public.organizations;
create policy "org_update" on public.organizations
  for update using (id = public.get_user_org_id() and public.is_admin());

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (org_id = public.get_user_org_id());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (org_id = public.get_user_org_id() and public.is_admin());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (org_id = public.get_user_org_id());

drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups
  for select using (org_id = public.get_user_org_id());

drop policy if exists "groups_insert" on public.groups;
create policy "groups_insert" on public.groups
  for insert with check (org_id = public.get_user_org_id() and public.is_admin());

drop policy if exists "groups_update" on public.groups;
create policy "groups_update" on public.groups
  for update using (org_id = public.get_user_org_id() and public.is_admin());

drop policy if exists "groups_delete" on public.groups;
create policy "groups_delete" on public.groups
  for delete using (org_id = public.get_user_org_id() and public.is_admin());

drop policy if exists "gm_select" on public.group_members;
create policy "gm_select" on public.group_members
  for select using (
    exists (select 1 from public.groups g where g.id = group_members.group_id and g.org_id = public.get_user_org_id())
  );

drop policy if exists "gm_insert" on public.group_members;
create policy "gm_insert" on public.group_members
  for insert with check (
    exists (select 1 from public.groups g where g.id = group_members.group_id and g.org_id = public.get_user_org_id())
    and public.is_admin()
  );

drop policy if exists "gm_delete" on public.group_members;
create policy "gm_delete" on public.group_members
  for delete using (
    exists (select 1 from public.groups g where g.id = group_members.group_id and g.org_id = public.get_user_org_id())
    and public.is_admin()
  );

drop policy if exists "perms_select" on public.permissions;
create policy "perms_select" on public.permissions
  for select using (
    exists (select 1 from public.groups g where g.id = permissions.group_id and g.org_id = public.get_user_org_id())
  );

drop policy if exists "perms_insert" on public.permissions;
create policy "perms_insert" on public.permissions
  for insert with check (
    exists (select 1 from public.groups g where g.id = permissions.group_id and g.org_id = public.get_user_org_id())
    and public.is_admin()
  );

drop policy if exists "perms_update" on public.permissions;
create policy "perms_update" on public.permissions
  for update using (
    exists (select 1 from public.groups g where g.id = permissions.group_id and g.org_id = public.get_user_org_id())
    and public.is_admin()
  );

drop policy if exists "perms_delete" on public.permissions;
create policy "perms_delete" on public.permissions
  for delete using (
    exists (select 1 from public.groups g where g.id = permissions.group_id and g.org_id = public.get_user_org_id())
    and public.is_admin()
  );

drop policy if exists "org_details_select" on public.org_details;
create policy "org_details_select" on public.org_details
  for select using (org_id = public.get_user_org_id());

drop policy if exists "org_details_upsert" on public.org_details;
create policy "org_details_upsert" on public.org_details
  for insert with check (org_id = public.get_user_org_id() and public.is_admin());

drop policy if exists "org_details_update" on public.org_details;
create policy "org_details_update" on public.org_details
  for update using (org_id = public.get_user_org_id() and public.is_admin());

drop policy if exists "parties_select" on public.parties;
create policy "parties_select" on public.parties
  for select using (org_id = public.get_user_org_id());

drop policy if exists "parties_insert" on public.parties;
create policy "parties_insert" on public.parties
  for insert with check (org_id = public.get_user_org_id());

drop policy if exists "parties_update" on public.parties;
create policy "parties_update" on public.parties
  for update using (org_id = public.get_user_org_id());

drop policy if exists "parties_delete" on public.parties;
create policy "parties_delete" on public.parties
  for delete using (org_id = public.get_user_org_id());

drop policy if exists "contracts_select" on public.contracts;
create policy "contracts_select" on public.contracts
  for select using (org_id = public.get_user_org_id());

drop policy if exists "contracts_insert" on public.contracts;
create policy "contracts_insert" on public.contracts
  for insert with check (org_id = public.get_user_org_id());

drop policy if exists "contracts_update" on public.contracts;
create policy "contracts_update" on public.contracts
  for update using (org_id = public.get_user_org_id());

drop policy if exists "contracts_delete" on public.contracts;
create policy "contracts_delete" on public.contracts
  for delete using (org_id = public.get_user_org_id());

drop policy if exists "documents_select" on public.documents;
create policy "documents_select" on public.documents
  for select using (org_id = public.get_user_org_id());

drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert with check (org_id = public.get_user_org_id());

drop policy if exists "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update using (org_id = public.get_user_org_id());

drop policy if exists "documents_delete" on public.documents;
create policy "documents_delete" on public.documents
  for delete using (org_id = public.get_user_org_id());

drop policy if exists "doc_items_select" on public.document_items;
create policy "doc_items_select" on public.document_items
  for select using (
    exists (select 1 from public.documents d where d.id = document_items.document_id and d.org_id = public.get_user_org_id())
  );

drop policy if exists "doc_items_insert" on public.document_items;
create policy "doc_items_insert" on public.document_items
  for insert with check (
    exists (select 1 from public.documents d where d.id = document_items.document_id and d.org_id = public.get_user_org_id())
  );

drop policy if exists "doc_items_update" on public.document_items;
create policy "doc_items_update" on public.document_items
  for update using (
    exists (select 1 from public.documents d where d.id = document_items.document_id and d.org_id = public.get_user_org_id())
  );

drop policy if exists "doc_items_delete" on public.document_items;
create policy "doc_items_delete" on public.document_items
  for delete using (
    exists (select 1 from public.documents d where d.id = document_items.document_id and d.org_id = public.get_user_org_id())
  );

drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments
  for select using (org_id = public.get_user_org_id());

drop policy if exists "payments_insert" on public.payments;
create policy "payments_insert" on public.payments
  for insert with check (org_id = public.get_user_org_id());

drop policy if exists "payments_update" on public.payments;
create policy "payments_update" on public.payments
  for update using (org_id = public.get_user_org_id());

drop policy if exists "payments_delete" on public.payments;
create policy "payments_delete" on public.payments
  for delete using (org_id = public.get_user_org_id());

drop policy if exists "letters_select" on public.letters;
create policy "letters_select" on public.letters
  for select using (org_id = public.get_user_org_id());

drop policy if exists "letters_insert" on public.letters;
create policy "letters_insert" on public.letters
  for insert with check (org_id = public.get_user_org_id());

drop policy if exists "letters_update" on public.letters;
create policy "letters_update" on public.letters
  for update using (org_id = public.get_user_org_id());

drop policy if exists "letters_delete" on public.letters;
create policy "letters_delete" on public.letters
  for delete using (org_id = public.get_user_org_id());

-- Trigger: auto-create profile + org on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name text;
begin
  org_name := coalesce(
    new.raw_user_meta_data->>'org_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  insert into public.organizations (name, short_name)
  values (org_name, org_name)
  returning id into new_org_id;

  insert into public.org_details (org_id, full_name, short_name)
  values (new_org_id, org_name, org_name);

  insert into public.profiles (id, org_id, full_name, role)
  values (
    new.id,
    new_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', org_name),
    'admin'
  );

  declare
    admin_group_id uuid;
  begin
    insert into public.groups (org_id, name, description)
    values (new_org_id, 'Администраторы', 'Полный доступ ко всем разделам')
    returning id into admin_group_id;

    insert into public.group_members (group_id, profile_id)
    values (admin_group_id, new.id);

    insert into public.permissions (group_id, section, can_view, can_create, can_edit, can_delete)
    select admin_group_id, s, true, true, true, true
    from unnest(array['dashboard','contracts','invoices','acts','finance','letters','parties','settings']) as s;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: auto-update updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_org_updated_at on public.organizations;
create trigger trg_org_updated_at       before update on public.organizations  for each row execute function public.update_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at  before update on public.profiles       for each row execute function public.update_updated_at();

drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at    before update on public.groups         for each row execute function public.update_updated_at();

drop trigger if exists trg_parties_updated_at on public.parties;
create trigger trg_parties_updated_at   before update on public.parties        for each row execute function public.update_updated_at();

drop trigger if exists trg_contracts_updated_at on public.contracts;
create trigger trg_contracts_updated_at before update on public.contracts      for each row execute function public.update_updated_at();

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at before update on public.documents      for each row execute function public.update_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at  before update on public.payments       for each row execute function public.update_updated_at();

drop trigger if exists trg_letters_updated_at on public.letters;
create trigger trg_letters_updated_at   before update on public.letters        for each row execute function public.update_updated_at();


-- ═══════════════════════════════════════════════════════════════
-- 003: Storage bucket for logos
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos_read" on storage.objects;
create policy "logos_read" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "logos_write" on storage.objects;
create policy "logos_write" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.get_user_org_id()::text
  );

drop policy if exists "logos_update" on storage.objects;
create policy "logos_update" on storage.objects
  for update using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.get_user_org_id()::text
  );

drop policy if exists "logos_delete" on storage.objects;
create policy "logos_delete" on storage.objects
  for delete using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.get_user_org_id()::text
    and public.is_admin()
  );


-- ═══════════════════════════════════════════════════════════════
-- 004: Multiple bank accounts
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.org_bank_accounts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  bank          text not null default '',
  bik           text not null default '',
  account       text not null default '',
  corr_account  text not null default '',
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_bank_accounts_org on public.org_bank_accounts(org_id);

alter table public.org_bank_accounts enable row level security;

drop policy if exists "bank_accounts_select" on public.org_bank_accounts;
create policy "bank_accounts_select" on public.org_bank_accounts
  for select using (org_id = public.get_user_org_id());

drop policy if exists "bank_accounts_insert" on public.org_bank_accounts;
create policy "bank_accounts_insert" on public.org_bank_accounts
  for insert with check (org_id = public.get_user_org_id() and public.is_admin());

drop policy if exists "bank_accounts_update" on public.org_bank_accounts;
create policy "bank_accounts_update" on public.org_bank_accounts
  for update using (org_id = public.get_user_org_id() and public.is_admin());

drop policy if exists "bank_accounts_delete" on public.org_bank_accounts;
create policy "bank_accounts_delete" on public.org_bank_accounts
  for delete using (org_id = public.get_user_org_id() and public.is_admin());

drop trigger if exists trg_bank_accounts_updated_at on public.org_bank_accounts;
create trigger trg_bank_accounts_updated_at
  before update on public.org_bank_accounts
  for each row execute function public.update_updated_at();

create or replace function public.enforce_single_default_account()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.org_bank_accounts
    set is_default = false
    where org_id = new.org_id
      and id <> new.id
      and is_default = true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_single_default on public.org_bank_accounts;
create trigger trg_enforce_single_default
  before insert or update on public.org_bank_accounts
  for each row execute function public.enforce_single_default_account();

alter table public.documents add column if not exists bank_account text;

-- Migrate existing data from org_details
insert into public.org_bank_accounts (org_id, bank, bik, account, corr_account, is_default)
select org_id, bank, bik, account, corr_account, true
from public.org_details
where (bank <> '' or bik <> '' or account <> '')
  and not exists (
    select 1 from public.org_bank_accounts ba where ba.org_id = org_details.org_id
  );
