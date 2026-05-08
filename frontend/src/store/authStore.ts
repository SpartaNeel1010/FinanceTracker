import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export interface User {
  id: number;
  email: string;
  name: string;
  currency: string;
  monthly_budget: number | null;
  avatar_url: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          localStorage.setItem('spendsense_token', data.access_token);
          set({ user: data.user, token: data.access_token, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', { name, email, password });
          localStorage.setItem('spendsense_token', data.access_token);
          set({ user: data.user, token: data.access_token, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('spendsense_token');
        set({ user: null, token: null });
        window.location.href = '/login';
      },

      updateUser: async (data) => {
        const { data: updated } = await api.patch('/auth/me', data);
        set({ user: updated });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data });
        } catch {
          // Token invalid
        }
      },
    }),
    {
      name: 'spendsense-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
