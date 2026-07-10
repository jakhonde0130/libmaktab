-- ============================================================================
-- ILMS schema — 10: Row Level Security
--
-- Convention:
--  - Bibliographic/catalog data is public-readable (OPAC serves anonymous
--    visitors) and staff-writable.
--  - Personal data (loans, reservations, fines, notifications) is
--    self-readable by the owning reader and fully accessible to staff.
--  - Administrative tables (roles, permissions, settings, audit) are
--    staff/admin-only.
--  - All writes from the backend that must bypass RLS (e.g. provisioning a
--    new user profile, writing audit_logs) go through the service-role
--    client (supabaseAdmin) — never exposed to the browser.
-- ============================================================================

alter table languages enable row level security;
alter table publishers enable row level security;
alter table authors enable row level security;
alter table faculties enable row level security;
alter table departments enable row level security;
alter table subjects enable row level security;
alter table categories enable row level security;
alter table keywords enable row level security;
alter table locations enable row level security;
alter table shelves enable row level security;
alter table racks enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table users enable row level security;
alter table books enable row level security;
alter table book_authors enable row level security;
alter table book_keywords enable row level security;
alter table book_images enable row level security;
alter table book_files enable row level security;
alter table book_copies enable row level security;
alter table borrowings enable row level security;
alter table returns enable row level security;
alter table reservations enable row level security;
alter table penalties enable row level security;
alter table inventory_logs enable row level security;
alter table audit_logs enable row level security;
alter table notifications enable row level security;
alter table settings enable row level security;
alter table opac_search_logs enable row level security;

-- ---------------------------------------------------------------------------
-- Public catalog reference data: readable by anyone, writable by staff.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'languages', 'publishers', 'authors', 'faculties', 'departments',
    'subjects', 'categories', 'keywords', 'locations', 'shelves', 'racks',
    'books', 'book_authors', 'book_keywords', 'book_images', 'book_copies'
  ]
  loop
    execute format('create policy "%s_public_read" on %I for select using (true);', t, t);
    execute format('create policy "%s_staff_write" on %I for insert with check (auth_is_staff());', t, t);
    execute format('create policy "%s_staff_update" on %I for update using (auth_is_staff());', t, t);
    execute format('create policy "%s_staff_delete" on %I for delete using (auth_is_staff());', t, t);
  end loop;
end $$;

-- book_files: metadata readable by authenticated users only (electronic
-- library requires login); staff manage uploads. Actual byte-level download
-- gating (is_downloadable) is enforced by the backend before it issues a
-- signed Storage URL.
create policy "book_files_authenticated_read" on book_files
  for select using (auth.role() = 'authenticated');
create policy "book_files_staff_write" on book_files
  for insert with check (auth_is_staff());
create policy "book_files_staff_update" on book_files
  for update using (auth_is_staff());
create policy "book_files_staff_delete" on book_files
  for delete using (auth_is_staff());

-- ---------------------------------------------------------------------------
-- Admin-only configuration tables.
-- ---------------------------------------------------------------------------
create policy "roles_staff_read" on roles for select using (auth_is_staff());
create policy "roles_admin_write" on roles for all
  using (auth_role() in ('director', 'administrator'))
  with check (auth_role() in ('director', 'administrator'));

create policy "permissions_staff_read" on permissions for select using (auth_is_staff());
create policy "permissions_admin_write" on permissions for all
  using (auth_role() in ('director', 'administrator'))
  with check (auth_role() in ('director', 'administrator'));

create policy "role_permissions_staff_read" on role_permissions for select using (auth_is_staff());
create policy "role_permissions_admin_write" on role_permissions for all
  using (auth_role() in ('director', 'administrator'))
  with check (auth_role() in ('director', 'administrator'));

create policy "settings_staff_read" on settings for select using (auth_is_staff());
create policy "settings_admin_write" on settings for all
  using (auth_role() in ('director', 'administrator'))
  with check (auth_role() in ('director', 'administrator'));

-- ---------------------------------------------------------------------------
-- users: self-service profile + staff directory access.
-- ---------------------------------------------------------------------------
create policy "users_self_read" on users for select using (id = auth.uid() or auth_is_staff());
create policy "users_self_update" on users for update using (id = auth.uid() or auth_is_staff());
-- Inserts happen via the backend's service-role client during signup
-- provisioning; role/status changes by non-admin staff are rejected at the
-- application layer even though librarians can read the full directory.
create policy "users_admin_write" on users for insert
  with check (auth_role() in ('director', 'administrator'));
create policy "users_admin_delete" on users for delete
  using (auth_role() in ('director', 'administrator'));

-- ---------------------------------------------------------------------------
-- Circulation: readers see their own records, staff see everything.
-- ---------------------------------------------------------------------------
create policy "borrowings_owner_or_staff_read" on borrowings
  for select using (reader_id = auth.uid() or auth_is_staff());
create policy "borrowings_staff_write" on borrowings for insert with check (auth_is_staff());
create policy "borrowings_staff_update" on borrowings for update using (auth_is_staff());

create policy "returns_owner_or_staff_read" on returns
  for select using (
    auth_is_staff()
    or exists (select 1 from borrowings b where b.id = returns.borrowing_id and b.reader_id = auth.uid())
  );
create policy "returns_staff_write" on returns for insert with check (auth_is_staff());

create policy "reservations_owner_or_staff_read" on reservations
  for select using (reader_id = auth.uid() or auth_is_staff());
create policy "reservations_owner_create" on reservations
  for insert with check (reader_id = auth.uid() or auth_is_staff());
create policy "reservations_owner_or_staff_update" on reservations
  for update using (reader_id = auth.uid() or auth_is_staff());

create policy "penalties_owner_or_staff_read" on penalties
  for select using (reader_id = auth.uid() or auth_is_staff());
create policy "penalties_staff_write" on penalties for insert with check (auth_is_staff());
create policy "penalties_staff_update" on penalties for update using (auth_is_staff());

-- ---------------------------------------------------------------------------
-- Notifications: users manage their own inbox; only staff/service enqueue.
-- ---------------------------------------------------------------------------
create policy "notifications_owner_read" on notifications
  for select using (user_id = auth.uid() or auth_is_staff());
create policy "notifications_owner_update" on notifications
  for update using (user_id = auth.uid());
create policy "notifications_staff_write" on notifications for insert with check (auth_is_staff());

-- ---------------------------------------------------------------------------
-- Inventory + audit: librarian tier and above only.
-- ---------------------------------------------------------------------------
create policy "inventory_logs_staff_all" on inventory_logs for all
  using (auth_is_staff())
  with check (auth_is_staff());

create policy "audit_logs_admin_read" on audit_logs
  for select using (auth_role() in ('director', 'administrator'));
-- No insert policy: audit rows are written exclusively via the backend's
-- service-role client, which bypasses RLS by design.

-- ---------------------------------------------------------------------------
-- OPAC search logs: anyone can log a search (including anonymous visitors);
-- only staff can read them back for reporting.
-- ---------------------------------------------------------------------------
create policy "opac_search_logs_public_insert" on opac_search_logs for insert with check (true);
create policy "opac_search_logs_staff_read" on opac_search_logs
  for select using (auth_is_staff());
