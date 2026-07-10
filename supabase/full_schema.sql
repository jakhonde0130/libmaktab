-- ILMS full schema — combined bundle

-- ---- 20260710000001_extensions_and_enums.sql ----
-- ============================================================================
-- ILMS schema — 01: extensions and enum types
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm; -- trigram search for OPAC full-text-ish lookups

-- RBAC role used for JWT claims and coarse-grained authorization.
-- Kept as an enum (fast, indexable) in addition to the roles/permissions
-- tables, which hold the fine-grained, admin-configurable permission catalog.
create type app_role as enum (
  'director',
  'administrator',
  'librarian',
  'operator',
  'teacher',
  'reader'
);

-- Reader/person category ("Lavozim"): who the person is, independent of
-- what they're allowed to do in the system (app_role).
create type reader_category as enum (
  'student',
  'teacher',
  'staff',
  'external'
);

create type account_status as enum ('active', 'blocked');

create type acquisition_type as enum ('purchased', 'donated', 'exchange', 'subscription');

create type copy_status as enum (
  'available',
  'issued',
  'reserved',
  'lost',
  'under_repair',
  'withdrawn',
  'in_transit'
);

create type book_file_type as enum ('pdf', 'docx', 'ppt', 'audio', 'video', 'zip');

create type borrowing_status as enum ('active', 'returned', 'overdue', 'lost');

create type reservation_status as enum ('pending', 'ready', 'fulfilled', 'cancelled', 'expired');

create type penalty_reason as enum ('overdue', 'lost_book', 'damage');

create type penalty_status as enum ('unpaid', 'paid', 'waived');

create type notification_channel as enum ('email', 'sms', 'telegram', 'system');

create type notification_status as enum ('pending', 'sent', 'failed');

create type inventory_result as enum ('found', 'missing', 'misplaced', 'damaged');

-- ---- 20260710000002_reference_tables.sql ----
-- ============================================================================
-- ILMS schema — 02: shared trigger helper + reference/lookup tables
-- ============================================================================

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table languages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,           -- e.g. 'uz', 'ru', 'en'
  name text not null,
  created_at timestamptz not null default now()
);

create table publishers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on publishers
  for each row execute function set_updated_at();

create table authors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  original_name text,
  birth_year smallint,
  death_year smallint,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on authors
  for each row execute function set_updated_at();

create table faculties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  created_at timestamptz not null default now()
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references faculties(id) on delete restrict,
  name text not null,
  code text unique,
  created_at timestamptz not null default now()
);

-- "Fan" — academic discipline a book belongs to (e.g. Mathematics, History).
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- "Mavzu" — general topical/genre classification, hierarchical (tree).
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now()
);

create table keywords (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---- 20260710000003_locations.sql ----
-- ============================================================================
-- ILMS schema — 03: physical location hierarchy
--
-- Maps the library's physical organization (fond -> bo'lim -> tokcha/javon -> raf)
-- onto a 3-level hierarchy:
--   locations  = library fund / section ("kutubxona fondi", "bo'lim")
--   shelves    = shelving unit / cabinet within a location ("tokcha", "javon")
--   racks      = individual rack/row within a shelf ("raf")
-- A book_copy's full shelf address is locations -> shelves -> racks.
-- ============================================================================

create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,          -- e.g. "Main Fund", "Reading Hall 2"
  code text unique,
  description text,
  created_at timestamptz not null default now()
);

create table shelves (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete restrict,
  name text not null,          -- e.g. "Cabinet 3"
  code text,
  created_at timestamptz not null default now(),
  unique (location_id, name)
);

create table racks (
  id uuid primary key default gen_random_uuid(),
  shelf_id uuid not null references shelves(id) on delete restrict,
  name text not null,          -- e.g. "Rack 2"
  code text,
  created_at timestamptz not null default now(),
  unique (shelf_id, name)
);

-- ---- 20260710000004_roles_permissions_users.sql ----
-- ============================================================================
-- ILMS schema — 04: roles, permissions, and the user profile table
--
-- Authorization has two layers:
--  - app_role (enum, mirrored into the JWT via auth.users.raw_app_meta_data)
--    is what RLS policies check — fast, no joins, set only by trusted code.
--  - roles/permissions/role_permissions is the admin-configurable permission
--    catalog the Admin Panel manages and the backend's authorization layer
--    reads for fine-grained checks beyond "is this role allowed at all".
-- ============================================================================

