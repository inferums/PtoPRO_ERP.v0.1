-- ============================================================
-- PtoPRO-ERP: RLS policies, triggers, helper functions
-- Run after 001_core_schema.sql
-- ============================================================

-- ─── Enable RLS on all tables ────────────────────────────────
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

-- ─── Helper: get user's org_id ───────────────────────────────
create or replace function public.get_user_org_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

-- ─── Helper: check if user is admin of their org ─────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select role = 'admin' from public.profiles where id = auth.uid();
$$;

-- ─── Helper: get user's effective permissions for a section ──
-- Returns merged permissions from all groups the user belongs to.
-- If any group grants can_view=true, the user can view (OR logic).
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

-- ─── Helper: get all user permissions (all sections) ─────────
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

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- ─── organizations ───────────────────────────────────────────
-- Users can read their own org
create policy "org_select" on public.organizations
  for select using (id = public.get_user_org_id());

-- Only admins can update their org
create policy "org_update" on public.organizations
  for update using (id = public.get_user_org_id() and public.is_admin());

-- ─── profiles ────────────────────────────────────────────────
-- Users can read profiles in their org
create policy "profiles_select" on public.profiles
  for select using (org_id = public.get_user_org_id());

-- Admins can manage profiles in their org
create policy "profiles_insert" on public.profiles
  for insert with check (org_id = public.get_user_org_id() and public.is_admin());

create policy "profiles_update" on public.profiles
  for update using (org_id = public.get_user_org_id());

-- ─── groups ──────────────────────────────────────────────────
create policy "groups_select" on public.groups
  for select using (org_id = public.get_user_org_id());

create policy "groups_insert" on public.groups
  for insert with check (org_id = public.get_user_org_id() and public.is_admin());

create policy "groups_update" on public.groups
  for update using (org_id = public.get_user_org_id() and public.is_admin());

create policy "groups_delete" on public.groups
  for delete using (org_id = public.get_user_org_id() and public.is_admin());

-- ─── group_members ───────────────────────────────────────────
create policy "gm_select" on public.group_members
  for select using (
    exists (select 1 from public.groups g where g.id = group_members.group_id and g.org_id = public.get_user_org_id())
  );

create policy "gm_insert" on public.group_members
  for insert with check (
    exists (select 1 from public.groups g where g.id = group_members.group_id and g.org_id = public.get_user_org_id())
    and public.is_admin()
  );

create policy "gm_delete" on public.group_members
  for delete using (
    exists (select 1 from public.groups g where g.id = group_members.group_id and g.org_id = public.get_user_org_id())
    and public.is_admin()
  );

-- ─── permissions ─────────────────────────────────────────────
create policy "perms_select" on public.permissions
  for select using (
    exists (select 1 from public.groups g where g.id = permissions.group_id and g.org_id = public.get_user_org_id())
  );

create policy "perms_insert" on public.permissions
  for insert with check (
    exists (select 1 from public.groups g where g.id = permissions.group_id and g.org_id = public.get_user_org_id())
    and public.is_admin()
  );

create policy "perms_update" on public.permissions
  for update using (
    exists (select 1 from public.groups g where g.id = permissions.group_id and g.org_id = public.get_user_org_id())
    and public.is_admin()
  );

create policy "perms_delete" on public.permissions
  for delete using (
    exists (select 1 from public.groups g where g.id = permissions.group_id and g.org_id = public.get_user_org_id())
    and public.is_admin()
  );

-- ─── org_details ─────────────────────────────────────────────
create policy "org_details_select" on public.org_details
  for select using (org_id = public.get_user_org_id());

create policy "org_details_upsert" on public.org_details
  for insert with check (org_id = public.get_user_org_id() and public.is_admin());

create policy "org_details_update" on public.org_details
  for update using (org_id = public.get_user_org_id() and public.is_admin());

-- ─── parties ─────────────────────────────────────────────────
create policy "parties_select" on public.parties
  for select using (org_id = public.get_user_org_id());

create policy "parties_insert" on public.parties
  for insert with check (org_id = public.get_user_org_id());

create policy "parties_update" on public.parties
  for update using (org_id = public.get_user_org_id());

create policy "parties_delete" on public.parties
  for delete using (org_id = public.get_user_org_id());

-- ─── contracts ───────────────────────────────────────────────
create policy "contracts_select" on public.contracts
  for select using (org_id = public.get_user_org_id());

