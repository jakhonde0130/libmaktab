import type { SupabaseClient } from "@supabase/supabase-js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";

export const inventoryRepository = {
  async findCopyByBarcode(client: SupabaseClient, barcode: string) {
    const { data, error } = await client
      .from("book_copies")
      .select("id, barcode, inventory_number, rack_id, book:books(id, title)")
      .eq("barcode", barcode)
      .maybeSingle();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async recordScan(
    client: SupabaseClient,
    row: {
      audit_batch_id: string;
      book_copy_id: string | null;
      scanned_barcode: string;
      scanned_by: string;
      expected_rack_id: string | null;
      found_rack_id: string | null;
      result: "found" | "missing" | "misplaced" | "damaged";
    }
  ) {
    const { data, error } = await client.from("inventory_logs").insert(row).select().single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async listLogs(client: SupabaseClient, auditBatchId: string) {
    const { data, error } = await client
      .from("inventory_logs")
      .select("*, book_copy:book_copies(id, barcode, inventory_number, book:books(id, title))")
      .eq("audit_batch_id", auditBatchId)
      .order("scanned_at", { ascending: false });
    if (error) throw mapSupabaseError(error);
    return data ?? [];
  },

  async listMissing(client: SupabaseClient, auditBatchId: string) {
    const { data: scanned, error: scannedError } = await client
      .from("inventory_logs")
      .select("book_copy_id")
      .eq("audit_batch_id", auditBatchId)
      .not("book_copy_id", "is", null);
    if (scannedError) throw mapSupabaseError(scannedError);

    const scannedIds = [...new Set((scanned ?? []).map((r) => r.book_copy_id as string))];

    let query = client
      .from("book_copies")
      .select("id, barcode, inventory_number, status, book:books(id, title)")
      .eq("status", "available");
    if (scannedIds.length > 0) {
      query = query.not("id", "in", `(${scannedIds.join(",")})`);
    }

    const { data, error } = await query;
    if (error) throw mapSupabaseError(error);
    return data ?? [];
  },
};
