import { z } from "zod";

export const classInputSchema = z.object({
  gradeNumber: z.number().int().min(1).max(11),
  section: z.string().min(1).max(5),
  homeroomTeacherId: z.string().uuid().optional(),
  academicYear: z.string().max(20).optional(),
});
export type ClassInput = z.infer<typeof classInputSchema>;

export const classUpdateSchema = classInputSchema.partial();

const CLASS_COLUMNS: Record<string, string> = {
  gradeNumber: "grade_number",
  section: "section",
  homeroomTeacherId: "homeroom_teacher_id",
  academicYear: "academic_year",
};

export function toClassRow(input: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const column = CLASS_COLUMNS[key];
    if (column && value !== undefined) row[column] = value;
  }
  return row;
}
