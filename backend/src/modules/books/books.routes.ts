import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "@/lib/async-handler.js";
import { optionalAuth, requireAuth, requireRole } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { booksController } from "@/modules/books/books.controller.js";
import { bookInputSchema, bookUpdateSchema } from "@/modules/books/books.schema.js";

export const booksRouter = Router();

const coverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB is plenty for a cover image
});

// Reads are public (RLS: books_public_read) so the OPAC can reuse this router.
booksRouter.get("/", optionalAuth, asyncHandler(booksController.list));
booksRouter.get("/:id", optionalAuth, asyncHandler(booksController.get));

const canManageBooks = requireRole("director", "administrator", "librarian");

booksRouter.post("/", requireAuth, canManageBooks, validate(bookInputSchema), asyncHandler(booksController.create));
booksRouter.patch(
  "/:id",
  requireAuth,
  canManageBooks,
  validate(bookUpdateSchema),
  asyncHandler(booksController.update)
);
booksRouter.post(
  "/:id/cover",
  requireAuth,
  canManageBooks,
  coverUpload.single("file"),
  asyncHandler(booksController.uploadCover)
);
booksRouter.delete("/:id", requireAuth, canManageBooks, asyncHandler(booksController.remove));
