import type ExcelJS from "exceljs";
import type { DashboardSummary } from "@/modules/dashboard/types/summary";
import type { ClassBreakdown, SubjectBreakdown, YearBreakdown } from "@/modules/reports/api/reports-api";

const BRAND_COLOR = "1F4E5F"; // deep teal — reads well printed in B/W too
const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: `FF${BRAND_COLOR}` } };
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const THIN_BORDER = { style: "thin" as const, color: { argb: "FFD0D0D0" } };
const ALL_BORDERS = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };

function addLetterhead(sheet: ExcelJS.Worksheet, institutionName: string, subtitle: string, lastCol: string) {
  sheet.mergeCells(`A1:${lastCol}1`);
  const title = sheet.getCell("A1");
  title.value = institutionName;
  title.font = { bold: true, size: 15, color: { argb: `FF${BRAND_COLOR}` } };
  title.alignment = { horizontal: "center" };

  sheet.mergeCells(`A2:${lastCol}2`);
  const sub = sheet.getCell("A2");
  sub.value = subtitle;
  sub.font = { bold: true, size: 12 };
  sub.alignment = { horizontal: "center" };

  sheet.mergeCells(`A3:${lastCol}3`);
  const date = sheet.getCell("A3");
  date.value = `Sana: ${new Date().toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" })}`;
  date.font = { italic: true, size: 10, color: { argb: "FF666666" } };
  date.alignment = { horizontal: "center" };

  sheet.addRow([]);
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = ALL_BORDERS;
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  row.height = 20;
}

function styleDataRow(row: ExcelJS.Row, zebraIndex: number) {
  row.eachCell((cell) => {
    cell.border = ALL_BORDERS;
    cell.alignment = { vertical: "middle" };
  });
  if (zebraIndex % 2 === 1) {
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F7F8" } };
    });
  }
}

function addFooter(sheet: ExcelJS.Worksheet, lastCol: string) {
  sheet.addRow([]);
  const row = sheet.addRow([`Hisobot avtomatik yaratildi — ${new Date().toLocaleString("uz-UZ")}`]);
  sheet.mergeCells(`A${row.number}:${lastCol}${row.number}`);
  row.getCell(1).font = { italic: true, size: 9, color: { argb: "FF999999" } };
}

export interface LibraryReportData {
  institutionName: string;
  summary: DashboardSummary;
  classBreakdown: ClassBreakdown[];
  subjectBreakdown: SubjectBreakdown[];
  yearBreakdown: YearBreakdown[];
}

const SUMMARY_ROWS: [string, keyof DashboardSummary][] = [
  ["Jami kitob (nomlar soni)", "totalBooks"],
  ["Jami nusxalar soni", "totalCopies"],
  ["Elektron kitoblar soni", "electronicBooks"],
  ["Faol kitobxonlar soni", "activeReaders"],
  ["Bugun berilgan kitoblar", "issuedToday"],
  ["Bugun qaytarilgan kitoblar", "returnedToday"],
  ["Muddati o'tgan qarzlar", "overdueLoans"],
];

export async function generateLibraryReport(data: LibraryReportData) {
  // Loaded on demand — exceljs is a large dependency and most Reports page
  // visits don't end in an export, so keep it out of that route's main chunk.
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ILMS";
  workbook.created = new Date();

  // --- Sheet 1: Umumiy hisobot ---
  const summarySheet = workbook.addWorksheet("Umumiy hisobot", { views: [{ showGridLines: false }] });
  summarySheet.columns = [{ width: 34 }, { width: 20 }];
  addLetterhead(summarySheet, data.institutionName, "Kutubxona statistik hisoboti", "B");

  const summaryHeaderRow = summarySheet.addRow(["Ko'rsatkich", "Qiymat"]);
  styleHeaderRow(summaryHeaderRow);

  SUMMARY_ROWS.forEach(([label, key], i) => {
    const row = summarySheet.addRow([label, data.summary[key] ?? 0]);
    row.getCell(2).alignment = { horizontal: "right" };
    row.getCell(2).numFmt = "#,##0";
    styleDataRow(row, i);
  });

  summarySheet.addRow([]);
  const topRow1 = summarySheet.addRow([
    "Eng ko'p o'qilgan kitob",
    data.summary.mostBorrowedBook
      ? `${data.summary.mostBorrowedBook.title} (${data.summary.mostBorrowedBook.borrowCount} marta)`
      : "—",
  ]);
  summarySheet.mergeCells(`B${topRow1.number}:B${topRow1.number}`);
  topRow1.getCell(1).font = { bold: true };

  const topRow2 = summarySheet.addRow([
    "Eng faol kitobxon",
    data.summary.mostActiveReader
      ? `${data.summary.mostActiveReader.fullName} (${data.summary.mostActiveReader.borrowCount} marta)`
      : "—",
  ]);
  topRow2.getCell(1).font = { bold: true };

  addFooter(summarySheet, "B");

  // --- Sheet 2: Sinflar kesimida ---
  addBreakdownSheet(
    workbook,
    "Sinflar kesimida",
    data.institutionName,
    "Sinflar kesimida kitobxonlar",
    ["Sinf", "Kitobxonlar soni"],
    data.classBreakdown.map((c) => [c.class_name, c.reader_count])
  );

  // --- Sheet 3: Fanlar kesimida ---
  addBreakdownSheet(
    workbook,
    "Fanlar kesimida",
    data.institutionName,
    "Fanlar kesimida kitoblar",
    ["Fan", "Kitoblar soni"],
    data.subjectBreakdown.map((s) => [s.subject_name, s.book_count])
  );

  // --- Sheet 4: Yillar kesimida ---
  addBreakdownSheet(
    workbook,
    "Yillar kesimida",
    data.institutionName,
    "Nashr yili kesimida kitoblar",
    ["Nashr yili", "Kitoblar soni"],
    data.yearBreakdown.map((y) => [y.publication_year, y.book_count])
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kutubxona-hisoboti-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function addBreakdownSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  institutionName: string,
  subtitle: string,
  headers: [string, string],
  rows: [string | number, number][]
) {
  const sheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: false }] });
  sheet.columns = [{ width: 34 }, { width: 20 }];
  addLetterhead(sheet, institutionName, subtitle, "B");

  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  if (rows.length === 0) {
    const emptyRow = sheet.addRow(["Ma'lumot yo'q", ""]);
    emptyRow.getCell(1).font = { italic: true, color: { argb: "FF999999" } };
  } else {
    rows.forEach((r, i) => {
      const row = sheet.addRow(r);
      row.getCell(2).alignment = { horizontal: "right" };
      row.getCell(2).numFmt = "#,##0";
      styleDataRow(row, i);
    });
  }

  addFooter(sheet, "B");
}
