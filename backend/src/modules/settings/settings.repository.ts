import type { SupabaseClient } from "@supabase/supabase-js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";

export const settingsRepository = {
  async list(client: SupabaseClient) {
    const { data, error } = await client.from("settings").select("*").order("key");
    if (error) throw mapSupabaseError(error);
    return data ?? [];
  },

  async update(client: SupabaseClient, key: string, value: unknown, updatedBy: string) {
    const { data, error } = await client
      .from("settings")
      .update({ value, updated_by: updatedBy })
      .eq("key", key)
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data;
  },
};
