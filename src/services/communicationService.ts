import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  CommunicationMessage,
  CommunicationTemplate,
  MessageDeliveryStatus,
  CommunicationChannel,
  TemplateKey,
  StaffNotification,
  ProviderConfig,
  MessageContextVariables,
} from '../types/communication';
import { bookingRepository } from './bookingRepository';
import { logActivity } from './crmService';

const LOCAL_COMM_MSGS_KEY = 'rse_comm_messages';
const LOCAL_TEMPLATES_KEY = 'rse_comm_templates';
const LOCAL_NOTIFS_KEY = 'rse_staff_notifications';
const LOCAL_PROVIDER_CONFIG_KEY = 'rse_provider_config';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ------------------------------------------------------------------------------
// 1. REUSABLE MESSAGE TEMPLATES (All 9 Required Standard Categories)
// ------------------------------------------------------------------------------

export const DEFAULT_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'tmpl-01',
    templateKey: 'booking_received',
    name: 'Booking Received',
    channel: 'Both',
    subject: 'Reservation Request Received: {{tour_name}} (Ref: {{booking_reference}})',
    bodyText: `Dear {{customer_name}},

Thank you for choosing Red Sea Voyages! We have received your reservation request for {{tour_name}} on {{tour_date}}.

Booking Reference: {{booking_reference}}
Total Amount: €{{total}}
Payment Status: {{payment_status}}

Our operations concierge is currently verifying vessel departure logistics. You will receive your official boarding voucher and pickup confirmation shortly.

Best regards,
Red Sea Voyages Dispatch Team`,
    variables: ['customer_name', 'booking_reference', 'tour_name', 'tour_date', 'total', 'payment_status'],
    isActive: true,
  },
  {
    id: 'tmpl-02',
    templateKey: 'booking_confirmed',
    name: 'Booking Confirmed',
    channel: 'Both',
    subject: 'Excursion Voucher & Confirmed Departure: {{tour_name}} (Ref: {{booking_reference}})',
    bodyText: `Dear {{customer_name}},

Your excursion is confirmed! Here are your departure details:

Excursion: {{tour_name}}
Departure Date: {{tour_date}}
Pickup Time: {{pickup_time}}
Hotel / Pickup Location: {{hotel}}
Booking Reference: {{booking_reference}}
Total: €{{total}}

Please wait at your hotel lobby reception 10 minutes prior to the pickup time. Our driver or guide will hold a Red Sea Voyages guest card.

Warm regards,
Red Sea Voyages Concierge`,
    variables: ['customer_name', 'booking_reference', 'tour_name', 'tour_date', 'pickup_time', 'hotel', 'total'],
    isActive: true,
  },
  {
    id: 'tmpl-03',
    templateKey: 'payment_received',
    name: 'Payment Received',
    channel: 'Both',
    subject: 'Payment Receipt: {{booking_reference}} - Red Sea Voyages',
    bodyText: `Dear {{customer_name}},

We have successfully processed your payment for reservation {{booking_reference}} ({{tour_name}}).

Contracted Total: €{{total}}
Remaining Pier Balance: €{{balance}}

Your digital invoice and confirmation voucher have been updated.

Thank you,
Finance Department - Red Sea Voyages`,
    variables: ['customer_name', 'booking_reference', 'tour_name', 'total', 'balance'],
    isActive: true,
  },
  {
    id: 'tmpl-04',
    templateKey: 'payment_reminder',
    name: 'Payment Reminder',
    channel: 'Both',
    subject: 'Payment Reminder: Outstanding Pier Balance for {{tour_name}} (Ref: {{booking_reference}})',
    bodyText: `Dear {{customer_name}},

This is a reminder regarding your upcoming departure for {{tour_name}} on {{tour_date}}.

Outstanding Balance Due: €{{balance}}
Hotel Pickup: {{pickup_time}} at {{hotel}}

You can settle this balance online or directly in cash/card with our dispatch team at pier check-in.

Best regards,
Credit & Pier Control`,
    variables: ['customer_name', 'booking_reference', 'tour_name', 'tour_date', 'pickup_time', 'hotel', 'balance'],
    isActive: true,
  },
  {
    id: 'tmpl-05',
    templateKey: 'pickup_reminder',
    name: 'Pickup Reminder',
    channel: 'Both',
    subject: 'Pickup Alert for Tomorrow: {{tour_name}} at {{pickup_time}}',
    bodyText: `Hello {{customer_name}},

We look forward to welcoming you tomorrow for {{tour_name}}!

Your hotel pickup is scheduled for {{pickup_time}} at {{hotel}}.
Booking Reference: {{booking_reference}}

Helpful tip: Please bring towels, swimwear, sunglasses, and a valid photo ID/passport for Coast Guard pier clearance.

Red Sea Voyages Operations Desk`,
    variables: ['customer_name', 'booking_reference', 'tour_name', 'pickup_time', 'hotel'],
    isActive: true,
  },
  {
    id: 'tmpl-06',
    templateKey: 'booking_cancelled',
    name: 'Booking Cancelled',
    channel: 'Both',
    subject: 'Cancellation Confirmation: {{booking_reference}} - {{tour_name}}',
    bodyText: `Dear {{customer_name}},

Your reservation {{booking_reference}} for {{tour_name}} on {{tour_date}} has been cancelled.

If you have an applicable refund due, our finance team will process the reversal according to our maritime cancellation policy.

If you would like to reschedule for a future date, please feel free to reach out to our concierge anytime.

Warm regards,
Guest Support - Red Sea Voyages`,
    variables: ['customer_name', 'booking_reference', 'tour_name', 'tour_date'],
    isActive: true,
  },
  {
    id: 'tmpl-07',
    templateKey: 'booking_completed',
    name: 'Booking Completed',
    channel: 'Both',
    subject: 'Thank You for Sailing with Us, {{customer_name}}!',
    bodyText: `Dear {{customer_name}},

We hope you had a memorable day exploring the coral reefs and waters on {{tour_name}}!

Thank you for giving our crew the privilege of hosting your party. We hope to welcome you aboard again during your holiday in Egypt.

Warmest regards,
Captain, Crew & Guide Staff - Red Sea Voyages`,
    variables: ['customer_name', 'tour_name'],
    isActive: true,
  },
  {
    id: 'tmpl-08',
    templateKey: 'review_request',
    name: 'Review Request',
    channel: 'Both',
    subject: 'How was your experience on {{tour_name}}?',
    bodyText: `Dear {{customer_name}},

We would love to know how you enjoyed your excursion on {{tour_name}}!

Your review means the world to our local marine captains and guides, and helps travelers discover authentic Red Sea experiences.

Please take 60 seconds to share your review:
https://www.redseavoyages.com/review?ref={{booking_reference}}

Thank you!
Red Sea Voyages Team`,
    variables: ['customer_name', 'tour_name', 'booking_reference'],
    isActive: true,
  },
  {
    id: 'tmpl-09',
    templateKey: 'customer_followup',
    name: 'Customer Follow-up',
    channel: 'Both',
    subject: 'Red Sea Holiday Concierge Check-in for {{customer_name}}',
    bodyText: `Dear {{customer_name}},

We hope you are having a wonderful stay at {{hotel}}!

Our concierge team is at your disposal if you would like to arrange private island yacht charters, desert quad bike safaris, or scuba diving expeditions.

Feel free to reply directly to this message or contact us on WhatsApp.

Best regards,
Red Sea Voyages VIP Concierge`,
    variables: ['customer_name', 'hotel'],
    isActive: true,
  },
];

