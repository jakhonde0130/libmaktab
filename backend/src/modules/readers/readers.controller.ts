import type { Request, Response } from "express";
import { logAudit } from "@/lib/audit.js";
import { paginationSchema } from "@/lib/pagination.js";
import { readersRepository } from "@/modules/readers/readers.repository.js";
import { readerListQuerySchema, toReaderRow } from "@/modules/readers/readers.schema.js";

export const readersController = {
  async list(req: Request, res: Response) {
    const pagination = paginationSchema.parse(req.query);
    const filters = readerListQuerySchema.parse(req.query);
    const result = await readersRepository.list(req.supabase!, pagination, filters);
    res.json(result);
  },

  async get(req: Request, res: Response) {
    const data = await readersRepository.get(req.supabase!, req.params.id!);
    res.json({ data });
  },

  async update(req: Request, res: Response) {
    const data = await readersRepository.update(req.supabase!, req.params.id!, toReaderRow(req.body));
    res.json({ data });
  },

  async setStatus(req: Request, res: Response) {
    const data = await readersRepository.update(req.supabase!, req.params.id!, { status: req.body.status });
    await logAudit({
      actorId: req.user!.id,
      action: "update_status",
      entityTable: "users",
      entityId: req.params.id,
      after: { status: req.body.status },
    });
    res.json({ data });
  },

  async setRole(req: Request, res: Response) {
    const data = await readersRepository.update(req.supabase!, req.params.id!, { role: req.body.role });
    await logAudit({
      actorId: req.user!.id,
      action: "update_role",
      entityTable: "users",
      entityId: req.params.id,
      after: { role: req.body.role },
    });
    res.json({ data });
  },
};
