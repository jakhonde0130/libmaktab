import { z } from "zod";

export const bookInputSchema = z.object({
  isbn: z.string().max(30).optional(),
  udk: z.string().max(50).optional(),
  bbk: z.string().max(50).optional(),
  title: z.string().min(1).max(500),
  originalTitle: z.string().max(500).optional(),
  publisherId: z.string().uuid().optional(),
  publicationPlace: z.string().max(200).optional(),
  publicationYear: z.number().int().min(1400).max(2100).optional(),
  languageId: z.string().uuid().optional(),
  pageCount: z.number().int().positive().optional(),
  volume: z.string().max(50).optional(),
  edition: z.string().max(50).optional(),
  series: z.string().max(200).optional(),
  annotation: z.string().max(5000).optional(),
  categoryId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  minGrade: z.number().int().min(1).max(11).optional(),
  maxGrade: z.number().int().min(1).max(11).optional(),
  coverImageUrl: z.string().url().optional(),
  downloadEnabled: z.boolean().default(true),
  authorIds: z.array(z.string().uuid()).max(20).default([]),
  keywords: z.array(z.string().min(1).max(100)).max(30).default([]),
});
export type BookInput = z.infer<typeof bookInputSchema>;

export const bookUpdateSchema = bookInputSchema.partial();

export const bookListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  isbn: z.string().max(30).optional(),
  udk: z.string().max(50).optional(),
  bbk: z.string().max(50).optional(),
  author: z.string().max(200).optional(),
  keyword: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  languageId: z.string().uuid().optional(),
  grade: z.coerce.number().int().min(1).max(11).optional(),
  publisherId: z.string().uuid().optional(),
  year: z.coerce.number().int().optional(),
  barcode: z.string().max(50).optional(),
  inventoryNumber: z.string().max(50).optional(),
  hasElectronicCopy: z.coerce.boolean().optional(),
});
export type BookListQuery = z.infer<typeof bookListQuerySchema>;

const BOOK_SCALAR_COLUMNS: Record<string, string> = {
  isbn: "isbn",
  udk: "udk",
  bbk: "bbk",
  title: "title",
  originalTitle: "original_title",
  publisherId: "publisher_id",
  publicationPlace: "publication_place",
  publicationYear: "publication_year",
  languageId: "language_id",
  pageCount: "page_count",
  volume: "volume",
  edition: "edition",
  series: "series",
  annotation: "annotation",
  categoryId: "category_id",
  subjectId: "subject_id",
  minGrade: "min_grade",
  maxGrade: "max_grade",
  coverImageUrl: "cover_image_url",
  downloadEnabled: "download_enabled",
};

/** Strips authorIds/keywords (handled separately as relations) and maps to snake_case DB columns. */
export function toBookRow(input: Partial<BookInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const column = BOOK_SCALAR_COLUMNS[key];
    if (column && value !== undefined) {
      row[column] = value;
    }
  }
  return row;
}
