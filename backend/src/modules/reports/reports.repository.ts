import type { SupabaseClient } from "@supabase/supabase-js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";

export const reportsRepository = {
  async getSummary(client: SupabaseClient) {
    const { data, error } = await client.rpc("get_dashboard_summary");
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async getClassBreakdown(client: SupabaseClient) {
    const { data, error } = await client.rpc("get_class_breakdown");
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async getSubjectBreakdown(client: SupabaseClient) {
    const { data, error } = await client.rpc("get_subject_breakdown");
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async getYearBreakdown(client: SupabaseClient) {
    const { data, error } = await client.rpc("get_year_breakdown");
    if (error) throw mapSupabaseError(error);
    return data;
  },
};
