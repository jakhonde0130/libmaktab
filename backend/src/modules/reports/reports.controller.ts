import type { Request, Response } from "express";
import { reportsRepository } from "@/modules/reports/reports.repository.js";

export const reportsController = {
  async summary(req: Request, res: Response) {
    const data = await reportsRepository.getSummary(req.supabase!);
    res.json({ data });
  },
  async classBreakdown(req: Request, res: Response) {
    const data = await reportsRepository.getClassBreakdown(req.supabase!);
    res.json({ data });
  },
  async subjectBreakdown(req: Request, res: Response) {
    const data = await reportsRepository.getSubjectBreakdown(req.supabase!);
    res.json({ data });
  },
  async yearBreakdown(req: Request, res: Response) {
    const data = await reportsRepository.getYearBreakdown(req.supabase!);
    res.json({ data });
  },
};
