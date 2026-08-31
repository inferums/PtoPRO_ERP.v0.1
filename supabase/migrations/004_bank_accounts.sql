-- ============================================================
-- PtoPRO-ERP: Multiple bank accounts per organization
-- Run after 003_storage.sql
-- ============================================================

-- ─── org_bank_accounts ──────────────────────────────────────
create table public.org_bank_accounts (
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

create index idx_bank_accounts_org on public.org_bank_accounts(org_id);

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.org_bank_accounts enable row level security;

create policy "bank_accounts_select" on public.org_bank_accounts
  for select using (org_id = public.get_user_org_id());

create policy "bank_accounts_insert" on public.org_bank_accounts
  for insert with check (org_id = public.get_user_org_id() and public.is_admin());

create policy "bank_accounts_update" on public.org_bank_accounts
  for update using (org_id = public.get_user_org_id() and public.is_admin());

create policy "bank_accounts_delete" on public.org_bank_accounts
  for delete using (org_id = public.get_user_org_id() and public.is_admin());

-- ─── Trigger: auto-update updated_at ─────────────────────────
create trigger trg_bank_accounts_updated_at
  before update on public.org_bank_accounts
  for each row execute function public.update_updated_at();

-- ─── Trigger: only one default per org ───────────────────────
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

create trigger trg_enforce_single_default
  before insert or update on public.org_bank_accounts
  for each row execute function public.enforce_single_default_account();

-- ─── Add bank_account column to documents ────────────────────
alter table public.documents add column if not exists bank_account text;

-- ─── Migrate existing data from org_details ──────────────────
-- Move the current single account into the new table
insert into public.org_bank_accounts (org_id, bank, bik, account, corr_account, is_default)
select
  org_id,
  bank,
  bik,
  account,
  corr_account,
  true
from public.org_details
where bank <> '' or bik <> '' or account <> '';