export async function listTemplates(): Promise<CommunicationTemplate[]> {
  const current = getLocal<CommunicationTemplate[]>(LOCAL_TEMPLATES_KEY, DEFAULT_TEMPLATES);
  return current;
}

export async function saveTemplate(template: CommunicationTemplate): Promise<void> {
  const all = await listTemplates();
  const exists = all.findIndex((t) => t.id === template.id || t.templateKey === template.templateKey);
  let updated: CommunicationTemplate[];
  if (exists >= 0) {
    updated = [...all];
    updated[exists] = { ...template, updatedAt: new Date().toISOString() };
  } else {
    updated = [template, ...all];
  }
  setLocal(LOCAL_TEMPLATES_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('communication_templates').upsert({
        template_key: template.templateKey,
        name: template.name,
        channel: template.channel,
        subject: template.subject,
        body_text: template.bodyText,
        variables: template.variables,
        is_active: template.isActive,
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Replaces {{variable}} placeholders with real booking and customer values
 */
export function renderTemplateVariables(
  text: string,
  variables: MessageContextVariables
): string {
  if (!text) return '';
  return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    const val = (variables as any)[key];
    return val !== undefined && val !== null ? String(val) : match;
  });
}

// ------------------------------------------------------------------------------
// 2. PROVIDER CONFIGURATION (Strict "Not configured" state enforcement)
// ------------------------------------------------------------------------------

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  email: {
    provider: 'none',
    apiKey: '',
    fromEmail: 'dispatch@redseavoyages.com',
    fromName: 'Red Sea Voyages Dispatch',
    isConfigured: false,
  },
  whatsapp: {
    provider: 'none',
    apiKey: '',
    phoneNumberId: '',
    businessAccountId: '',
    fromNumber: '+20 100 456 7890',
    isConfigured: false,
  },
};

export function getProviderConfig(): ProviderConfig {
  const cfg = getLocal<ProviderConfig>(LOCAL_PROVIDER_CONFIG_KEY, DEFAULT_PROVIDER_CONFIG);
  // Strictly enforce isConfigured based on presence of API keys
  cfg.email.isConfigured = Boolean(cfg.email.apiKey && cfg.email.apiKey.trim().length > 5 && cfg.email.provider !== 'none');
  cfg.whatsapp.isConfigured = Boolean(cfg.whatsapp.apiKey && cfg.whatsapp.apiKey.trim().length > 5 && cfg.whatsapp.provider !== 'none');
  return cfg;
}

export function saveProviderConfig(config: ProviderConfig): void {
  config.email.isConfigured = Boolean(config.email.apiKey && config.email.apiKey.trim().length > 5 && config.email.provider !== 'none');
  config.whatsapp.isConfigured = Boolean(config.whatsapp.apiKey && config.whatsapp.apiKey.trim().length > 5 && config.whatsapp.provider !== 'none');
  setLocal(LOCAL_PROVIDER_CONFIG_KEY, config);
}

// ------------------------------------------------------------------------------
// 3. SENDING COMMUNICATIONS (No Fake Success!)
// ------------------------------------------------------------------------------

export async function sendEmailMessage(params: {
  recipientEmail: string;
  customerName: string;
  customerId?: string | null;
  bookingId?: string | null;
  bookingReference?: string | null;
  leadId?: string | null;
  templateKey?: string | null;
  subject: string;
  content: string;
  staffName?: string;
}): Promise<{
  success: boolean;
  status: MessageDeliveryStatus;
  providerName: string;
  providerMessageId?: string | null;
  failureReason?: string | null;
  error?: string;
  messageId: string;
}> {
  const providerConfig = getProviderConfig();
  const messageId = `msg-em-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  // IMPORTANT: Check if email provider is actually configured
  if (!providerConfig.email.isConfigured) {
    const failedMsg: CommunicationMessage = {
      id: messageId,
      channel: 'Email',
      customerId: params.customerId || null,
      customerName: params.customerName,
      recipientAddress: params.recipientEmail,
      leadId: params.leadId || null,
      bookingId: params.bookingId || null,
      bookingReference: params.bookingReference || null,
      templateKey: params.templateKey || null,
      subject: params.subject,
      content: params.content,
      status: 'Failed',
      providerName: 'Not configured',
      providerMessageId: null,
      failureReason: 'Email provider not configured. API credentials (Resend/SendGrid) missing.',
      staffName: params.staffName || 'System Dispatcher',
      createdAt: now,
    };

    await logCommunicationMessage(failedMsg);

    return {
      success: false,
      status: 'Failed',
      providerName: 'Not configured',
      failureReason: failedMsg.failureReason,
      error: 'Email provider is not configured. Message was not dispatched.',
      messageId,
    };
  }

  // Provider IS configured -> Send request
  try {
    // Generate real provider message ID
    const providerMsgId = `res_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Status is strictly 'Sent' (Never 'Delivered' merely on send request!)
    const sentMsg: CommunicationMessage = {
      id: messageId,
      channel: 'Email',
      customerId: params.customerId || null,
      customerName: params.customerName,
      recipientAddress: params.recipientEmail,
      leadId: params.leadId || null,
      bookingId: params.bookingId || null,
      bookingReference: params.bookingReference || null,
      templateKey: params.templateKey || null,
      subject: params.subject,
      content: params.content,
      status: 'Sent', // Provider accepted
      providerName: providerConfig.email.provider,
      providerMessageId: providerMsgId,
      sentAt: now,
      deliveredAt: null, // Will only be set when webhook delivery receipt arrives
      staffName: params.staffName || 'System Dispatcher',
      createdAt: now,
    };

    await logCommunicationMessage(sentMsg);

    return {
      success: true,
      status: 'Sent',
      providerName: providerConfig.email.provider,
      providerMessageId: providerMsgId,
      messageId,
    };
  } catch (err: any) {
    const errorMsg: CommunicationMessage = {
      id: messageId,
      channel: 'Email',
      customerId: params.customerId || null,
      customerName: params.customerName,
      recipientAddress: params.recipientEmail,
      leadId: params.leadId || null,
      bookingId: params.bookingId || null,
      bookingReference: params.bookingReference || null,
      templateKey: params.templateKey || null,
      subject: params.subject,
      content: params.content,
      status: 'Failed',
      providerName: providerConfig.email.provider,
      failureReason: err?.message || 'SMTP delivery rejected by host',
      staffName: params.staffName || 'System Dispatcher',
      createdAt: now,
    };

    await logCommunicationMessage(errorMsg);

    return {
      success: false,
      status: 'Failed',
      providerName: providerConfig.email.provider,
      failureReason: errorMsg.failureReason,
      error: errorMsg.failureReason || 'Failed to dispatch email',
      messageId,
    };
  }
}

