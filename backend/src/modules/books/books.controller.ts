import type { Request, Response } from "express";
import { logAudit } from "@/lib/audit.js";
import { paginationSchema } from "@/lib/pagination.js";
import { booksRepository } from "@/modules/books/books.repository.js";
import { booksService } from "@/modules/books/books.service.js";
import { bookListQuerySchema, type BookInput } from "@/modules/books/books.schema.js";

export const booksController = {
  async list(req: Request, res: Response) {
    const pagination = paginationSchema.parse(req.query);
    const filters = bookListQuerySchema.parse(req.query);
    const result = await booksRepository.list(req.supabase!, pagination, filters);
    res.json(result);
  },

  async get(req: Request, res: Response) {
    const data = await booksRepository.get(req.supabase!, req.params.id!);
    res.json({ data });
  },

  async create(req: Request, res: Response) {
    const data = await booksService.createBook(req.supabase!, req.body as BookInput, req.user!.id);
    res.status(201).json({ data });
  },

  async update(req: Request, res: Response) {
    const data = await booksService.updateBook(req.supabase!, req.params.id!, req.body as Partial<BookInput>);
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    await booksRepository.remove(req.supabase!, req.params.id!);
    await logAudit({
      actorId: req.user!.id,
      action: "delete",
      entityTable: "books",
      entityId: req.params.id,
    });
    res.status(204).send();
  },
};
