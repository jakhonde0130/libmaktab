import type { Request, Response } from "express";
import { classesRepository } from "@/modules/classes/classes.repository.js";
import { toClassRow } from "@/modules/classes/classes.schema.js";

export const classesController = {
  async list(req: Request, res: Response) {
    const data = await classesRepository.list(req.supabase!);
    res.json({ data });
  },
  async get(req: Request, res: Response) {
    const data = await classesRepository.get(req.supabase!, req.params.id!);
    res.json({ data });
  },
  async create(req: Request, res: Response) {
    const data = await classesRepository.create(req.supabase!, toClassRow(req.body));
    res.status(201).json({ data });
  },
  async update(req: Request, res: Response) {
    const data = await classesRepository.update(req.supabase!, req.params.id!, toClassRow(req.body));
    res.json({ data });
  },
  async remove(req: Request, res: Response) {
    await classesRepository.remove(req.supabase!, req.params.id!);
    res.status(204).send();
  },
};