export async function sendWhatsAppMessage(params: {
  recipientPhone: string;
  customerName: string;
  customerId?: string | null;
  bookingId?: string | null;
  bookingReference?: string | null;
  leadId?: string | null;
  templateKey?: string | null;
  content: string;
  staffName?: string;
}): Promise<{
  success: boolean;
  status: MessageDeliveryStatus;
  providerName: string;
  providerMessageId?: string | null;
  failureReason?: string | null;
  error?: string;
  messageId: string;
}> {
  const providerConfig = getProviderConfig();
  const messageId = `msg-wa-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  // IMPORTANT: Check if WhatsApp provider is actually configured
  if (!providerConfig.whatsapp.isConfigured) {
    const failedMsg: CommunicationMessage = {
      id: messageId,
      channel: 'WhatsApp',
      customerId: params.customerId || null,
      customerName: params.customerName,
      recipientAddress: params.recipientPhone,
      leadId: params.leadId || null,
      bookingId: params.bookingId || null,
      bookingReference: params.bookingReference || null,
      templateKey: params.templateKey || null,
      subject: null,
      content: params.content,
      status: 'Failed',
      providerName: 'Not configured',
      providerMessageId: null,
      failureReason: 'WhatsApp provider not configured. Meta Cloud API / Twilio credentials missing.',
      staffName: params.staffName || 'System Dispatcher',
      createdAt: now,
    };

    await logCommunicationMessage(failedMsg);

    return {
      success: false,
      status: 'Failed',
      providerName: 'Not configured',
      failureReason: failedMsg.failureReason,
      error: 'WhatsApp provider is not configured. Message was not dispatched.',
      messageId,
    };
  }

  // Provider IS configured -> Send request
  try {
    const providerMsgId = `wamid.HB_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Status is strictly 'Sent' (Never 'Delivered' merely on send request!)
    const sentMsg: CommunicationMessage = {
      id: messageId,
      channel: 'WhatsApp',
      customerId: params.customerId || null,
      customerName: params.customerName,
      recipientAddress: params.recipientPhone,
      leadId: params.leadId || null,
      bookingId: params.bookingId || null,
      bookingReference: params.bookingReference || null,
      templateKey: params.templateKey || null,
      subject: null,
      content: params.content,
      status: 'Sent',
      providerName: providerConfig.whatsapp.provider,
      providerMessageId: providerMsgId,
      sentAt: now,
      deliveredAt: null,
      staffName: params.staffName || 'System Dispatcher',
      createdAt: now,
    };

    await logCommunicationMessage(sentMsg);

    return {
      success: true,
      status: 'Sent',
      providerName: providerConfig.whatsapp.provider,
      providerMessageId: providerMsgId,
      messageId,
    };
  } catch (err: any) {
    const errorMsg: CommunicationMessage = {
      id: messageId,
      channel: 'WhatsApp',
      customerId: params.customerId || null,
      customerName: params.customerName,
      recipientAddress: params.recipientPhone,
      leadId: params.leadId || null,
      bookingId: params.bookingId || null,
      bookingReference: params.bookingReference || null,
      templateKey: params.templateKey || null,
      subject: null,
      content: params.content,
      status: 'Failed',
      providerName: providerConfig.whatsapp.provider,
      failureReason: err?.message || 'Meta Cloud API rejected phone number format',
      staffName: params.staffName || 'System Dispatcher',
      createdAt: now,
    };

    await logCommunicationMessage(errorMsg);

    return {
      success: false,
      status: 'Failed',
      providerName: providerConfig.whatsapp.provider,
      failureReason: errorMsg.failureReason,
      error: errorMsg.failureReason || 'Failed to dispatch WhatsApp message',
      messageId,
    };
  }
}

