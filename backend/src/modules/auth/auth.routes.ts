import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { requireAuth, requireRole } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { authController } from "@/modules/auth/auth.controller.js";
import { registerUserSchema } from "@/modules/auth/auth.schema.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, asyncHandler(authController.me));

authRouter.post(
  "/register",
  requireAuth,
  requireRole("director", "administrator", "librarian"),
  validate(registerUserSchema),
  asyncHandler(authController.register)
);
