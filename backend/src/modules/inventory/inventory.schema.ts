import { z } from "zod";

export const scanSchema = z.object({
  auditBatchId: z.string().uuid(),
  barcode: z.string().min(1),
});

export const listLogsQuerySchema = z.object({
  auditBatchId: z.string().uuid(),
});