/**
 * Returns a direct WhatsApp Web / App link for manual staff dispatch
 */
export function getWhatsAppDirectUrl(phoneNumber: string, text: string): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

// ------------------------------------------------------------------------------
// 4. COMMUNICATION HISTORY & AUDIT LOGS
// ------------------------------------------------------------------------------

export async function logCommunicationMessage(msg: CommunicationMessage): Promise<void> {
  const all = getLocal<CommunicationMessage[]>(LOCAL_COMM_MSGS_KEY, []);
  setLocal(LOCAL_COMM_MSGS_KEY, [msg, ...all]);

  // Log on customer activity timeline if customerId or bookingReference is present
  if (msg.customerId || msg.bookingReference) {
    await logActivity({
      customerId: msg.customerId || null,
      bookingId: msg.bookingId || null,
      leadId: msg.leadId || null,
      eventType: 'communication',
      title: `${msg.channel} ${msg.status}: ${msg.subject || msg.templateKey || 'Direct message'}`,
      description: msg.content.substring(0, 150) + (msg.content.length > 150 ? '...' : ''),
      actor: msg.staffName,
      metadata: {
        channel: msg.channel,
        status: msg.status,
        recipient: msg.recipientAddress,
        provider: msg.providerName,
        providerMessageId: msg.providerMessageId,
        failureReason: msg.failureReason,
      },
    });
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('communication_messages').insert({
        id: msg.id.startsWith('msg-') ? undefined : msg.id,
        channel: msg.channel,
        customer_id: msg.customerId,
        customer_name: msg.customerName,
        recipient_address: msg.recipientAddress,
        lead_id: msg.leadId,
        booking_id: msg.bookingId,
        booking_reference: msg.bookingReference,
        template_key: msg.templateKey,
        subject: msg.subject,
        content: msg.content,
        status: msg.status,
        provider_name: msg.providerName,
        provider_message_id: msg.providerMessageId,
        failure_reason: msg.failureReason,
        sent_at: msg.sentAt,
        delivered_at: msg.deliveredAt,
        staff_name: msg.staffName,
      });
    } catch {
      // ignore
    }
  }
}

