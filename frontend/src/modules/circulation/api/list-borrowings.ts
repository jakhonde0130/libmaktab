import { apiClient } from "@/lib/api-client";

export interface Borrowing {
  id: string;
  status: "active" | "returned" | "overdue";
  issued_at: string;
  due_date: string;
  returned_at: string | null;
  book_copy: { id: string; barcode: string; book: { id: string; title: string } };
  reader: { id: string; full_name: string; library_card_barcode: string };
}

interface ListResponse {
  data: Borrowing[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function listBorrowings(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiClient.get<ListResponse>(`/circulation/borrowings${suffix}`);
}
