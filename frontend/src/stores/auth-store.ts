import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "director" | "administrator" | "librarian" | "operator" | "teacher" | "reader";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  isInitializing: boolean;
  setSession: (session: Session | null) => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  isInitializing: true,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      role: (session?.user?.app_metadata?.role as AppRole | undefined) ?? null,
    }),
  setInitializing: (value) => set({ isInitializing: value }),
}));
