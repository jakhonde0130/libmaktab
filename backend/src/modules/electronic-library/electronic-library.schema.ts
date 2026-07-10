import { z } from "zod";

export const BOOK_FILE_TYPES = ["pdf", "docx", "ppt", "audio", "video", "zip"] as const;
export type BookFileType = (typeof BOOK_FILE_TYPES)[number];

export const MIME_TYPES_BY_FILE_TYPE: Record<BookFileType, string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ppt: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  zip: ["application/zip", "application/x-zip-compressed"],
};

export const uploadFileMetaSchema = z.object({
  fileType: z.enum(BOOK_FILE_TYPES),
  isDownloadable: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
});

export const updateFileMetaSchema = z.object({
  isDownloadable: z.boolean().optional(),
});
