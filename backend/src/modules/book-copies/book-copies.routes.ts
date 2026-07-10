import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { optionalAuth, requireAuth, requireRole } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { bookCopiesController } from "@/modules/book-copies/book-copies.controller.js";
import { copyInputSchema, copyUpdateSchema } from "@/modules/book-copies/book-copies.schema.js";

export const bookCopiesRouter = Router();

bookCopiesRouter.get("/", optionalAuth, asyncHandler(bookCopiesController.list));
bookCopiesRouter.get("/barcode/:barcode", optionalAuth, asyncHandler(bookCopiesController.getByBarcode));
bookCopiesRouter.get("/:id", optionalAuth, asyncHandler(bookCopiesController.get));

const canManageCopies = requireRole("director", "administrator", "librarian", "operator");

bookCopiesRouter.post(
  "/",
  requireAuth,
  canManageCopies,
  validate(copyInputSchema),
  asyncHandler(bookCopiesController.create)
);
bookCopiesRouter.patch(
  "/:id",
  requireAuth,
  canManageCopies,
  validate(copyUpdateSchema),
  asyncHandler(bookCopiesController.update)
);
bookCopiesRouter.delete(
  "/:id",
  requireAuth,
  requireRole("director", "administrator", "librarian"),
  asyncHandler(bookCopiesController.remove)
);
