import { apiClient } from "@/lib/api-client";

export function createReservation(bookId: string) {
  return apiClient.post("/circulation/reservations", { bookId });
}
