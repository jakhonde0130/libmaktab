import type { Request, Response } from "express";
import { settingsRepository } from "@/modules/settings/settings.repository.js";

export const settingsController = {
  async list(req: Request, res: Response) {
    const data = await settingsRepository.list(req.supabase!);
    res.json({ data });
  },

  async update(req: Request, res: Response) {
    const data = await settingsRepository.update(req.supabase!, req.params.key!, req.body.value, req.user!.id);
    res.json({ data });
  },
};
