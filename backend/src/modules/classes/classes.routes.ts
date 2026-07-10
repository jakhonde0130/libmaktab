import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { optionalAuth, requireAuth, requireRole } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { classesController } from "@/modules/classes/classes.controller.js";
import { classInputSchema, classUpdateSchema } from "@/modules/classes/classes.schema.js";

export const classesRouter = Router();

classesRouter.get("/", optionalAuth, asyncHandler(classesController.list));
classesRouter.get("/:id", optionalAuth, asyncHandler(classesController.get));

const canManageClasses = requireRole("director", "administrator", "librarian");

classesRouter.post(
  "/",
  requireAuth,
  canManageClasses,
  validate(classInputSchema),
  asyncHandler(classesController.create)
);
classesRouter.patch(
  "/:id",
  requireAuth,
  canManageClasses,
  validate(classUpdateSchema),
  asyncHandler(classesController.update)
);
classesRouter.delete("/:id", requireAuth, canManageClasses, asyncHandler(classesController.remove));
