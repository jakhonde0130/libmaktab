import type { Request, Response } from "express";
import { logAudit } from "@/lib/audit.js";
import { AppError } from "@/middleware/errorHandler.js";
import { authRepository } from "@/modules/auth/auth.repository.js";
import { authService } from "@/modules/auth/auth.service.js";
import type { RegisterUserInput } from "@/modules/auth/auth.schema.js";
import type { AppRole } from "@/types/domain.js";

export const authController = {
  async register(req: Request, res: Response) {
    const input = req.body as RegisterUserInput;
    const profile = await authService.registerUser(input, req.user!.role as AppRole);
    await logAudit({
      actorId: req.user!.id,
      action: "create_account",
      entityTable: "users",
      entityId: profile.id,
      after: { fullName: input.fullName, role: input.role },
    });
    res.status(201).json({ data: profile });
  },

  async me(req: Request, res: Response) {
    const profile = await authRepository.getProfile(req.supabase!, req.user!.id);
    if (!profile) {
      throw new AppError("Profile not found", 404, "NOT_FOUND");
    }
    res.json({ data: profile });
  },
};
