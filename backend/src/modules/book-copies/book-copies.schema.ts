import { z } from "zod";

export const copyInputSchema = z.object({
  bookId: z.string().uuid(),
  inventoryNumber: z.string().min(1).max(50),
  barcode: z.string().min(1).max(50),
  rackId: z.string().uuid().optional(),
  status: z
    .enum(["available", "issued", "reserved", "lost", "under_repair", "withdrawn", "in_transit"])
    .default("available"),
  conditionNotes: z.string().max(1000).optional(),
  price: z.number().nonnegative().optional(),
  acquisitionDate: z.string().date().optional(),
  acquisitionType: z.enum(["purchased", "donated", "exchange", "subscription"]).default("purchased"),
});
export type CopyInput = z.infer<typeof copyInputSchema>;

export const copyUpdateSchema = copyInputSchema.partial().omit({ bookId: true });

const COPY_COLUMNS: Record<string, string> = {
  bookId: "book_id",
  inventoryNumber: "inventory_number",
  barcode: "barcode",
  rackId: "rack_id",
  status: "status",
  conditionNotes: "condition_notes",
  price: "price",
  acquisitionDate: "acquisition_date",
  acquisitionType: "acquisition_type",
};

export function toCopyRow(input: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const column = COPY_COLUMNS[key];
    if (column && value !== undefined) row[column] = value;
  }
  return row;
}
