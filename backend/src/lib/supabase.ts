import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env.js";

// NOTE: not parameterized with the generated `Database` type yet — the
// placeholder in src/types/database.ts has no real table shapes, and
// applying it here makes every .from(...) call infer as `never`. Once the
// project is CLI-linked, regenerate that file with
// `supabase gen types typescript` and reintroduce SupabaseClient<Database>.

/**
 * Service-role client: bypasses RLS. Use only for trusted server-side
 * operations (e.g. admin tooling, scheduled jobs). Never forward this
 * client's results directly from a user-scoped endpoint.
 */
export const supabaseAdmin: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Per-request client scoped to the caller's JWT, so Postgres RLS policies
 * apply exactly as they would for the authenticated user.
 */
export function createRequestClient(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Shared anon-role client for unauthenticated requests (e.g. public OPAC
 * reads). Keeps least-privilege even for public data instead of falling
 * back to supabaseAdmin.
 */
export const supabaseAnon: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
