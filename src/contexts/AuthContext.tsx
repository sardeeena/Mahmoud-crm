import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  AppUser,
  signInUser,
  signUpUser,
  resendConfirmationEmail,
  confirmUserEmail,
  resetPasswordRequest,
  updateUserPassword,
  signOutAdmin,
  getCurrentAdminUser,
} from '../services/authService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useToast } from './ToastContext';

export type AuthModalView = 'login' | 'register' | 'forgot' | 'forgot_password' | 'verify' | 'staff';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  authModalView: AuthModalView | null;
  openAuthModal: (view?: AuthModalView) => void;
  closeAuthModal: () => void;
  signIn: (email: string, pass: string) => Promise<{ 
    success: boolean; 
    error?: string; 
    requiresEmailConfirmation?: boolean; 
    unconfirmedEmail?: string 
  }>;
  signUp: (data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    phone?: string;
    countryCode?: string;
    country?: string;
  }) => Promise<{ 
    success: boolean; 
    error?: string; 
    requiresEmailConfirmation?: boolean; 
    needsEmailConfirmation?: boolean;
    email?: string;
    confirmationToken?: string;
  }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  confirmEmail: (email: string, token?: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string; resetCode?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; message?: string; resetCode?: string }>;
  updatePassword: (newPassword: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<AppUser>) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 30 minutes of idle time before automatic session logout for terminal security
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalView, setAuthModalView] = useState<AuthModalView | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openAuthModal = useCallback((view: AuthModalView = 'login') => {
    setAuthModalView(view);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalView(null);
  }, []);

  const updateProfile = async (data: Partial<AppUser>) => {
    if (user) {
      const updated = { ...user, ...data };
      if (data.phone && !data.phoneNumber) {
        updated.phoneNumber = data.phone;
      }
      setUser(updated);
      try {
        localStorage.setItem('redsea_auth_user', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    return { success: true };
  };

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
      showToast('Session expired due to inactivity. Please sign in again.', 'info', 5000);
    }
  }, [showToast]);

  // Reset idle timer on user activity if user is logged in
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (user && (user.role === 'admin' || user.role === 'manager')) {
      idleTimerRef.current = setTimeout(() => {
        handleSignOut(true);
      }, IDLE_TIMEOUT_MS);
    }
  }, [user, handleSignOut]);

  // Activity listeners for idle timeout
  useEffect(() => {
    if (!user || user.role === 'customer') return;

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
      // Exchange code or token_hash if landing directly from an email confirmation link
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const tokenHash = params.get('token_hash');
        const otpType = params.get('type') || 'signup';

        if (code) {
          supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
            if (!error && data?.user) {
              refreshUser();
            }
          }).catch((err) => console.warn('Global PKCE exchange notice:', err));
        } else if (tokenHash) {
          supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (otpType as any) || 'signup',
          }).then(({ data, error }) => {
            if (!error && data?.user) {
              refreshUser();
            }
          }).catch((err) => console.warn('Global verifyOtp notice:', err));
        }
      } catch {
        // ignore
      }

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
    const result = await signInUser(email, pass);
    setUser(result.user);
    setLoading(false);
    return { 
      success: !result.error && !!result.user, 
      error: result.error,
      requiresEmailConfirmation: result.requiresEmailConfirmation,
      unconfirmedEmail: result.unconfirmedEmail,
    };
  };

  const handleSignUp = async (data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    phone?: string;
    countryCode?: string;
    country?: string;
  }) => {
    setLoading(true);
    const result = await signUpUser({
      ...data,
      phoneNumber: data.phoneNumber || data.phone,
    });
    // User is NOT set as active yet because email confirmation is required!
    setLoading(false);
    return { 
      success: !result.error, 
      error: result.error,
      requiresEmailConfirmation: result.requiresEmailConfirmation,
      needsEmailConfirmation: result.requiresEmailConfirmation,
      email: result.email,
      confirmationToken: result.confirmationToken,
    };
  };

  const handleResendConfirmation = async (email: string) => {
    return resendConfirmationEmail(email);
  };

  const handleConfirmEmail = async (email: string, token?: string) => {
    return confirmUserEmail(email, token);
  };

  const handleResetPassword = async (email: string) => {
    return resetPasswordRequest(email);
  };

  const handleUpdatePassword = async (newPassword: string, email?: string) => {
    return updateUserPassword(newPassword, email || user?.email);
  };

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'manager' || user.role === 'staff'));
  const isStaff = isAdmin;
  const isCustomer = Boolean(user && user.role === 'customer');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isStaff,
        isCustomer,
        authModalView,
        openAuthModal,
        closeAuthModal,
        signIn: handleSignIn,
        signUp: handleSignUp,
        resendConfirmation: handleResendConfirmation,
        resendVerification: handleResendConfirmation,
        confirmEmail: handleConfirmEmail,
        resetPassword: handleResetPassword,
        sendPasswordReset: handleResetPassword,
        updatePassword: handleUpdatePassword,
        updateProfile,
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
