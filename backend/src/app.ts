import { createRequire } from "node:module";
import compression from "compression";
import cors from "cors";
import express from "express";
import { pinoHttp } from "pino-http";
import { env } from "@/config/env.js";
import { logger } from "@/lib/logger.js";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler.js";
import { apiRouter } from "@/routes.js";

// helmet/express-rate-limit are CJS packages whose `export =` default export
// TypeScript's NodeNext module resolution can resolve inconsistently across
// npm vs pnpm node_modules layouts (works locally, breaks on some CI/deploy
// hosts with "not callable" errors). require() + a minimal explicit type
// (rather than deriving the type from the package's own declarations, which
// is what triggers the inconsistency) sidesteps it entirely.
const require = createRequire(import.meta.url);
const helmet = require("helmet") as (options?: Record<string, unknown>) => express.RequestHandler;
const rateLimit = require("express-rate-limit") as (
  options?: Record<string, unknown>
) => express.RequestHandler;

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
