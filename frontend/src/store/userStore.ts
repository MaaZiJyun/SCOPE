import { UserInfo } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setUserInfo: (userInfo: UserInfo) => void;
  clearUserInfo: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userInfo: null,
      isAuthenticated: false,
      hasHydrated: false,

      setUserInfo: (userInfo: UserInfo) =>
        set({ userInfo, isAuthenticated: true }),
      clearUserInfo: () =>
        set({ userInfo: null, isAuthenticated: false }),
      setHasHydrated: (hydrated: boolean) =>
        set({ hasHydrated: hydrated }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
