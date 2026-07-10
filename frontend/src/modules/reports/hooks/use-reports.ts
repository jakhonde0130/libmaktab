import { useQuery } from "@tanstack/react-query";
import { getClassBreakdown, getSubjectBreakdown, getYearBreakdown } from "@/modules/reports/api/reports-api";

export function useClassBreakdown() {
  return useQuery({ queryKey: ["reports", "class-breakdown"], queryFn: getClassBreakdown, staleTime: 60_000 });
}
export function useSubjectBreakdown() {
  return useQuery({ queryKey: ["reports", "subject-breakdown"], queryFn: getSubjectBreakdown, staleTime: 60_000 });
}
export function useYearBreakdown() {
  return useQuery({ queryKey: ["reports", "year-breakdown"], queryFn: getYearBreakdown, staleTime: 60_000 });
}
