import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/modules/dashboard/api/get-summary";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["reports", "summary"],
    queryFn: getDashboardSummary,
    staleTime: 60_000,
  });
}
