import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { requireAuth, requireRole } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { readersController } from "@/modules/readers/readers.controller.js";
import { readerRoleSchema, readerStatusSchema, readerUpdateSchema } from "@/modules/readers/readers.schema.js";

export const readersRouter = Router();

// Reader directory is staff-only (RLS also enforces: readers can only read their own row).
const isStaff = requireRole("director", "administrator", "librarian", "operator");

readersRouter.get("/", requireAuth, isStaff, asyncHandler(readersController.list));
readersRouter.get("/:id", requireAuth, asyncHandler(readersController.get));
readersRouter.patch(
  "/:id",
  requireAuth,
  isStaff,
  validate(readerUpdateSchema),
  asyncHandler(readersController.update)
);
readersRouter.patch(
  "/:id/status",
  requireAuth,
  isStaff,
  validate(readerStatusSchema),
  asyncHandler(readersController.setStatus)
);
readersRouter.patch(
  "/:id/role",
  requireAuth,
  requireRole("director", "administrator"),
  validate(readerRoleSchema),
  asyncHandler(readersController.setRole)
);
