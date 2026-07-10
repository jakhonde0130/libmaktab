import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { requireAuth, requireRole } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { inventoryController } from "@/modules/inventory/inventory.controller.js";
import { listLogsQuerySchema, scanSchema } from "@/modules/inventory/inventory.schema.js";

export const inventoryRouter = Router();

const isStaff = requireRole("director", "administrator", "librarian");

inventoryRouter.post("/scan", requireAuth, isStaff, validate(scanSchema), asyncHandler(inventoryController.scan));
inventoryRouter.get(
  "/logs",
  requireAuth,
  isStaff,
  validate(listLogsQuerySchema, "query"),
  asyncHandler(inventoryController.logs)
);
inventoryRouter.get(
  "/missing",
  requireAuth,
  isStaff,
  validate(listLogsQuerySchema, "query"),
  asyncHandler(inventoryController.missing)
);
