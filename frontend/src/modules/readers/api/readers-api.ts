import { apiClient } from "@/lib/api-client";
import type { AppRole, Reader, ReaderFormValues, ReaderUpdateValues } from "@/modules/readers/types/reader";

interface ListResponse {
  data: Reader[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export function listReaders(params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return apiClient.get<ListResponse>(`/readers?${query.toString()}`);
}

export function getReader(id: string) {
  return apiClient.get<{ data: Reader }>(`/readers/${id}`).then((res) => res.data);
}

export function registerReader(values: ReaderFormValues) {
  return apiClient
    .post<{ data: Reader }>("/auth/register", { ...values, role: "reader" })
    .then((res) => res.data);
}

/** Same registration endpoint, but for staff accounts — role is caller-supplied, not forced to "reader". */
export function registerAccount(values: ReaderFormValues & { role: AppRole }) {
  return apiClient.post<{ data: Reader }>("/auth/register", values).then((res) => res.data);
}

export function updateReader(id: string, values: ReaderUpdateValues) {
  return apiClient.patch<{ data: Reader }>(`/readers/${id}`, values).then((res) => res.data);
}

export function setReaderStatus(id: string, status: "active" | "blocked") {
  return apiClient.patch<{ data: Reader }>(`/readers/${id}/status`, { status }).then((res) => res.data);
}
