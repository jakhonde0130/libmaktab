import { apiClient } from "@/lib/api-client";

export interface Setting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
}

export const listSettings = () => apiClient.get<{ data: Setting[] }>("/settings").then((res) => res.data);

export const updateSetting = (key: string, value: unknown) =>
  apiClient.patch<{ data: Setting }>(`/settings/${key}`, { value }).then((res) => res.data);
