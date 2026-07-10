import { Download, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ColumnDef, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { Link } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { exportToCsv } from "@/lib/export-csv";
import { useBooks } from "@/modules/books/hooks/use-books";
import { useDeleteBook } from "@/modules/books/hooks/use-book-mutations";
import type { BookSummary } from "@/modules/catalog/types/book-summary";

export function BooksListPage() {
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const { data, isLoading } = useBooks({
    q: search,
    page: String(pagination.pageIndex + 1),
    pageSize: String(pagination.pageSize),
  });
  const deleteBook = useDeleteBook();

  const columns = useMemo<ColumnDef<BookSummary>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kitob nomi" />,
        cell: ({ row }) => (
          <Link to={`${row.original.id}/edit`} className="font-medium hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      {
        id: "publisher",
        header: "Nashriyot",
        cell: ({ row }) => row.original.publisher?.name ?? "—",
      },
      {
        accessorKey: "publication_year",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Yil" />,
        cell: ({ row }) => row.original.publication_year ?? "—",
      },
      {
        accessorKey: "isbn",
        header: "ISBN",
        cell: ({ row }) => row.original.isbn ?? "—",
      },
      {
        id: "copies",
        header: "Nusxalar",
        cell: ({ row }) => {
          const count = row.original.book_copies?.[0]?.count ?? 0;
          return <Badge variant={count > 0 ? "secondary" : "outline"}>{count}</Badge>;
        },
      },
      {
        id: "electronic",
        header: "Elektron",
        cell: ({ row }) => (row.original.has_electronic_copy ? <Badge>PDF</Badge> : "—"),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={() => setConfirmDeleteId(row.original.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const selectedIds = Object.keys(rowSelection);

  async function handleBulkDelete() {
    await Promise.all(selectedIds.map((id) => deleteBook.mutateAsync(id)));
    toast.success(`${selectedIds.length} ta kitob o'chirildi`);
    setRowSelection({});
    setConfirmBulkDelete(false);
  }

  async function handleDelete() {
    if (!confirmDeleteId) return;
    await deleteBook.mutateAsync(confirmDeleteId);
    toast.success("Kitob o'chirildi");
    setConfirmDeleteId(null);
  }

  function handleExport() {
    if (!data?.data.length) return;
    exportToCsv(
      "books",
      data.data.map((b) => ({
        title: b.title,
        isbn: b.isbn ?? "",
        udk: b.udk ?? "",
        bbk: b.bbk ?? "",
        publisher: b.publisher?.name ?? "",
        year: b.publication_year ?? "",
        copies: b.book_copies?.[0]?.count ?? 0,
      }))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kitoblar</h1>
          <p className="text-sm text-muted-foreground">Bibliografik yozuvlarni boshqarish</p>
        </div>
        <Button asChild>
          <Link to="new">
            <Plus className="size-4" />
            Yangi kitob
          </Link>
        </Button>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Nom, ISBN, muallif bo'yicha qidirish..."
        selectedCount={selectedIds.length}
        onClearSelection={() => setRowSelection({})}
        bulkActions={
          <Button variant="destructive" size="sm" onClick={() => setConfirmBulkDelete(true)}>
            <Trash2 className="size-4" />
            O'chirish
          </Button>
        }
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Eksport
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.meta.total ?? 0}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Kitobni o'chirish"
        description="Bu kitob va unga bog'liq barcha nusxalar butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi."
        destructive
        isLoading={deleteBook.isPending}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title={`${selectedIds.length} ta kitobni o'chirish`}
        description="Tanlangan kitoblar va ularning nusxalari butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi."
        destructive
        isLoading={deleteBook.isPending}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
