import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens, LawyerProfile } from '@/types';
import { api } from '@/lib/api';

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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      lawyerProfile: null,
      isLoading: false,
      isAuthenticated: false,

      setAuth: (user, tokens, lawyerProfile) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        set({
          user,
          tokens,
          lawyerProfile: lawyerProfile || null,
          isAuthenticated: true,
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
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
        } catch (error) {
          set({
            user: null,
            tokens: null,
            lawyerProfile: null,
            isAuthenticated: false,
          });
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        lawyerProfile: state.lawyerProfile,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

