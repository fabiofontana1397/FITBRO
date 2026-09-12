import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appJsonStorage } from '@/store/storage';

export type Account = {
  name: string;
  email: string;
  password: string;
};

type AuthState = {
  account: Account | null;
  isAuthenticated: boolean;
  register: (account: Account) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

/**
 * Local-only mock auth: there is no backend yet, so "login" just checks
 * against the single account persisted on this device. Good enough to
 * gate the app behind a real welcome/sign-in flow now; swap for real
 * auth once a backend exists.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      account: null,
      isAuthenticated: false,
      register: (account) => set({ account, isAuthenticated: true }),
      login: (email, password) => {
        const { account } = get();
        if (account && account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    { name: 'fitbro/auth', storage: appJsonStorage }
  )
);
