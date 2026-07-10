import { apiClient } from "@/lib/api-client";

export interface CopyLookupResult {
  id: string;
  barcode: string;
  inventory_number: string;
  status: string;
  book: { id: string; title: string; isbn: string | null };
}

export function getCopyByBarcode(barcode: string) {
  return apiClient
    .get<{ data: CopyLookupResult }>(`/book-copies/barcode/${encodeURIComponent(barcode)}`)
    .then((res) => res.data);
}
