import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "@/lib/async-handler.js";
import { requireAuth, requireRole } from "@/middleware/auth.js";
import { electronicLibraryController } from "@/modules/electronic-library/electronic-library.controller.js";

export const electronicLibraryRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB ceiling (video/audio)
});

const canManageFiles = requireRole("director", "administrator", "librarian");

electronicLibraryRouter.post(
  "/books/:bookId/files",
  requireAuth,
  canManageFiles,
  upload.single("file"),
  asyncHandler(electronicLibraryController.upload)
);

electronicLibraryRouter.get("/files/:fileId/view-url", requireAuth, asyncHandler(electronicLibraryController.viewUrl));
electronicLibraryRouter.get(
  "/files/:fileId/download-url",
  requireAuth,
  asyncHandler(electronicLibraryController.downloadUrl)
);
electronicLibraryRouter.patch(
  "/files/:fileId",
  requireAuth,
  canManageFiles,
  asyncHandler(electronicLibraryController.update)
);
electronicLibraryRouter.delete(
  "/files/:fileId",
  requireAuth,
  canManageFiles,
  asyncHandler(electronicLibraryController.remove)
);
