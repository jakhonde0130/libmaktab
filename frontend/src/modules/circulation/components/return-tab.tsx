import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { getCopyByBarcode } from "@/modules/book-copies/api/get-copy-by-barcode";
import { useReturnBorrowing } from "@/modules/circulation/hooks/use-circulation";
import { listBorrowings } from "@/modules/circulation/api/list-borrowings";

export function ReturnTab() {
  const [barcode, setBarcode] = useState("");
  const returnMutation = useReturnBorrowing();

  const copyQuery = useQuery({
    queryKey: ["circulation", "return-copy-lookup", barcode],
    queryFn: () => getCopyByBarcode(barcode),
    enabled: barcode.length >= 3,
    retry: false,
  });
  const copy = copyQuery.data;

  const borrowingQuery = useQuery({
    queryKey: ["circulation", "return-borrowing-lookup", copy?.id],
    queryFn: () => listBorrowings({ bookCopyId: copy!.id, status: "active", pageSize: 1 }),
    enabled: !!copy && copy.status === "issued",
  });
  const borrowing = borrowingQuery.data?.data[0];

  async function handleReturn() {
    if (!borrowing) return;
    try {
      await returnMutation.mutateAsync({ id: borrowing.id });
      toast.success("Kitob qaytarildi");
      setBarcode("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Qaytarib bo'lmadi", { description: message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kitob qaytarish</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm space-y-1.5">
          <Label>Kitob nusxasi (barkod)</Label>
          <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} autoFocus />
        </div>

        {copy && copy.status !== "issued" ? (
          <p className="text-sm text-muted-foreground">Bu nusxa hozir berilmagan (holati: {copy.status})</p>
        ) : null}

        {borrowing ? (
          <div className="rounded-md border p-4">
            <p className="font-medium">{borrowing.book_copy.book.title}</p>
            <p className="text-sm text-muted-foreground">
              {borrowing.reader.full_name} — muddat: {borrowing.due_date}
            </p>
            <Button className="mt-3" onClick={handleReturn} disabled={returnMutation.isPending}>
              {returnMutation.isPending ? "Qaytarilmoqda..." : "Qaytarish"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
