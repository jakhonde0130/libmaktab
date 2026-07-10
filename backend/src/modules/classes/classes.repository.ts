import type { SupabaseClient } from "@supabase/supabase-js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";

const SELECT = "*, homeroom_teacher:users!classes_homeroom_teacher_id_fkey(id, full_name)";

export const classesRepository = {
  async list(client: SupabaseClient) {
    const { data, error } = await client
      .from("classes")
      .select(SELECT)
      .order("grade_number")
      .order("section");
    if (error) throw mapSupabaseError(error);
    return data ?? [];
  },

  async get(client: SupabaseClient, id: string) {
    const { data, error } = await client.from("classes").select(SELECT).eq("id", id).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async create(client: SupabaseClient, row: Record<string, unknown>) {
    const { data, error } = await client.from("classes").insert(row).select(SELECT).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async update(client: SupabaseClient, id: string, row: Record<string, unknown>) {
    const { data, error } = await client.from("classes").update(row).eq("id", id).select(SELECT).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async remove(client: SupabaseClient, id: string) {
    const { error } = await client.from("classes").delete().eq("id", id);
    if (error) throw mapSupabaseError(error);
  },
};
