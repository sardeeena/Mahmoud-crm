import { supabase, isSupabaseConfigured, formatSupabaseError } from './supabaseClient';
import { UserRole } from '../types/database';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phoneNumber?: string;
  phone?: string;
  countryCode?: string;
  country?: string;
  isConfirmed?: boolean;
  createdAt?: string;
}

export type AdminUser = AppUser;

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

interface StoredLocalUser {
  user: AppUser;
  passwordHash: string;
  isConfirmed?: boolean;
  confirmationToken?: string;
  confirmationSentAt?: string;
}

export const LOCAL_USERS_KEY = 'rse_registered_users';
export const LOCAL_ACTIVE_USER_KEY = 'rse_active_user';

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

  // 1. Try Supabase Auth FIRST if configured (Supabase is source of truth for email verification)
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
        // Check if account email is verified
        const isEmailConfirmed = Boolean(
          data.user.email_confirmed_at ||
          (data.user as any)?.confirmed_at ||
          data.session
        );

        if (!isEmailConfirmed) {
          return {
            user: null,
            error: 'Your account has not been confirmed yet. Please check your inbox for the confirmation email from Supabase and click the verification link.',
            requiresEmailConfirmation: true,
            unconfirmedEmail: cleanEmail,
          };
        }

        // Check or update role in profiles table
        let userRole: UserRole = (data.user.user_metadata?.role as UserRole) || 'customer';
        let profileFullName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Voyager';
        let profilePhone = data.user.user_metadata?.phone;
        let profileCountry = data.user.user_metadata?.country;
        let profileAvatar = data.user.user_metadata?.avatar_url;

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile) {
            if (profile.role) userRole = profile.role as UserRole;
            if (profile.full_name) profileFullName = profile.full_name;
            if (profile.phone) profilePhone = profile.phone;
            if (profile.avatar_url) profileAvatar = profile.avatar_url;
            if (profile.country) profileCountry = profile.country;

            // Ensure profile is marked confirmed
            if (!profile.is_confirmed) {
              await supabase.from('profiles').update({ is_confirmed: true }).eq('id', data.user.id);
            }
          } else {
            // Self-healing: if the user account existed in auth.users without a profiles row, create it
            const newProfile = {
              id: data.user.id,
              email: cleanEmail,
              full_name: profileFullName,
              role: userRole,
              phone: profilePhone || null,
              country: profileCountry || null,
              is_confirmed: true,
            };
            const { data: createdProfile } = await supabase
              .from('profiles')
              .upsert(newProfile)
              .select('*')
              .maybeSingle();

            if (createdProfile?.role) {
              userRole = createdProfile.role as UserRole;
            }
          }
        } catch (err) {
          console.warn('Profile sync notice during signInUser:', err);
        }

        // Sync local registered copy if it exists so local storage reflects confirmed status
        const localUsers = getStoredLocalUsers();
        const matchedLocal = localUsers.find((u) => u.user.email.toLowerCase() === cleanEmail);
        if (matchedLocal) {
          matchedLocal.isConfirmed = true;
          matchedLocal.user.isConfirmed = true;
          matchedLocal.user.role = userRole;
          saveStoredLocalUsers(localUsers);
        }

        const authedUser: AppUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          fullName: profileFullName,
          role: userRole,
          avatarUrl: profileAvatar,
          phoneNumber: profilePhone,
          country: profileCountry,
          isConfirmed: true,
        };

        localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(authedUser));
        return { user: authedUser };
      }

      // If Supabase returned an error:
      const errorMsg = error ? formatSupabaseError(error) : '';
      const isNotConfirmed =
        errorMsg.toLowerCase().includes('email not confirmed') ||
        errorMsg.toLowerCase().includes('not confirmed') ||
        (error as any)?.code === 'email_not_confirmed';

      if (isNotConfirmed) {
        // Check if the user was confirmed locally
        const localUsers = getStoredLocalUsers();
        const matchedLocal = localUsers.find(
          (u) => u.user.email.toLowerCase() === cleanEmail && u.passwordHash === password
        );
        if (matchedLocal && matchedLocal.isConfirmed === true) {
          localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(matchedLocal.user));
          return { user: matchedLocal.user };
        }

        return {
          user: null,
          error: 'Your account has not been confirmed yet. Please check your inbox for the confirmation email from Supabase and click the verification link.',
          requiresEmailConfirmation: true,
          unconfirmedEmail: cleanEmail,
        };
      }

      // If Supabase returned another error (e.g. invalid credentials or network/schema error),
      // check if user registered in local registry fallback
      const localUsers = getStoredLocalUsers();
      const matchedLocal = localUsers.find(
        (u) => u.user.email.toLowerCase() === cleanEmail && u.passwordHash === password
      );
      if (matchedLocal) {
        if (matchedLocal.isConfirmed === false) {
          return {
            user: null,
            error: 'Your account is pending email confirmation. Please check the email sent from Supabase and click the confirmation link to activate your account.',
            requiresEmailConfirmation: true,
            unconfirmedEmail: cleanEmail,
          };
        }
        localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(matchedLocal.user));
        return { user: matchedLocal.user };
      }

      return {
        user: null,
        error: errorMsg || 'Invalid email or password. Please verify your credentials.',
      };
    } catch (err) {
      console.warn('Supabase sign-in failed, checking local registry:', err);
    }
  }

  // 4. Fallback: Check Local Registered Users (when Supabase is offline or unconfigured)
  const localUsers = getStoredLocalUsers();
  const matchedLocal = localUsers.find(
    (u) => u.user.email.toLowerCase() === cleanEmail && u.passwordHash === password
  );
  if (matchedLocal) {
    if (matchedLocal.isConfirmed === false) {
      return {
        user: null,
        error: 'Your account is pending email confirmation. Please check the email sent from Supabase and click the confirmation link to activate your account.',
        requiresEmailConfirmation: true,
        unconfirmedEmail: cleanEmail,
      };
    }

    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(matchedLocal.user));
    return { user: matchedLocal.user };
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
        const errorMsg = formatSupabaseError(error);
        const lower = errorMsg.toLowerCase();
        // If Supabase reports user already confirmed or verified:
        if (lower.includes('already confirmed') || lower.includes('already verified')) {
          const localUsers = getStoredLocalUsers();
          const matched = localUsers.find((u) => u.user.email.toLowerCase() === cleanEmail);
          if (matched) {
            matched.isConfirmed = true;
            matched.user.isConfirmed = true;
            saveStoredLocalUsers(localUsers);
          }
          return {
            success: true,
            message: 'Your account is already verified and confirmed! Please enter your password to sign in.',
          };
        }
        return { success: false, error: errorMsg };
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
  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }

  let confirmedInSupabase = false;

  // 1. If using Supabase and a token was provided
  if (isSupabaseConfigured() && token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: token.trim(),
        type: 'signup',
      });

      if (!error && data?.user) {
        confirmedInSupabase = true;
        try {
          await supabase.from('profiles').update({ is_confirmed: true }).eq('id', data.user.id);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Supabase verifyOtp notice:', err);
    }
  }

  // 2. If using Supabase without token (e.g. user clicked confirmation link or confirmed=true in URL)
  if (isSupabaseConfigured() && !token) {
    try {
      await supabase.from('profiles').update({ is_confirmed: true }).eq('email', cleanEmail);
    } catch {
      // ignore
    }
  }

  // 3. Always update local fallback registry so local storage stays confirmed
  const localUsers = getStoredLocalUsers();
  const matched = localUsers.find((u) => u.user.email.toLowerCase() === cleanEmail);
  if (matched) {
    // If token was provided and doesn't match local token AND wasn't confirmed in Supabase:
    if (token && matched.confirmationToken && matched.confirmationToken !== token.trim() && !confirmedInSupabase) {
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
 * Helper to test if a user has administrative authorization (admin, manager, or staff)
 */
export function isUserAdmin(user: AppUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'manager' || user.role === 'staff';
}

/**
 * Get currently logged-in user with live Supabase synchronization
 */
export async function getCurrentAdminUser(): Promise<AppUser | null> {
  // 1. If Supabase is configured, ALWAYS check live Supabase session and query public.profiles directly
  // to ensure role updates in SQL Editor or Supabase Auth are immediately detected without relying on local cache.
  if (isSupabaseConfigured()) {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        // No active Supabase session - clean up any stale cached local user or demo admin keys
        localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
        localStorage.removeItem('rse_demo_admin');
        return null;
      }

      // Query live public.profiles table directly (authoritative source of truth for user role)
      let userRole: UserRole = 'customer';
      let profileFullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Voyager';
      let profilePhone = user.user_metadata?.phone;
      let profileCountry = user.user_metadata?.country;
      let profileAvatar = user.user_metadata?.avatar_url;
      let isProfileConfirmed = Boolean(user.email_confirmed_at || (user as any)?.confirmed_at);

      try {
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, phone, country, country_code, avatar_url, is_confirmed')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          // Direct verified role from public.profiles table
          if (profile.role) userRole = profile.role as UserRole;
          if (profile.full_name) profileFullName = profile.full_name;
          if (profile.phone) profilePhone = profile.phone;
          if (profile.avatar_url) profileAvatar = profile.avatar_url;
          if (profile.country) profileCountry = profile.country;
          if (profile.is_confirmed !== undefined) isProfileConfirmed = Boolean(profile.is_confirmed);
        } else {
          // Self-heal: Backfill missing profile row directly in database
          const newProfile = {
            id: user.id,
            email: user.email || '',
            full_name: profileFullName,
            role: (user.app_metadata?.role as UserRole) || (user.user_metadata?.role as UserRole) || 'customer',
            phone: profilePhone || null,
            country: profileCountry || null,
            is_confirmed: true,
          };
          const { data: createdProfile } = await supabase
            .from('profiles')
            .upsert(newProfile)
            .select('*')
            .maybeSingle();

          if (createdProfile?.role) {
            userRole = createdProfile.role as UserRole;
          }
        }
      } catch (profErr) {
        console.warn('Direct live profiles table query notice:', profErr);
        // Fallback to JWT metadata if profile query fails temporarily
        userRole = (user.app_metadata?.role as UserRole) || (user.user_metadata?.role as UserRole) || 'customer';
      }

      // Administrators are never blocked by missing confirmation flags
      const hasAdminRole = userRole === 'admin' || userRole === 'manager' || userRole === 'staff';
      if (!isProfileConfirmed && !hasAdminRole) {
        return null;
      }

      const authedUser: AppUser = {
        id: user.id,
        email: user.email || '',
        fullName: profileFullName,
        role: userRole,
        avatarUrl: profileAvatar,
        phoneNumber: profilePhone,
        country: profileCountry,
        isConfirmed: true,
      };

      // Keep local cache aligned with the live database role
      localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(authedUser));

      return authedUser;
    } catch (sbErr) {
      console.warn('Supabase getUser notice:', sbErr);
      return null;
    }
  }

  // 2. Fallback: Check active user in local storage (sandbox mode)
  const activeUserRaw = localStorage.getItem(LOCAL_ACTIVE_USER_KEY);
  if (activeUserRaw) {
    try {
      const user = JSON.parse(activeUserRaw) as AppUser;
      return user;
    } catch {
      localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
    }
  }

  return null;
}

/**
 * Directly verifies administrator privileges by querying the public.profiles table in Supabase.
 * Bypasses cached local state so database updates in SQL Editor are immediately detected.
 */
export async function verifyAdminAccess(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const activeUserRaw = localStorage.getItem(LOCAL_ACTIVE_USER_KEY);
    if (!activeUserRaw) return false;
    try {
      const u = JSON.parse(activeUserRaw) as AppUser;
      return isUserAdmin(u);
    } catch {
      return false;
    }
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return false;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      const metaRole = (user.app_metadata?.role || user.user_metadata?.role) as string | undefined;
      return metaRole === 'admin' || metaRole === 'manager' || metaRole === 'staff';
    }

    return profile.role === 'admin' || profile.role === 'manager' || profile.role === 'staff';
  } catch (err) {
    console.error('Error verifying admin access against profiles table:', err);
    return false;
  }
}
