-- ============================================================================
-- ILMS schema — 16: adapt from university to general secondary school
--
-- Replaces the faculty/department/course/group model (higher-ed) with a
-- school "classes" model: grade_number (1-11) + section letter (e.g. "5-A"),
-- with an optional homeroom teacher. Applies to both readers (students) and
-- books (recommended grade range) — a school library organizes its
-- collection by grade level and subject, not by faculty/department.
-- ============================================================================

create table classes (
  id uuid primary key default gen_random_uuid(),
  grade_number smallint not null check (grade_number between 1 and 11),
  section text not null,                    -- e.g. 'A', 'B', 'V'
  name text generated always as (grade_number || '-' || section) stored,
  homeroom_teacher_id uuid references users(id) on delete set null,
  academic_year text,                       -- e.g. '2025-2026', optional
  created_at timestamptz not null default now(),
  unique (grade_number, section, academic_year)
);

alter table users
  add column class_id uuid references classes(id) on delete set null;

alter table users
  drop column faculty_id,
  drop column department_id,
  drop column course,
  drop column group_name;

alter table books
  add column min_grade smallint check (min_grade between 1 and 11),
  add column max_grade smallint check (max_grade between 1 and 11);

alter table books
  drop column faculty_id,
  drop column department_id,
  drop column direction;

drop table departments;
drop table faculties;

-- --- RLS: classes follow the same public-read / staff-write pattern as
-- --- other reference/catalog data.
alter table classes enable row level security;
create policy "classes_public_read" on classes for select using (true);
create policy "classes_staff_write" on classes for insert with check (auth_is_staff());
create policy "classes_staff_update" on classes for update using (auth_is_staff());
create policy "classes_staff_delete" on classes for delete using (auth_is_staff());

-- --- Reports: faculty breakdown -> class breakdown.
drop function get_faculty_breakdown();

create function get_class_breakdown()
returns table (class_name text, reader_count bigint)
language sql
stable
as $$
  select c.name as class_name, count(u.id) as reader_count
  from classes c
  left join users u on u.class_id = c.id
  group by c.id, c.name
  order by c.grade_number, c.section;
$$;
