-- ============================================================
-- PtoPRO-ERP: Extended party (counterparty) fields
-- ============================================================

alter table public.parties add column if not exists kpp text not null default '';
alter table public.parties add column if not exists ogrn text not null default '';
alter table public.parties add column if not exists address text not null default '';
alter table public.parties add column if not exists postal_address text not null default '';
alter table public.parties add column if not exists phone text not null default '';
alter table public.parties add column if not exists email text not null default '';
alter table public.parties add column if not exists representative_position text not null default '';
alter table public.parties add column if not exists representative_name text not null default '';
alter table public.parties add column if not exists corr_account text not null default '';
