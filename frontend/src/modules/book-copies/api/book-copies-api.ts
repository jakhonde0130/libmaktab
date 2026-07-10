import { apiClient } from "@/lib/api-client";
import type { BookCopyDetail } from "@/modules/catalog/types/book-summary";

export interface CopyFormValues {
  bookId: string;
  inventoryNumber: string;
  barcode: string;
  rackId?: string;
  status?: string;
  price?: number;
  acquisitionDate?: string;
  acquisitionType?: string;
  conditionNotes?: string;
}

export function listCopiesForBook(bookId: string) {
  return apiClient
    .get<{ data: BookCopyDetail[]; meta: unknown }>(`/book-copies?bookId=${bookId}&pageSize=100`)
    .then((res) => res.data);
}

export function createCopy(values: CopyFormValues) {
  return apiClient.post<{ data: BookCopyDetail }>("/book-copies", values).then((res) => res.data);
}

export function updateCopy(id: string, values: Partial<CopyFormValues>) {
  return apiClient.patch<{ data: BookCopyDetail }>(`/book-copies/${id}`, values).then((res) => res.data);
}

export function deleteCopy(id: string) {
  return apiClient.delete<void>(`/book-copies/${id}`);
}
