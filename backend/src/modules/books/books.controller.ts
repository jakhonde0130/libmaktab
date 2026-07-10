import type { Request, Response } from "express";
import { logAudit } from "@/lib/audit.js";
import { paginationSchema } from "@/lib/pagination.js";
import { AppError } from "@/middleware/errorHandler.js";
import { booksRepository } from "@/modules/books/books.repository.js";
import { booksService } from "@/modules/books/books.service.js";
import { bookListQuerySchema, type BookInput } from "@/modules/books/books.schema.js";

const ALLOWED_COVER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

  async uploadCover(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError("No file uploaded", 422, "VALIDATION_ERROR");
    }
    if (!ALLOWED_COVER_MIME_TYPES.includes(req.file.mimetype)) {
      throw new AppError("Cover must be a JPEG, PNG, or WebP image", 422, "VALIDATION_ERROR");
    }
    const data = await booksRepository.uploadCover(req.supabase!, req.params.id!, req.file);
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
