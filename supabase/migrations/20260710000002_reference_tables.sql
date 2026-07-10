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
