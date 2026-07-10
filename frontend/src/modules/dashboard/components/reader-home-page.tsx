import { BookMarked, Bookmark, LibraryBig, Search, Wallet } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { useBorrowingsList, usePenaltiesList, useReservationsList } from "@/modules/circulation/hooks/use-circulation";

const RESERVATION_STATUS_LABEL: Record<string, string> = {
  pending: "Navbatda",
  ready: "Tayyor",
  fulfilled: "Bajarilgan",
  cancelled: "Bekor qilingan",
  expired: "Muddati o'tgan",
};

export function ReaderHomePage() {
  const fullName = useAuthStore((s) => s.user?.user_metadata?.full_name as string | undefined);
  const { data: borrowings, isLoading: isBorrowingsLoading } = useBorrowingsList({ status: "active", pageSize: "20" });
  const { data: reservations, isLoading: isReservationsLoading } = useReservationsList({ pageSize: "10" });
  const { data: penalties, isLoading: isPenaltiesLoading } = usePenaltiesList({ status: "unpaid", pageSize: "10" });

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Xush kelibsiz{fullName ? `, ${fullName}` : ""}</h1>
        <p className="text-sm text-muted-foreground">Sizning kitoblaringiz, bronlaringiz va jarimalaringiz</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/catalog">
            <Search className="size-4" />
            Katalogdan qidirish
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/electronic-library">
            <LibraryBig className="size-4" />
            Elektron kutubxona
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <BookMarked className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Mendagi kitoblar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isBorrowingsLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : borrowings?.data.length ? (
            borrowings.data.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{b.book_copy.book.title}</p>
                  <p className="text-sm text-muted-foreground">Qaytarish muddati: {b.due_date}</p>
                </div>
                <Badge variant={isOverdue(b.due_date) ? "destructive" : "secondary"}>
                  {isOverdue(b.due_date) ? "Muddati o'tgan" : "Faol"}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Hozirda sizda olingan kitob yo'q</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Bookmark className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Bronlarim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isReservationsLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : reservations?.data.length ? (
            reservations.data.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border p-3">
                <p className="font-medium">{r.book.title}</p>
                <Badge variant="outline">{RESERVATION_STATUS_LABEL[r.status] ?? r.status}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Bronlaringiz yo'q</p>
          )}
        </CardContent>
      </Card>

      {penalties?.data.length ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Wallet className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">To'lanmagan jarimalar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isPenaltiesLoading
              ? null
              : penalties.data.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                    <p>{p.borrowing?.book_copy.book.title ?? "—"}</p>
                    <Badge variant="destructive">{p.amount.toLocaleString()} so'm</Badge>
                  </div>
                ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
