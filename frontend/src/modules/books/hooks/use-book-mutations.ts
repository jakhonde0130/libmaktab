import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBook, deleteBook, updateBook } from "@/modules/books/api/books-api";
import type { BookFormValues } from "@/modules/books/types/book";

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: BookFormValues) => createBook(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useUpdateBook(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<BookFormValues>) => updateBook(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["books", "detail", id] });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });
}
