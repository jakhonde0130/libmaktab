import type { NextFunction, Request, Response } from "express";
import { createRequestClient, supabaseAdmin, supabaseAnon } from "@/lib/supabase.js";
import { AppError } from "@/middleware/errorHandler.js";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      supabase?: ReturnType<typeof createRequestClient>;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

async function resolveUser(token: string): Promise<AuthenticatedUser> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new AppError("Invalid or expired session", 401, "UNAUTHENTICATED");
  }
  const role = (data.user.app_metadata?.role as string | undefined) ?? "reader";
  return { id: data.user.id, email: data.user.email ?? null, role };
}

/**
 * Verifies the caller's Supabase JWT and attaches both the resolved user
 * and a request-scoped Supabase client (so downstream handlers query
 * through the user's own RLS context, never the service role).
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError("Missing bearer token", 401, "UNAUTHENTICATED");
    }
    req.user = await resolveUser(token);
    req.supabase = createRequestClient(token);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Resolves the caller if a valid token is present, but doesn't reject the
 * request otherwise. req.supabase always ends up set — either RLS-scoped to
 * the caller, or the shared anon client — so public routes (OPAC, reference
 * data) can use a single client without branching on auth state.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      req.supabase = supabaseAnon;
      next();
      return;
    }
    req.user = await resolveUser(token);
    req.supabase = createRequestClient(token);
    next();
  } catch (err) {
    next(err);
  }
}

/** Restricts a route to one or more roles (see roles table in Phase 2 schema). */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError("Missing bearer token", 401, "UNAUTHENTICATED"));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("Insufficient permissions for this action", 403, "FORBIDDEN"));
      return;
    }
    next();
  };
}
