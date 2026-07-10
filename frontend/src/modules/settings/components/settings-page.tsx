import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { listSettings, updateSetting } from "@/modules/settings/api/settings-api";

const LABELS: Record<string, string> = {
  "circulation.default_loan_days": "Standart berish muddati (kun)",
  "circulation.max_renewals": "Maksimal uzaytirish soni",
  "circulation.max_active_loans": "Bir kitobxon uchun maksimal faol qarz",
  "circulation.overdue_fine_per_day": "Kunlik jarima summasi (so'm)",
  "electronic_library.download_enabled_default": "Yangi fayllar uchun yuklab olish (standart)",
};

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: listSettings });
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      setValues(Object.fromEntries(data.map((s) => [s.key, JSON.stringify(s.value)])));
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Saqlandi");
    },
    onError: () => toast.error("Saqlab bo'lmadi"),
  });

  function handleSave(key: string) {
    try {
      const parsed = JSON.parse(values[key] ?? "null");
      mutation.mutate({ key, value: parsed });
    } catch {
      toast.error("Noto'g'ri qiymat");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sozlamalar</h1>
        <p className="text-sm text-muted-foreground">Tizim konfiguratsiyasi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kitob aylanishi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          ) : (
            data?.map((setting) => (
              <div key={setting.key} className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label>{LABELS[setting.key] ?? setting.key}</Label>
                  <Input
                    value={values[setting.key] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                  />
                </div>
                <Button variant="outline" onClick={() => handleSave(setting.key)} disabled={mutation.isPending}>
                  Saqlash
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
