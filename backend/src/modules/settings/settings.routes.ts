import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { requireAuth, requireRole } from "@/middleware/auth.js";
import { settingsController } from "@/modules/settings/settings.controller.js";

export const settingsRouter = Router();

const isStaff = requireRole("director", "administrator", "librarian", "operator");

settingsRouter.get("/", requireAuth, isStaff, asyncHandler(settingsController.list));
settingsRouter.patch(
  "/:key",
  requireAuth,
  requireRole("director", "administrator"),
  asyncHandler(settingsController.update)
);
