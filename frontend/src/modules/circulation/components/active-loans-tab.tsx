import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import { useBorrowingsList, useRenewBorrowing, useReturnBorrowing } from "@/modules/circulation/hooks/use-circulation";

const STATUS_LABEL: Record<string, string> = { active: "Faol", returned: "Qaytarilgan", overdue: "Muddati o'tgan" };

export function ActiveLoansTab() {
  const [status, setStatus] = useState<string | undefined>("active");
  const { data, isLoading } = useBorrowingsList({ status, pageSize: "50" });
  const renew = useRenewBorrowing();
  const returnMutation = useReturnBorrowing();

  async function handleRenew(id: string) {
    try {
      await renew.mutateAsync(id);
      toast.success("Muddat uzaytirildi");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Uzaytirib bo'lmadi", { description: message });
    }
  }

  async function handleReturn(id: string) {
    try {
      await returnMutation.mutateAsync({ id });
      toast.success("Qaytarildi");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Qaytarib bo'lmadi", { description: message });
    }
  }

  const isOverdue = (dueDate: string, currentStatus: string) =>
    currentStatus === "active" && new Date(dueDate) < new Date();

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[
          { value: "active", label: "Faol" },
          { value: undefined, label: "Barchasi" },
          { value: "returned", label: "Qaytarilgan" },
        ].map((f) => (
          <Button
            key={f.label}
            variant={status === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kitob</TableHead>
              <TableHead>Kitobxon</TableHead>
              <TableHead>Muddat</TableHead>
              <TableHead>Holati</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.book_copy.book.title}</TableCell>
                <TableCell>{b.reader.full_name}</TableCell>
                <TableCell>{b.due_date}</TableCell>
                <TableCell>
                  <Badge variant={isOverdue(b.due_date, b.status) ? "destructive" : "secondary"}>
                    {isOverdue(b.due_date, b.status) ? "Muddati o'tgan" : STATUS_LABEL[b.status]}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  {b.status === "active" ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleRenew(b.id)}>
                        Uzaytirish
                      </Button>
                      <Button size="sm" onClick={() => handleReturn(b.id)}>
                        Qaytarish
                      </Button>
                    </>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
