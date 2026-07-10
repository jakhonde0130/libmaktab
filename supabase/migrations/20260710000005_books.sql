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
