import { apiClient } from "@/lib/api-client";
import type { ClassFormValues, SchoolClass } from "@/modules/classes/types/class";

export const listClasses = () => apiClient.get<{ data: SchoolClass[] }>("/classes").then((res) => res.data);

export const createClass = (values: ClassFormValues) =>
  apiClient.post<{ data: SchoolClass }>("/classes", values).then((res) => res.data);

export const updateClass = (id: string, values: Partial<ClassFormValues>) =>
  apiClient.patch<{ data: SchoolClass }>(`/classes/${id}`, values).then((res) => res.data);

export const deleteClass = (id: string) => apiClient.delete<void>(`/classes/${id}`);
