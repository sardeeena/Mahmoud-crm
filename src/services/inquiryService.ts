import { supabase, isSupabaseConfigured, formatSupabaseError } from './supabaseClient';
import { DbInquiry } from '../types/database';
import { sanitizeString, isValidEmail, inquiryRateLimiter } from '../lib/security';

export interface CreateInquiryInput {
  customer_name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  tour_id?: string | null;
  tour_title?: string | null;
  subject: string;
  message: string;
  source?: 'web' | 'whatsapp' | 'email' | 'phone';
}

const LOCAL_INQUIRIES_KEY = 'rse_inquiries_data';

const SEED_INQUIRIES: DbInquiry[] = [];

function getStoredInquiries(): DbInquiry[] {
  try {
    const raw = localStorage.getItem(LOCAL_INQUIRIES_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredInquiries(inquiries: DbInquiry[]) {
  try {
    localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(inquiries));
  } catch {
    // ignore
  }
}

/**
 * Creates a new help request / inquiry from the customer.
 * Persists directly to Supabase and browser cache.
 */
export async function createCustomerInquiry(
  input: CreateInquiryInput
): Promise<{ success: boolean; inquiry?: DbInquiry; error?: string }> {
  const limit = inquiryRateLimiter.check();
  if (limit.isLocked) {
    return {
      success: false,
      error: `Too many submissions. Please wait ${limit.remainingSeconds} seconds before sending another message.`,
    };
  }

  const cleanName = sanitizeString(input.customer_name);
  const cleanEmail = sanitizeString(input.email).toLowerCase();
  const cleanSubject = sanitizeString(input.subject);
  const cleanMessage = sanitizeString(input.message);
  const cleanPhone = input.phone ? sanitizeString(input.phone) : null;
  const cleanWhatsapp = input.whatsapp ? sanitizeString(input.whatsapp) : cleanPhone;

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return {
      success: false,
      error: 'Please fill in your name, email address, and inquiry message.',
    };
  }

  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      error: 'Please provide a valid email address.',
    };
  }

  const generatedId = `inq-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newInquiry: DbInquiry = {
    id: generatedId,
    customer_name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    whatsapp: cleanWhatsapp,
    tour_id: input.tour_id || null,
    subject: cleanSubject || 'General Excursion Assistance',
    message: cleanMessage,
    status: 'new',
    source: input.source || 'web',
    ip_address: null,
    admin_notes: input.tour_title ? `Referenced Tour: ${input.tour_title}` : null,
    created_at: now,
    updated_at: now,
  };

  // 1. Save to local fallback cache immediately
  const localList = getStoredInquiries();
  saveStoredInquiries([newInquiry, ...localList]);

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .insert({
          customer_name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
          tour_id: input.tour_id || null,
          subject: cleanSubject || 'General Excursion Assistance',
          message: cleanMessage,
          status: 'new',
          source: input.source || 'web',
          admin_notes: input.tour_title ? `Referenced Tour: ${input.tour_title}` : null,
        })
        .select('*')
        .single();

      if (error) {
        console.warn('Notice: Inquiries table insert error (using local state):', error.message);
      } else if (data) {
        return { success: true, inquiry: data as DbInquiry };
      }
    } catch (err) {
      console.warn('Supabase inquiries table connection issue:', err);
    }
  }

  inquiryRateLimiter.recordFailedAttempt();
  return { success: true, inquiry: newInquiry };
}

/**
 * Lists all inquiries for the admin dashboard.
 */
export async function listInquiries(filter?: { status?: string }): Promise<DbInquiry[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as DbInquiry[];
      }
    } catch (err) {
      console.warn('Fallback to local inquiries due to query error:', err);
    }
  }

  const localList = getStoredInquiries();
  if (filter?.status && filter.status !== 'all') {
    return localList.filter((item) => item.status === filter.status);
  }
  return localList;
}

/**
 * Updates inquiry status or admin notes
 */
export async function updateInquiryStatus(
  id: string,
  status: DbInquiry['status'],
  adminNotes?: string
): Promise<boolean> {
  const now = new Date().toISOString();

  // 1. Update in local storage
  const localList = getStoredInquiries();
  const updated = localList.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        admin_notes: adminNotes !== undefined ? adminNotes : item.admin_notes,
        updated_at: now,
      };
    }
    return item;
  });
  saveStoredInquiries(updated);

  // 2. Update in Supabase
  if (isSupabaseConfigured()) {
    try {
      const updates: Record<string, unknown> = {
        status,
        updated_at: now,
      };
      if (adminNotes !== undefined) {
        updates.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('inquiries')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.warn('Failed to update inquiry in Supabase:', error);
      }
    } catch (err) {
      console.warn('Inquiry status update exception:', err);
    }
  }

  return true;
}

/**
 * Deletes an inquiry
 */
export async function deleteInquiry(id: string): Promise<boolean> {
  // Local deletion
  const localList = getStoredInquiries();
  saveStoredInquiries(localList.filter((item) => item.id !== id));

  // Supabase deletion
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('inquiries').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  return true;
}
