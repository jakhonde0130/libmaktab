import type { Request, Response } from "express";
import { AppError } from "@/middleware/errorHandler.js";
import { paginationSchema } from "@/lib/pagination.js";
import { circulationRepository } from "@/modules/circulation/circulation.repository.js";
import { circulationService } from "@/modules/circulation/circulation.service.js";
import {
  borrowingListQuerySchema,
  penaltyListQuerySchema,
  reservationListQuerySchema,
} from "@/modules/circulation/circulation.schema.js";

export const circulationController = {
  async issue(req: Request, res: Response) {
    const { bookCopyId, readerId, dueDate } = req.body;
    const data = await circulationService.issue(req.supabase!, bookCopyId, readerId, req.user!.id, dueDate);
    res.status(201).json({ data });
  },

  async return_(req: Request, res: Response) {
    const { condition, notes } = req.body;
    const data = await circulationRepository.return_(req.supabase!, req.params.id!, req.user!.id, condition, notes);
    res.json({ data });
  },

  async renew(req: Request, res: Response) {
    const data = await circulationRepository.renew(req.supabase!, req.params.id!, req.body.extraDays);
    res.json({ data });
  },

  async listBorrowings(req: Request, res: Response) {
    const pagination = paginationSchema.parse(req.query);
    const filters = borrowingListQuerySchema.parse(req.query);
    // Readers may only see their own loans; staff can see everyone's (RLS also enforces this).
    if (req.user!.role === "reader") filters.readerId = req.user!.id;
    const result = await circulationRepository.listBorrowings(req.supabase!, pagination, filters);
    res.json(result);
  },

  async getBorrowing(req: Request, res: Response) {
    const data = await circulationRepository.getBorrowing(req.supabase!, req.params.id!);
    res.json({ data });
  },

  async createReservation(req: Request, res: Response) {
    const readerId = req.user!.role === "reader" ? req.user!.id : req.body.readerId;
    if (!readerId) {
      throw new AppError("readerId is required", 422, "VALIDATION_ERROR");
    }
    const data = await circulationRepository.createReservation(req.supabase!, req.body.bookId, readerId);
    res.status(201).json({ data });
  },

  async fulfillReservation(req: Request, res: Response) {
    const data = await circulationRepository.fulfillReservation(req.supabase!, req.params.id!, req.body.bookCopyId);
    res.json({ data });
  },

  async cancelReservation(req: Request, res: Response) {
    const data = await circulationRepository.cancelReservation(req.supabase!, req.params.id!);
    res.json({ data });
  },

  async listReservations(req: Request, res: Response) {
    const pagination = paginationSchema.parse(req.query);
    const filters = reservationListQuerySchema.parse(req.query);
    if (req.user!.role === "reader") filters.readerId = req.user!.id;
    const result = await circulationRepository.listReservations(req.supabase!, pagination, filters);
    res.json(result);
  },

  async listPenalties(req: Request, res: Response) {
    const pagination = paginationSchema.parse(req.query);
    const filters = penaltyListQuerySchema.parse(req.query);
    if (req.user!.role === "reader") filters.readerId = req.user!.id;
    const result = await circulationRepository.listPenalties(req.supabase!, pagination, filters);
    res.json(result);
  },

  async payPenalty(req: Request, res: Response) {
    const data = await circulationRepository.payPenalty(req.supabase!, req.params.id!);
    res.json({ data });
  },

  async waivePenalty(req: Request, res: Response) {
    const data = await circulationRepository.waivePenalty(req.supabase!, req.params.id!, req.user!.id, req.body.notes);
    res.json({ data });
  },
};
