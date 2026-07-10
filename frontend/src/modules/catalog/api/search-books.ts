import { apiClient } from "@/lib/api-client";
import type { BookDetail, BookSummary } from "@/modules/catalog/types/book-summary";

export interface BookSearchFilters {
  q?: string;
  isbn?: string;
  udk?: string;
  bbk?: string;
  author?: string;
  keyword?: string;
  categoryId?: string;
  subjectId?: string;
  languageId?: string;
  grade?: string;
  publisherId?: string;
  year?: string;
  barcode?: string;
  inventoryNumber?: string;
  hasElectronicCopy?: string;
  page?: string;
  pageSize?: string;
}

interface ListResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function searchBooks(filters: BookSearchFilters) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  return apiClient.get<ListResponse<BookSummary>>(`/books?${query.toString()}`);
}

export function getBook(id: string) {
  return apiClient.get<{ data: BookDetail }>(`/books/${id}`).then((res) => res.data);
}
