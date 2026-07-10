import { supabaseAdmin } from "@/lib/supabase.js";

interface AuditEntry {
  actorId: string;
  action: string;
  entityTable: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Writes an audit_logs row via the service-role client — RLS only allows
 * admin reads and has no insert policy at all for regular sessions, so this
 * is the sole write path (see supabase/migrations RLS policies).
 */
export async function logAudit(entry: AuditEntry) {
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_table: entry.entityTable,
    entity_id: entry.entityId ?? null,
    before_data: entry.before ?? null,
    after_data: entry.after ?? null,
  });
}
