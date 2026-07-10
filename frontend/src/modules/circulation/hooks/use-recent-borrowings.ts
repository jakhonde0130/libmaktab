import { useQuery } from "@tanstack/react-query";
import { listBorrowings } from "@/modules/circulation/api/list-borrowings";

export function useRecentBorrowings(pageSize = 5) {
  return useQuery({
    queryKey: ["circulation", "borrowings", "recent", pageSize],
    queryFn: () => listBorrowings({ pageSize }),
    staleTime: 30_000,
  });
}
