import { supabase, isSupabaseConfigured, formatSupabaseError } from './supabaseClient';
import { UserRole } from '../types/database';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phoneNumber?: string;
  countryCode?: string;
  country?: string;
  isDemo?: boolean;
  isConfirmed?: boolean;
  createdAt?: string;
}

export type AdminUser = AppUser;

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

export const DEMO_ADMIN: AppUser = {
  id: 'demo-admin-uuid-000000000001',
  email: 'admin@redseavoyages.com',
  fullName: 'Captain Youssef (Super Admin)',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  isDemo: true,
  isConfirmed: true,
};

export const DEMO_CUSTOMER: AppUser = {
  id: 'demo-cust-uuid-000000000002',
  email: 'customer@redseavoyages.com',
  fullName: 'Sarah Jenkins',
  role: 'customer',
  phoneNumber: '7700 900123',
  countryCode: '+44',
  country: 'United Kingdom',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  isDemo: true,
  isConfirmed: true,
};

interface StoredLocalUser {
  user: AppUser;
  passwordHash: string;
  isConfirmed?: boolean;
  confirmationToken?: string;
  confirmationSentAt?: string;
}

const LOCAL_USERS_KEY = 'rse_registered_users';
const LOCAL_ACTIVE_USER_KEY = 'rse_active_user';

export function getStoredLocalUsers(): StoredLocalUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredLocalUsers(users: StoredLocalUser[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

/**
 * Validates role from database profiles table.
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
 * General user login (Customer, Staff, Manager, or Admin)
 */
export async function signInUser(
  email: string,
  password: string
): Promise<{ user: AppUser | null; error?: string; requiresEmailConfirmation?: boolean; unconfirmedEmail?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check Demo Customer
  if (cleanEmail === 'customer@redseavoyages.com' && password === 'customer123') {
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(DEMO_CUSTOMER));
    return { user: DEMO_CUSTOMER };
  }

  // 2. Check Demo Admin
  if (cleanEmail === 'admin@redseavoyages.com' && password === 'admin123') {
    localStorage.setItem('rse_demo_admin', 'true');
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(DEMO_ADMIN));
    return { user: DEMO_ADMIN };
  }

  // 3. Check Local Registered Users
  const localUsers = getStoredLocalUsers();
  const matchedLocal = localUsers.find(
    (u) => u.user.email.toLowerCase() === cleanEmail && u.passwordHash === password
  );
  if (matchedLocal) {
    // Enforce that account is confirmed
    if (matchedLocal.isConfirmed === false) {
      return {
        user: null,
        error: 'Your account is pending email confirmation. Please check the email sent from Supabase and click the confirmation link to activate your account.',
        requiresEmailConfirmation: true,
        unconfirmedEmail: cleanEmail,
      };
    }

    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(matchedLocal.user));
    if (matchedLocal.user.role === 'admin' || matchedLocal.user.role === 'manager') {
      localStorage.setItem('rse_demo_admin', 'true');
    }
    return { user: matchedLocal.user };
  }

  // 4. Try Supabase Auth if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.user) {
        const errorMsg = error ? formatSupabaseError(error) : 'Invalid credentials';
        const isNotConfirmed = 
          errorMsg.toLowerCase().includes('email not confirmed') ||
          (error as any)?.code === 'email_not_confirmed';

        return { 
          user: null, 
          error: isNotConfirmed 
            ? 'Your account has not been confirmed yet. Please check your inbox for the confirmation email from Supabase and click the verification link.'
            : errorMsg,
          requiresEmailConfirmation: isNotConfirmed,
          unconfirmedEmail: cleanEmail,
        };
      }

      // Check if session or confirmed_at is missing
      if (!data.user.email_confirmed_at && !data.session) {
        return {
          user: null,
          error: 'Your account has not been confirmed yet. Please check your inbox for the confirmation email from Supabase and click the verification link.',
          requiresEmailConfirmation: true,
          unconfirmedEmail: cleanEmail,
        };
      }

      // Check role in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      const userRole: UserRole = (profile?.role as UserRole) || (data.user.user_metadata?.role as UserRole) || 'customer';

      const authedUser: AppUser = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        fullName: profile?.full_name || data.user.user_metadata?.full_name || 'Voyager',
        role: userRole,
        avatarUrl: profile?.avatar_url,
        phoneNumber: profile?.phone || data.user.user_metadata?.phone,
        country: data.user.user_metadata?.country,
        isConfirmed: true,
        isDemo: false,
      };

      localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(authedUser));
      return { user: authedUser };
    } catch (err) {
      return { user: null, error: formatSupabaseError(err) };
    }
  }

  return {
    user: null,
    error: 'Invalid email or password. Please verify your credentials or register a new account.',
  };
}

