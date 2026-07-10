-- ============================================================================
-- ILMS schema — 13: circulation transactional functions
--
-- Issuing/returning a copy touches two tables (borrowings/returns +
-- book_copies.status) that must change together. Doing that as two separate
-- REST calls from the backend risks a copy stuck "issued" with no loan (or
-- vice versa) if the second call fails. These run as a single Postgres
-- transaction instead. SECURITY INVOKER (the default) so RLS still applies
-- based on the calling user's JWT — a non-staff caller is rejected by the
-- same policies as a direct table write.
-- ============================================================================

create function issue_book_copy(
  p_book_copy_id uuid,
  p_reader_id uuid,
  p_issued_by uuid,
  p_due_date date
)
returns borrowings
language plpgsql
as $$
declare
  v_copy_status copy_status;
  v_reader_status account_status;
  v_borrowing borrowings;
begin
  select status into v_copy_status from book_copies where id = p_book_copy_id for update;
  if v_copy_status is null then
    raise exception 'Book copy not found';
  end if;
  if v_copy_status <> 'available' then
    raise exception 'Book copy is not available (current status: %)', v_copy_status;
  end if;

  select status into v_reader_status from users where id = p_reader_id;
  if v_reader_status is null then
    raise exception 'Reader not found';
  end if;
  if v_reader_status <> 'active' then
    raise exception 'Reader account is blocked';
  end if;

  insert into borrowings (book_copy_id, reader_id, issued_by, due_date)
  values (p_book_copy_id, p_reader_id, p_issued_by, p_due_date)
  returning * into v_borrowing;

  update book_copies set status = 'issued' where id = p_book_copy_id;

  return v_borrowing;
end;
$$;

create function return_book_copy(
  p_borrowing_id uuid,
  p_received_by uuid,
  p_condition text default null,
  p_notes text default null
)
returns returns
language plpgsql
as $$
declare
  v_borrowing borrowings;
  v_return returns;
  v_fine_per_day numeric;
  v_days_overdue integer;
begin
  select * into v_borrowing from borrowings where id = p_borrowing_id for update;
  if v_borrowing.id is null then
    raise exception 'Borrowing not found';
  end if;
  if v_borrowing.status not in ('active', 'overdue') then
    raise exception 'Borrowing is already closed (status: %)', v_borrowing.status;
  end if;

  update borrowings set status = 'returned', returned_at = now() where id = p_borrowing_id;
  update book_copies set status = 'available' where id = v_borrowing.book_copy_id;

  insert into returns (borrowing_id, received_by, condition_on_return, notes)
  values (p_borrowing_id, p_received_by, p_condition, p_notes)
  returning * into v_return;

  v_days_overdue := greatest(0, (current_date - v_borrowing.due_date));
  if v_days_overdue > 0 then
    select coalesce((value #>> '{}')::numeric, 0) into v_fine_per_day
    from settings where key = 'circulation.overdue_fine_per_day';

    if v_fine_per_day is not null and v_fine_per_day > 0 then
      insert into penalties (borrowing_id, reader_id, reason, amount)
      values (p_borrowing_id, v_borrowing.reader_id, 'overdue', v_fine_per_day * v_days_overdue);
    end if;
  end if;

  return v_return;
end;
$$;

create function renew_borrowing(p_borrowing_id uuid, p_extra_days integer default null)
returns borrowings
language plpgsql
as $$
declare
  v_borrowing borrowings;
  v_max_renewals integer;
  v_loan_days integer;
begin
  select * into v_borrowing from borrowings where id = p_borrowing_id for update;
  if v_borrowing.id is null then
    raise exception 'Borrowing not found';
  end if;
  if v_borrowing.status not in ('active', 'overdue') then
    raise exception 'Borrowing is already closed (status: %)', v_borrowing.status;
  end if;

  select coalesce((value #>> '{}')::integer, 2) into v_max_renewals
  from settings where key = 'circulation.max_renewals';
  if v_borrowing.renewal_count >= coalesce(v_max_renewals, 2) then
    raise exception 'Maximum renewals reached';
  end if;

  select coalesce((value #>> '{}')::integer, 14) into v_loan_days
  from settings where key = 'circulation.default_loan_days';

  update borrowings
  set
    due_date = due_date + make_interval(days => coalesce(p_extra_days, v_loan_days, 14)),
    renewal_count = renewal_count + 1,
    status = 'active'
  where id = p_borrowing_id
  returning * into v_borrowing;

  return v_borrowing;
end;
$$;

create function create_reservation(p_book_id uuid, p_reader_id uuid)
returns reservations
language plpgsql
as $$
declare
  v_next_position integer;
  v_reservation reservations;
begin
  select coalesce(max(queue_position), 0) + 1 into v_next_position
  from reservations
  where book_id = p_book_id and status = 'pending';

  insert into reservations (book_id, reader_id, queue_position)
  values (p_book_id, p_reader_id, v_next_position)
  returning * into v_reservation;

  return v_reservation;
end;
$$;

create function fulfill_reservation(p_reservation_id uuid, p_book_copy_id uuid)
returns reservations
language plpgsql
as $$
declare
  v_copy_status copy_status;
  v_reservation reservations;
begin
  select status into v_copy_status from book_copies where id = p_book_copy_id for update;
  if v_copy_status is null then
    raise exception 'Book copy not found';
  end if;
  if v_copy_status <> 'available' then
    raise exception 'Book copy is not available (current status: %)', v_copy_status;
  end if;

  update reservations
  set status = 'ready', fulfilled_copy_id = p_book_copy_id, fulfilled_at = now()
  where id = p_reservation_id and status = 'pending'
  returning * into v_reservation;

  if v_reservation.id is null then
    raise exception 'Reservation not found or not pending';
  end if;

  update book_copies set status = 'reserved' where id = p_book_copy_id;

  return v_reservation;
end;
$$;
