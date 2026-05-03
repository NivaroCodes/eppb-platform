import { create } from 'zustand';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  role: UserRole;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  login: (role: UserRole, name: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'eppb.auth.user';

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if ((parsed.role === 'admin' || parsed.role === 'user') && parsed.name) {
      return parsed;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: readStoredUser(),

  login: (role, name) => {
    const user = { role, name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null });
  },
}));
