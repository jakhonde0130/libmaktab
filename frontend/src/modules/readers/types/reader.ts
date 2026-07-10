export type ReaderCategory = "student" | "teacher" | "staff" | "external";
export type AppRole = "director" | "administrator" | "librarian" | "operator" | "teacher" | "reader";
export type AccountStatus = "active" | "blocked";

export interface Reader {
  id: string;
  full_name: string;
  pinfl: string | null;
  phone: string | null;
  email: string | null;
  reader_category: ReaderCategory;
  role: AppRole;
  photo_url: string | null;
  library_card_barcode: string;
  qr_code_url: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
  class: { id: string; grade_number: number; section: string; name: string } | null;
}

export interface ReaderFormValues {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  pinfl?: string;
  classId?: string;
  readerCategory: ReaderCategory;
}

export interface ReaderUpdateValues {
  fullName?: string;
  phone?: string;
  pinfl?: string;
  classId?: string | null;
  readerCategory?: ReaderCategory;
}
