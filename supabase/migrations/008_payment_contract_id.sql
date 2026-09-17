-- ============================================================
-- PtoPRO-ERP: Payment contract_id — direct link to contract
-- ============================================================

alter table public.payments add column if not exists contract_id uuid references public.contracts(id) on delete set null;
create index if not exists idx_payments_contract on public.payments(contract_id);
