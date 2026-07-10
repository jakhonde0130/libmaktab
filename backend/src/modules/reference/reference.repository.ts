import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPageMeta, toRange, type PaginationInput } from "@/lib/pagination.js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";
import { referenceSearchColumn, type ReferenceResource } from "@/modules/reference/reference.schema.js";

export function createReferenceRepository(resource: ReferenceResource) {
  const searchColumn = referenceSearchColumn[resource];

  return {
    async list(client: SupabaseClient, pagination: PaginationInput, search?: string) {
      let query = client.from(resource).select("*", { count: "exact" });
      if (search) {
        query = query.ilike(searchColumn, `%${search}%`);
      }
      const [from, to] = toRange(pagination);
      const { data, error, count } = await query.order(searchColumn).range(from, to);

      if (error) throw mapSupabaseError(error);
      return { data: data ?? [], meta: buildPageMeta(pagination, count ?? 0) };
    },

    async get(client: SupabaseClient, id: string) {
      const { data, error } = await client.from(resource).select("*").eq("id", id).single();
      if (error) throw mapSupabaseError(error);
      return data;
    },

    async create(client: SupabaseClient, payload: Record<string, unknown>) {
      const { data, error } = await client.from(resource).insert(payload).select().single();
      if (error) throw mapSupabaseError(error);
      return data;
    },

    async update(client: SupabaseClient, id: string, payload: Record<string, unknown>) {
      const { data, error } = await client.from(resource).update(payload).eq("id", id).select().single();
      if (error) throw mapSupabaseError(error);
      return data;
    },

    async remove(client: SupabaseClient, id: string) {
      const { error } = await client.from(resource).delete().eq("id", id);
      if (error) throw mapSupabaseError(error);
    },
  };
}
