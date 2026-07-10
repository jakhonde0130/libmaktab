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
