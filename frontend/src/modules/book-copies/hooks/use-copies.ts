import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCopy,
  deleteCopy,
  listCopiesForBook,
  updateCopy,
  type CopyFormValues,
} from "@/modules/book-copies/api/book-copies-api";

export function useCopiesForBook(bookId: string) {
  return useQuery({
    queryKey: ["book-copies", bookId],
    queryFn: () => listCopiesForBook(bookId),
    enabled: !!bookId,
  });
}

export function useCreateCopy(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Omit<CopyFormValues, "bookId">) => createCopy({ ...values, bookId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["book-copies", bookId] }),
  });
}

export function useUpdateCopy(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CopyFormValues> }) => updateCopy(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["book-copies", bookId] }),
  });
}

export function useDeleteCopy(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCopy(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["book-copies", bookId] }),
  });
}
