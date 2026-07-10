import { useQuery } from "@tanstack/react-query";
import { searchBooks, type BookSearchFilters } from "@/modules/catalog/api/search-books";

export function useBookSearch(filters: BookSearchFilters) {
  return useQuery({
    queryKey: ["catalog", "books", filters],
    queryFn: () => searchBooks(filters),
    staleTime: 30_000,
  });
}