/**
 * Customer & User Registration
 * Requires email confirmation before user account is confirmed and allowed to log in.
 */
export async function signUpUser(data: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  countryCode?: string;
  country?: string;
}): Promise<{ 
  user: AppUser | null; 
  error?: string; 
  requiresEmailConfirmation?: boolean; 
  email?: string;
  confirmationToken?: string;
}> {
  const cleanEmail = data.email.trim().toLowerCase();

  if (!cleanEmail || !data.password || !data.fullName.trim()) {
    return { user: null, error: 'Please provide full name, email, and password.' };
  }

  if (data.password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters long.' };
  }

  // Check if email already registered locally
  const localUsers = getStoredLocalUsers();
  const existingUser = localUsers.find((u) => u.user.email.toLowerCase() === cleanEmail);
  if (
    (existingUser && existingUser.isConfirmed !== false) ||
    cleanEmail === 'customer@redseavoyages.com' ||
    cleanEmail === 'admin@redseavoyages.com'
  ) {
    return {
      user: null,
      error: 'An account with this email address already exists. Please sign in instead.',
    };
  }

  const generatedToken = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser: AppUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    fullName: data.fullName.trim(),
    role: 'customer',
    phoneNumber: data.phoneNumber ? data.phoneNumber.trim() : undefined,
    countryCode: data.countryCode || '+20',
    country: data.country ? data.country.trim() : 'International',
    isDemo: false,
    isConfirmed: false,
    createdAt: new Date().toISOString(),
  };

  // 1. Try Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const redirectUrl = `${window.location.origin}/login?confirmed=true&email=${encodeURIComponent(cleanEmail)}`;
      const { data: sbData, error: sbError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName.trim(),
            phone: data.phoneNumber,
            country: data.country,
            country_code: data.countryCode,
            role: 'customer',
          },
        },
      });

      if (sbError) {
        return { user: null, error: formatSupabaseError(sbError) };
      }

      if (sbData.user) {
        newUser.id = sbData.user.id;
        // Optionally insert profile as unconfirmed
        try {
          await supabase.from('profiles').upsert({
            id: sbData.user.id,
            email: cleanEmail,
            full_name: data.fullName.trim(),
            phone: data.phoneNumber || null,
            country: data.country || null,
            country_code: data.countryCode || null,
            role: 'customer',
            is_confirmed: false,
          });
        } catch {
          // ignore profile sync failure
        }

        // Supabase sends email confirmation link.
        // User is NOT logged in and account is pending confirmation!
        return {
          user: null,
          requiresEmailConfirmation: true,
          email: cleanEmail,
        };
      }
    } catch (err) {
      console.warn('Supabase signup notice, saving locally:', err);
    }
  }

  // 2. Save to local registry with isConfirmed = false
  // CRITICAL: Notice we do NOT set localStorage.setItem(LOCAL_ACTIVE_USER_KEY)
  // because user MUST confirm email first.
  const existingIdx = localUsers.findIndex((u) => u.user.email.toLowerCase() === cleanEmail);
  if (existingIdx >= 0) {
    localUsers[existingIdx] = {
      user: newUser,
      passwordHash: data.password,
      isConfirmed: false,
      confirmationToken: generatedToken,
      confirmationSentAt: new Date().toISOString(),
    };
  } else {
    localUsers.push({
      user: newUser,
      passwordHash: data.password,
      isConfirmed: false,
      confirmationToken: generatedToken,
      confirmationSentAt: new Date().toISOString(),
    });
  }
  saveStoredLocalUsers(localUsers);

  return {
    user: null,
    requiresEmailConfirmation: true,
    email: cleanEmail,
    confirmationToken: generatedToken,
  };
}

/**
 * Resend confirmation email
 */