create table roles (
  id uuid primary key default gen_random_uuid(),
  code app_role not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,   -- e.g. 'books.create', 'circulation.issue'
  module text not null,        -- e.g. 'books', 'circulation', 'reports'
  description text,
  created_at timestamptz not null default now()
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Profile table extending Supabase auth.users with library-specific fields.
-- One row per authenticated identity (staff and readers alike).
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,               -- FISH
  pinfl text unique,                     -- JSHSHIR
  phone text,
  email text,
  faculty_id uuid references faculties(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  course smallint,                       -- Kurs
  group_name text,                       -- Guruh
  reader_category reader_category not null default 'student', -- Lavozim
  role app_role not null default 'reader',
  photo_url text,
  library_card_barcode text not null unique,
  qr_code_url text,
  status account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on users
  for each row execute function set_updated_at();

-- Keeps the JWT app_metadata.role claim (used by RLS) in sync whenever the
-- profile role changes. Requires the trigger to run as the table owner
-- since auth.users can only be updated by privileged roles.
create function sync_user_role_to_auth_claims()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
  where id = new.id;
  return new;
end;
$$;

create trigger sync_role_to_claims
  after insert or update of role on users
  for each row execute function sync_user_role_to_auth_claims();

-- Convenience helper for RLS policies: current caller's role from the JWT.
create function auth_role()
returns app_role
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'role', '')::app_role;
$$;

create function auth_is_staff()
returns boolean
language sql
stable
as $$
  select auth_role() in ('director', 'administrator', 'librarian', 'operator');
$$;

-- ---- 20260710000005_books.sql ----
-- ============================================================================
-- ILMS schema — 05: bibliographic records (title level)
--
-- Follows the standard bibliographic-vs-item split (MARC/Koha style):
-- `books` describes the *work* (one row per title/edition). Inventory
-- number, barcode, physical location, price, and condition belong to
-- individual copies (book_copies, next migration) since a single title can
-- have many physical copies, each independently tracked.
-- ============================================================================

create table books (
  id uuid primary key default gen_random_uuid(),

  isbn text,
  udk text,                        -- УДК classification code
  bbk text,                        -- ББК classification code

  title text not null,
  original_title text,

  publisher_id uuid references publishers(id) on delete set null,
  publication_place text,
  publication_year smallint,

  language_id uuid references languages(id) on delete set null,
  page_count integer,
  volume text,                     -- Jild
  edition text,                    -- Nashr soni
  series text,                     -- Seriya

  annotation text,
  category_id uuid references categories(id) on delete set null,   -- Mavzu
  subject_id uuid references subjects(id) on delete set null,      -- Fan
  faculty_id uuid references faculties(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  direction text,                  -- Yo'nalish

  cover_image_url text,
  has_electronic_copy boolean not null default false,
  has_pdf boolean not null default false,
  download_enabled boolean not null default true, -- admin-wide default; per-file override in book_files

  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on books
  for each row execute function set_updated_at();

create index books_title_trgm_idx on books using gin (title gin_trgm_ops);
create index books_isbn_idx on books (isbn);
create index books_udk_idx on books (udk);
create index books_bbk_idx on books (bbk);

-- A book can have multiple authors (author/editor/translator), ordered.
create table book_authors (
  book_id uuid not null references books(id) on delete cascade,
  author_id uuid not null references authors(id) on delete restrict,
  author_role text not null default 'author', -- author | editor | translator | compiler
  sort_order smallint not null default 0,
  primary key (book_id, author_id, author_role)
);

create table book_keywords (
  book_id uuid not null references books(id) on delete cascade,
  keyword_id uuid not null references keywords(id) on delete cascade,
  primary key (book_id, keyword_id)
);

create table book_images (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  storage_path text not null,      -- Supabase Storage object path
  is_primary boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);
create unique index book_images_one_primary_idx on book_images (book_id) where is_primary;

-- Electronic library files (PDF/DOCX/PPT/audio/video/zip) for online reading
-- and (admin-controlled) download.
create table book_files (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  file_type book_file_type not null,
  storage_path text not null,
  file_name text not null,
  file_size_bytes bigint,
  mime_type text,
  is_downloadable boolean not null default true, -- per-file admin override for copyright control
  uploaded_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index book_files_book_id_idx on book_files (book_id);

-- ---- 20260710000006_book_copies.sql ----
-- ============================================================================
-- ILMS schema — 06: book copies (items)
--
-- One row per physical (or electronic-only) copy of a title. Each copy is
-- tracked independently: its own inventory number, barcode, shelf location,
-- status, price, and acquisition details — matching Koha's item model.
-- ============================================================================

create table book_copies (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,

  inventory_number text not null unique,
  barcode text not null unique,

  rack_id uuid references racks(id) on delete set null,

  status copy_status not null default 'available',
  condition_notes text,

  price numeric(12, 2),
  acquisition_date date,
  acquisition_type acquisition_type not null default 'purchased', -- Manba: sotib olingan / sovg'a

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on book_copies
  for each row execute function set_updated_at();

create index book_copies_book_id_idx on book_copies (book_id);
create index book_copies_status_idx on book_copies (status);
create index book_copies_rack_id_idx on book_copies (rack_id);

-- Keeps books.has_electronic_copy / has_pdf in sync with book_files so the
-- catalog can filter on those flags without joining every search.
create function sync_book_electronic_flags()
returns trigger
language plpgsql
as $$
declare
  target_book_id uuid := coalesce(new.book_id, old.book_id);
begin
  update books
  set
    has_electronic_copy = exists (select 1 from book_files where book_id = target_book_id),
    has_pdf = exists (select 1 from book_files where book_id = target_book_id and file_type = 'pdf')
  where id = target_book_id;
  return null;
end;
$$;

create trigger sync_electronic_flags
  after insert or update or delete on book_files
  for each row execute function sync_book_electronic_flags();

-- ---- 20260710000007_circulation.sql ----
-- ============================================================================
-- ILMS schema — 07: circulation (borrowings, returns, reservations, penalties)
-- ============================================================================

create table borrowings (
  id uuid primary key default gen_random_uuid(),
  book_copy_id uuid not null references book_copies(id) on delete restrict,
  reader_id uuid not null references users(id) on delete restrict,
  issued_by uuid references users(id) on delete set null,

  issued_at timestamptz not null default now(),
  due_date date not null,
  returned_at timestamptz,

  status borrowing_status not null default 'active',
  renewal_count integer not null default 0,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on borrowings
  for each row execute function set_updated_at();

create index borrowings_reader_id_idx on borrowings (reader_id);
create index borrowings_book_copy_id_idx on borrowings (book_copy_id);
create index borrowings_status_idx on borrowings (status);
-- Enforces at most one active loan per copy at a time.
create unique index borrowings_one_active_per_copy_idx on borrowings (book_copy_id) where status in ('active', 'overdue');

-- Detailed return event log — separate from borrowings so a loan's
-- lifecycle (issue -> renewals -> return) and the physical hand-back
-- inspection (condition, who received it) are recorded independently.
create table returns (
  id uuid primary key default gen_random_uuid(),
  borrowing_id uuid not null references borrowings(id) on delete cascade,
  returned_at timestamptz not null default now(),
  received_by uuid references users(id) on delete set null,
  condition_on_return text,
  notes text,
  created_at timestamptz not null default now()
);
create index returns_borrowing_id_idx on returns (borrowing_id);

-- Reservations are placed against a title (not a specific copy) and
-- fulfilled from whichever copy becomes available first — Koha-style queue.
create table reservations (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  reader_id uuid not null references users(id) on delete cascade,

  requested_at timestamptz not null default now(),
  status reservation_status not null default 'pending',
  queue_position integer,

  notified_at timestamptz,
  expires_at timestamptz,

  fulfilled_copy_id uuid references book_copies(id) on delete set null,
  fulfilled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on reservations
  for each row execute function set_updated_at();

create index reservations_book_id_idx on reservations (book_id);
create index reservations_reader_id_idx on reservations (reader_id);
create index reservations_status_idx on reservations (status);

create table penalties (
  id uuid primary key default gen_random_uuid(),
  borrowing_id uuid references borrowings(id) on delete set null,
  reader_id uuid not null references users(id) on delete cascade,

  reason penalty_reason not null,
  amount numeric(12, 2) not null,
  status penalty_status not null default 'unpaid',

  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  waived_by uuid references users(id) on delete set null,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on penalties
  for each row execute function set_updated_at();

create index penalties_reader_id_idx on penalties (reader_id);
create index penalties_status_idx on penalties (status);

-- ---- 20260710000008_inventory_audit.sql ----
-- ============================================================================
-- ILMS schema — 08: inventory (stocktake) logs and system audit trail
-- ============================================================================

-- One row per barcode scan during a stocktake/shelf-check run.
-- audit_batch_id groups scans belonging to the same inventory session
-- without needing a separate sessions table.
create table inventory_logs (
  id uuid primary key default gen_random_uuid(),
  audit_batch_id uuid not null,
  book_copy_id uuid references book_copies(id) on delete set null,
  scanned_barcode text not null,
  scanned_by uuid references users(id) on delete set null,
  scanned_at timestamptz not null default now(),
  expected_rack_id uuid references racks(id) on delete set null,
  found_rack_id uuid references racks(id) on delete set null,
  result inventory_result not null,
  notes text
);
create index inventory_logs_batch_idx on inventory_logs (audit_batch_id);
create index inventory_logs_copy_idx on inventory_logs (book_copy_id);

-- Generic "who changed what, when" trail for every mutable table.
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id) on delete set null,
  action text not null,            -- create | update | delete | login | logout | ...
  entity_table text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on audit_logs (entity_table, entity_id);
create index audit_logs_actor_idx on audit_logs (actor_id);
create index audit_logs_created_at_idx on audit_logs (created_at desc);

-- ---- 20260710000009_notifications_settings_search.sql ----
-- ============================================================================
-- ILMS schema — 09: notifications, system settings, OPAC search logs
-- ============================================================================

-- Channel-agnostic outbox. Sending is implemented per-provider in the
-- backend notifications module (email/SMTP, SMS gateway, Telegram Bot API);
-- this table is the durable record of what was queued/sent regardless of
-- which provider handled it.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  channel notification_channel not null,
  title text not null,
  message text not null,
  related_entity_table text,
  related_entity_id uuid,
  is_read boolean not null default false,
  status notification_status not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on notifications (user_id);
create index notifications_status_idx on notifications (status);

-- Key-value system configuration (loan duration, fine rates, max renewals,
-- default download policy, etc.), editable from the Admin Panel.
create table settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  description text,
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on settings
  for each row execute function set_updated_at();

-- OPAC search analytics — anonymous searches are allowed, hence user_id is nullable.
create table opac_search_logs (
  id uuid primary key default gen_random_uuid(),
  query text,
  filters jsonb,
  user_id uuid references users(id) on delete set null,
  results_count integer,
  ip_address inet,
  searched_at timestamptz not null default now()
);
create index opac_search_logs_searched_at_idx on opac_search_logs (searched_at desc);

-- ---- 20260710000010_rls_policies.sql ----
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

-- ---- 20260710000011_seed_data.sql ----
-- ============================================================================
-- ILMS schema — 11: seed data (roles, starter permission catalog, languages)
-- ============================================================================

insert into roles (code, name, description) values
  ('director', 'Director', 'Full system oversight and reporting'),
  ('administrator', 'Administrator', 'System configuration, users, and roles'),
  ('librarian', 'Librarian', 'Cataloging, circulation, and inventory'),
  ('operator', 'Operator', 'Day-to-day circulation desk operations'),
  ('teacher', 'Teacher', 'Reader with extended borrowing privileges'),
  ('reader', 'Reader', 'Standard library patron');

insert into permissions (code, module, description) values
  ('books.read', 'books', 'View bibliographic records'),
  ('books.write', 'books', 'Create/edit bibliographic records'),
  ('books.delete', 'books', 'Delete bibliographic records'),
  ('circulation.issue', 'circulation', 'Issue a book copy to a reader'),
  ('circulation.return', 'circulation', 'Process a return'),
  ('circulation.manage_penalties', 'circulation', 'Waive or adjust fines'),
  ('readers.read', 'readers', 'View reader accounts'),
  ('readers.write', 'readers', 'Create/edit reader accounts'),
  ('inventory.audit', 'inventory', 'Run stocktake / shelf-check sessions'),
  ('reports.view', 'reports', 'View analytics and export reports'),
  ('admin.manage_roles', 'admin', 'Manage roles and permissions'),
  ('admin.manage_settings', 'admin', 'Change system settings');

-- Baseline role -> permission grants. Fully editable afterwards from the
-- Admin Panel (Phase 14) via the role_permissions table.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p where r.code = 'director';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p where r.code = 'administrator';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'librarian'
  and p.code in (
    'books.read', 'books.write', 'circulation.issue', 'circulation.return',
    'circulation.manage_penalties', 'readers.read', 'readers.write',
    'inventory.audit', 'reports.view'
  );

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code = 'operator'
  and p.code in ('books.read', 'circulation.issue', 'circulation.return', 'readers.read');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code in ('teacher', 'reader') and p.code = 'books.read';

insert into languages (code, name) values
  ('uz', 'O''zbek'),
  ('ru', 'Русский'),
  ('en', 'English');

insert into settings (key, value, description) values
  ('circulation.default_loan_days', '14', 'Default loan period in days'),
  ('circulation.max_renewals', '2', 'Maximum renewals allowed per loan'),
  ('circulation.max_active_loans', '5', 'Maximum concurrent active loans per reader'),
  ('circulation.overdue_fine_per_day', '1000', 'Fine amount per overdue day (UZS)'),
  ('electronic_library.download_enabled_default', 'true', 'Default download permission for newly uploaded files');

-- ---- 20260711000001_auth_provisioning.sql ----
-- ============================================================================
-- ILMS schema — 12: auth provisioning safety net
--
-- Readers/staff are normally created through the backend's staff-only
-- registration endpoint (full profile in one call). This trigger is a
-- safety net for any identity that ends up in auth.users some other way
-- (magic link, OAuth, direct Studio use) so it never ends up without a
-- matching public.users row — every FK in the schema (borrowings.reader_id,
-- etc.) depends on that row existing.
-- ============================================================================

create function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users (id, full_name, email, library_card_barcode, role, reader_category)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'User ' || substr(new.id::text, 1, 8)
    ),
    new.email,
    'TEMP-' || substr(new.id::text, 1, 8),
    'reader',
    'external'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ---- 20260711000002_circulation_functions.sql ----
-- ============================================================================
-- ILMS schema — 13: circulation transactional functions
--
-- Issuing/returning a copy touches two tables (borrowings/returns +
-- book_copies.status) that must change together. Doing that as two separate
-- REST calls from the backend risks a copy stuck "issued" with no loan (or
-- vice versa) if the second call fails. These run as a single Postgres
-- transaction instead. SECURITY INVOKER (the default) so RLS still applies
-- based on the calling user's JWT — a non-staff caller is rejected by the
-- same policies as a direct table write.
-- ============================================================================

create function issue_book_copy(
  p_book_copy_id uuid,
  p_reader_id uuid,
  p_issued_by uuid,
  p_due_date date
)
returns borrowings
language plpgsql
as $$
declare
  v_copy_status copy_status;
  v_reader_status account_status;
  v_borrowing borrowings;
begin
  select status into v_copy_status from book_copies where id = p_book_copy_id for update;
  if v_copy_status is null then
    raise exception 'Book copy not found';
  end if;
  if v_copy_status <> 'available' then
    raise exception 'Book copy is not available (current status: %)', v_copy_status;
  end if;

  select status into v_reader_status from users where id = p_reader_id;
  if v_reader_status is null then
    raise exception 'Reader not found';
  end if;
  if v_reader_status <> 'active' then
    raise exception 'Reader account is blocked';
  end if;

  insert into borrowings (book_copy_id, reader_id, issued_by, due_date)
  values (p_book_copy_id, p_reader_id, p_issued_by, p_due_date)
  returning * into v_borrowing;

  update book_copies set status = 'issued' where id = p_book_copy_id;

  return v_borrowing;
end;
$$;

create function return_book_copy(
  p_borrowing_id uuid,
  p_received_by uuid,
  p_condition text default null,
  p_notes text default null
)
returns returns
language plpgsql
as $$
declare
  v_borrowing borrowings;
  v_return returns;
  v_fine_per_day numeric;
  v_days_overdue integer;
begin
  select * into v_borrowing from borrowings where id = p_borrowing_id for update;
  if v_borrowing.id is null then
    raise exception 'Borrowing not found';
  end if;
  if v_borrowing.status not in ('active', 'overdue') then
    raise exception 'Borrowing is already closed (status: %)', v_borrowing.status;
  end if;

  update borrowings set status = 'returned', returned_at = now() where id = p_borrowing_id;
  update book_copies set status = 'available' where id = v_borrowing.book_copy_id;

  insert into returns (borrowing_id, received_by, condition_on_return, notes)
  values (p_borrowing_id, p_received_by, p_condition, p_notes)
  returning * into v_return;

  v_days_overdue := greatest(0, (current_date - v_borrowing.due_date));
  if v_days_overdue > 0 then
    select coalesce((value #>> '{}')::numeric, 0) into v_fine_per_day
    from settings where key = 'circulation.overdue_fine_per_day';

    if v_fine_per_day is not null and v_fine_per_day > 0 then
      insert into penalties (borrowing_id, reader_id, reason, amount)
      values (p_borrowing_id, v_borrowing.reader_id, 'overdue', v_fine_per_day * v_days_overdue);
    end if;
  end if;

  return v_return;
end;
$$;

create function renew_borrowing(p_borrowing_id uuid, p_extra_days integer default null)
returns borrowings
language plpgsql
as $$
declare
  v_borrowing borrowings;
  v_max_renewals integer;
  v_loan_days integer;
begin
  select * into v_borrowing from borrowings where id = p_borrowing_id for update;
  if v_borrowing.id is null then
    raise exception 'Borrowing not found';
  end if;
  if v_borrowing.status not in ('active', 'overdue') then
    raise exception 'Borrowing is already closed (status: %)', v_borrowing.status;
  end if;

  select coalesce((value #>> '{}')::integer, 2) into v_max_renewals
  from settings where key = 'circulation.max_renewals';
  if v_borrowing.renewal_count >= coalesce(v_max_renewals, 2) then
    raise exception 'Maximum renewals reached';
  end if;

  select coalesce((value #>> '{}')::integer, 14) into v_loan_days
  from settings where key = 'circulation.default_loan_days';

  update borrowings
  set
    due_date = due_date + make_interval(days => coalesce(p_extra_days, v_loan_days, 14)),
    renewal_count = renewal_count + 1,
    status = 'active'
  where id = p_borrowing_id
  returning * into v_borrowing;

  return v_borrowing;
end;
$$;

create function create_reservation(p_book_id uuid, p_reader_id uuid)
returns reservations
language plpgsql
as $$
declare
  v_next_position integer;
  v_reservation reservations;
begin
  select coalesce(max(queue_position), 0) + 1 into v_next_position
  from reservations
  where book_id = p_book_id and status = 'pending';

  insert into reservations (book_id, reader_id, queue_position)
  values (p_book_id, p_reader_id, v_next_position)
  returning * into v_reservation;

  return v_reservation;
end;
$$;

create function fulfill_reservation(p_reservation_id uuid, p_book_copy_id uuid)
returns reservations
language plpgsql
as $$
declare
  v_copy_status copy_status;
  v_reservation reservations;
begin
  select status into v_copy_status from book_copies where id = p_book_copy_id for update;
  if v_copy_status is null then
    raise exception 'Book copy not found';
  end if;
  if v_copy_status <> 'available' then
    raise exception 'Book copy is not available (current status: %)', v_copy_status;
  end if;

  update reservations
  set status = 'ready', fulfilled_copy_id = p_book_copy_id, fulfilled_at = now()
  where id = p_reservation_id and status = 'pending'
  returning * into v_reservation;

  if v_reservation.id is null then
    raise exception 'Reservation not found or not pending';
  end if;

  update book_copies set status = 'reserved' where id = p_book_copy_id;

  return v_reservation;
end;
$$;

-- ---- 20260712000001_dashboard_summary.sql ----
-- ============================================================================
-- ILMS schema — 14: dashboard/reports summary function
--
-- Backs both the Dashboard (Phase 6) and Reports (Phase 12) modules with a
-- single query instead of ~8 round trips, and lets "most borrowed book" /
-- "most active reader" use GROUP BY aggregation PostgREST can't express
-- directly. SECURITY INVOKER (default) — RLS still applies for the calling
-- (staff) user, same as any direct table read.
-- ============================================================================

create function get_dashboard_summary()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'totalBooks', (select count(*) from books),
    'totalCopies', (select count(*) from book_copies),
    'electronicBooks', (select count(*) from books where has_electronic_copy),
    'activeReaders', (select count(*) from users where role = 'reader' and status = 'active'),
    'issuedToday', (select count(*) from borrowings where issued_at::date = current_date),
    'returnedToday', (select count(*) from returns where returned_at::date = current_date),
    'overdueLoans', (select count(*) from borrowings where status = 'active' and due_date < current_date),
    'mostBorrowedBook', (
      select jsonb_build_object('bookId', b.id, 'title', b.title, 'borrowCount', c.cnt)
      from (
        select bc.book_id, count(*) as cnt
        from borrowings br
        join book_copies bc on bc.id = br.book_copy_id
        group by bc.book_id
        order by cnt desc
        limit 1
      ) c
      join books b on b.id = c.book_id
    ),
    'mostActiveReader', (
      select jsonb_build_object('readerId', u.id, 'fullName', u.full_name, 'borrowCount', c.cnt)
      from (
        select reader_id, count(*) as cnt from borrowings group by reader_id order by cnt desc limit 1
      ) c
      join users u on u.id = c.reader_id
    )
  );
$$;

create function get_faculty_breakdown()
returns table (faculty_name text, book_count bigint)
language sql
stable
as $$
  select f.name as faculty_name, count(b.id) as book_count
  from faculties f
  left join books b on b.faculty_id = f.id
  group by f.id, f.name
  order by book_count desc;
$$;

create function get_subject_breakdown()
returns table (subject_name text, book_count bigint)
language sql
stable
as $$
  select s.name as subject_name, count(b.id) as book_count
  from subjects s
  left join books b on b.subject_id = s.id
  group by s.id, s.name
  order by book_count desc;
$$;

create function get_year_breakdown()
returns table (publication_year smallint, book_count bigint)
language sql
stable
as $$
  select b.publication_year, count(*) as book_count
  from books b
  where b.publication_year is not null
  group by b.publication_year
  order by b.publication_year desc;
$$;

-- ---- 20260713000001_storage_buckets.sql ----
-- ============================================================================
-- ILMS schema — 15: Storage bucket for electronic library files
--
-- Private bucket — nobody reads/writes it directly via client Storage RLS.
-- The backend is the sole access point: uploads go through a staff-only
-- REST endpoint (validated, written via the service-role client), and
-- reads are always short-lived signed URLs the backend issues after
-- checking auth + book_files.is_downloadable. This is what actually makes
-- the "admin can disable download" toggle meaningful — a direct client-side
-- Storage RLS read policy would let any authenticated user bypass it.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('book-files', 'book-files', false)
on conflict (id) do nothing;

-- ---- 20260714000001_school_classes.sql ----
-- ============================================================================
-- ILMS schema — 16: adapt from university to general secondary school
--
-- Replaces the faculty/department/course/group model (higher-ed) with a
-- school "classes" model: grade_number (1-11) + section letter (e.g. "5-A"),
-- with an optional homeroom teacher. Applies to both readers (students) and
-- books (recommended grade range) — a school library organizes its
-- collection by grade level and subject, not by faculty/department.
-- ============================================================================

create table classes (
  id uuid primary key default gen_random_uuid(),
  grade_number smallint not null check (grade_number between 1 and 11),
  section text not null,                    -- e.g. 'A', 'B', 'V'
  name text generated always as (grade_number || '-' || section) stored,
  homeroom_teacher_id uuid references users(id) on delete set null,
  academic_year text,                       -- e.g. '2025-2026', optional
  created_at timestamptz not null default now(),
  unique (grade_number, section, academic_year)
);

alter table users
  add column class_id uuid references classes(id) on delete set null;

alter table users
  drop column faculty_id,
  drop column department_id,
  drop column course,
  drop column group_name;

alter table books
  add column min_grade smallint check (min_grade between 1 and 11),
  add column max_grade smallint check (max_grade between 1 and 11);

alter table books
  drop column faculty_id,
  drop column department_id,
  drop column direction;

drop table departments;
drop table faculties;

-- --- RLS: classes follow the same public-read / staff-write pattern as
-- --- other reference/catalog data.
alter table classes enable row level security;
create policy "classes_public_read" on classes for select using (true);
create policy "classes_staff_write" on classes for insert with check (auth_is_staff());
create policy "classes_staff_update" on classes for update using (auth_is_staff());
create policy "classes_staff_delete" on classes for delete using (auth_is_staff());

-- --- Reports: faculty breakdown -> class breakdown.
drop function get_faculty_breakdown();

create function get_class_breakdown()
returns table (class_name text, reader_count bigint)
language sql
stable
as $$
  select c.name as class_name, count(u.id) as reader_count
  from classes c
  left join users u on u.class_id = c.id
  group by c.id, c.name
  order by c.grade_number, c.section;
$$;

