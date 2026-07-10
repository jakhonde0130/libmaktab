import { apiClient } from "@/lib/api-client";

export interface AuditLog {
  id: string;
  action: string;
  entity_table: string;
  entity_id: string | null;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
  actor: { id: string; full_name: string } | null;
}

export function listAuditLogs(params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return apiClient.get<{ data: AuditLog[]; meta: { total: number; totalPages: number; page: number; pageSize: number } }>(
    `/audit?${query.toString()}`
  );
}
