import { apiClient } from "@/lib/api-client";
import type { Borrowing } from "@/modules/circulation/api/list-borrowings";

export interface Reservation {
  id: string;
  status: "pending" | "ready" | "fulfilled" | "cancelled" | "expired";
  requested_at: string;
  queue_position: number | null;
  book: { id: string; title: string; cover_image_url: string | null };
  reader: { id: string; full_name: string; library_card_barcode: string };
}

export interface Penalty {
  id: string;
  reason: "overdue" | "lost_book" | "damage";
  amount: number;
  status: "unpaid" | "paid" | "waived";
  issued_at: string;
  reader: { id: string; full_name: string; library_card_barcode: string };
  borrowing: { id: string; book_copy: { id: string; book: { id: string; title: string } } } | null;
}

interface ListResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

function toQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  return query.toString();
}

export function issueBorrowing(bookCopyId: string, readerId: string) {
  return apiClient
    .post<{ data: Borrowing }>("/circulation/borrowings", { bookCopyId, readerId })
    .then((res) => res.data);
}

export function returnBorrowing(id: string, condition?: string, notes?: string) {
  return apiClient
    .post<{ data: unknown }>(`/circulation/borrowings/${id}/return`, { condition, notes })
    .then((res) => res.data);
}

export function renewBorrowing(id: string) {
  return apiClient.post<{ data: Borrowing }>(`/circulation/borrowings/${id}/renew`, {}).then((res) => res.data);
}

export function listReservations(params: Record<string, string | undefined> = {}) {
  return apiClient.get<ListResponse<Reservation>>(`/circulation/reservations?${toQuery(params)}`);
}

export function fulfillReservation(id: string, bookCopyId: string) {
  return apiClient
    .post<{ data: Reservation }>(`/circulation/reservations/${id}/fulfill`, { bookCopyId })
    .then((res) => res.data);
}

export function cancelReservation(id: string) {
  return apiClient.post<{ data: Reservation }>(`/circulation/reservations/${id}/cancel`, {}).then((res) => res.data);
}

export function listPenalties(params: Record<string, string | undefined> = {}) {
  return apiClient.get<ListResponse<Penalty>>(`/circulation/penalties?${toQuery(params)}`);
}

export function payPenalty(id: string) {
  return apiClient.post<{ data: Penalty }>(`/circulation/penalties/${id}/pay`, {}).then((res) => res.data);
}

export function waivePenalty(id: string, notes?: string) {
  return apiClient.post<{ data: Penalty }>(`/circulation/penalties/${id}/waive`, { notes }).then((res) => res.data);
}
