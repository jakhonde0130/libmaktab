import type { Request, Response } from "express";
import { inventoryRepository } from "@/modules/inventory/inventory.repository.js";

export const inventoryController = {
  async scan(req: Request, res: Response) {
    const { auditBatchId, barcode } = req.body;
    const copy = await inventoryRepository.findCopyByBarcode(req.supabase!, barcode);

    const result = copy ? "found" : "misplaced";
    const row = await inventoryRepository.recordScan(req.supabase!, {
      audit_batch_id: auditBatchId,
      book_copy_id: copy?.id ?? null,
      scanned_barcode: barcode,
      scanned_by: req.user!.id,
      expected_rack_id: copy?.rack_id ?? null,
      found_rack_id: copy?.rack_id ?? null,
      result,
    });

    res.status(201).json({ data: { ...row, copy } });
  },

  async logs(req: Request, res: Response) {
    const data = await inventoryRepository.listLogs(req.supabase!, req.query.auditBatchId as string);
    res.json({ data });
  },

  async missing(req: Request, res: Response) {
    const data = await inventoryRepository.listMissing(req.supabase!, req.query.auditBatchId as string);
    res.json({ data });
  },
};
