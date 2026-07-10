import { z } from "zod";

export const issueBorrowingSchema = z.object({
  bookCopyId: z.string().uuid(),
  readerId: z.string().uuid(),
  dueDate: z.string().date().optional(),
});
export type IssueBorrowingInput = z.infer<typeof issueBorrowingSchema>;

export const returnBorrowingSchema = z.object({
  condition: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const renewBorrowingSchema = z.object({
  extraDays: z.number().int().positive().max(90).optional(),
});

export const borrowingListQuerySchema = z.object({
  readerId: z.string().uuid().optional(),
  bookCopyId: z.string().uuid().optional(),
  status: z.enum(["active", "returned", "overdue"]).optional(),
});

export const createReservationSchema = z.object({
  bookId: z.string().uuid(),
  readerId: z.string().uuid().optional(),
});

export const fulfillReservationSchema = z.object({
  bookCopyId: z.string().uuid(),
});

export const reservationListQuerySchema = z.object({
  bookId: z.string().uuid().optional(),
  readerId: z.string().uuid().optional(),
  status: z.enum(["pending", "ready", "fulfilled", "cancelled", "expired"]).optional(),
});

export const waivePenaltySchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const penaltyListQuerySchema = z.object({
  readerId: z.string().uuid().optional(),
  status: z.enum(["unpaid", "paid", "waived"]).optional(),
});
