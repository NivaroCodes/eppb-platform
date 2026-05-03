import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

interface NotificationsState {
  items: Notification[];
  push: (n: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],

  push: (n) => {
    const notification: Notification = {
      ...n,
      id: crypto.randomUUID(),
      read: false,
      timestamp: new Date(),
    };
    set((state) => ({ items: [notification, ...state.items].slice(0, 20) }));
  },

  markRead: (id) => {
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    }));
  },

  markAllRead: () => {
    set((state) => ({ items: state.items.map((item) => ({ ...item, read: true })) }));
  },

  unreadCount: () => get().items.filter((item) => !item.read).length,
}));
