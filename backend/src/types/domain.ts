// Mirrors the Postgres enums defined in supabase/migrations. Regenerate
// frontend/src/types/database.ts + backend/src/types/database.ts with
// `supabase gen types typescript` once the project is CLI-linked, and these
// can be replaced with the generated Enums<'...'> equivalents.

export type AppRole = "director" | "administrator" | "librarian" | "operator" | "teacher" | "reader";

export type ReaderCategory = "student" | "teacher" | "staff" | "external";

export type AccountStatus = "active" | "blocked";

export interface UserProfile {
  id: string;
  full_name: string;
  pinfl: string | null;
  phone: string | null;
  email: string | null;
  class_id: string | null;
  reader_category: ReaderCategory;
  role: AppRole;
  photo_url: string | null;
  library_card_barcode: string;
  qr_code_url: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}
