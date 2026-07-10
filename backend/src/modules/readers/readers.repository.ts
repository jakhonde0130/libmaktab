import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPageMeta, toRange, type PaginationInput } from "@/lib/pagination.js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";
import type { ReaderListQuery } from "@/modules/readers/readers.schema.js";

const SELECT = `
  id, full_name, pinfl, phone, email, reader_category, role,
  photo_url, library_card_barcode, qr_code_url, status, created_at, updated_at,
  class:classes(id, grade_number, section, name)
`;

export const readersRepository = {
  async list(client: SupabaseClient, pagination: PaginationInput, filters: ReaderListQuery) {
    let query = client.from("users").select(SELECT, { count: "exact" });

    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,library_card_barcode.ilike.%${filters.search}%,pinfl.ilike.%${filters.search}%`
      );
    }
    if (filters.classId) query = query.eq("class_id", filters.classId);
    if (filters.readerCategory) query = query.eq("reader_category", filters.readerCategory);
    if (filters.role) query = query.eq("role", filters.role);
    if (filters.status) query = query.eq("status", filters.status);

    const [from, to] = toRange(pagination);
    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
    if (error) throw mapSupabaseError(error);
    return { data: data ?? [], meta: buildPageMeta(pagination, count ?? 0) };
  },

  async get(client: SupabaseClient, id: string) {
    const { data, error } = await client.from("users").select(SELECT).eq("id", id).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async update(client: SupabaseClient, id: string, row: Record<string, unknown>) {
    const { data, error } = await client.from("users").update(row).eq("id", id).select(SELECT).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },
};
