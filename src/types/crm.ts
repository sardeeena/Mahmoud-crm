import { UserRole } from './database';
import { Booking } from './booking';

export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Quotation Sent'
  | 'Booking Pending'
  | 'Booked'
  | 'Completed'
  | 'Lost';

export type LeadSource =
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
  source: LeadSource;
  interestedTourId?: string | null;
  interestedTourTitle?: string | null;
  travelDate?: string | null;
  numberOfGuests: number;
  estimatedValue: number;
  currency: string;
  stage: LeadStage;
  notes?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  customerId?: string | null;
  followUpDate?: string | null;
  lostReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface CrmTask {
  id: string;
  title: string;
  description?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  leadId?: string | null;
  leadName?: string | null;
  bookingId?: string | null;
  bookingReference?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  isFollowUp: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CommChannel = 'WhatsApp' | 'Email' | 'Phone' | 'In-Person' | 'Web Chat' | 'SMS';

export interface CrmCommunication {
  id: string;
  customerId?: string | null;
  customerName?: string | null;
  leadId?: string | null;
  bookingId?: string | null;
  channel: CommChannel;
  direction: 'inbound' | 'outbound';
  summary: string;
  content?: string | null;
  staffName: string;
  staffId?: string | null;
  createdAt: string;
}

export interface CrmNote {
  id: string;
  customerId?: string | null;
  leadId?: string | null;
  bookingId?: string | null;
  content: string;
  staffName: string;
  staffId?: string | null;
  isPinned: boolean;
  createdAt: string;
}

export type CrmEventType =
  | 'account_created'
  | 'inquiry_created'
  | 'booking_created'
  | 'payment_recorded'
  | 'booking_changed'
  | 'cancellation'
  | 'review_submitted'
  | 'staff_note'
  | 'communication'
  | 'lead_created'
  | 'stage_changed'
  | 'task_created'
  | 'task_completed';

export interface CrmActivity {
  id: string;
  customerId?: string | null;
  leadId?: string | null;
  bookingId?: string | null;
  eventType: CrmEventType;
  title: string;
  description?: string | null;
  actor: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CrmCustomerDetail {
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
  totalRevenue: number;
  outstandingAmount: number;
  lastContactDate?: string | null;
  source: string;
  createdAt: string;
  role: UserRole;
  isRegistered: boolean;
  avatarUrl?: string | null;
  bookings: Booking[];
  inquiries: any[];
  communications: CrmCommunication[];
  staffNotes: CrmNote[];
  tasks: CrmTask[];
  activities: CrmActivity[];
  reviews: any[];
}

export interface CrmDashboardMetrics {
  newLeadsCount: number;
  openInquiriesCount: number;
  bookingsTodayCount: number;
  bookingsThisWeekCount: number;
  followUpsDueCount: number;
  overdueFollowUpsCount: number;
  newCustomersCount: number;
  conversionRate: number; // percentage
  totalRevenueEur: number;
  outstandingPaymentsEur: number;
  totalActiveLeads: number;
  totalWonLeadsEur: number;
}
