-- ============================================================
-- PtoPRO-ERP: Storage bucket for organization logos
-- Run after 001_core_schema.sql
-- ============================================================

-- Create bucket for logos
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- RLS for logos bucket:
-- Anyone can read logos (public bucket)
create policy "logos_read" on storage.objects
  for select using (bucket_id = 'logos');

-- Only authenticated users from the org can upload/update
-- File path pattern: logos/{org_id}/{filename}
create policy "logos_write" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.get_user_org_id()::text
  );

create policy "logos_update" on storage.objects
  for update using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.get_user_org_id()::text
  );

create policy "logos_delete" on storage.objects
  for delete using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.get_user_org_id()::text
    and public.is_admin()
  );
