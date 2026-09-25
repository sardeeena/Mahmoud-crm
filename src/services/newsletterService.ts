import { supabase, isSupabaseConfigured, formatSupabaseError } from './supabaseClient';
import { isValidEmail } from '../lib/security';

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  source?: string;
  status?: 'subscribed' | 'unsubscribed';
  discountCode?: string;
  createdAt?: string;
}

const LOCAL_NEWSLETTER_KEY = 'rse_newsletter_subscriptions';

function getStoredSubscribers(): NewsletterSubscriber[] {
  try {
    const raw = localStorage.getItem(LOCAL_NEWSLETTER_KEY);
    return raw ? JSON.parse(raw) : [];
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
 * Subscribes a user email to promotional updates in Supabase
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
            .update({ status: 'subscribed', updated_at: new Date().toISOString() })
            .eq('id', existing.id);

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
            subscribedAt: new Date().toISOString(),
          },
        });

      if (insertError) {
        // If unique constraint error or table missing, handle gracefully
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
          localList.push({
            email: cleanEmail,
            source,
            status: 'subscribed',
            discountCode,
            createdAt: new Date().toISOString(),
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
    return {
      success: true,
      alreadySubscribed: true,
      discountCode,
      message: 'You are already subscribed! Your 15% discount voucher code is REDSEA15.',
    };
  }

  localList.push({
    email: cleanEmail,
    source,
    status: 'subscribed',
    discountCode,
    createdAt: new Date().toISOString(),
  });
  saveStoredSubscribers(localList);

  return {
    success: true,
    discountCode,
    message: 'Welcome to Red Sea Voyagers! You have been subscribed to exclusive updates & seasonal deals.',
  };
}