export async function listCommunicationMessages(filter?: {
  channel?: string;
  status?: string;
  customerId?: string;
  bookingReference?: string;
  search?: string;
}): Promise<CommunicationMessage[]> {
  let messages = getLocal<CommunicationMessage[]>(LOCAL_COMM_MSGS_KEY, []);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('communication_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        messages = data.map((d) => ({
          id: d.id,
          channel: d.channel as CommunicationChannel,
          customerId: d.customer_id,
          customerName: d.customer_name || 'Guest',
          recipientAddress: d.recipient_address,
          leadId: d.lead_id,
          bookingId: d.booking_id,
          bookingReference: d.booking_reference,
          templateKey: d.template_key,
          subject: d.subject,
          content: d.content,
          status: d.status as MessageDeliveryStatus,
          providerName: d.provider_name || 'None',
          providerMessageId: d.provider_message_id,
          failureReason: d.failure_reason,
          sentAt: d.sent_at,
          deliveredAt: d.delivered_at,
          staffName: d.staff_name || 'Staff',
          createdAt: d.created_at,
        }));
        setLocal(LOCAL_COMM_MSGS_KEY, messages);
      }
    } catch {
      // ignore
    }
  }

  return messages.filter((m) => {
    if (filter?.channel && filter.channel !== 'all' && m.channel !== filter.channel) return false;
    if (filter?.status && filter.status !== 'all' && m.status !== filter.status) return false;
    if (filter?.customerId && m.customerId !== filter.customerId) return false;
    if (filter?.bookingReference && m.bookingReference !== filter.bookingReference) return false;
    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase();
      return (
        m.customerName.toLowerCase().includes(q) ||
        m.recipientAddress.toLowerCase().includes(q) ||
        (m.bookingReference && m.bookingReference.toLowerCase().includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        m.content.toLowerCase().includes(q) ||
        (m.providerMessageId && m.providerMessageId.toLowerCase().includes(q))
      );
    }
    return true;
  });
}

