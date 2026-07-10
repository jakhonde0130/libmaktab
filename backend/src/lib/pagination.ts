import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/** Inclusive [from, to] range for Supabase's `.range()`, derived from page/pageSize. */
export function toRange({ page, pageSize }: PaginationInput): [number, number] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function buildPageMeta(pagination: PaginationInput, total: number): PageMeta {
  return {
    ...pagination,
    total,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}
