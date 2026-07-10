import { Download, Printer } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { generateLibraryReport } from "@/lib/excel-report";
import { useDashboardSummary } from "@/modules/dashboard/hooks/use-dashboard-summary";
import { useClassBreakdown, useSubjectBreakdown, useYearBreakdown } from "@/modules/reports/hooks/use-reports";

const STAT_LABELS: [string, string][] = [
  ["totalBooks", "Jami kitob"],
  ["totalCopies", "Jami nusxa"],
  ["electronicBooks", "Elektron kitob"],
  ["activeReaders", "Faol kitobxon"],
  ["issuedToday", "Bugun berilgan"],
  ["returnedToday", "Bugun qaytarilgan"],
  ["overdueLoans", "Muddati o'tgan"],
];

const INSTITUTION_NAME_KEY = "ilms.institutionName";

function ChartCard<T extends object>({
  title,
  data,
  dataKey,
  nameKey,
  isLoading,
}: {
  title: string;
  data: T[] | undefined;
  dataKey: keyof T & string;
  nameKey: keyof T & string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : data?.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={nameKey as string}
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey={dataKey as string} fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">Ma'lumot yo'q</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();
  const { data: classBreakdown, isLoading: isClassLoading } = useClassBreakdown();
  const { data: subject, isLoading: isSubjectLoading } = useSubjectBreakdown();
  const { data: year, isLoading: isYearLoading } = useYearBreakdown();

  const [institutionName, setInstitutionName] = useState(
    () => localStorage.getItem(INSTITUTION_NAME_KEY) ?? "Umumiy o'rta ta'lim maktabi kutubxonasi"
  );
  const [isExporting, setIsExporting] = useState(false);

  async function handleExcelExport() {
    if (!summary) return;
    localStorage.setItem(INSTITUTION_NAME_KEY, institutionName);
    setIsExporting(true);
    try {
      await generateLibraryReport({
        institutionName,
        summary,
        classBreakdown: classBreakdown ?? [],
        subjectBreakdown: subject ?? [],
        yearBreakdown: year ?? [],
      });
    } catch {
      toast.error("Hisobotni yaratib bo'lmadi");
    } finally {
      setIsExporting(false);
    }
  }

  const isLoading = isSummaryLoading || isClassLoading || isSubjectLoading || isYearLoading;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hisobotlar</h1>
          <p className="text-sm text-muted-foreground">Statistika, grafiklar va eksport</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="institution-name" className="text-xs text-muted-foreground">
              Muassasa nomi (hisobot sarlavhasi uchun)
            </Label>
            <Input
              id="institution-name"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-72"
            />
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Chop etish
          </Button>
          <Button onClick={handleExcelExport} disabled={isLoading || isExporting}>
            <Download className="size-4" />
            {isExporting ? "Tayyorlanmoqda..." : "Excelga yuklab olish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_LABELS.map(([key, label]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <p className="text-xl font-semibold tabular-nums">
                  {(summary?.[key as keyof typeof summary] as number) ?? 0}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Sinf kesimida" data={classBreakdown} dataKey="reader_count" nameKey="class_name" isLoading={isClassLoading} />
        <ChartCard title="Fan kesimida" data={subject} dataKey="book_count" nameKey="subject_name" isLoading={isSubjectLoading} />
      </div>

      <ChartCard title="Yil kesimida" data={year} dataKey="book_count" nameKey="publication_year" isLoading={isYearLoading} />
    </div>
  );
}
