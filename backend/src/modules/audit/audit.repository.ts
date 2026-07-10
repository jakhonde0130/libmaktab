import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPageMeta, toRange, type PaginationInput } from "@/lib/pagination.js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";

export const auditRepository = {
  async list(
    client: SupabaseClient,
    pagination: PaginationInput,
    filters: { entityTable?: string; actorId?: string }
  ) {
    let query = client
      .from("audit_logs")
      .select("*, actor:users(id, full_name)", { count: "exact" });
    if (filters.entityTable) query = query.eq("entity_table", filters.entityTable);
    if (filters.actorId) query = query.eq("actor_id", filters.actorId);

    const [from, to] = toRange(pagination);
    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
    if (error) throw mapSupabaseError(error);
    return { data: data ?? [], meta: buildPageMeta(pagination, count ?? 0) };
  },
};
