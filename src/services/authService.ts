import { supabase, isSupabaseConfigured, formatSupabaseError } from './supabaseClient';
import { UserRole } from '../types/database';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  isDemo?: boolean;
}

export interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
}

const DEMO_ADMIN: AdminUser = {
  id: 'demo-admin-uuid-000000000001',
  email: 'admin@redseavoyages.com',
  fullName: 'Captain Youssef (Super Admin)',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  isDemo: true,
};

/**
 * Validates role from database profiles table.
 * Crucial security requirement: A logged-in customer user must NOT have admin access.
 */
export async function getProfileRole(userId: string): Promise<UserRole | null> {
  if (!isSupabaseConfigured()) {
    return 'admin';
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data.role as UserRole;
  } catch {
    return null;
  }
}

/**
 * Authenticates user and checks role permission
 */
export async function signInAdmin(email: string, password: string): Promise<{ user: AdminUser | null; error?: string }> {
  // If in demo fallback or credentials match demo admin
  if (!isSupabaseConfigured() || (email.toLowerCase() === 'admin@redseavoyages.com' && password === 'admin123')) {
    localStorage.setItem('rse_demo_admin', 'true');
    return { user: DEMO_ADMIN };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return { user: null, error: formatSupabaseError(error) };
    }

    // Role verification against profiles table
    const role = await getProfileRole(data.user.id);
    if (!role || (role !== 'admin' && role !== 'manager' && role !== 'staff')) {
      await supabase.auth.signOut();
      return {
        user: null,
        error: 'Access denied: Your account exists but does not have administrator privileges. Please contact the system administrator.',
      };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    const adminUser: AdminUser = {
      id: data.user.id,
      email: data.user.email || email,
      fullName: profile?.full_name || data.user.user_metadata?.full_name || 'Admin Officer',
      role,
      avatarUrl: profile?.avatar_url,
      isDemo: false,
    };

    return { user: adminUser };
  } catch (err) {
    return { user: null, error: formatSupabaseError(err) };
  }
}

/**
 * Signs out current user
 */
export async function signOutAdmin(): Promise<void> {
  localStorage.removeItem('rse_demo_admin');
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
}

/**
 * Checks current session on startup
 */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const isDemo = localStorage.getItem('rse_demo_admin') === 'true';
  if (isDemo || !isSupabaseConfigured()) {
    if (isDemo) return DEMO_ADMIN;
  }

  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return null;

    const role = await getProfileRole(session.user.id);
    if (!role || (role !== 'admin' && role !== 'manager' && role !== 'staff')) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    return {
      id: session.user.id,
      email: session.user.email || '',
      fullName: profile?.full_name || session.user.user_metadata?.full_name || 'Admin Officer',
      role,
      avatarUrl: profile?.avatar_url,
      isDemo: false,
    };
  } catch {
    return null;
  }
}
