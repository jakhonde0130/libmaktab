import { Lock, Plus, Unlock } from "lucide-react";
import { useMemo, useState } from "react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Link } from "react-router";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { exportToCsv } from "@/lib/export-csv";
import { ReaderFormDialog } from "@/modules/readers/components/reader-form-dialog";
import { useReaders, useSetReaderStatus } from "@/modules/readers/hooks/use-readers";
import type { Reader } from "@/modules/readers/types/reader";

const CATEGORY_LABEL: Record<string, string> = {
  student: "Talaba",
  teacher: "O'qituvchi",
  staff: "Xodim",
  external: "Tashqi",
};

export function ReadersListPage() {
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useReaders({
    search,
    page: String(pagination.pageIndex + 1),
    pageSize: String(pagination.pageSize),
  });
  const setStatus = useSetReaderStatus();

  async function toggleStatus(reader: Reader) {
    const next = reader.status === "active" ? "blocked" : "active";
    await setStatus.mutateAsync({ id: reader.id, status: next });
    toast.success(next === "active" ? "Hisob faollashtirildi" : "Hisob bloklandi");
  }

  const columns = useMemo<ColumnDef<Reader>[]>(
    () => [
      {
        id: "avatar",
        header: "",
        cell: ({ row }) => (
          <Avatar className="size-8">
            {row.original.photo_url ? <AvatarImage src={row.original.photo_url} /> : null}
            <AvatarFallback>{row.original.full_name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        ),
      },
      {
        accessorKey: "full_name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="FISH" />,
        cell: ({ row }) => (
          <Link to={row.original.id} className="font-medium hover:underline">
            {row.original.full_name}
          </Link>
        ),
      },
      {
        accessorKey: "library_card_barcode",
        header: "Karta raqami",
      },
      {
        id: "category",
        header: "Toifa",
        cell: ({ row }) => (
          <Badge variant="outline">{CATEGORY_LABEL[row.original.reader_category] ?? row.original.reader_category}</Badge>
        ),
      },
      {
        id: "class",
        header: "Sinf",
        cell: ({ row }) => row.original.class?.name ?? "—",
      },
      {
        id: "status",
        header: "Holati",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "active" ? "secondary" : "destructive"}>
            {row.original.status === "active" ? "Faol" : "Bloklangan"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={() => toggleStatus(row.original)}>
              {row.original.status === "active" ? (
                <Lock className="size-4" />
              ) : (
                <Unlock className="size-4 text-emerald-600" />
              )}
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function handleExport() {
    if (!data?.data.length) return;
    exportToCsv(
      "readers",
      data.data.map((r) => ({
        full_name: r.full_name,
        barcode: r.library_card_barcode,
        category: r.reader_category,
        class: r.class?.name ?? "",
        status: r.status,
        phone: r.phone ?? "",
      }))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kitobxonlar</h1>
          <p className="text-sm text-muted-foreground">Kitobxonlar bazasini boshqarish</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Yangi kitobxon
        </Button>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="FISH, karta raqami yoki JSHSHIR bo'yicha qidirish..."
        actions={
          <Button variant="outline" onClick={handleExport}>
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
        getRowId={(row) => row.id}
      />

      <ReaderFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
