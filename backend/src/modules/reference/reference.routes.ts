import { Router } from "express";
import { asyncHandler } from "@/lib/async-handler.js";
import { optionalAuth, requireAuth } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { createReferenceController } from "@/modules/reference/reference.controller.js";
import { referenceSchemas, type ReferenceResource } from "@/modules/reference/reference.schema.js";

export const referenceRouter = Router();

const RESOURCES = Object.keys(referenceSchemas) as ReferenceResource[];

for (const resource of RESOURCES) {
  const controller = createReferenceController(resource);
  const schema = referenceSchemas[resource];
  const router = Router();

  // Public read (RLS: public_read policy) — resolves the caller if present
  // but doesn't require it, so req.supabase is always set.
  router.get("/", optionalAuth, asyncHandler(controller.list));
  router.get("/:id", optionalAuth, asyncHandler(controller.get));

  // Writes require a session; RLS (staff_write/update/delete policies)
  // decides whether that session's role is actually allowed to write.
  router.post("/", requireAuth, validate(schema), asyncHandler(controller.create));
  router.patch("/:id", requireAuth, validate(schema.partial()), asyncHandler(controller.update));
  router.delete("/:id", requireAuth, asyncHandler(controller.remove));

  referenceRouter.use(`/${resource}`, router);
}
