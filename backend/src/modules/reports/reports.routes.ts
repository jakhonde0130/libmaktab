import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { requireAuth, requireRole } from "@/middleware/auth.js";
import { reportsController } from "@/modules/reports/reports.controller.js";

export const reportsRouter = Router();

const canViewReports = requireRole("director", "administrator", "librarian");
// Front-desk operators land on the same staff Dashboard (see frontend
// HomePage routing) and need today's issue/return/overdue counts, but not
// the deeper breakdown reports (those stay behind the "Reports" nav item,
// which operators don't see).
const canViewSummary = requireRole("director", "administrator", "librarian", "operator");

reportsRouter.get("/summary", requireAuth, canViewSummary, asyncHandler(reportsController.summary));
reportsRouter.get("/class-breakdown", requireAuth, canViewReports, asyncHandler(reportsController.classBreakdown));
reportsRouter.get("/subject-breakdown", requireAuth, canViewReports, asyncHandler(reportsController.subjectBreakdown));
reportsRouter.get("/year-breakdown", requireAuth, canViewReports, asyncHandler(reportsController.yearBreakdown));
