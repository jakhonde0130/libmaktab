import { Plus } from "lucide-react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api-client";
import { useReaders } from "@/modules/readers/hooks/use-readers";
import { registerAccount } from "@/modules/readers/api/readers-api";
import { useQueryClient } from "@tanstack/react-query";

const ROLE_OPTIONS = [
  { value: "administrator", label: "Administrator" },
  { value: "librarian", label: "Kutubxonachi" },
  { value: "operator", label: "Operator" },
  { value: "teacher", label: "O'qituvchi" },
];

const ROLE_LABEL: Record<string, string> = {
  director: "Direktor",
  administrator: "Administrator",
  librarian: "Kutubxonachi",
  operator: "Operator",
  teacher: "O'qituvchi",
};

const staffSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["administrator", "librarian", "operator", "teacher"]),
});
type StaffValues = z.infer<typeof staffSchema>;

export function StaffTab() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading } = useReaders({ page: "1", pageSize: "50" });
  const staff = data?.data.filter((r) => r.role !== "reader") ?? [];

  const form = useForm<StaffValues>({ resolver: zodResolver(staffSchema), defaultValues: { role: "librarian" } });

  async function onSubmit(values: StaffValues) {
    try {
      await registerAccount({ ...values, readerCategory: "staff" });
      toast.success("Xodim yaratildi");
      queryClient.invalidateQueries({ queryKey: ["readers"] });
      form.reset({ role: "librarian" });
      setOpen(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Xatolik yuz berdi";
      toast.error("Yaratib bo'lmadi", { description: message });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Yangi xodim
        </Button>
      </div>

      {isLoading ? null : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ism</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Holati</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.full_name}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ROLE_LABEL[s.role] ?? s.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={s.status === "active" ? "secondary" : "destructive"}>
                    {s.status === "active" ? "Faol" : "Bloklangan"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi xodim</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parol</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Yaratish</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
