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
