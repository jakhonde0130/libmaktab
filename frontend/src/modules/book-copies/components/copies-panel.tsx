import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ApiError } from "@/lib/api-client";
import { CopyFormDialog } from "@/modules/book-copies/components/copy-form-dialog";
import { useCopiesForBook, useCreateCopy, useDeleteCopy, useUpdateCopy } from "@/modules/book-copies/hooks/use-copies";
import type { BookCopyDetail } from "@/modules/catalog/types/book-summary";

const STATUS_LABEL: Record<string, string> = {
  available: "Mavjud",
  issued: "Berilgan",
  reserved: "Bron qilingan",
  lost: "Yo'qolgan",
  under_repair: "Ta'mirda",
  withdrawn: "Chiqarilgan",
  in_transit: "Yo'lda",
};

export function CopiesPanel({ bookId }: { bookId: string }) {
  const { data: copies, isLoading } = useCopiesForBook(bookId);
  const createCopy = useCreateCopy(bookId);
  const updateCopy = useUpdateCopy(bookId);
  const deleteCopy = useDeleteCopy(bookId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<BookCopyDetail | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditingCopy(null);
    setDialogOpen(true);
  }

  function openEdit(copy: BookCopyDetail) {
    setEditingCopy(copy);
    setDialogOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (editingCopy) {
        await updateCopy.mutateAsync({ id: editingCopy.id, values });
        toast.success("Nusxa yangilandi");
      } else {
        await createCopy.mutateAsync(values as never);
        toast.success("Nusxa qo'shildi");
      }
      setDialogOpen(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Saqlab bo'lmadi", { description: message });
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    await deleteCopy.mutateAsync(deletingId);
    toast.success("Nusxa o'chirildi");
    setDeletingId(null);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Nusxalar {copies ? `(${copies.length})` : ""}</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Nusxa qo'shish
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : copies?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inventar</TableHead>
                <TableHead>Barkod</TableHead>
                <TableHead>Holati</TableHead>
                <TableHead>Narxi</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {copies.map((copy) => (
                <TableRow key={copy.id} className="cursor-pointer" onClick={() => openEdit(copy)}>
                  <TableCell>{copy.inventory_number}</TableCell>
                  <TableCell>{copy.barcode}</TableCell>
                  <TableCell>
                    <Badge variant={copy.status === "available" ? "secondary" : "outline"}>
                      {STATUS_LABEL[copy.status] ?? copy.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{copy.price ?? "—"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(copy.id);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">Hali nusxa qo'shilmagan</p>
        )}
      </CardContent>

      <CopyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={
          editingCopy
            ? {
                bookId,
                inventoryNumber: editingCopy.inventory_number,
                barcode: editingCopy.barcode,
                status: editingCopy.status,
                price: editingCopy.price ?? undefined,
                acquisitionDate: editingCopy.acquisition_date ?? undefined,
                acquisitionType: editingCopy.acquisition_type,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        isSubmitting={createCopy.isPending || updateCopy.isPending}
      />

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Nusxani o'chirish"
        description="Bu nusxa butunlay o'chiriladi. Agar bu nusxa bo'yicha qarz tarixi bo'lsa, o'chirib bo'lmaydi."
        destructive
        isLoading={deleteCopy.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
