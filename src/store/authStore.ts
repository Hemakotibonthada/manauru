/**
 * Auth Store
 * Global state management for authentication
 */

import { create } from 'zustand';
import { User } from '../types';
import AuthService from '../services/authService';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, phoneNumber?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const user = await AuthService.signIn(email, password);
      set({ user, isAuthenticated: true, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signUp: async (email, password, displayName, phoneNumber) => {
    try {
      set({ loading: true, error: null });
      const user = await AuthService.registerUser(email, password, displayName, phoneNumber);
      set({ user, isAuthenticated: true, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await AuthService.signOut();
      set({ user: null, isAuthenticated: false, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProfile: async (updates) => {
    try {
      const { user } = get();
      if (!user) throw new Error('No user logged in');
      
      set({ loading: true, error: null });
      await AuthService.updateUserProfile(user.id, updates);
      set({ user: { ...user, ...updates }, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
