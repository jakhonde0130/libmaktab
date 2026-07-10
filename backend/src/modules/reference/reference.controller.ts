import type { Request, Response } from "express";
import { paginationSchema } from "@/lib/pagination.js";
import { createReferenceRepository } from "@/modules/reference/reference.repository.js";
import { toDbPayload, type ReferenceResource } from "@/modules/reference/reference.schema.js";

export function createReferenceController(resource: ReferenceResource) {
  const repository = createReferenceRepository(resource);

  return {
    async list(req: Request, res: Response) {
      const pagination = paginationSchema.parse(req.query);
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const result = await repository.list(req.supabase!, pagination, search);
      res.json(result);
    },

    async get(req: Request, res: Response) {
      const data = await repository.get(req.supabase!, req.params.id!);
      res.json({ data });
    },

    async create(req: Request, res: Response) {
      const data = await repository.create(req.supabase!, toDbPayload(resource, req.body));
      res.status(201).json({ data });
    },

    async update(req: Request, res: Response) {
      const data = await repository.update(req.supabase!, req.params.id!, toDbPayload(resource, req.body));
      res.json({ data });
    },

    async remove(req: Request, res: Response) {
      await repository.remove(req.supabase!, req.params.id!);
      res.status(204).send();
    },
  };
}