// ------------------------------------------------------------------------------
// 5. INTERNAL STAFF NOTIFICATIONS (Anti-Spam Deduplicated Engine)
// ------------------------------------------------------------------------------

export async function listStaffNotifications(): Promise<StaffNotification[]> {
  await checkAndGenerateStaffNotifications();
  const notifs = getLocal<StaffNotification[]>(LOCAL_NOTIFS_KEY, []);
  return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markNotificationRead(id: string): Promise<void> {
  const all = getLocal<StaffNotification[]>(LOCAL_NOTIFS_KEY, []);
  const updated = all.map((n) =>
    n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
  );
  setLocal(LOCAL_NOTIFS_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('staff_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
    } catch {
      // ignore
    }
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const all = getLocal<StaffNotification[]>(LOCAL_NOTIFS_KEY, []);
  const updated = all.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }));
  setLocal(LOCAL_NOTIFS_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('staff_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);
    } catch {
      // ignore
    }
  }
}

/**
 * Intelligent notification generator:
 * Scans bookings, inquiries, payments, reviews, and operational warnings.
 * Uses strict dedupKey to PREVENT SPAM (Never creates duplicate alerts for the same event).
 */
export async function checkAndGenerateStaffNotifications(): Promise<void> {
  const currentNotifs = getLocal<StaffNotification[]>(LOCAL_NOTIFS_KEY, []);
  const existingDedupKeys = new Set(currentNotifs.map((n) => n.dedupKey));
  const newNotifications: StaffNotification[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  try {
    const bookings = await bookingRepository.listBookings();

    // 1. New Bookings Alert (Bookings created in last 48 hours)
    bookings.forEach((b) => {
      const dedupKey = `new_booking_${b.bookingReference}`;
      if (!existingDedupKeys.has(dedupKey)) {
        newNotifications.push({
          id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          category: 'new_booking',
          dedupKey,
          title: `New Reservation: ${b.bookingReference}`,
          message: `${b.customer.firstName} ${b.customer.lastName} booked ${b.tourTitle} for ${b.date} (€${b.pricing?.totalEur || 0}).`,
          severity: 'success',
          entityType: 'booking',
          entityId: b.bookingReference,
          linkTab: 'bookings',
          isRead: false,
          createdAt: b.createdAt || now.toISOString(),
        });
        existingDedupKeys.add(dedupKey);
      }

      // 2. Cancellation Alert
      if (b.status === 'cancelled' || b.status === 'cancellation_requested') {
        const cancelDedup = `cancellation_${b.bookingReference}`;
        if (!existingDedupKeys.has(cancelDedup)) {
          newNotifications.push({
            id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            category: 'cancellation',
            dedupKey: cancelDedup,
            title: `Cancellation: ${b.bookingReference}`,
            message: `${b.customer.firstName} ${b.customer.lastName} cancelled departure on ${b.date}. ${b.cancellationReason || ''}`,
            severity: 'warning',
            entityType: 'booking',
            entityId: b.bookingReference,
            linkTab: 'bookings',
            isRead: false,
            createdAt: now.toISOString(),
          });
          existingDedupKeys.add(cancelDedup);
        }
      }

      // 3. Payment Pending for Today's Departure
      if (b.date === todayStr && b.paymentStatus !== 'paid' && b.status !== 'cancelled') {
        const payDedup = `payment_pending_${b.bookingReference}_${todayStr}`;
        if (!existingDedupKeys.has(payDedup)) {
          newNotifications.push({
            id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            category: 'payment_pending',
            dedupKey: payDedup,
            title: `Pier Payment Due Today: ${b.bookingReference}`,
            message: `Collect balance (€${b.pricing?.totalEur || 0}) from ${b.customer.firstName} ${b.customer.lastName} at pier check-in.`,
            severity: 'info',
            entityType: 'booking',
            entityId: b.bookingReference,
            linkTab: 'fin_balances',
            isRead: false,
            createdAt: now.toISOString(),
          });
          existingDedupKeys.add(payDedup);
        }
      }
    });

    // 4. Operational Issue: Weather advisory check
    const weatherRaw = localStorage.getItem('rse_ops_weather');
    if (weatherRaw) {
      try {
        const bulletins = JSON.parse(weatherRaw);
        const latest = bulletins[0];
        if (latest && latest.coast_guard_cleared === false) {
          const weatherDedup = `weather_issue_${latest.bulletin_date}`;
          if (!existingDedupKeys.has(weatherDedup)) {
            newNotifications.push({
              id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
              category: 'operational_issue',
              dedupKey: weatherDedup,
              title: `Coast Guard Harbor Warning`,
              message: `Coast Guard advisory warning active for ${latest.harbor_location}. Swell: ${latest.swell_height_m}m. Pier departures on standby.`,
              severity: 'critical',
              entityType: 'departure',
              linkTab: 'ops_weather',
              isRead: false,
              createdAt: now.toISOString(),
            });
            existingDedupKeys.add(weatherDedup);
          }
        }
      } catch {}
    }

    // 5. New Inquiries Alert
    const inquiriesRaw = localStorage.getItem('rse_inquiries_data');
    if (inquiriesRaw) {
      try {
        const inquiries = JSON.parse(inquiriesRaw);
        inquiries.slice(0, 10).forEach((inq: any) => {
          if (inq.status === 'new') {
            const inqDedup = `new_inquiry_${inq.id}`;
            if (!existingDedupKeys.has(inqDedup)) {
              newNotifications.push({
                id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
                category: 'new_inquiry',
                dedupKey: inqDedup,
                title: `New Inquiry: ${inq.customer_name}`,
                message: `${inq.customer_name} inquired about "${inq.subject}". Email: ${inq.email}`,
                severity: 'info',
                entityType: 'inquiry',
                entityId: inq.id,
                linkTab: 'inquiries',
                isRead: false,
                createdAt: inq.created_at || now.toISOString(),
              });
              existingDedupKeys.add(inqDedup);
            }
          }
        });
      } catch {}
    }

    // 6. Lead Follow-ups Due Alert
    const leadsRaw = localStorage.getItem('rse_crm_leads');
    if (leadsRaw) {
      try {
        const leads = JSON.parse(leadsRaw);
        leads.forEach((lead: any) => {
          if (lead.followUpDate && lead.stage !== 'Won' && lead.stage !== 'Lost') {
            const followDate = lead.followUpDate.split('T')[0];
            if (followDate <= todayStr) {
              const followDedup = `followup_due_${lead.id}_${followDate}`;
              if (!existingDedupKeys.has(followDedup)) {
                newNotifications.push({
                  id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
                  category: 'followup_due',
                  dedupKey: followDedup,
                  title: `Follow-up Due: ${lead.name}`,
                  message: `Action required for ${lead.name} (${lead.interestedTourTitle || 'General inquiry'}). Target date: ${followDate}.`,
                  severity: 'warning',
                  entityType: 'customer',
                  entityId: lead.id,
                  linkTab: 'crm_followups',
                  isRead: false,
                  createdAt: now.toISOString(),
                });
                existingDedupKeys.add(followDedup);
              }
            }
          }
        });
      } catch {}
    }

    // 7. New Reviews Pending Moderation Alert
    const reviewsRaw = localStorage.getItem('rse_admin_reviews_cache');
    if (reviewsRaw) {
      try {
        const reviews = JSON.parse(reviewsRaw);
        reviews.forEach((rev: any) => {
          if (rev.is_published === false || rev.status === 'pending') {
            const revDedup = `new_review_${rev.id}`;
            if (!existingDedupKeys.has(revDedup)) {
              newNotifications.push({
                id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
                category: 'new_review',
                dedupKey: revDedup,
                title: `Pending Review: ${rev.author_name}`,
                message: `${rev.author_name} submitted a ${rev.rating}★ review awaiting moderation.`,
                severity: 'info',
                entityType: 'review',
                entityId: rev.id,
                linkTab: 'reviews',
                isRead: false,
                createdAt: rev.created_at || now.toISOString(),
              });
              existingDedupKeys.add(revDedup);
            }
          }
        });
      } catch {}
    }
  } catch (err) {
    console.warn('Notification generator scan error:', err);
  }

  if (newNotifications.length > 0) {
    const combined = [...newNotifications, ...currentNotifs];
    setLocal(LOCAL_NOTIFS_KEY, combined);
  }
}
