import type { Request, Response } from "express";
import { paginationSchema } from "@/lib/pagination.js";
import { bookCopiesRepository } from "@/modules/book-copies/book-copies.repository.js";
import { toCopyRow } from "@/modules/book-copies/book-copies.schema.js";

export const bookCopiesController = {
  async list(req: Request, res: Response) {
    const pagination = paginationSchema.parse(req.query);
    const filters = {
      bookId: typeof req.query.bookId === "string" ? req.query.bookId : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    };
    const result = await bookCopiesRepository.list(req.supabase!, pagination, filters);
    res.json(result);
  },

  async get(req: Request, res: Response) {
    const data = await bookCopiesRepository.get(req.supabase!, req.params.id!);
    res.json({ data });
  },

  async getByBarcode(req: Request, res: Response) {
    const data = await bookCopiesRepository.getByBarcode(req.supabase!, req.params.barcode!);
    res.json({ data });
  },

  async create(req: Request, res: Response) {
    const data = await bookCopiesRepository.create(req.supabase!, toCopyRow(req.body));
    res.status(201).json({ data });
  },

  async update(req: Request, res: Response) {
    const data = await bookCopiesRepository.update(req.supabase!, req.params.id!, toCopyRow(req.body));
    res.json({ data });
  },

  async remove(req: Request, res: Response) {
    await bookCopiesRepository.remove(req.supabase!, req.params.id!);
    res.status(204).send();
  },
};
