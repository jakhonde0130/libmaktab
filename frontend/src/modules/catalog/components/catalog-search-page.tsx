import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { SimplePagination } from "@/components/shared/simple-pagination";
import { AdvancedSearchPanel } from "@/modules/catalog/components/advanced-search-panel";
import { BookCard } from "@/modules/catalog/components/book-card";
import { useBookSearch } from "@/modules/catalog/hooks/use-book-search";
import type { BookSearchFilters } from "@/modules/catalog/api/search-books";

interface CatalogSearchPageProps {
  /** Prefix used to build each result's detail link, e.g. "/catalog" or "/opac". */
  detailBasePath: string;
}

const PAGE_SIZE = 12;

export function CatalogSearchPage({ detailBasePath }: CatalogSearchPageProps) {
  const [params, setParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filters: BookSearchFilters = Object.fromEntries(params.entries());
  const page = Number(filters.page) || 1;

  const { data, isLoading } = useBookSearch({ ...filters, page: String(page), pageSize: String(PAGE_SIZE) });

  function patchFilters(patch: Partial<BookSearchFilters>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    setParams(next);
  }

  function setPage(nextPage: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    setParams(next);
  }

  const activeFilterCount = Object.keys(filters).filter((k) => k !== "q" && k !== "page").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Katalog</h1>
        <p className="text-sm text-muted-foreground">Kutubxona fondidan kitob qidiring</p>
      </div>

      <DataTableToolbar
        search={filters.q}
        onSearchChange={(value) => patchFilters({ q: value || undefined })}
        searchPlaceholder="Kitob nomi, muallif yoki ISBN bo'yicha qidirish..."
        actions={
          <Button variant="outline" onClick={() => setShowAdvanced((v) => !v)}>
            <SlidersHorizontal className="size-4" />
            Kengaytirilgan qidiruv
            {activeFilterCount > 0 ? (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        }
      />

      {showAdvanced ? (
        <div className="space-y-2">
          <AdvancedSearchPanel filters={filters} onChange={patchFilters} />
          {activeFilterCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setParams({})}>
              <X className="size-3.5" />
              Filtrlarni tozalash
            </Button>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : data?.data.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.data.map((book) => (
              <BookCard key={book.id} book={book} to={`${detailBasePath}/${book.id}`} />
            ))}
          </div>
          <SimplePagination
            page={page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="rounded-md border py-16 text-center text-muted-foreground">Hech narsa topilmadi</div>
      )}
    </div>
  );
}
