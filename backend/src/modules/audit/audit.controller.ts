import type { Request, Response } from "express";
import { paginationSchema } from "@/lib/pagination.js";
import { auditRepository } from "@/modules/audit/audit.repository.js";

export const auditController = {
  async list(req: Request, res: Response) {
    const pagination = paginationSchema.parse(req.query);
    const filters = {
      entityTable: typeof req.query.entityTable === "string" ? req.query.entityTable : undefined,
      actorId: typeof req.query.actorId === "string" ? req.query.actorId : undefined,
    };
    const result = await auditRepository.list(req.supabase!, pagination, filters);
    res.json(result);
  },
};
