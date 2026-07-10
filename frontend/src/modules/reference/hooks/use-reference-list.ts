import { useQuery } from "@tanstack/react-query";
import { listReference, type ReferenceResource } from "@/modules/reference/api/list-reference";

export function useReferenceList(resource: ReferenceResource, params: Record<string, string> = {}) {
  return useQuery({
    queryKey: ["reference", resource, params],
    queryFn: () => listReference(resource, params),
    staleTime: 5 * 60_000,
  });
}
