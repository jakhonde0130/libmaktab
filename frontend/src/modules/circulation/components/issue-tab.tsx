import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { getCopyByBarcode } from "@/modules/book-copies/api/get-copy-by-barcode";
import { useIssueBorrowing } from "@/modules/circulation/hooks/use-circulation";
import { listReaders } from "@/modules/readers/api/readers-api";

export function IssueTab() {
  const [readerBarcode, setReaderBarcode] = useState("");
  const [copyBarcode, setCopyBarcode] = useState("");
  const issue = useIssueBorrowing();

  const readerQuery = useQuery({
    queryKey: ["circulation", "reader-lookup", readerBarcode],
    queryFn: () => listReaders({ search: readerBarcode, page: "1", pageSize: "1" }),
    enabled: readerBarcode.length >= 4,
  });
  const reader = readerQuery.data?.data[0];

  const copyQuery = useQuery({
    queryKey: ["circulation", "copy-lookup", copyBarcode],
    queryFn: () => getCopyByBarcode(copyBarcode),
    enabled: copyBarcode.length >= 3,
    retry: false,
  });
  const copy = copyQuery.data;

  async function handleIssue() {
    if (!reader || !copy) return;
    try {
      await issue.mutateAsync({ bookCopyId: copy.id, readerId: reader.id });
      toast.success("Kitob berildi", { description: `${copy.book.title} — ${reader.full_name}` });
      setReaderBarcode("");
      setCopyBarcode("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Berib bo'lmadi", { description: message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kitob berish</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Kitobxon (barkod yoki ism)</Label>
            <Input value={readerBarcode} onChange={(e) => setReaderBarcode(e.target.value)} autoFocus />
            {reader ? (
              <p className="text-sm text-emerald-600">
                {reader.full_name} — {reader.library_card_barcode}
              </p>
            ) : readerBarcode.length >= 4 && !readerQuery.isFetching ? (
              <p className="text-sm text-destructive">Kitobxon topilmadi</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label>Kitob nusxasi (barkod)</Label>
            <Input value={copyBarcode} onChange={(e) => setCopyBarcode(e.target.value)} />
            {copy ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-emerald-600">{copy.book.title}</span>
                <Badge variant={copy.status === "available" ? "secondary" : "destructive"}>{copy.status}</Badge>
              </div>
            ) : copyBarcode.length >= 3 && !copyQuery.isFetching ? (
              <p className="text-sm text-destructive">Nusxa topilmadi</p>
            ) : null}
          </div>
        </div>
        <Button
          onClick={handleIssue}
          disabled={!reader || !copy || copy.status !== "available" || issue.isPending}
        >
          {issue.isPending ? "Berilmoqda..." : "Berish"}
        </Button>
      </CardContent>
    </Card>
  );
}
