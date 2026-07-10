import { apiClient } from "@/lib/api-client";
import type { UserProfile } from "@/modules/auth/types/user-profile";

export function getMe() {
  return apiClient.get<{ data: UserProfile }>("/auth/me").then((res) => res.data);
}
