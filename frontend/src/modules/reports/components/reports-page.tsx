import { Download, Printer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToCsv } from "@/lib/export-csv";
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

function ChartCard<T extends object>({
  title,
  data,
  dataKey,
  nameKey,
  isLoading,
  onExport,
}: {
  title: string;
  data: T[] | undefined;
  dataKey: keyof T & string;
  nameKey: keyof T & string;
  isLoading: boolean;
  onExport: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onExport} disabled={!data?.length}>
          <Download className="size-4" />
        </Button>
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

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hisobotlar</h1>
          <p className="text-sm text-muted-foreground">Statistika, grafiklar va eksport</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Chop etish
        </Button>
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
        <ChartCard
          title="Sinf kesimida"
          data={classBreakdown}
          dataKey="reader_count"
          nameKey="class_name"
          isLoading={isClassLoading}
          onExport={() => classBreakdown && exportToCsv("class-breakdown", classBreakdown)}
        />
        <ChartCard
          title="Fan kesimida"
          data={subject}
          dataKey="book_count"
          nameKey="subject_name"
          isLoading={isSubjectLoading}
          onExport={() => subject && exportToCsv("subject-breakdown", subject)}
        />
      </div>

      <ChartCard
        title="Yil kesimida"
        data={year}
        dataKey="book_count"
        nameKey="publication_year"
        isLoading={isYearLoading}
        onExport={() => year && exportToCsv("year-breakdown", year)}
      />
    </div>
  );
}
