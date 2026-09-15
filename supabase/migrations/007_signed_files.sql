-- ============================================================
-- PtoPRO-ERP: Signed file attachments for documents & contracts
-- ============================================================

-- columns
alter table public.documents add column if not exists signed_file_url text;
alter table public.contracts add column if not exists signed_file_url text;

-- storage bucket for signed scans
insert into storage.buckets (id, name, public)
values ('signed_files', 'signed_files', true)
on conflict (id) do nothing;

-- RLS: anyone can read signed files (public bucket)
drop policy if exists "signed_files_read" on storage.objects;
create policy "signed_files_read" on storage.objects
  for select using (bucket_id = 'signed_files');

-- only org members can upload (path pattern: {org_id}/document|contract/{entity_id}.ext)
drop policy if exists "signed_files_write" on storage.objects;
create policy "signed_files_write" on storage.objects
  for insert with check (
    bucket_id = 'signed_files'
    and (storage.foldername(name))[1] = public.get_user_org_id()::text
  );

drop policy if exists "signed_files_update" on storage.objects;
create policy "signed_files_update" on storage.objects
  for update using (
    bucket_id = 'signed_files'
    and (storage.foldername(name))[1] = public.get_user_org_id()::text
  );

drop policy if exists "signed_files_delete" on storage.objects;
create policy "signed_files_delete" on storage.objects
  for delete using (
    bucket_id = 'signed_files'
    and (storage.foldername(name))[1] = public.get_user_org_id()::text
  );
