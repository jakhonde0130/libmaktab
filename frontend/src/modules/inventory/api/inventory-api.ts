import { apiClient } from "@/lib/api-client";

export interface InventoryLog {
  id: string;
  audit_batch_id: string;
  scanned_barcode: string;
  scanned_at: string;
  result: "found" | "missing" | "misplaced" | "damaged";
  book_copy: { id: string; barcode: string; inventory_number: string; book: { id: string; title: string } } | null;
}

export interface MissingCopy {
  id: string;
  barcode: string;
  inventory_number: string;
  status: string;
  book: { id: string; title: string };
}

export function scanBarcode(auditBatchId: string, barcode: string) {
  return apiClient.post<{ data: InventoryLog }>("/inventory/scan", { auditBatchId, barcode }).then((res) => res.data);
}

export function listInventoryLogs(auditBatchId: string) {
  return apiClient
    .get<{ data: InventoryLog[] }>(`/inventory/logs?auditBatchId=${auditBatchId}`)
    .then((res) => res.data);
}

export function listMissingCopies(auditBatchId: string) {
  return apiClient
    .get<{ data: MissingCopy[] }>(`/inventory/missing?auditBatchId=${auditBatchId}`)
    .then((res) => res.data);
}
