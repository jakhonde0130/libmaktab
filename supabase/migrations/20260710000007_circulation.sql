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
