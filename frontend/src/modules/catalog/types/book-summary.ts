export interface BookSummary {
  id: string;
  isbn: string | null;
  udk: string | null;
  bbk: string | null;
  title: string;
  original_title: string | null;
  publication_year: number | null;
  cover_image_url: string | null;
  has_electronic_copy: boolean;
  has_pdf: boolean;
  download_enabled: boolean;
  annotation: string | null;
  publisher: { id: string; name: string } | null;
  language: { id: string; code: string; name: string } | null;
  category: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
  min_grade: number | null;
  max_grade: number | null;
  book_copies: { count: number }[];
}

export interface BookAuthorLink {
  author_role: string;
  sort_order: number;
  author: { id: string; full_name: string; original_name: string | null };
}

export interface BookCopyDetail {
  id: string;
  inventory_number: string;
  barcode: string;
  status: "available" | "issued" | "reserved" | "lost" | "under_repair" | "withdrawn" | "in_transit";
  price: number | null;
  acquisition_date: string | null;
  acquisition_type: string;
  rack: {
    id: string;
    name: string;
    shelf: { id: string; name: string; location: { id: string; name: string } };
  } | null;
}

export interface BookFileSummary {
  id: string;
  file_type: "pdf" | "docx" | "ppt" | "audio" | "video" | "zip";
  file_name: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  is_downloadable: boolean;
  created_at: string;
}

export type BookDetail = Omit<BookSummary, "book_copies"> & {
  page_count: number | null;
  volume: string | null;
  edition: string | null;
  series: string | null;
  book_authors: BookAuthorLink[];
  book_keywords: { keyword: { id: string; name: string } }[];
  book_images: { id: string; storage_path: string; is_primary: boolean; sort_order: number }[];
  book_files: BookFileSummary[];
  book_copies: BookCopyDetail[];
};
