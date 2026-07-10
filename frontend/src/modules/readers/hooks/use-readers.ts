import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getReader,
  listReaders,
  registerReader,
  setReaderStatus,
  updateReader,
} from "@/modules/readers/api/readers-api";
import type { ReaderFormValues, ReaderUpdateValues } from "@/modules/readers/types/reader";

export function useReaders(params: Record<string, string>) {
  return useQuery({
    queryKey: ["readers", "list", params],
    queryFn: () => listReaders(params),
    staleTime: 15_000,
  });
}

export function useReader(id: string) {
  return useQuery({
    queryKey: ["readers", "detail", id],
    queryFn: () => getReader(id),
    enabled: !!id,
  });
}

export function useRegisterReader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ReaderFormValues) => registerReader(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["readers"] }),
  });
}

export function useUpdateReader(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ReaderUpdateValues) => updateReader(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readers"] });
      queryClient.invalidateQueries({ queryKey: ["readers", "detail", id] });
    },
  });
}

export function useSetReaderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "blocked" }) => setReaderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["readers"] }),
  });
}
