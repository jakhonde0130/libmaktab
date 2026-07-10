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
