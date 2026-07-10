import { useQuery } from "@tanstack/react-query";
import { listBooksAdmin } from "@/modules/books/api/books-api";

export function useBooks(params: Record<string, string>) {
  return useQuery({
    queryKey: ["books", "list", params],
    queryFn: () => listBooksAdmin(params),
    staleTime: 15_000,
  });
}
