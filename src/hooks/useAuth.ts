/**
 * Custom Hooks for Authentication
 */

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import AuthService from '../services/authService';

/**
 * Hook to initialize auth state and listen to auth changes
 */
export const useAuthInit = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    setLoading(true);
    
    // Listen to auth state changes
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await AuthService.getUserData(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);
};

/**
 * Hook to get current user
 */
export const useAuth = () => {
  const { user, loading, error, isAuthenticated } = useAuthStore();
  return { user, loading, error, isAuthenticated };
};

/**
 * Hook to check if user is authenticated
 */
export const useRequireAuth = () => {
  const { isAuthenticated, loading } = useAuthStore();
  return { isAuthenticated, loading };
};
