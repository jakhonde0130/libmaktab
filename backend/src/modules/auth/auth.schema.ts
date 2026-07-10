import { z } from "zod";

export const registerUserSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().max(30).optional(),
  pinfl: z.string().length(14).optional(),
  classId: z.string().uuid().optional(),
  readerCategory: z.enum(["student", "teacher", "staff", "external"]).default("external"),
  role: z.enum(["director", "administrator", "librarian", "operator", "teacher", "reader"]).default("reader"),
  photoUrl: z.string().url().optional(),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
