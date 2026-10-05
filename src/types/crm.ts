/**
 * Types & Data Contracts for Red Sea Excursions CRM Platform
 */

import { Booking } from './booking';
import { DbInquiry, DbReview, UserRole } from './database';

export type CrmLeadStage =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'quotation_sent'
  | 'booking_pending'
  | 'booked'
  | 'completed'
  | 'lost';

export type CrmLeadSource =
  | 'Website'
  | 'WhatsApp'
  | 'Facebook'
  | 'Instagram'
  | 'Google'
  | 'Phone'
  | 'Email'
  | 'Hotel'
  | 'Referral'
  | 'Walk-in'
  | 'Other';

export interface CrmLead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  hotel?: string | null;
  source: CrmLeadSource;
  interestedTourId?: string | null;
  interestedTourTitle?: string | null;
  travelDate?: string | null;
  guestsCount?: number;
  estimatedValueEur?: number;
  notes?: string | null;
  assignedStaff?: string | null;
  stage: CrmLeadStage;
  followUpDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CrmTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CrmTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface CrmTask {
  id: string;
  title: string;
  description?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  leadId?: string | null;
  bookingReference?: string | null;
  assignedStaff: string;
  dueDate: string;
  priority: CrmTaskPriority;
  status: CrmTaskStatus;
  createdAt: string;
  completedAt?: string | null;
}

export interface CrmFollowUp {
  id: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  leadId?: string | null;
  notes: string;
  scheduledFor: string; // ISO date or date string
  assignedStaff: string;
  isCompleted: boolean;
  completedAt?: string | null;
  createdAt: string;
}

export type CrmCommunicationChannel = 'whatsapp' | 'email' | 'phone' | 'website_chat' | 'pier_desk';

export interface CrmConversationMessage {
  id: string;
  customerId?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName: string;
  channel: CrmCommunicationChannel;
  direction: 'inbound' | 'outbound';
  sender: string;
  recipient: string;
  subject?: string | null;
  message: string;
  timestamp: string;
}

export interface CrmStaffNote {
  id: string;
  customerId: string;
  author: string;
  note: string;
  createdAt: string;
  isPinned?: boolean;
}

export interface CrmTimelineEvent {
  id: string;
  customerId?: string | null;
  customerName?: string;
  type:
    | 'account_created'
    | 'inquiry_created'
    | 'booking_created'
    | 'payment_recorded'
    | 'booking_status_changed'
    | 'cancellation'
    | 'review_submitted'
    | 'staff_note'
    | 'communication'
    | 'lead_created'
    | 'lead_stage_changed'
    | 'task_completed';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  badgeColor?: string;
  metadata?: Record<string, any>;
}

export interface CrmCustomerSummary {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  hotel?: string | null;
  notes?: string | null;
  tags: string[];
  firstBookingDate?: string | null;
  latestBookingDate?: string | null;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenueEur: number;
  outstandingAmountEur: number;
  lastContactDate?: string | null;
  customerSource: CrmLeadSource | string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string | null;
}

export interface CrmCustomerDetail extends CrmCustomerSummary {
  bookings: Booking[];
  inquiries: DbInquiry[];
  communications: CrmConversationMessage[];
  staffNotes: CrmStaffNote[];
  tasks: CrmTask[];
  followUps: CrmFollowUp[];
  reviews: DbReview[];
  timeline: CrmTimelineEvent[];
}

export interface CrmDashboardMetrics {
  newLeadsCount: number;
  openInquiriesCount: number;
  bookingsTodayCount: number;
  bookingsThisWeekCount: number;
  followUpsDueCount: number;
  overdueFollowUpsCount: number;
  newCustomersCount: number;
  conversionRatePercent: number;
  totalRevenueEur: number;
  outstandingPaymentsEur: number;
}
