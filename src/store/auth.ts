import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens, LawyerProfile } from '@/types';
import { api } from '@/lib/api';
import { clearTokens, setTokens } from '@/lib/auth/token-storage';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  lawyerProfile: LawyerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens, lawyerProfile?: LawyerProfile) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLawyerProfile: (profile: LawyerProfile | null) => void;
  checkAuth: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      lawyerProfile: null,
      isLoading: true,
      isAuthenticated: false,

      setHasHydrated: (value) => set({ isLoading: !value }),

      setAuth: (user, tokens, lawyerProfile) => {
        setTokens(tokens);
        set({
          user,
          tokens,
          lawyerProfile: lawyerProfile || null,
          isAuthenticated: true,
        });
      },

      logout: () => {
        clearTokens();
        set({
          user: null,
          tokens: null,
          lawyerProfile: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      setLawyerProfile: (profile) => {
        set({ lawyerProfile: profile });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const data = await api.getProfile();
          set({
            user: data as User,
            lawyerProfile: data.lawyerProfile || null,
            isAuthenticated: true,
          });
        } catch {
          clearTokens();
          set({
            user: null,
            tokens: null,
            lawyerProfile: null,
            isAuthenticated: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        lawyerProfile: state.lawyerProfile,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.tokens) {
          setTokens(state.tokens);
        }
        // Mark hydration done — isLoading was true by default so every
        // page waits here before running auth redirect checks.
        state?.setHasHydrated(true);
      },
    },
  ),
);
