import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  selectedCount?: number;
  onClearSelection?: () => void;
  bulkActions?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Qidirish...",
  selectedCount = 0,
  onClearSelection,
  bulkActions,
  filters,
  actions,
}: DataTableToolbarProps) {
  if (selectedCount > 0) {
    return (
      <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-7" onClick={onClearSelection}>
            <X className="size-4" />
          </Button>
          <span className="text-sm font-medium">{selectedCount} ta tanlandi</span>
        </div>
        <div className="flex items-center gap-2">{bulkActions}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {onSearchChange ? (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8"
            />
          </div>
        ) : null}
        {filters}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}
