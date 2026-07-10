-- ============================================================================
-- ILMS schema — 17: Storage bucket for book cover images
--
-- Public bucket (unlike book-files) — covers are meant to be displayed
-- everywhere in the catalog/OPAC without needing signed URLs, so a plain
-- public URL is stored directly in books.cover_image_url. Uploads still go
-- through a staff-only backend endpoint (validated, service-role write) for
-- consistency with book-files and to enforce image-type/size limits.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;
