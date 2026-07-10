import type { Request, Response } from "express";
import { AppError } from "@/middleware/errorHandler.js";
import { electronicLibraryRepository } from "@/modules/electronic-library/electronic-library.repository.js";
import {
  MIME_TYPES_BY_FILE_TYPE,
  uploadFileMetaSchema,
  updateFileMetaSchema,
} from "@/modules/electronic-library/electronic-library.schema.js";

export const electronicLibraryController = {
  async upload(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError("No file uploaded", 422, "VALIDATION_ERROR");
    }
    const { fileType, isDownloadable } = uploadFileMetaSchema.parse(req.body);

    if (!MIME_TYPES_BY_FILE_TYPE[fileType].includes(req.file.mimetype)) {
      throw new AppError(
        `File content (${req.file.mimetype}) doesn't match declared type '${fileType}'`,
        422,
        "VALIDATION_ERROR"
      );
    }

    const data = await electronicLibraryRepository.uploadFile(
      req.params.bookId!,
      req.file,
      fileType,
      isDownloadable,
      req.user!.id
    );
    res.status(201).json({ data });
  },

  async viewUrl(req: Request, res: Response) {
    const data = await electronicLibraryRepository.getViewUrl(req.params.fileId!);
    res.json({ data });
  },

  async downloadUrl(req: Request, res: Response) {
    const isStaff = ["director", "administrator", "librarian", "operator"].includes(req.user!.role);
    const data = await electronicLibraryRepository.getDownloadUrl(req.params.fileId!, isStaff);
    res.json({ data });
  },

  async update(req: Request, res: Response) {
    const { isDownloadable } = updateFileMetaSchema.parse(req.body);
    const data = await electronicLibraryRepository.updateFile(req.params.fileId!, isDownloadable ?? true);
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    await electronicLibraryRepository.deleteFile(req.params.fileId!);
    res.status(204).send();
  },
};
