import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/shared/multi-select";
import { TagInput } from "@/components/shared/tag-input";
import { useReferenceList } from "@/modules/reference/hooks/use-reference-list";
import type { BookFormValues } from "@/modules/books/types/book";

const NONE = "__none__";

const bookFormSchema = z.object({
  title: z.string().min(1, "Kitob nomi kiritilishi shart"),
  originalTitle: z.string().optional(),
  isbn: z.string().optional(),
  udk: z.string().optional(),
  bbk: z.string().optional(),
  publisherId: z.string().optional(),
  publicationPlace: z.string().optional(),
  publicationYear: z.coerce.number().int().optional(),
  languageId: z.string().optional(),
  pageCount: z.coerce.number().int().positive().optional(),
  volume: z.string().optional(),
  edition: z.string().optional(),
  series: z.string().optional(),
  annotation: z.string().optional(),
  categoryId: z.string().optional(),
  subjectId: z.string().optional(),
  minGrade: z.coerce.number().int().optional(),
  maxGrade: z.coerce.number().int().optional(),
  coverImageUrl: z.string().optional(),
  downloadEnabled: z.boolean(),
  authorIds: z.array(z.string()),
  keywords: z.array(z.string()),
});

interface BookFormProps {
  defaultValues?: Partial<BookFormValues>;
  onSubmit: (values: BookFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function BookForm({ defaultValues, onSubmit, isSubmitting, submitLabel = "Saqlash" }: BookFormProps) {
  const { data: authors } = useReferenceList("authors");
  const { data: publishers } = useReferenceList("publishers");
  const { data: languages } = useReferenceList("languages");
  const { data: categories } = useReferenceList("categories");
  const { data: subjects } = useReferenceList("subjects");

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      downloadEnabled: true,
      authorIds: [],
      keywords: [],
      ...defaultValues,
    },
  });

  function selectField(name: keyof BookFormValues, label: string, options?: { id: string; label: string }[]) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              value={(field.value as string) || NONE}
              onValueChange={(value) => field.onChange(value === NONE ? undefined : value)}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tanlanmagan" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE}>Tanlanmagan</SelectItem>
                {options?.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Clearing a text/number field leaves "" (or a coerced 0) in RHF state rather
  // than undefined; normalize those away so we don't send stray empty strings
  // or a bogus year/page-count of 0 to the backend.
  function sanitize(values: BookFormValues): BookFormValues {
    const cleaned = { ...values };
    for (const key of Object.keys(cleaned) as (keyof BookFormValues)[]) {
      const value = cleaned[key];
      if (value === "") {
        delete cleaned[key];
      }
    }
    if (cleaned.publicationYear === 0) delete cleaned.publicationYear;
    if (cleaned.pageCount === 0) delete cleaned.pageCount;
    if (cleaned.minGrade === 0) delete cleaned.minGrade;
    if (cleaned.maxGrade === 0) delete cleaned.maxGrade;
    return cleaned;
  }

  function textField(name: keyof BookFormValues, label: string, placeholder?: string) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input {...field} value={(field.value as string) ?? ""} placeholder={placeholder} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(sanitize(values)))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asosiy ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{textField("title", "Kitob nomi *")}</div>
            <div className="sm:col-span-2">{textField("originalTitle", "Asl nomi")}</div>

            <FormField
              control={form.control}
              name="authorIds"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Muallif(lar)</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={authors?.map((a) => ({ value: a.id, label: String(a.full_name) })) ?? []}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Muallif tanlang"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {textField("isbn", "ISBN")}
            {textField("udk", "UDK")}
            {textField("bbk", "BBK")}
            {selectField("categoryId", "Mavzu", categories?.map((c) => ({ id: c.id, label: String(c.name) })))}
            {selectField("subjectId", "Fan", subjects?.map((s) => ({ id: s.id, label: String(s.name) })))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nashr ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectField("publisherId", "Nashriyot", publishers?.map((p) => ({ id: p.id, label: String(p.name) })))}
            {textField("publicationPlace", "Nashr joyi")}
            {textField("publicationYear", "Nashr yili", "2024")}
            {selectField("languageId", "Til", languages?.map((l) => ({ id: l.id, label: String(l.name) })))}
            {textField("pageCount", "Betlar soni")}
            {textField("volume", "Jild")}
            {textField("edition", "Nashr soni")}
            {textField("series", "Seriya")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tavsiya etilgan sinf</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {textField("minGrade", "Sinfdan (1-11)")}
            {textField("maxGrade", "Sinfgacha (1-11)")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tavsif</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="annotation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annotatsiya</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kalit so'zlar</FormLabel>
                  <FormControl>
                    <TagInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Elektron nusxa</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="downloadEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel>Yuklab olishga ruxsat</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Mualliflik huquqi sababli o'chirib qo'yish mumkin (faqat onlayn o'qish qoladi)
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saqlanmoqda..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
