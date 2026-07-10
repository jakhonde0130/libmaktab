import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase.js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";
import { AppError } from "@/middleware/errorHandler.js";
import type { BookFileType } from "@/modules/electronic-library/electronic-library.schema.js";

const BUCKET = "book-files";
const SIGNED_URL_TTL_SECONDS = 600;

interface BookFileRow {
  id: string;
  book_id: string;
  file_type: BookFileType;
  storage_path: string;
  file_name: string;
  is_downloadable: boolean;
}

export const electronicLibraryRepository = {
  async uploadFile(
    bookId: string,
    file: Express.Multer.File,
    fileType: BookFileType,
    isDownloadable: boolean,
    uploadedBy: string
  ) {
    const storagePath = `${bookId}/${randomUUID()}-${file.originalname.replace(/[^\w.\-]/g, "_")}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      throw new AppError(`Upload failed: ${uploadError.message}`, 500, "STORAGE_ERROR");
    }

    const { data, error } = await supabaseAdmin
      .from("book_files")
      .insert({
        book_id: bookId,
        file_type: fileType,
        storage_path: storagePath,
        file_name: file.originalname,
        file_size_bytes: file.size,
        mime_type: file.mimetype,
        is_downloadable: isDownloadable,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (error) {
      await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
      throw mapSupabaseError(error);
    }
    return data;
  },

  async getFile(fileId: string): Promise<BookFileRow> {
    const { data, error } = await supabaseAdmin.from("book_files").select("*").eq("id", fileId).single();
    if (error) throw mapSupabaseError(error);
    return data as BookFileRow;
  },

  async getViewUrl(fileId: string) {
    const file = await this.getFile(fileId);
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, SIGNED_URL_TTL_SECONDS);
    if (error) throw new AppError(error.message, 500, "STORAGE_ERROR");
    return { url: data.signedUrl, fileName: file.file_name };
  },

  async getDownloadUrl(fileId: string, isStaff: boolean) {
    const file = await this.getFile(fileId);
    if (!file.is_downloadable && !isStaff) {
      throw new AppError("Downloading this file is disabled", 403, "DOWNLOAD_DISABLED");
    }
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, SIGNED_URL_TTL_SECONDS, { download: file.file_name });
    if (error) throw new AppError(error.message, 500, "STORAGE_ERROR");
    return { url: data.signedUrl, fileName: file.file_name };
  },

  async updateFile(fileId: string, isDownloadable: boolean) {
    const { data, error } = await supabaseAdmin
      .from("book_files")
      .update({ is_downloadable: isDownloadable })
      .eq("id", fileId)
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async deleteFile(fileId: string) {
    const file = await this.getFile(fileId);
    await supabaseAdmin.storage.from(BUCKET).remove([file.storage_path]);
    const { error } = await supabaseAdmin.from("book_files").delete().eq("id", fileId);
    if (error) throw mapSupabaseError(error);
  },
};
