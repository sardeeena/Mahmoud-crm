import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Vite and Node.js testing
const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || undefined;
const envAnonKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || undefined;

// Allow manual override from Admin Settings in browser storage for instant testing
const getStoredUrl = () => {
  try {
    return localStorage.getItem('rse_supabase_url') || envUrl || '';
  } catch {
    return envUrl || '';
  }
};

const getStoredKey = () => {
  try {
    return localStorage.getItem('rse_supabase_anon_key') || envAnonKey || '';
  } catch {
    return envAnonKey || '';
  }
};

let activeUrl = getStoredUrl();
let activeKey = getStoredKey();

let schemaMissingDetected = false;
const schemaMissingListeners = new Set<(missing: boolean) => void>();

export const setSchemaMissing = (missing: boolean) => {
  if (schemaMissingDetected !== missing) {
    schemaMissingDetected = missing;
    schemaMissingListeners.forEach((fn) => {
      try {
        fn(missing);
      } catch {
        // ignore subscriber errors
      }
    });
  }
};

export const isSchemaMissing = () => schemaMissingDetected;

export const subscribeSchemaMissing = (listener: (missing: boolean) => void) => {
  schemaMissingListeners.add(listener);
  return () => {
    schemaMissingListeners.delete(listener);
  };
};

export const isSchemaMissingError = (error: unknown): boolean => {
  if (!error) return false;
  if (typeof error === 'string') {
    return error.includes('PGRST205') || error.includes('Could not find the table') || error.includes('schema cache');
  }
  const err = error as { code?: string; message?: string; details?: string };
  const message = err.message || '';
  const code = err.code || '';
  return code === 'PGRST205' || message.includes('Could not find the table') || message.includes('schema cache');
};

// Helper to determine if valid Supabase credentials exist
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    activeUrl &&
    activeKey &&
    activeUrl.startsWith('https://') &&
    activeUrl.includes('.supabase.co') &&
    activeKey.length > 20
  );
};

// Create client instance safely
const createSafeClient = (): SupabaseClient => {
  if (isSupabaseConfigured()) {
    return createClient(activeUrl, activeKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  // Fallback placeholder client (prevents immediate crashes on bootstrap if env not set)
  return createClient('https://placeholder-project.supabase.co', 'placeholder-anon-key-000000000000000000000000', {
    auth: { persistSession: false },
  });
};

export let supabase: SupabaseClient = createSafeClient();

/**
 * Re-initializes client when user updates keys in Admin Settings
 */
export const updateSupabaseCredentials = (url: string, anonKey: string): boolean => {
  activeUrl = url.trim();
  activeKey = anonKey.trim();
  try {
    localStorage.setItem('rse_supabase_url', activeUrl);
    localStorage.setItem('rse_supabase_anon_key', activeKey);
  } catch {
    // ignore local storage restrictions
  }
  setSchemaMissing(false);
  supabase = createSafeClient();
  return isSupabaseConfigured();
};

export const getSupabaseConfig = () => ({
  url: activeUrl,
  anonKey: activeKey ? `${activeKey.slice(0, 10)}...${activeKey.slice(-6)}` : '',
  isConfigured: isSupabaseConfigured(),
});

/**
 * Converts PostgreSQL / Supabase errors into clear, human-readable user messages
 */
export const formatSupabaseError = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  if (typeof error === 'string') return error;

  const err = error as { code?: string; message?: string; details?: string };
  const message = err.message || '';
  const code = err.code || '';

  // Missing table in schema cache (PGRST205)
  if (code === 'PGRST205' || message.includes('Could not find the table') || message.includes('schema cache')) {
    return 'Database table was not found in the Supabase schema cache. Please execute the Phase 4 SQL migration in your Supabase SQL Editor.';
  }

  // Unique constraint violation (23505)
  if (code === '23505' || message.includes('duplicate key') || message.includes('unique constraint')) {
    if (message.includes('slug')) {
      return 'This URL slug is already being used by another item. Please choose a unique title or slug.';
    }
    if (message.includes('booking_reference')) {
      return 'A booking with this reference number already exists in the system.';
    }
    if (message.includes('email')) {
      return 'An account with this email address already exists.';
    }
    return 'A record with these unique details already exists.';
  }

  // Foreign key violation (23503)
  if (code === '23503' || message.includes('foreign key constraint')) {
    if (message.includes('bookings_tour_id_fkey')) {
      return 'Cannot delete this tour because historical customer bookings are associated with it. Please archive or unpublish the tour instead.';
    }
    return 'This operation cannot be completed because related data exists.';
  }

  // Row Level Security (42501 / new row violates row-level security)
  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return 'Permission denied: Your current account role does not have authorization to perform this action. Administrator privileges required.';
  }

  // Invalid login credentials
  if (message.includes('Invalid login credentials') || message.includes('invalid_grant')) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }

  // Email not confirmed
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox for the verification email, or request a new one.';
  }

  // User already registered
  if (message.includes('User already registered') || message.includes('user_already_exists') || message.includes('already registered')) {
    return 'An account with this email address already exists. Please sign in or use password reset.';
  }

  // Password requirements
  if (message.includes('Password should be at least') || message.includes('weak_password')) {
    return 'Password is too weak. It must be at least 6 characters long.';
  }

  // Over email rate limit
  if (message.includes('rate limit') || message.includes('over_email_send_rate_limit')) {
    return 'Too many email requests sent. For security, please wait a minute before requesting another email.';
  }

  // Expired or invalid recovery/invite link
  if (message.includes('recovery link') || message.includes('token has expired') || message.includes('token is invalid')) {
    return 'This password reset link has expired or has already been used. Please request a new link.';
  }

  // JWT expired
  if (message.includes('JWT expired') || message.includes('token is expired')) {
    return 'Your session has expired. Please sign in again.';
  }

  return message || 'Request failed. Please check your connection and try again.';
};
