import { apiClient } from "@/lib/api-client";

export type ReferenceResource =
  | "languages"
  | "publishers"
  | "authors"
  | "faculties"
  | "departments"
  | "subjects"
  | "categories"
  | "keywords"
  | "locations"
  | "shelves"
  | "racks";

export interface ReferenceItem {
  id: string;
  name?: string;
  full_name?: string;
  code?: string;
  [key: string]: unknown;
}

export function listReference(resource: ReferenceResource, params: Record<string, string> = {}) {
  const query = new URLSearchParams({ pageSize: "100", ...params });
  return apiClient
    .get<{ data: ReferenceItem[] }>(`/reference/${resource}?${query.toString()}`)
    .then((res) => res.data);
}
