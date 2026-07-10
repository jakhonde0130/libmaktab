import { randomInt } from "node:crypto";

/**
 * Generates a library barcode: a fixed prefix + 10 random digits.
 * Callers are responsible for retrying on a uniqueness conflict (the
 * database's unique constraint is the source of truth).
 */
export function generateBarcode(prefix: "RD" | "BK" = "RD"): string {
  const digits = Array.from({ length: 10 }, () => randomInt(0, 10)).join("");
  return `${prefix}${digits}`;
}
