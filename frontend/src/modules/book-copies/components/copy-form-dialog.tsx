import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CopyFormValues } from "@/modules/book-copies/api/book-copies-api";

const COPY_STATUSES = [
  { value: "available", label: "Mavjud" },
  { value: "issued", label: "Berilgan" },
  { value: "reserved", label: "Bron qilingan" },
  { value: "lost", label: "Yo'qolgan" },
  { value: "under_repair", label: "Ta'mirda" },
  { value: "withdrawn", label: "Chiqarilgan" },
  { value: "in_transit", label: "Yo'lda" },
];

const ACQUISITION_TYPES = [
  { value: "purchased", label: "Sotib olingan" },
  { value: "donated", label: "Sovg'a" },
  { value: "exchange", label: "Almashinuv" },
  { value: "subscription", label: "Obuna" },
];

const copySchema = z.object({
  inventoryNumber: z.string().min(1, "Inventar raqami kiritilishi shart"),
  barcode: z.string().min(1, "Barkod kiritilishi shart"),
  status: z.string(),
  price: z.coerce.number().nonnegative().optional(),
  acquisitionType: z.string(),
  acquisitionDate: z.string().optional(),
  conditionNotes: z.string().optional(),
});

type CopyDialogValues = z.infer<typeof copySchema>;

interface CopyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<CopyFormValues>;
  onSubmit: (values: CopyDialogValues) => void;
  isSubmitting?: boolean;
}

export function CopyFormDialog({ open, onOpenChange, defaultValues, onSubmit, isSubmitting }: CopyFormDialogProps) {
  const form = useForm<CopyDialogValues>({
    resolver: zodResolver(copySchema),
    defaultValues: {
      inventoryNumber: defaultValues?.inventoryNumber ?? "",
      barcode: defaultValues?.barcode ?? "",
      status: defaultValues?.status ?? "available",
      acquisitionType: defaultValues?.acquisitionType ?? "purchased",
      price: defaultValues?.price,
      acquisitionDate: defaultValues?.acquisitionDate,
      conditionNotes: defaultValues?.conditionNotes,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        inventoryNumber: defaultValues?.inventoryNumber ?? "",
        barcode: defaultValues?.barcode ?? "",
        status: defaultValues?.status ?? "available",
        acquisitionType: defaultValues?.acquisitionType ?? "purchased",
        price: defaultValues?.price,
        acquisitionDate: defaultValues?.acquisitionDate,
        conditionNotes: defaultValues?.conditionNotes,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Nusxani tahrirlash" : "Yangi nusxa qo'shish"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inventoryNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventar raqami</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barkod</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holati</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COPY_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
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
                name="acquisitionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manba</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACQUISITION_TYPES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narxi</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="acquisitionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelgan sana</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
