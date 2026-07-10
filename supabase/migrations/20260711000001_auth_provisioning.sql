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
