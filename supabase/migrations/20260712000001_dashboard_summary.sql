-- ============================================================================
-- ILMS schema — 14: dashboard/reports summary function
--
-- Backs both the Dashboard (Phase 6) and Reports (Phase 12) modules with a
-- single query instead of ~8 round trips, and lets "most borrowed book" /
-- "most active reader" use GROUP BY aggregation PostgREST can't express
-- directly. SECURITY INVOKER (default) — RLS still applies for the calling
-- (staff) user, same as any direct table read.
-- ============================================================================

create function get_dashboard_summary()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'totalBooks', (select count(*) from books),
    'totalCopies', (select count(*) from book_copies),
    'electronicBooks', (select count(*) from books where has_electronic_copy),
    'activeReaders', (select count(*) from users where role = 'reader' and status = 'active'),
    'issuedToday', (select count(*) from borrowings where issued_at::date = current_date),
    'returnedToday', (select count(*) from returns where returned_at::date = current_date),
    'overdueLoans', (select count(*) from borrowings where status = 'active' and due_date < current_date),
    'mostBorrowedBook', (
      select jsonb_build_object('bookId', b.id, 'title', b.title, 'borrowCount', c.cnt)
      from (
        select bc.book_id, count(*) as cnt
        from borrowings br
        join book_copies bc on bc.id = br.book_copy_id
        group by bc.book_id
        order by cnt desc
        limit 1
      ) c
      join books b on b.id = c.book_id
    ),
    'mostActiveReader', (
      select jsonb_build_object('readerId', u.id, 'fullName', u.full_name, 'borrowCount', c.cnt)
      from (
        select reader_id, count(*) as cnt from borrowings group by reader_id order by cnt desc limit 1
      ) c
      join users u on u.id = c.reader_id
    )
  );
$$;

create function get_faculty_breakdown()
returns table (faculty_name text, book_count bigint)
language sql
stable
as $$
  select f.name as faculty_name, count(b.id) as book_count
  from faculties f
  left join books b on b.faculty_id = f.id
  group by f.id, f.name
  order by book_count desc;
$$;

create function get_subject_breakdown()
returns table (subject_name text, book_count bigint)
language sql
stable
as $$
  select s.name as subject_name, count(b.id) as book_count
  from subjects s
  left join books b on b.subject_id = s.id
  group by s.id, s.name
  order by book_count desc;
$$;

create function get_year_breakdown()
returns table (publication_year smallint, book_count bigint)
language sql
stable
as $$
  select b.publication_year, count(*) as book_count
  from books b
  where b.publication_year is not null
  group by b.publication_year
  order by b.publication_year desc;
$$;
