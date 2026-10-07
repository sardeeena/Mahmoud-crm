export type MessageDeliveryStatus = 'Queued' | 'Sent' | 'Delivered' | 'Failed';

export type CommunicationChannel = 'Email' | 'WhatsApp';

export type TemplateKey =
  | 'booking_received'
  | 'booking_confirmed'
  | 'payment_received'
  | 'payment_reminder'
  | 'pickup_reminder'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'review_request'
  | 'customer_followup';

export interface CommunicationTemplate {
  id: string;
  templateKey: TemplateKey;
  name: string;
  channel: 'Email' | 'WhatsApp' | 'Both';
  subject?: string | null;
  bodyText: string;
  variables: string[];
  isActive: boolean;
  updatedAt?: string;
}

export interface CommunicationMessage {
  id: string;
  channel: CommunicationChannel;
  customerId?: string | null;
  customerName: string;
  recipientAddress: string; // Email or WhatsApp international phone number
  leadId?: string | null;
  bookingId?: string | null;
  bookingReference?: string | null;
  templateKey?: string | null;
  subject?: string | null;
  content: string;
  status: MessageDeliveryStatus;
  providerName: string; // 'Resend', 'SendGrid', 'Twilio', 'Meta Cloud API', 'Not configured'
  providerMessageId?: string | null;
  failureReason?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  staffName: string;
  staffId?: string | null;
  createdAt: string;
}

export type NotificationCategory =
  | 'new_booking'
  | 'new_inquiry'
  | 'payment_pending'
  | 'cancellation'
  | 'new_review'
  | 'followup_due'
  | 'operational_issue';

export interface StaffNotification {
  id: string;
  category: NotificationCategory;
  dedupKey: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  entityType?: 'booking' | 'inquiry' | 'customer' | 'departure' | 'review' | 'task';
  entityId?: string;
  linkTab?: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ProviderConfig {
  email: {
    provider: 'resend' | 'sendgrid' | 'smtp' | 'none';
    apiKey?: string;
    fromEmail?: string;
    fromName?: string;
    isConfigured: boolean;
  };
  whatsapp: {
    provider: 'meta_cloud' | 'twilio' | 'custom' | 'none';
    apiKey?: string;
    phoneNumberId?: string;
    businessAccountId?: string;
    fromNumber?: string;
    isConfigured: boolean;
  };
}

export interface MessageContextVariables {
  customer_name?: string;
  booking_reference?: string;
  tour_name?: string;
  tour_date?: string;
  pickup_time?: string;
  hotel?: string;
  total?: string;
  balance?: string;
  departure_time?: string;
  guests_count?: string;
  payment_status?: string;
}
