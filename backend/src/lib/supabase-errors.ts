import { AppError } from "@/middleware/errorHandler.js";

interface PostgrestLikeError {
  code?: string;
  message: string;
}

/**
 * Translates common Postgres/PostgREST error codes into the right HTTP
 * status. Every repository funnels its Supabase errors through this so
 * controllers never have to guess what a raw DB error means.
 */
export function mapSupabaseError(error: PostgrestLikeError): AppError {
  switch (error.code) {
    case "23505":
      return new AppError("A record with this value already exists", 409, "CONFLICT");
    case "23503":
      return new AppError("This action conflicts with a related record", 409, "CONFLICT");
    case "23514":
      return new AppError("Value violates a database constraint", 422, "VALIDATION_ERROR");
    case "42501":
      return new AppError("You don't have permission to perform this action", 403, "FORBIDDEN");
    case "PGRST116":
      return new AppError("Record not found", 404, "NOT_FOUND");
    case "P0001":
      // Custom `raise exception` from a Postgres function (e.g. issue_book_copy,
      // return_book_copy) — the message is already meant for the end user.
      return new AppError(error.message, 400, "BUSINESS_RULE_VIOLATION");
    default:
      return new AppError(error.message, 500, "DATABASE_ERROR");
  }
}
