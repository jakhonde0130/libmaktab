import { Router } from "express";
import { auditRouter } from "@/modules/audit/audit.routes.js";
import { authRouter } from "@/modules/auth/auth.routes.js";
import { bookCopiesRouter } from "@/modules/book-copies/book-copies.routes.js";
import { booksRouter } from "@/modules/books/books.routes.js";
import { circulationRouter } from "@/modules/circulation/circulation.routes.js";
import { classesRouter } from "@/modules/classes/classes.routes.js";
import { electronicLibraryRouter } from "@/modules/electronic-library/electronic-library.routes.js";
import { inventoryRouter } from "@/modules/inventory/inventory.routes.js";
import { readersRouter } from "@/modules/readers/readers.routes.js";
import { referenceRouter } from "@/modules/reference/reference.routes.js";
import { reportsRouter } from "@/modules/reports/reports.routes.js";
import { settingsRouter } from "@/modules/settings/settings.routes.js";

/**
 * Root API router. Each domain module (books, readers, circulation, ...)
 * owns its own router under src/modules/<name>/<name>.routes.ts and is
 * mounted here as it's built out (see project phases).
 */
export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.json({ name: "ILMS API", version: "v1" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/reference", referenceRouter);
apiRouter.use("/classes", classesRouter);
apiRouter.use("/books", booksRouter);
apiRouter.use("/book-copies", bookCopiesRouter);
apiRouter.use("/readers", readersRouter);
apiRouter.use("/circulation", circulationRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/electronic-library", electronicLibraryRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/audit", auditRouter);
apiRouter.use("/settings", settingsRouter);

// apiRouter.use("/notifications", notificationsRouter);
