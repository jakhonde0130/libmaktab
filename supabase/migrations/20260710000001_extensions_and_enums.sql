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
