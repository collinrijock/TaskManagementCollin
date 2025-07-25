import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthenticatedUser } from "../types";

interface AuthState {
  user: AuthenticatedUser | null;
  login: (user: AuthenticatedUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
