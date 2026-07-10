import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePayPenalty, usePenaltiesList, useWaivePenalty } from "@/modules/circulation/hooks/use-circulation";

const REASON_LABEL: Record<string, string> = { overdue: "Muddati o'tgan", lost_book: "Yo'qolgan", damage: "Shikastlangan" };
const STATUS_LABEL: Record<string, string> = { unpaid: "To'lanmagan", paid: "To'langan", waived: "Kechirilgan" };

export function PenaltiesTab() {
  const { data, isLoading } = usePenaltiesList({ pageSize: "50" });
  const pay = usePayPenalty();
  const waive = useWaivePenalty();

  async function handlePay(id: string) {
    await pay.mutateAsync(id);
    toast.success("To'lov qayd etildi");
  }

  async function handleWaive(id: string) {
    await waive.mutateAsync({ id });
    toast.success("Jarima kechirildi");
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kitobxon</TableHead>
          <TableHead>Kitob</TableHead>
          <TableHead>Sabab</TableHead>
          <TableHead>Summa</TableHead>
          <TableHead>Holati</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.data.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.reader.full_name}</TableCell>
            <TableCell>{p.borrowing?.book_copy.book.title ?? "—"}</TableCell>
            <TableCell>{REASON_LABEL[p.reason] ?? p.reason}</TableCell>
            <TableCell>{p.amount.toLocaleString()} so'm</TableCell>
            <TableCell>
              <Badge variant={p.status === "unpaid" ? "destructive" : "secondary"}>
                {STATUS_LABEL[p.status] ?? p.status}
              </Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2">
              {p.status === "unpaid" ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleWaive(p.id)}>
                    Kechirish
                  </Button>
                  <Button size="sm" onClick={() => handlePay(p.id)}>
                    To'landi
                  </Button>
                </>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
