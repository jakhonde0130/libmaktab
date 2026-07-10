import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelReservation,
  fulfillReservation,
  issueBorrowing,
  listPenalties,
  listReservations,
  payPenalty,
  renewBorrowing,
  returnBorrowing,
  waivePenalty,
} from "@/modules/circulation/api/circulation-api";
import { listBorrowings } from "@/modules/circulation/api/list-borrowings";

function invalidateCirculation(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["circulation"] });
  queryClient.invalidateQueries({ queryKey: ["reports"] });
}

export function useBorrowingsList(params: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ["circulation", "borrowings", params],
    queryFn: () => listBorrowings(params as Record<string, string>),
  });
}

export function useIssueBorrowing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookCopyId, readerId }: { bookCopyId: string; readerId: string }) =>
      issueBorrowing(bookCopyId, readerId),
    onSuccess: () => invalidateCirculation(queryClient),
  });
}

export function useReturnBorrowing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, condition, notes }: { id: string; condition?: string; notes?: string }) =>
      returnBorrowing(id, condition, notes),
    onSuccess: () => invalidateCirculation(queryClient),
  });
}

export function useRenewBorrowing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => renewBorrowing(id),
    onSuccess: () => invalidateCirculation(queryClient),
  });
}

export function useReservationsList(params: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: ["circulation", "reservations", params],
    queryFn: () => listReservations(params),
  });
}

export function useFulfillReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bookCopyId }: { id: string; bookCopyId: string }) => fulfillReservation(id, bookCopyId),
    onSuccess: () => invalidateCirculation(queryClient),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelReservation(id),
    onSuccess: () => invalidateCirculation(queryClient),
  });
}

export function usePenaltiesList(params: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: ["circulation", "penalties", params],
    queryFn: () => listPenalties(params),
  });
}

export function usePayPenalty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payPenalty(id),
    onSuccess: () => invalidateCirculation(queryClient),
  });
}

export function useWaivePenalty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => waivePenalty(id, notes),
    onSuccess: () => invalidateCirculation(queryClient),
  });
}
