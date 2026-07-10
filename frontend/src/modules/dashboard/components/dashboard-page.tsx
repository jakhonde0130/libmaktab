import { AlertTriangle, BookMarked, BookOpen, Clock, LibraryBig, Star, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "@/modules/dashboard/hooks/use-dashboard-summary";
import { useRecentBorrowings } from "@/modules/circulation/hooks/use-recent-borrowings";

const STAT_CARDS = [
  { key: "totalBooks", label: "Jami kitob", icon: BookOpen },
  { key: "totalCopies", label: "Jami nusxa", icon: BookMarked },
  { key: "electronicBooks", label: "Elektron kitob", icon: LibraryBig },
  { key: "activeReaders", label: "Faol kitobxon", icon: Users },
  { key: "issuedToday", label: "Bugun berilgan", icon: Clock },
  { key: "returnedToday", label: "Bugun qaytarilgan", icon: Clock },
  { key: "overdueLoans", label: "Muddati o'tgan", icon: AlertTriangle },
] as const;

const BORROWING_STATUS_LABEL: Record<string, string> = {
  active: "Faol",
  returned: "Qaytarilgan",
  overdue: "Muddati o'tgan",
};

export function DashboardPage() {
  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();
  const { data: recent, isLoading: isRecentLoading } = useRecentBorrowings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Boshqaruv paneli</h1>
        <p className="text-sm text-muted-foreground">Kutubxona bo'yicha umumiy ko'rsatkichlar</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-semibold tabular-nums">{summary?.[stat.key] ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Trophy className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Eng ko'p o'qilgan kitob</CardTitle>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : summary?.mostBorrowedBook ? (
              <div className="flex items-center justify-between">
                <p className="font-medium">{summary.mostBorrowedBook.title}</p>
                <Badge variant="secondary">{summary.mostBorrowedBook.borrowCount} marta</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Hali ma'lumot yo'q</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Star className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Eng faol kitobxon</CardTitle>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : summary?.mostActiveReader ? (
              <div className="flex items-center justify-between">
                <p className="font-medium">{summary.mostActiveReader.fullName}</p>
                <Badge variant="secondary">{summary.mostActiveReader.borrowCount} marta</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Hali ma'lumot yo'q</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>So'nggi harakatlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isRecentLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          ) : recent?.data.length ? (
            recent.data.map((borrowing) => (
              <div
                key={borrowing.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{borrowing.book_copy.book.title}</p>
                  <p className="text-muted-foreground">{borrowing.reader.full_name}</p>
                </div>
                <Badge variant={borrowing.status === "overdue" ? "destructive" : "secondary"}>
                  {BORROWING_STATUS_LABEL[borrowing.status] ?? borrowing.status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Hali faoliyat yo'q</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
