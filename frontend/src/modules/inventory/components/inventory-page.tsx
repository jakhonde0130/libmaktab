import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api-client";
import { listInventoryLogs, listMissingCopies, scanBarcode } from "@/modules/inventory/api/inventory-api";

const RESULT_LABEL: Record<string, string> = { found: "Topildi", missing: "Yo'q", misplaced: "Noto'g'ri/topilmadi", damaged: "Shikastlangan" };

export function InventoryPage() {
  const [auditBatchId] = useState(() => crypto.randomUUID());
  const [barcode, setBarcode] = useState("");
  const queryClient = useQueryClient();

  const { data: logs } = useQuery({
    queryKey: ["inventory", "logs", auditBatchId],
    queryFn: () => listInventoryLogs(auditBatchId),
  });

  const { data: missing, refetch: refetchMissing } = useQuery({
    queryKey: ["inventory", "missing", auditBatchId],
    queryFn: () => listMissingCopies(auditBatchId),
    enabled: false,
  });

  const scan = useMutation({
    mutationFn: (value: string) => scanBarcode(auditBatchId, value),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "logs", auditBatchId] });
      if (data.result === "found") {
        toast.success(data.book_copy?.book.title ?? "Topildi");
      } else {
        toast.error("Bu barkod tizimda topilmadi");
      }
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Xatolik";
      toast.error(message);
    },
  });

  function handleScan(e: FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;
    scan.mutate(barcode.trim());
    setBarcode("");
  }

  const foundCount = logs?.filter((l) => l.result === "found").length ?? 0;
  const misplacedCount = logs?.filter((l) => l.result === "misplaced").length ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventarizatsiya</h1>
        <p className="text-sm text-muted-foreground">Barcode skaner bilan javon tekshiruvi</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Skanerlangan</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{logs?.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Topildi</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">{foundCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Noma'lum barkod</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">{misplacedCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skanerlash</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="flex gap-2">
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Barkodni skanerlang yoki kiriting"
              autoFocus
            />
            <Button type="submit" disabled={scan.isPending}>
              Tekshirish
            </Button>
          </form>

          {logs && logs.length > 0 ? (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Barkod</TableHead>
                  <TableHead>Kitob</TableHead>
                  <TableHead>Natija</TableHead>
                  <TableHead>Vaqt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">{log.scanned_barcode}</TableCell>
                    <TableCell>{log.book_copy?.book.title ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={log.result === "found" ? "secondary" : "destructive"} className="gap-1">
                        {log.result === "found" ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                        {RESULT_LABEL[log.result] ?? log.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.scanned_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Yo'qolgan kitoblar (bu sessiyada skanerlanmagan)</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetchMissing()}>
            <RotateCcw className="size-4" />
            Hisoblash
          </Button>
        </CardHeader>
        <CardContent>
          {missing ? (
            missing.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inventar</TableHead>
                    <TableHead>Barkod</TableHead>
                    <TableHead>Kitob</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missing.map((copy) => (
                    <TableRow key={copy.id}>
                      <TableCell>{copy.inventory_number}</TableCell>
                      <TableCell className="font-mono text-sm">{copy.barcode}</TableCell>
                      <TableCell>{copy.book.title}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Barcha nusxalar joyida</p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Skanerlashni tugatgach, "Hisoblash" tugmasini bosing
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
