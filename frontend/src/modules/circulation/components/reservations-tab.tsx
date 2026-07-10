import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api-client";
import { getCopyByBarcode } from "@/modules/book-copies/api/get-copy-by-barcode";
import { useCancelReservation, useFulfillReservation, useReservationsList } from "@/modules/circulation/hooks/use-circulation";

const STATUS_LABEL: Record<string, string> = {
  pending: "Navbatda",
  ready: "Tayyor",
  fulfilled: "Bajarilgan",
  cancelled: "Bekor qilingan",
  expired: "Muddati o'tgan",
};

export function ReservationsTab() {
  const { data, isLoading } = useReservationsList({ status: "pending", pageSize: "50" });
  const fulfill = useFulfillReservation();
  const cancel = useCancelReservation();
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [copyBarcode, setCopyBarcode] = useState("");

  async function handleFulfill(reservationId: string) {
    if (!copyBarcode) return;
    try {
      const copy = await getCopyByBarcode(copyBarcode);
      await fulfill.mutateAsync({ id: reservationId, bookCopyId: copy.id });
      toast.success("Bron bajarildi");
      setFulfillingId(null);
      setCopyBarcode("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Nusxa topilmadi yoki band emas";
      toast.error("Bajarib bo'lmadi", { description: message });
    }
  }

  async function handleCancel(id: string) {
    await cancel.mutateAsync(id);
    toast.success("Bron bekor qilindi");
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
          <TableHead>Kitob</TableHead>
          <TableHead>Kitobxon</TableHead>
          <TableHead>Navbat</TableHead>
          <TableHead>Holati</TableHead>
          <TableHead className="w-72" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.data.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.book.title}</TableCell>
            <TableCell>{r.reader.full_name}</TableCell>
            <TableCell>{r.queue_position ?? "—"}</TableCell>
            <TableCell>
              <Badge variant="outline">{STATUS_LABEL[r.status] ?? r.status}</Badge>
            </TableCell>
            <TableCell>
              {fulfillingId === r.id ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nusxa barkodi"
                    value={copyBarcode}
                    onChange={(e) => setCopyBarcode(e.target.value)}
                    className="h-8"
                  />
                  <Button size="sm" onClick={() => handleFulfill(r.id)} disabled={fulfill.isPending}>
                    Tasdiqlash
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCancel(r.id)}>
                    Bekor qilish
                  </Button>
                  <Button size="sm" onClick={() => setFulfillingId(r.id)}>
                    Nusxa berish
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
