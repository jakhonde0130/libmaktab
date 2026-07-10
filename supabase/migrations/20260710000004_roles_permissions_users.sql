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
