import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPageMeta, toRange, type PaginationInput } from "@/lib/pagination.js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";

const BORROWING_SELECT = `
  *,
  book_copy:book_copies(id, barcode, inventory_number, book:books(id, title)),
  reader:users!borrowings_reader_id_fkey(id, full_name, library_card_barcode),
  issuer:users!borrowings_issued_by_fkey(id, full_name)
`;

const RESERVATION_SELECT = `
  *,
  book:books(id, title, cover_image_url),
  reader:users!reservations_reader_id_fkey(id, full_name, library_card_barcode)
`;

const PENALTY_SELECT = `
  *,
  reader:users!penalties_reader_id_fkey(id, full_name, library_card_barcode),
  borrowing:borrowings(id, book_copy:book_copies(id, book:books(id, title)))
`;

export const circulationRepository = {
  async issue(client: SupabaseClient, bookCopyId: string, readerId: string, issuedBy: string, dueDate: string) {
    const { data, error } = await client.rpc("issue_book_copy", {
      p_book_copy_id: bookCopyId,
      p_reader_id: readerId,
      p_issued_by: issuedBy,
      p_due_date: dueDate,
    });
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async return_(client: SupabaseClient, borrowingId: string, receivedBy: string, condition?: string, notes?: string) {
    const { data, error } = await client.rpc("return_book_copy", {
      p_borrowing_id: borrowingId,
      p_received_by: receivedBy,
      p_condition: condition ?? null,
      p_notes: notes ?? null,
    });
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async renew(client: SupabaseClient, borrowingId: string, extraDays?: number) {
    const { data, error } = await client.rpc("renew_borrowing", {
      p_borrowing_id: borrowingId,
      p_extra_days: extraDays ?? null,
    });
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async getSetting(client: SupabaseClient, key: string): Promise<unknown> {
    const { data, error } = await client.from("settings").select("value").eq("key", key).maybeSingle();
    if (error) throw mapSupabaseError(error);
    return data?.value;
  },

  async listBorrowings(
    client: SupabaseClient,
    pagination: PaginationInput,
    filters: { readerId?: string; bookCopyId?: string; status?: string }
  ) {
    let query = client.from("borrowings").select(BORROWING_SELECT, { count: "exact" });
    if (filters.readerId) query = query.eq("reader_id", filters.readerId);
    if (filters.bookCopyId) query = query.eq("book_copy_id", filters.bookCopyId);
    if (filters.status) query = query.eq("status", filters.status);

    const [from, to] = toRange(pagination);
    const { data, error, count } = await query.order("issued_at", { ascending: false }).range(from, to);
    if (error) throw mapSupabaseError(error);
    return { data: data ?? [], meta: buildPageMeta(pagination, count ?? 0) };
  },

  async getBorrowing(client: SupabaseClient, id: string) {
    const { data, error } = await client.from("borrowings").select(BORROWING_SELECT).eq("id", id).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async createReservation(client: SupabaseClient, bookId: string, readerId: string) {
    const { data, error } = await client.rpc("create_reservation", { p_book_id: bookId, p_reader_id: readerId });
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async fulfillReservation(client: SupabaseClient, reservationId: string, bookCopyId: string) {
    const { data, error } = await client.rpc("fulfill_reservation", {
      p_reservation_id: reservationId,
      p_book_copy_id: bookCopyId,
    });
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async cancelReservation(client: SupabaseClient, id: string) {
    const { data, error } = await client
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async listReservations(
    client: SupabaseClient,
    pagination: PaginationInput,
    filters: { bookId?: string; readerId?: string; status?: string }
  ) {
    let query = client.from("reservations").select(RESERVATION_SELECT, { count: "exact" });
    if (filters.bookId) query = query.eq("book_id", filters.bookId);
    if (filters.readerId) query = query.eq("reader_id", filters.readerId);
    if (filters.status) query = query.eq("status", filters.status);

    const [from, to] = toRange(pagination);
    const { data, error, count } = await query.order("requested_at", { ascending: true }).range(from, to);
    if (error) throw mapSupabaseError(error);
    return { data: data ?? [], meta: buildPageMeta(pagination, count ?? 0) };
  },

  async listPenalties(
    client: SupabaseClient,
    pagination: PaginationInput,
    filters: { readerId?: string; status?: string }
  ) {
    let query = client.from("penalties").select(PENALTY_SELECT, { count: "exact" });
    if (filters.readerId) query = query.eq("reader_id", filters.readerId);
    if (filters.status) query = query.eq("status", filters.status);

    const [from, to] = toRange(pagination);
    const { data, error, count } = await query.order("issued_at", { ascending: false }).range(from, to);
    if (error) throw mapSupabaseError(error);
    return { data: data ?? [], meta: buildPageMeta(pagination, count ?? 0) };
  },

  async payPenalty(client: SupabaseClient, id: string) {
    const { data, error } = await client
      .from("penalties")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async waivePenalty(client: SupabaseClient, id: string, waivedBy: string, notes?: string) {
    const { data, error } = await client
      .from("penalties")
      .update({ status: "waived", waived_by: waivedBy, notes: notes ?? null })
      .eq("id", id)
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data;
  },
};