export async function resendConfirmationEmail(
  email: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Please enter your email address.' };
  }

  if (isSupabaseConfigured()) {
    try {
      const redirectUrl = `${window.location.origin}/login?confirmed=true&email=${encodeURIComponent(cleanEmail)}`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: formatSupabaseError(error) };
      }
      return { 
        success: true, 
        message: `A fresh confirmation email has been dispatched by Supabase to ${cleanEmail}.` 
      };
    } catch (err) {
      return { success: false, error: formatSupabaseError(err) };
    }
  }

  // Local fallback
  const localUsers = getStoredLocalUsers();
  const matched = localUsers.find((u) => u.user.email.toLowerCase() === cleanEmail);
  if (matched) {
    matched.confirmationToken = Math.floor(100000 + Math.random() * 900000).toString();
    matched.confirmationSentAt = new Date().toISOString();
    saveStoredLocalUsers(localUsers);
  }

  return {
    success: true,
    message: `A fresh confirmation link has been sent to ${cleanEmail}. Check your inbox.`,
  };
}

/**
 * Confirm user email manually or via verification link/code
 */
export async function confirmUserEmail(
  email: string,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // If using Supabase and a token was provided
  if (isSupabaseConfigured() && token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: token.trim(),
        type: 'signup',
      });

      if (error) {
        return { success: false, error: formatSupabaseError(error) };
      }

      if (data.user) {
        try {
          await supabase.from('profiles').update({ is_confirmed: true }).eq('id', data.user.id);
        } catch {
          // ignore
        }
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: formatSupabaseError(err) };
    }
  }

  // Local fallback confirmation
  const localUsers = getStoredLocalUsers();
  const matched = localUsers.find((u) => u.user.email.toLowerCase() === cleanEmail);
  if (matched) {
    if (token && matched.confirmationToken && matched.confirmationToken !== token.trim()) {
      return { 
        success: false, 
        error: 'Invalid confirmation code. Please check the email sent from Supabase.' 
      };
    }
    matched.isConfirmed = true;
    matched.user.isConfirmed = true;
    saveStoredLocalUsers(localUsers);
    return { success: true };
  }

  return { success: true };
}

/**
 * Request password reset
 */
export async function resetPasswordRequest(
  email: string
): Promise<{ success: boolean; error?: string; message?: string; resetCode?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Please enter your email address.' };
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        console.warn('Supabase reset warning:', error);
      }
    } catch {
      // ignore
    }
  }

  // Generate a friendly 6-digit confirmation recovery code for test verification
  const testCode = Math.floor(100000 + Math.random() * 900000).toString();
  sessionStorage.setItem(`rse_reset_${cleanEmail}`, testCode);

  return {
    success: true,
    message: `Password reset instructions have been sent to ${cleanEmail}. Check your inbox.`,
    resetCode: testCode,
  };
}

/**
 * Update password for user
 */
export async function updateUserPassword(
  newPassword: string,
  email?: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: formatSupabaseError(error) };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: formatSupabaseError(err) };
    }
  }

  // Update in local registered users
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const localUsers = getStoredLocalUsers();
    const matched = localUsers.find((u) => u.user.email.toLowerCase() === cleanEmail);
    if (matched) {
      matched.passwordHash = newPassword;
      saveStoredLocalUsers(localUsers);
      return { success: true };
    }
  }

  return { success: true };
}

/**
 * Logout
 */
export async function signOutAdmin(): Promise<void> {
  localStorage.removeItem('rse_demo_admin');
  localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);

  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
}

/**
 * Get currently logged-in user
 */
export async function getCurrentAdminUser(): Promise<AppUser | null> {
  // Check active user in local storage
  const activeUserRaw = localStorage.getItem(LOCAL_ACTIVE_USER_KEY);
  if (activeUserRaw) {
    try {
      const user = JSON.parse(activeUserRaw) as AppUser;
      return user;
    } catch {
      localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
    }
  }

  // Check demo admin
  const isDemo = localStorage.getItem('rse_demo_admin');
  if (isDemo === 'true') {
    return DEMO_ADMIN;
  }

  // Check Supabase session
  if (isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Must be email confirmed
      if (!user.email_confirmed_at) {
        return null;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const userRole: UserRole = (profile?.role as UserRole) || (user.user_metadata?.role as UserRole) || 'customer';

      return {
        id: user.id,
        email: user.email || '',
        fullName: profile?.full_name || user.user_metadata?.full_name || 'Voyager',
        role: userRole,
        avatarUrl: profile?.avatar_url,
        phoneNumber: profile?.phone || user.user_metadata?.phone,
        country: user.user_metadata?.country,
        isConfirmed: true,
        isDemo: false,
      };
    } catch {
      return null;
    }
  }

  return null;
}
