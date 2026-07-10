import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import { useClasses } from "@/modules/classes/hooks/use-classes";
import { LibraryCardDialog } from "@/modules/readers/components/library-card";
import { useReader, useSetReaderStatus, useUpdateReader } from "@/modules/readers/hooks/use-readers";

const CATEGORY_OPTIONS = [
  { value: "student", label: "O'quvchi" },
  { value: "teacher", label: "O'qituvchi" },
  { value: "staff", label: "Xodim" },
  { value: "external", label: "Tashqi foydalanuvchi" },
];

const NONE = "__none__";

const updateSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  pinfl: z.string().optional(),
  classId: z.string().optional(),
  readerCategory: z.enum(["student", "teacher", "staff", "external"]),
});
type UpdateValues = z.infer<typeof updateSchema>;

export function ReaderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: reader, isLoading } = useReader(id!);
  const { data: classes } = useClasses();
  const updateReader = useUpdateReader(id!);
  const setStatus = useSetReaderStatus();
  const [cardOpen, setCardOpen] = useState(false);

  const form = useForm<UpdateValues>({ resolver: zodResolver(updateSchema) });

  useEffect(() => {
    if (reader) {
      form.reset({
        fullName: reader.full_name,
        phone: reader.phone ?? undefined,
        pinfl: reader.pinfl ?? undefined,
        classId: reader.class?.id,
        readerCategory: reader.reader_category,
      });
    }
  }, [reader, form]);

  async function onSubmit(values: UpdateValues) {
    try {
      await updateReader.mutateAsync({
        ...values,
        classId: values.classId === NONE ? null : values.classId,
      });
      toast.success("Ma'lumotlar yangilandi");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Saqlab bo'lmadi", { description: message });
    }
  }

  async function toggleStatus() {
    if (!reader) return;
    const next = reader.status === "active" ? "blocked" : "active";
    await setStatus.mutateAsync({ id: reader.id, status: next });
    toast.success(next === "active" ? "Hisob faollashtirildi" : "Hisob bloklandi");
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!reader) {
    return <p className="text-muted-foreground">Kitobxon topilmadi</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            {reader.photo_url ? <AvatarImage src={reader.photo_url} /> : null}
            <AvatarFallback className="text-lg">{reader.full_name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{reader.full_name}</h1>
            <p className="font-mono text-sm text-muted-foreground">{reader.library_card_barcode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={reader.status === "active" ? "secondary" : "destructive"}>
            {reader.status === "active" ? "Faol" : "Bloklangan"}
          </Badge>
          <Button variant="outline" onClick={() => setCardOpen(true)}>
            <CreditCard className="size-4" />
            Kartani chop etish
          </Button>
          <Button variant="outline" onClick={toggleStatus}>
            {reader.status === "active" ? "Bloklash" : "Faollashtirish"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>FISH</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pinfl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>JSHSHIR</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="readerCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lavozim</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sinf</FormLabel>
                    <Select value={field.value || NONE} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tanlanmagan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Tanlanmagan</SelectItem>
                        {classes?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-2">
                <Button type="submit" disabled={updateReader.isPending}>
                  {updateReader.isPending ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <LibraryCardDialog reader={reader} open={cardOpen} onOpenChange={setCardOpen} />
    </div>
  );
}
