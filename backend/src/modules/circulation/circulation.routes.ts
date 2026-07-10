import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { requireAuth, requireRole } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { circulationController } from "@/modules/circulation/circulation.controller.js";
import {
  createReservationSchema,
  fulfillReservationSchema,
  issueBorrowingSchema,
  renewBorrowingSchema,
  returnBorrowingSchema,
  waivePenaltySchema,
} from "@/modules/circulation/circulation.schema.js";

export const circulationRouter = Router();

const isDeskStaff = requireRole("director", "administrator", "librarian", "operator");

// --- borrowings ---
circulationRouter.get("/borrowings", requireAuth, asyncHandler(circulationController.listBorrowings));
circulationRouter.get("/borrowings/:id", requireAuth, asyncHandler(circulationController.getBorrowing));
circulationRouter.post(
  "/borrowings",
  requireAuth,
  isDeskStaff,
  validate(issueBorrowingSchema),
  asyncHandler(circulationController.issue)
);
circulationRouter.post(
  "/borrowings/:id/return",
  requireAuth,
  isDeskStaff,
  validate(returnBorrowingSchema),
  asyncHandler(circulationController.return_)
);
circulationRouter.post(
  "/borrowings/:id/renew",
  requireAuth,
  isDeskStaff,
  validate(renewBorrowingSchema),
  asyncHandler(circulationController.renew)
);

// --- reservations ---
circulationRouter.get("/reservations", requireAuth, asyncHandler(circulationController.listReservations));
circulationRouter.post(
  "/reservations",
  requireAuth,
  validate(createReservationSchema),
  asyncHandler(circulationController.createReservation)
);
circulationRouter.post(
  "/reservations/:id/fulfill",
  requireAuth,
  isDeskStaff,
  validate(fulfillReservationSchema),
  asyncHandler(circulationController.fulfillReservation)
);
circulationRouter.post(
  "/reservations/:id/cancel",
  requireAuth,
  asyncHandler(circulationController.cancelReservation)
);

// --- penalties ---
circulationRouter.get("/penalties", requireAuth, asyncHandler(circulationController.listPenalties));
circulationRouter.post("/penalties/:id/pay", requireAuth, isDeskStaff, asyncHandler(circulationController.payPenalty));
circulationRouter.post(
  "/penalties/:id/waive",
  requireAuth,
  isDeskStaff,
  validate(waivePenaltySchema),
  asyncHandler(circulationController.waivePenalty)
);
