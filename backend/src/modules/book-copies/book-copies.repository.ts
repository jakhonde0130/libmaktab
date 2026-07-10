import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPageMeta, toRange, type PaginationInput } from "@/lib/pagination.js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";

const SELECT = `
  *,
  book:books(id, title, isbn),
  rack:racks(id, name, shelf:shelves(id, name, location:locations(id, name)))
`;

export const bookCopiesRepository = {
  async list(
    client: SupabaseClient,
    pagination: PaginationInput,
    filters: { bookId?: string; status?: string; search?: string }
  ) {
    let query = client.from("book_copies").select(SELECT, { count: "exact" });
    if (filters.bookId) query = query.eq("book_id", filters.bookId);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.search) {
      query = query.or(`barcode.ilike.%${filters.search}%,inventory_number.ilike.%${filters.search}%`);
    }

    const [from, to] = toRange(pagination);
    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
    if (error) throw mapSupabaseError(error);
    return { data: data ?? [], meta: buildPageMeta(pagination, count ?? 0) };
  },

  async get(client: SupabaseClient, id: string) {
    const { data, error } = await client.from("book_copies").select(SELECT).eq("id", id).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async getByBarcode(client: SupabaseClient, barcode: string) {
    const { data, error } = await client.from("book_copies").select(SELECT).eq("barcode", barcode).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async create(client: SupabaseClient, row: Record<string, unknown>) {
    const { data, error } = await client.from("book_copies").insert(row).select(SELECT).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async update(client: SupabaseClient, id: string, row: Record<string, unknown>) {
    const { data, error } = await client.from("book_copies").update(row).eq("id", id).select(SELECT).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async remove(client: SupabaseClient, id: string) {
    const { error } = await client.from("book_copies").delete().eq("id", id);
    if (error) throw mapSupabaseError(error);
  },
};
