import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReferenceList } from "@/modules/reference/hooks/use-reference-list";
import type { BookSearchFilters } from "@/modules/catalog/api/search-books";

interface AdvancedSearchPanelProps {
  filters: BookSearchFilters;
  onChange: (patch: Partial<BookSearchFilters>) => void;
}

const NONE = "__none__";
const GRADE_OPTIONS = Array.from({ length: 11 }, (_, i) => ({ id: String(i + 1), label: `${i + 1}-sinf` }));

export function AdvancedSearchPanel({ filters, onChange }: AdvancedSearchPanelProps) {
  const { data: languages } = useReferenceList("languages");
  const { data: subjects } = useReferenceList("subjects");
  const { data: publishers } = useReferenceList("publishers");

  const selectField = (
    label: string,
    key: keyof BookSearchFilters,
    options: { id: string; label: string }[] | undefined
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={filters[key] || NONE}
        onValueChange={(value) => onChange({ [key]: value === NONE ? undefined : value })}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Barchasi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Barchasi</SelectItem>
          {options?.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const textField = (label: string, key: keyof BookSearchFilters, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={filters[key] ?? ""}
        onChange={(e) => onChange({ [key]: e.target.value || undefined })}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
      {textField("Muallif", "author", "Muallif ismi")}
      {textField("ISBN", "isbn")}
      {textField("Kalit so'z", "keyword")}
      {textField("UDK", "udk")}
      {textField("BBK", "bbk")}
      {textField("Nashr yili", "year", "2024")}
      {textField("Inventar raqami", "inventoryNumber")}
      {textField("Barkod", "barcode")}
      {selectField(
        "Til",
        "languageId",
        languages?.map((l) => ({ id: l.id, label: String(l.name) }))
      )}
      {selectField(
        "Fan",
        "subjectId",
        subjects?.map((s) => ({ id: s.id, label: String(s.name) }))
      )}
      {selectField("Sinf", "grade", GRADE_OPTIONS)}
      {selectField(
        "Nashriyot",
        "publisherId",
        publishers?.map((p) => ({ id: p.id, label: String(p.name) }))
      )}
    </div>
  );
}
