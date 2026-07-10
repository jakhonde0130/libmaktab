import { z } from "zod";

export const readerListQuerySchema = z.object({
  search: z.string().max(200).optional(),
  classId: z.string().uuid().optional(),
  readerCategory: z.enum(["student", "teacher", "staff", "external"]).optional(),
  role: z.enum(["director", "administrator", "librarian", "operator", "teacher", "reader"]).optional(),
  status: z.enum(["active", "blocked"]).optional(),
});
export type ReaderListQuery = z.infer<typeof readerListQuerySchema>;

export const readerUpdateSchema = z.object({
  fullName: z.string().min(2).max(200).optional(),
  phone: z.string().max(30).optional(),
  pinfl: z.string().length(14).optional(),
  classId: z.string().uuid().nullable().optional(),
  readerCategory: z.enum(["student", "teacher", "staff", "external"]).optional(),
  photoUrl: z.string().url().nullable().optional(),
});
export type ReaderUpdateInput = z.infer<typeof readerUpdateSchema>;

export const readerStatusSchema = z.object({ status: z.enum(["active", "blocked"]) });
export const readerRoleSchema = z.object({
  role: z.enum(["director", "administrator", "librarian", "operator", "teacher", "reader"]),
});

const READER_COLUMNS: Record<string, string> = {
  fullName: "full_name",
  phone: "phone",
  pinfl: "pinfl",
  classId: "class_id",
  readerCategory: "reader_category",
  photoUrl: "photo_url",
};

export function toReaderRow(input: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const column = READER_COLUMNS[key];
    if (column && value !== undefined) row[column] = value;
  }
  return row;
}
