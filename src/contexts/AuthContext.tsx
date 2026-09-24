import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AdminUser, signInAdmin, signOutAdmin, getCurrentAdminUser } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 30 minutes of idle time before automatic session logout for terminal security
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const current = await getCurrentAdminUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async (isAutoLogout = false) => {
    setLoading(true);
    await signOutAdmin();
    setUser(null);
    setLoading(false);

    if (isAutoLogout) {
      showToast('Admin session expired due to inactivity. Please sign in again.', 'info', 5000);
    }
  }, [showToast]);

  // Reset idle timer on user activity if admin is logged in
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (user) {
      idleTimerRef.current = setTimeout(() => {
        handleSignOut(true);
      }, IDLE_TIMEOUT_MS);
    }
  }, [user, handleSignOut]);

  // Activity listeners for idle timeout
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimer();

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [user, resetIdleTimer]);

  useEffect(() => {
    refreshUser();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [refreshUser]);

  const handleSignIn = async (email: string, pass: string) => {
    setLoading(true);
    const { user: authedUser, error } = await signInAdmin(email, pass);
    setUser(authedUser);
    setLoading(false);
    return { success: !error && !!authedUser, error };
  };

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'manager'));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        signIn: handleSignIn,
        signOut: () => handleSignOut(false),
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
