import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClass, deleteClass, listClasses, updateClass } from "@/modules/classes/api/classes-api";
import type { ClassFormValues } from "@/modules/classes/types/class";

export function useClasses() {
  return useQuery({ queryKey: ["classes"], queryFn: listClasses, staleTime: 60_000 });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ClassFormValues) => createClass(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ClassFormValues> }) => updateClass(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}
