import { apiClient } from "@/lib/api-client";
import type { BookDetail, BookSummary } from "@/modules/catalog/types/book-summary";
import type { BookFormValues } from "@/modules/books/types/book";

interface ListResponse {
  data: BookSummary[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function listBooksAdmin(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params);
  return apiClient.get<ListResponse>(`/books?${query.toString()}`);
}

export function getBookAdmin(id: string) {
  return apiClient.get<{ data: BookDetail }>(`/books/${id}`).then((res) => res.data);
}

export function createBook(values: BookFormValues) {
  return apiClient.post<{ data: BookDetail }>("/books", values).then((res) => res.data);
}

export function updateBook(id: string, values: Partial<BookFormValues>) {
  return apiClient.patch<{ data: BookDetail }>(`/books/${id}`, values).then((res) => res.data);
}

export function deleteBook(id: string) {
  return apiClient.delete<void>(`/books/${id}`);
}
