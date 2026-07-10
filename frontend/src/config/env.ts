import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url({ message: "VITE_SUPABASE_URL must be set (see .env.example)" }),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY is required"),
  VITE_API_URL: z.string().url().default("http://localhost:4000/api/v1"),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed. Copy frontend/.env.example to frontend/.env.local and fill it in.");
}

export const env = parsed.data;
