import { supabase, isSupabaseConfigured, formatSupabaseError } from './supabaseClient';
import { isValidEmail, newsletterRateLimiter } from '../lib/security';

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  source?: string;
  status: 'subscribed' | 'unsubscribed';
  discountCode?: string;
  createdAt: string;
}

const LOCAL_NEWSLETTER_KEY = 'rse_newsletter_subscriptions';

const SEED_SUBSCRIBERS: NewsletterSubscriber[] = [];

function getStoredSubscribers(): NewsletterSubscriber[] {
  try {
    const raw = localStorage.getItem(LOCAL_NEWSLETTER_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredSubscribers(subscribers: NewsletterSubscriber[]) {
  try {
    localStorage.setItem(LOCAL_NEWSLETTER_KEY, JSON.stringify(subscribers));
  } catch {
    // ignore
  }
}

/**
 * Subscribes a user email to promotional updates in Supabase and local cache
 */
export async function subscribeToNewsletter(
  email: string,
  source = 'footer'
): Promise<{ 
  success: boolean; 
  alreadySubscribed?: boolean; 
  discountCode: string; 
  message: string; 
  error?: string 
}> {
  const limit = newsletterRateLimiter.check();
  if (limit.isLocked) {
    return {
      success: false,
      discountCode: 'REDSEA15',
      message: `Too many attempts. Please wait ${limit.remainingSeconds} seconds.`,
      error: 'Rate limit exceeded',
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      success: false,
      discountCode: 'REDSEA15',
      message: 'Please provide a valid email address.',
      error: 'Email is required',
    };
  }

  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      discountCode: 'REDSEA15',
      message: 'Please enter a valid email address format (e.g. name@domain.com).',
      error: 'Invalid email address format',
    };
  }

  const discountCode = 'REDSEA15';
  const now = new Date().toISOString();

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    try {
      // Check if already subscribed in database
      const { data: existing } = await supabase
        .from('newsletter_subscriptions')
        .select('id, email, status')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'unsubscribed') {
          // Re-subscribe
          await supabase
            .from('newsletter_subscriptions')
            .update({ status: 'subscribed', updated_at: now })
            .eq('id', existing.id);

          const localList = getStoredSubscribers();
          const updated = localList.map((s) => s.email === cleanEmail ? { ...s, status: 'subscribed' as const } : s);
          saveStoredSubscribers(updated);

          return {
            success: true,
            discountCode,
            message: 'Welcome back! You have been re-subscribed to our seasonal updates.',
          };
        }

        return {
          success: true,
          alreadySubscribed: true,
          discountCode,
          message: 'You are already subscribed to Red Sea Voyagers! Your 15% promotional voucher code is REDSEA15.',
        };
      }

      // Insert new subscriber into Supabase table
      const { error: insertError } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: cleanEmail,
          source,
          status: 'subscribed',
          discount_code: discountCode,
          metadata: {
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            subscribedAt: now,
          },
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return {
            success: true,
            alreadySubscribed: true,
            discountCode,
            message: 'You are already subscribed! Use promo voucher code REDSEA15 on your next excursion booking.',
          };
        }
        console.warn('Supabase newsletter insert error:', insertError);
      } else {
        // Record in local cache
        const localList = getStoredSubscribers();
        if (!localList.some((s) => s.email === cleanEmail)) {
          localList.unshift({
            id: `sub-${Date.now().toString(36)}`,
            email: cleanEmail,
            source,
            status: 'subscribed',
            discountCode,
            createdAt: now,
          });
          saveStoredSubscribers(localList);
        }

        return {
          success: true,
          discountCode,
          message: 'Welcome aboard! You have been subscribed to exclusive updates & seasonal deals.',
        };
      }
    } catch (err) {
      console.warn('Supabase newsletter connection fallback:', err);
    }
  }

  // 2. Local fallback storage
  const localList = getStoredSubscribers();
  const existingLocal = localList.find((s) => s.email === cleanEmail);

  if (existingLocal) {
    if (existingLocal.status === 'unsubscribed') {
      existingLocal.status = 'subscribed';
      saveStoredSubscribers(localList);
      return {
        success: true,
        discountCode,
        message: 'Welcome back! You have been re-subscribed to our seasonal updates.',
      };
    }
    return {
      success: true,
      alreadySubscribed: true,
      discountCode,
      message: 'You are already subscribed! Your 15% discount voucher code is REDSEA15.',
    };
  }

  localList.unshift({
    id: `sub-${Date.now().toString(36)}`,
    email: cleanEmail,
    source,
    status: 'subscribed',
    discountCode,
    createdAt: now,
  });
  saveStoredSubscribers(localList);

  return {
    success: true,
    discountCode,
    message: 'Welcome to Red Sea Voyagers! You have been subscribed to exclusive updates & seasonal deals.',
  };
}

/**
 * Lists all newsletter subscribers for admin dashboard
 */
export async function listNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          email: d.email,
          source: d.source || 'footer',
          status: (d.status === 'unsubscribed' ? 'unsubscribed' : 'subscribed') as 'subscribed' | 'unsubscribed',
          discountCode: d.discount_code || 'REDSEA15',
          createdAt: d.created_at || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Supabase newsletter listing error, using local fallback:', err);
    }
  }

  return getStoredSubscribers();
}

/**
 * Updates subscriber status (e.g. toggle between subscribed and unsubscribed)
 */
export async function updateSubscriberStatus(
  idOrEmail: string,
  status: 'subscribed' | 'unsubscribed'
): Promise<boolean> {
  const localList = getStoredSubscribers();
  const updated = localList.map((s) => {
    if (s.id === idOrEmail || s.email === idOrEmail) {
      return { ...s, status };
    }
    return s;
  });
  saveStoredSubscribers(updated);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('newsletter_subscriptions')
        .update({ status, updated_at: new Date().toISOString() })
        .or(`id.eq.${idOrEmail},email.eq.${idOrEmail}`);
    } catch (err) {
      console.warn('Failed to update newsletter status in database:', err);
    }
  }

  return true;
}

/**
 * Deletes a subscriber record
 */
export async function deleteSubscriber(idOrEmail: string): Promise<boolean> {
  const localList = getStoredSubscribers();
  const filtered = localList.filter((s) => s.id !== idOrEmail && s.email !== idOrEmail);
  saveStoredSubscribers(filtered);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('newsletter_subscriptions')
        .delete()
        .or(`id.eq.${idOrEmail},email.eq.${idOrEmail}`);
    } catch {
      // ignore
    }
  }

  return true;
}
