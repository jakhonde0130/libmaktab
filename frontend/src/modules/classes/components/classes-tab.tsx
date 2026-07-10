import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ApiError } from "@/lib/api-client";
import { useClasses, useCreateClass, useDeleteClass } from "@/modules/classes/hooks/use-classes";
import { useReaders } from "@/modules/readers/hooks/use-readers";

const NONE = "__none__";

const classSchema = z.object({
  gradeNumber: z.coerce.number().int().min(1).max(11),
  section: z.string().min(1).max(5),
  homeroomTeacherId: z.string().optional(),
});
type ClassValues = z.infer<typeof classSchema>;

export function ClassesTab() {
  const { data: classes, isLoading } = useClasses();
  const { data: teachersData } = useReaders({ role: "teacher", page: "1", pageSize: "100" });
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<ClassValues>({ resolver: zodResolver(classSchema) });

  async function onSubmit(values: ClassValues) {
    try {
      await createClass.mutateAsync({
        ...values,
        homeroomTeacherId: values.homeroomTeacherId === NONE ? undefined : values.homeroomTeacherId,
      });
      toast.success("Sinf yaratildi");
      form.reset();
      setOpen(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Yaratib bo'lmadi", { description: message });
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    await deleteClass.mutateAsync(deletingId);
    toast.success("Sinf o'chirildi");
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Yangi sinf
        </Button>
      </div>

      {!isLoading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sinf</TableHead>
              <TableHead>Sinf rahbari</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.homeroom_teacher?.full_name ?? "—"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setDeletingId(c.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi sinf</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gradeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sinf raqami (1-11)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={11} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harf (A, B, V...)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="homeroomTeacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sinf rahbari</FormLabel>
                    <Select value={field.value || NONE} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tanlanmagan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>Tanlanmagan</SelectItem>
                        {teachersData?.data.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createClass.isPending}>
                  Yaratish
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Sinfni o'chirish"
        description="Bu sinf o'chiriladi. Unga bog'langan o'quvchilar sinfsiz qoladi."
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
