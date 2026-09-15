-- ============================================================
-- PtoPRO-ERP: Payment direction (income/expense)
-- ============================================================

alter table public.payments add column if not exists direction text not null default 'income' check (direction in ('income', 'expense'));
