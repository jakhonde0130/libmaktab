import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/modules/auth/api/get-me";
import { useAuthStore } from "@/stores/auth-store";

export function useMe() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: !!session,
    staleTime: 5 * 60_000,
  });
}
