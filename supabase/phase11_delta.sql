-- ============================================================================
-- ILMS schema — 15: Storage bucket for electronic library files
--
-- Private bucket — nobody reads/writes it directly via client Storage RLS.
-- The backend is the sole access point: uploads go through a staff-only
-- REST endpoint (validated, written via the service-role client), and
-- reads are always short-lived signed URLs the backend issues after
-- checking auth + book_files.is_downloadable. This is what actually makes
-- the "admin can disable download" toggle meaningful — a direct client-side
-- Storage RLS read policy would let any authenticated user bypass it.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('book-files', 'book-files', false)
on conflict (id) do nothing;
