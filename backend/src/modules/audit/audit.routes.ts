import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { requireAuth, requireRole } from "@/middleware/auth.js";
import { auditController } from "@/modules/audit/audit.controller.js";

export const auditRouter = Router();

auditRouter.get(
  "/",
  requireAuth,
  requireRole("director", "administrator"),
  asyncHandler(auditController.list)
);
