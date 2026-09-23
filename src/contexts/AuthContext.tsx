import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, signInAdmin, signOutAdmin, getCurrentAdminUser } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const current = await getCurrentAdminUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  const handleSignIn = async (email: string, pass: string) => {
    setLoading(true);
    const { user: authedUser, error } = await signInAdmin(email, pass);
    setUser(authedUser);
    setLoading(false);
    return { success: !error && !!authedUser, error };
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOutAdmin();
    setUser(null);
    setLoading(false);
  };

  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'manager'));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        signIn: handleSignIn,
        signOut: handleSignOut,
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
