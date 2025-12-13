/**
 * App Store
 * Global application state
 */

import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
  toggleNotifications: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  language: 'en',
  notifications: true,

  setTheme: (theme) => set({ theme }),
  
  setLanguage: (language) => set({ language }),
  
  toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
}));
