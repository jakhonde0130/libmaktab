import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { requireAuth, requireRole } from "@/middleware/auth.js";
import { reportsController } from "@/modules/reports/reports.controller.js";

export const reportsRouter = Router();

const canViewReports = requireRole("director", "administrator", "librarian");

reportsRouter.get("/summary", requireAuth, canViewReports, asyncHandler(reportsController.summary));
reportsRouter.get("/class-breakdown", requireAuth, canViewReports, asyncHandler(reportsController.classBreakdown));
reportsRouter.get("/subject-breakdown", requireAuth, canViewReports, asyncHandler(reportsController.subjectBreakdown));
reportsRouter.get("/year-breakdown", requireAuth, canViewReports, asyncHandler(reportsController.yearBreakdown));