create policy "contracts_insert" on public.contracts
  for insert with check (org_id = public.get_user_org_id());

create policy "contracts_update" on public.contracts
  for update using (org_id = public.get_user_org_id());

create policy "contracts_delete" on public.contracts
  for delete using (org_id = public.get_user_org_id());

-- ─── documents ───────────────────────────────────────────────
create policy "documents_select" on public.documents
  for select using (org_id = public.get_user_org_id());

create policy "documents_insert" on public.documents
  for insert with check (org_id = public.get_user_org_id());

create policy "documents_update" on public.documents
  for update using (org_id = public.get_user_org_id());

create policy "documents_delete" on public.documents
  for delete using (org_id = public.get_user_org_id());

-- ─── document_items ──────────────────────────────────────────
-- Access through parent document's org
create policy "doc_items_select" on public.document_items
  for select using (
    exists (select 1 from public.documents d where d.id = document_items.document_id and d.org_id = public.get_user_org_id())
  );

create policy "doc_items_insert" on public.document_items
  for insert with check (
    exists (select 1 from public.documents d where d.id = document_items.document_id and d.org_id = public.get_user_org_id())
  );

create policy "doc_items_update" on public.document_items
  for update using (
    exists (select 1 from public.documents d where d.id = document_items.document_id and d.org_id = public.get_user_org_id())
  );

create policy "doc_items_delete" on public.document_items
  for delete using (
    exists (select 1 from public.documents d where d.id = document_items.document_id and d.org_id = public.get_user_org_id())
  );

-- ─── payments ────────────────────────────────────────────────
create policy "payments_select" on public.payments
  for select using (org_id = public.get_user_org_id());

create policy "payments_insert" on public.payments
  for insert with check (org_id = public.get_user_org_id());

create policy "payments_update" on public.payments
  for update using (org_id = public.get_user_org_id());

create policy "payments_delete" on public.payments
  for delete using (org_id = public.get_user_org_id());

-- ─── letters ─────────────────────────────────────────────────
create policy "letters_select" on public.letters
  for select using (org_id = public.get_user_org_id());

create policy "letters_insert" on public.letters
  for insert with check (org_id = public.get_user_org_id());

create policy "letters_update" on public.letters
  for update using (org_id = public.get_user_org_id());

create policy "letters_delete" on public.letters
  for delete using (org_id = public.get_user_org_id());

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- ─── Auto-create profile + org on signup ─────────────────────
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
  -- Use raw_user_meta_data to get org name from signup metadata
  org_name := coalesce(
    new.raw_user_meta_data->>'org_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- Create organization
  insert into public.organizations (name, short_name)
  values (org_name, org_name)
  returning id into new_org_id;

  -- Create org_details row
  insert into public.org_details (org_id, full_name, short_name)
  values (new_org_id, org_name, org_name);

  -- Create profile as admin
  insert into public.profiles (id, org_id, full_name, role)
  values (
    new.id,
    new_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', org_name),
    'admin'
  );

  -- Create default "Администраторы" group with full permissions
  declare
    admin_group_id uuid;
  begin
    insert into public.groups (org_id, name, description)
    values (new_org_id, 'Администраторы', 'Полный доступ ко всем разделам')
    returning id into admin_group_id;

    -- Add user to admin group
    insert into public.group_members (group_id, profile_id)
    values (admin_group_id, new.id);

    -- Grant full permissions for all sections
    insert into public.permissions (group_id, section, can_view, can_create, can_edit, can_delete)
    select admin_group_id, s, true, true, true, true
    from unnest(array['dashboard','contracts','invoices','acts','finance','letters','parties','settings']) as s;
  end;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Auto-update updated_at ──────────────────────────────────
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_org_updated_at       before update on public.organizations  for each row execute function public.update_updated_at();
create trigger trg_profiles_updated_at  before update on public.profiles       for each row execute function public.update_updated_at();
create trigger trg_groups_updated_at    before update on public.groups         for each row execute function public.update_updated_at();
create trigger trg_parties_updated_at   before update on public.parties        for each row execute function public.update_updated_at();
create trigger trg_contracts_updated_at before update on public.contracts      for each row execute function public.update_updated_at();
create trigger trg_documents_updated_at before update on public.documents      for each row execute function public.update_updated_at();
create trigger trg_payments_updated_at  before update on public.payments       for each row execute function public.update_updated_at();
create trigger trg_letters_updated_at   before update on public.letters        for each row execute function public.update_updated_at();
