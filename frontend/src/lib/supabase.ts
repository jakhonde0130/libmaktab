import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Client-side Supabase instance. Used only for Auth (sign-in/session) and
 * Storage (direct uploads/signed downloads); all other data access goes
 * through the backend REST API so business rules and RLS-scoped queries
 * live in one place (see backend/src/modules).
 */
export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
