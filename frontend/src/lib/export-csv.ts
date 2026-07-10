/**
 * Lightweight client-side CSV export (no extra dependency). Used for quick
 * "Export" actions on data tables; the Reports module (Phase 12) adds
 * formatted Excel/PDF export for full reports.
 */
export function exportToCsv<T extends object>(filename: string, rows: T[]) {
  if (rows.length === 0) return;

  const data = rows as unknown as Record<string, unknown>[];
  const headers = Object.keys(data[0]!);
  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const csv = [headers.join(","), ...data.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n");

  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
