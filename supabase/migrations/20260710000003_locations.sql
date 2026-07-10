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
