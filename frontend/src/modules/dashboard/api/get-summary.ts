import { apiClient } from "@/lib/api-client";
import type { DashboardSummary } from "@/modules/dashboard/types/summary";

export function getDashboardSummary() {
  return apiClient.get<{ data: DashboardSummary }>("/reports/summary").then((res) => res.data);
}
