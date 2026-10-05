import { supabase, isSupabaseConfigured } from './supabaseClient';
import { bookingRepository } from './bookingRepository';
import { listInquiries } from './inquiryService';
import {
  CrmLead,
  CrmLeadStage,
  CrmLeadSource,
  CrmTask,
  CrmTaskStatus,
  CrmFollowUp,
  CrmConversationMessage,
  CrmStaffNote,
  CrmTimelineEvent,
  CrmCustomerSummary,
  CrmCustomerDetail,
  CrmDashboardMetrics,
} from '../types/crm';
import { Booking } from '../types/booking';

// Storage Cache Keys
const KEYS = {
  LEADS: 'rse_crm_leads',
  TASKS: 'rse_crm_tasks',
  FOLLOW_UPS: 'rse_crm_follow_ups',
  CONVERSATIONS: 'rse_crm_conversations',
  NOTES: 'rse_crm_notes',
  TIMELINE: 'rse_crm_timeline',
  CUSTOMERS: 'rse_crm_customers',
};

// Seed Leads
const SEED_LEADS: CrmLead[] = [
  {
    id: 'lead-1',
    name: 'Marcus Schneider',
    email: 'marcus.s@luxurytravel.de',
    phone: '+49 171 2345678',
    whatsapp: '+49 171 2345678',
    country: 'Germany',
    hotel: 'Steigenberger ALDAU Beach Hotel',
    source: 'WhatsApp',
    interestedTourTitle: 'Private Red Sea Yacht Charter',
    travelDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    guestsCount: 6,
    estimatedValueEur: 500,
    notes: 'Interested in a private yacht to Orange Bay with seafood lunch. Prefers morning 08:30 departure.',
    assignedStaff: 'Captain Ahmed',
    stage: 'quotation_sent',
    followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lead-2',
    name: 'Elena Rostova',
    email: 'elena.rostova@travelmail.ru',
    phone: '+7 916 555 4321',
    whatsapp: '+7 916 555 4321',
    country: 'Russia',
    hotel: 'Rixos Premium Magawish Suites',
    source: 'Website',
    interestedTourTitle: 'Desert Safari & Bedouin Experience',
    travelDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    guestsCount: 3,
    estimatedValueEur: 105,
    notes: 'Family with 1 child (age 8). Wants quad bikes + buggy + camel ride dinner.',
    assignedStaff: 'Mina Samir',
    stage: 'interested',
    followUpDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lead-3',
    name: 'David & Sarah Jenkins',
    email: 'd.jenkins@horizonvoyages.co.uk',
    phone: '+44 7700 900123',
    whatsapp: '+44 7700 900123',
    country: 'United Kingdom',
    hotel: 'Kempinski Hotel Soma Bay',
    source: 'Google',
    interestedTourTitle: 'Introductory Scuba Diving Experience',
    travelDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    guestsCount: 2,
    estimatedValueEur: 130,
    notes: 'First time divers. Inquired about instructor certification and hotel transfer fees from Soma Bay.',
    assignedStaff: 'Captain Farouk',
    stage: 'new',
    followUpDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Seed Tasks
const SEED_TASKS: CrmTask[] = [
  {
    id: 'task-1',
    title: 'Send private yacht quotation to Marcus Schneider',
    description: 'Provide quote for 6 guests on Motor Yacht Nefertiti including fresh seafood and wine permit.',
    customerName: 'Marcus Schneider',
    leadId: 'lead-1',
    assignedStaff: 'Captain Ahmed',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'high',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Confirm Soma Bay transfer surcharge for David Jenkins',
    description: 'Check dispatch logistics for hotel pickup outside central Hurghada zone.',
    customerName: 'David & Sarah Jenkins',
    leadId: 'lead-3',
    assignedStaff: 'Mina Samir',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
  },
];

// Seed Follow-ups
const SEED_FOLLOW_UPS: CrmFollowUp[] = [
  {
    id: 'fup-1',
    customerName: 'Marcus Schneider',
    customerPhone: '+49 171 2345678',
    customerEmail: 'marcus.s@luxurytravel.de',
    leadId: 'lead-1',
    notes: 'Follow up via WhatsApp regarding quotation sent yesterday for Friday yacht charter.',
    scheduledFor: new Date(Date.now() - 3600000 * 2).toISOString(), // overdue
    assignedStaff: 'Captain Ahmed',
    isCompleted: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'fup-2',
    customerName: 'Elena Rostova',
    customerPhone: '+7 916 555 4321',
    customerEmail: 'elena.rostova@travelmail.ru',
    leadId: 'lead-2',
    notes: 'Call customer to confirm buggy reservation and child seat arrangement.',
    scheduledFor: new Date().toISOString().split('T')[0],
    assignedStaff: 'Mina Samir',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
];

// Seed Conversations
const SEED_CONVERSATIONS: CrmConversationMessage[] = [
  {
    id: 'conv-1',
    customerId: 'cust-marcus_s_luxurytravel_de',
    customerEmail: 'marcus.s@luxurytravel.de',
    customerPhone: '+49 171 2345678',
    customerName: 'Marcus Schneider',
    channel: 'whatsapp',
    direction: 'outbound',
    sender: 'Captain Ahmed',
    recipient: 'Marcus Schneider (+49 171 2345678)',
    subject: 'Quotation: Private Yacht Nefertiti',
    message: 'Hello Marcus, quotation for private yacht charter on Friday has been prepared (€500 for 6 guests with seafood lunch included). Let me know if you would like me to reserve the yacht berth.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'conv-2',
    customerId: 'cust-marcus_s_luxurytravel_de',
    customerEmail: 'marcus.s@luxurytravel.de',
    customerPhone: '+49 171 2345678',
    customerName: 'Marcus Schneider',
    channel: 'whatsapp',
    direction: 'inbound',
    sender: 'Marcus Schneider',
    recipient: 'Red Sea Excursions Concierge',
    subject: null,
    message: 'Thank you Captain Ahmed! Does the rate include snorkeling gear and towels or should we bring our own from the hotel?',
    timestamp: new Date(Date.now() - 80000000).toISOString(),
  },
  {
    id: 'conv-3',
    customerId: 'cust-d_jenkins_horizonvoyages_co_uk',
    customerEmail: 'd.jenkins@horizonvoyages.co.uk',
    customerPhone: '+44 7700 900123',
    customerName: 'David Jenkins',
    channel: 'email',
    direction: 'inbound',
    sender: 'David Jenkins <d.jenkins@horizonvoyages.co.uk>',
    recipient: 'info@redseaexcursions.com',
    subject: 'Question on beginner scuba diving gear',
    message: 'We are staying at Kempinski Soma Bay. Can you confirm if transfer pickup is complimentary or if there is a surcharge?',
    timestamp: new Date(Date.now() - 40000000).toISOString(),
  },
];

// Seed Timeline
const SEED_TIMELINE: CrmTimelineEvent[] = [
  {
    id: 'ev-seed-1',
    type: 'booking_created',
    customerName: 'Alexander Bauer',
    title: 'Booking Confirmed: Dolphin House Elite Speedboat',
    description: 'Reservation RST-2026-DH9921 placed for 3 passengers on Saturday.',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    badgeColor: 'emerald',
  },
  {
    id: 'ev-seed-2',
    type: 'lead_stage_changed',
    customerName: 'Marcus Schneider',
    title: 'Lead Advanced to "Quotation Sent"',
    description: 'Captain Ahmed transmitted custom VIP yacht charter quote (€500).',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    badgeColor: 'teal',
  },
  {
    id: 'ev-seed-3',
    type: 'communication',
    customerName: 'Marcus Schneider',
    title: 'WhatsApp Message Exchanged',
    description: 'Guest inquired about snorkeling gear & towels onboard.',
    timestamp: new Date(Date.now() - 80000000).toISOString(),
    badgeColor: 'sky',
  },
  {
    id: 'ev-seed-4',
    type: 'inquiry_created',
    customerName: 'David Jenkins',
    title: 'New Concierge Inquiry Received',
    description: 'Inquired about beginner scuba diving and Soma Bay transfer cutoff.',
    timestamp: new Date(Date.now() - 40000000).toISOString(),
    badgeColor: 'amber',
  },
];

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

// ==============================================================================
// 1. LEADS ENGINE
// ==============================================================================

export async function getLeads(): Promise<CrmLead[]> {
  return getStored<CrmLead[]>(KEYS.LEADS, SEED_LEADS);
}

export async function createLead(payload: Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt'>): Promise<CrmLead> {
  const leads = await getLeads();
  const newLead: CrmLead = {
    ...payload,
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  setStored(KEYS.LEADS, [newLead, ...leads]);

  // Log timeline event
  await logTimelineEvent({
    id: `ev-${Date.now()}`,
    type: 'lead_created',
    customerName: newLead.name,
    title: `New Lead: ${newLead.name}`,
    description: `Originated via ${newLead.source} for ${newLead.interestedTourTitle || 'Excursions'}.`,
    timestamp: new Date().toISOString(),
    badgeColor: 'sky',
  });

  return newLead;
}

export async function updateLead(id: string, updates: Partial<CrmLead>): Promise<CrmLead | null> {
  const leads = await getLeads();
  let updatedLead: CrmLead | null = null;
  const nextLeads = leads.map((l) => {
    if (l.id === id) {
      updatedLead = { ...l, ...updates, updatedAt: new Date().toISOString() };
      return updatedLead;
    }
    return l;
  });
  setStored(KEYS.LEADS, nextLeads);
  return updatedLead;
}

export async function updateLeadStage(id: string, stage: CrmLeadStage): Promise<void> {
  const leads = await getLeads();
  const target = leads.find((l) => l.id === id);
  if (target && target.stage !== stage) {
    const oldStage = target.stage;
    await updateLead(id, { stage });

    await logTimelineEvent({
      id: `ev-${Date.now()}`,
      type: 'lead_stage_changed',
      customerName: target.name,
      title: `Lead Stage Advanced: ${target.name}`,
      description: `Moved from "${oldStage}" to "${stage}".`,
      timestamp: new Date().toISOString(),
      badgeColor: 'teal',
    });
  }
}

export async function deleteLead(id: string): Promise<void> {
  const leads = await getLeads();
  setStored(KEYS.LEADS, leads.filter((l) => l.id !== id));
}

// ==============================================================================
// 2. CONVERSIONS (INQUIRY ➔ LEAD / CUSTOMER / BOOKING)
// ==============================================================================

export async function convertInquiryToLead(inquiryId: string): Promise<CrmLead> {
  const inquiries = await listInquiries();
  const inq = inquiries.find((i) => i.id === inquiryId);
  if (!inq) {
    throw new Error('Inquiry record not found.');
  }

  const newLead = await createLead({
    name: inq.customer_name,
    email: inq.email,
    phone: inq.phone || null,
    whatsapp: inq.phone || null,
    source: 'Website',
    interestedTourTitle: inq.subject || 'Custom Excursion Inquiry',
    notes: inq.message,
    assignedStaff: 'Captain Farouk',
    stage: 'new',
    followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  return newLead;
}

// ==============================================================================
// 3. TASKS ENGINE
// ==============================================================================

export async function getCrmTasks(): Promise<CrmTask[]> {
  return getStored<CrmTask[]>(KEYS.TASKS, SEED_TASKS);
}

export async function createCrmTask(payload: Omit<CrmTask, 'id' | 'createdAt'>): Promise<CrmTask> {
  const tasks = await getCrmTasks();
  const newTask: CrmTask = {
    ...payload,
    id: `task-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  setStored(KEYS.TASKS, [newTask, ...tasks]);
  return newTask;
}

export async function updateCrmTaskStatus(id: string, status: CrmTaskStatus): Promise<void> {
  const tasks = await getCrmTasks();
  const nextTasks = tasks.map((t) => {
    if (t.id === id) {
      return {
        ...t,
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : null,
      };
    }
    return t;
  });
  setStored(KEYS.TASKS, nextTasks);
}

export async function deleteCrmTask(id: string): Promise<void> {
  const tasks = await getCrmTasks();
  setStored(KEYS.TASKS, tasks.filter((t) => t.id !== id));
}

// ==============================================================================
// 4. FOLLOW-UPS ENGINE
// ==============================================================================

export async function getCrmFollowUps(): Promise<CrmFollowUp[]> {
  return getStored<CrmFollowUp[]>(KEYS.FOLLOW_UPS, SEED_FOLLOW_UPS);
}

export async function scheduleFollowUp(payload: Omit<CrmFollowUp, 'id' | 'isCompleted' | 'createdAt'>): Promise<CrmFollowUp> {
  const followUps = await getCrmFollowUps();
  const newFollowUp: CrmFollowUp = {
    ...payload,
    id: `fup-${Date.now()}`,
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };
  setStored(KEYS.FOLLOW_UPS, [newFollowUp, ...followUps]);
  return newFollowUp;
}

export async function completeFollowUp(id: string): Promise<void> {
  const followUps = await getCrmFollowUps();
  const next = followUps.map((f) =>
    f.id === id ? { ...f, isCompleted: true, completedAt: new Date().toISOString() } : f
  );
  setStored(KEYS.FOLLOW_UPS, next);
}

// ==============================================================================
// 5. COMMUNICATIONS LOG
// ==============================================================================

export async function getCrmConversations(customerEmailOrId?: string): Promise<CrmConversationMessage[]> {
  const all = getStored<CrmConversationMessage[]>(KEYS.CONVERSATIONS, SEED_CONVERSATIONS);
  if (!customerEmailOrId) return all;
  const q = customerEmailOrId.toLowerCase();
  return all.filter(
    (m) =>
      m.customerId === customerEmailOrId ||
      (m.customerEmail && m.customerEmail.toLowerCase() === q)
  );
}

export async function logCommunication(payload: Omit<CrmConversationMessage, 'id' | 'timestamp'>): Promise<CrmConversationMessage> {
  const all = await getCrmConversations();
  const newMsg: CrmConversationMessage = {
    ...payload,
    id: `msg-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  setStored(KEYS.CONVERSATIONS, [newMsg, ...all]);

  await logTimelineEvent({
    id: `ev-${Date.now()}`,
    customerId: newMsg.customerId,
    customerName: newMsg.customerName,
    type: 'communication',
    title: `${newMsg.direction === 'outbound' ? 'Outbound' : 'Inbound'} ${newMsg.channel.toUpperCase()}`,
    description: newMsg.message.slice(0, 120),
    timestamp: newMsg.timestamp,
    badgeColor: 'emerald',
  });

  return newMsg;
}

// ==============================================================================
// 6. STAFF NOTES
// ==============================================================================

export async function getCustomerStaffNotes(customerId: string): Promise<CrmStaffNote[]> {
  const all = getStored<CrmStaffNote[]>(KEYS.NOTES, []);
  return all.filter((n) => n.customerId === customerId);
}

export async function addCustomerStaffNote(
  customerId: string,
  author: string,
  note: string,
  isPinned: boolean = false
): Promise<CrmStaffNote> {
  const all = getStored<CrmStaffNote[]>(KEYS.NOTES, []);
  const newNote: CrmStaffNote = {
    id: `note-${Date.now()}`,
    customerId,
    author,
    note,
    createdAt: new Date().toISOString(),
    isPinned,
  };
  setStored(KEYS.NOTES, [newNote, ...all]);

  await logTimelineEvent({
    id: `ev-${Date.now()}`,
    customerId,
    type: 'staff_note',
    title: `Internal Note added by ${author}`,
    description: note.slice(0, 100),
    timestamp: newNote.createdAt,
    badgeColor: 'amber',
  });

  return newNote;
}

// ==============================================================================
// 7. TIMELINE ENGINE
// ==============================================================================

export async function getGlobalTimeline(limit: number = 50): Promise<CrmTimelineEvent[]> {
  const events = getStored<CrmTimelineEvent[]>(KEYS.TIMELINE, SEED_TIMELINE);
  return events.slice(0, limit);
}

export async function logTimelineEvent(event: CrmTimelineEvent): Promise<void> {
  const all = getStored<CrmTimelineEvent[]>(KEYS.TIMELINE, []);
  setStored(KEYS.TIMELINE, [event, ...all].slice(0, 300));
}

// ==============================================================================
// 8. UNIFIED CUSTOMERS & DEDUPLICATION ENGINE
// ==============================================================================

export async function getCrmCustomers(): Promise<CrmCustomerSummary[]> {
  const customerMap = new Map<string, CrmCustomerSummary>();

  // 1. Load bookings to build customer registry
  const allBookings = await bookingRepository.listBookings();
  allBookings.forEach((b) => {
    const email = (b.customer?.email || '').trim().toLowerCase();
    if (!email) return;

    const existing = customerMap.get(email);
    const amount = b.pricing?.totalEur || 0;
    const isCompleted = b.status === 'completed';
    const isCancelled = b.status === 'cancelled';
    const isConfirmed = b.status === 'confirmed';

    if (existing) {
      existing.totalBookings += 1;
      existing.totalRevenueEur += amount;
      if (isCompleted) existing.completedBookings += 1;
      if (isCancelled) existing.cancelledBookings += 1;
      if (isConfirmed && b.paymentMethod === 'pay_at_pickup') {
        existing.outstandingAmountEur += amount;
      }
      if (!existing.latestBookingDate || b.date > existing.latestBookingDate) {
        existing.latestBookingDate = b.date;
      }
      existing.hotel = existing.hotel || b.pickup.hotelName || b.customer.hotelName;
      existing.phone = existing.phone || b.customer.phoneNumber;
      existing.whatsapp = existing.whatsapp || b.customer.phoneNumber;
      existing.country = existing.country || b.customer.country;
    } else {
      customerMap.set(email, {
        id: `cust-${email.replace(/[^a-z0-9]/g, '_')}`,
        fullName: `${b.customer.firstName || ''} ${b.customer.lastName || ''}`.trim() || 'Traveler',
        email,
        phone: b.customer.phoneNumber || null,
        whatsapp: b.customer.phoneNumber || null,
        country: b.customer.country || 'International',
        hotel: b.pickup.hotelName || b.customer.hotelName || null,
        notes: null,
        tags: amount > 200 ? ['VIP'] : ['First-time'],
        firstBookingDate: b.date || b.createdAt,
        latestBookingDate: b.date || b.createdAt,
        totalBookings: 1,
        completedBookings: isCompleted ? 1 : 0,
        cancelledBookings: isCancelled ? 1 : 0,
        totalRevenueEur: amount,
        outstandingAmountEur: isConfirmed && b.paymentMethod === 'pay_at_pickup' ? amount : 0,
        lastContactDate: b.createdAt || b.date,
        customerSource: 'Website',
        createdAt: b.createdAt || new Date().toISOString(),
        updatedAt: b.createdAt || new Date().toISOString(),
      });
    }
  });

  // 2. Incorporate custom CRM customers
  const manualCustomers = getStored<CrmCustomerSummary[]>(KEYS.CUSTOMERS, []);
  manualCustomers.forEach((mc) => {
    const email = mc.email.toLowerCase();
    if (customerMap.has(email)) {
      const merged = customerMap.get(email)!;
      merged.tags = Array.from(new Set([...merged.tags, ...mc.tags]));
      merged.notes = mc.notes || merged.notes;
      merged.customerSource = mc.customerSource || merged.customerSource;
    } else {
      customerMap.set(email, mc);
    }
  });

  return Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.latestBookingDate || b.createdAt).getTime() - new Date(a.latestBookingDate || a.createdAt).getTime()
  );
}

export async function getCrmCustomerDetail(emailOrId: string): Promise<CrmCustomerDetail | null> {
  const allCustomers = await getCrmCustomers();
  const clean = emailOrId.toLowerCase();
  const customer = allCustomers.find(
    (c) => c.id === emailOrId || c.email.toLowerCase() === clean
  );

  if (!customer) return null;

  // Retrieve correlated data
  const [allBookings, allInquiries, allConversations, staffNotes, allTasks, allFollowUps] =
    await Promise.all([
      bookingRepository.listBookings(),
      listInquiries(),
      getCrmConversations(customer.email),
      getCustomerStaffNotes(customer.id),
      getCrmTasks(),
      getCrmFollowUps(),
    ]);

  const customerBookings = allBookings.filter(
    (b) => b.customer?.email?.toLowerCase() === customer.email.toLowerCase()
  );

  const customerInquiries = allInquiries.filter(
    (i) => i.email?.toLowerCase() === customer.email.toLowerCase()
  );

  const customerTasks = allTasks.filter(
    (t) => t.customerId === customer.id || t.customerName === customer.fullName
  );

  const customerFollowUps = allFollowUps.filter(
    (f) => f.customerEmail?.toLowerCase() === customer.email.toLowerCase() || f.customerName === customer.fullName
  );

  // Generate dynamic combined activity timeline
  const timeline: CrmTimelineEvent[] = [];

  // Account creation
  timeline.push({
    id: `tl-acc-${customer.id}`,
    customerId: customer.id,
    type: 'account_created',
    title: 'Customer Record Established',
    description: `Profile initialized via ${customer.customerSource}.`,
    timestamp: customer.createdAt,
    badgeColor: 'blue',
  });

  // Bookings
  customerBookings.forEach((b) => {
    timeline.push({
      id: `tl-bk-${b.bookingReference}`,
      customerId: customer.id,
      type: 'booking_created',
      title: `Booking Created: ${b.tourTitle || 'Tour'} (${b.bookingReference})`,
      description: `Party of ${b.party.adults + b.party.children} on ${b.date}. Total: €${b.pricing.totalEur.toFixed(2)}.`,
      timestamp: b.createdAt || b.date,
      badgeColor: 'emerald',
    });

    if (b.status === 'cancelled') {
      timeline.push({
        id: `tl-cxl-${b.bookingReference}`,
        customerId: customer.id,
        type: 'cancellation',
        title: `Booking Cancelled: ${b.bookingReference}`,
        description: 'Voucher was cancelled and cancellation policies applied.',
        timestamp: b.updatedAt || b.date,
        badgeColor: 'red',
      });
    }
  });

  // Inquiries
  customerInquiries.forEach((inq) => {
    timeline.push({
      id: `tl-inq-${inq.id}`,
      customerId: customer.id,
      type: 'inquiry_created',
      title: `Concierge Inquiry: ${inq.subject || 'Support Ticket'}`,
      description: inq.message.slice(0, 100),
      timestamp: inq.created_at,
      badgeColor: 'amber',
    });
  });

  // Conversations
  allConversations.forEach((msg) => {
    timeline.push({
      id: `tl-msg-${msg.id}`,
      customerId: customer.id,
      type: 'communication',
      title: `${msg.channel.toUpperCase()}: ${msg.direction === 'outbound' ? 'Sent to Customer' : 'Received from Customer'}`,
      description: msg.message.slice(0, 120),
      timestamp: msg.timestamp,
      badgeColor: 'sky',
    });
  });

  // Staff notes
  staffNotes.forEach((n) => {
    timeline.push({
      id: `tl-note-${n.id}`,
      customerId: customer.id,
      type: 'staff_note',
      title: `Staff Note: ${n.author}`,
      description: n.note,
      timestamp: n.createdAt,
      badgeColor: 'purple',
    });
  });

  // Sort timeline chronologically descending
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    ...customer,
    bookings: customerBookings,
    inquiries: customerInquiries,
    communications: allConversations,
    staffNotes,
    tasks: customerTasks,
    followUps: customerFollowUps,
    reviews: [],
    timeline,
  };
}

export async function addCustomerTag(customerId: string, tag: string): Promise<void> {
  const manual = getStored<CrmCustomerSummary[]>(KEYS.CUSTOMERS, []);
  const cleanTag = tag.trim();
  const updated = manual.map((c) => {
    if (c.id === customerId && !c.tags.includes(cleanTag)) {
      return { ...c, tags: [...c.tags, cleanTag] };
    }
    return c;
  });
  setStored(KEYS.CUSTOMERS, updated);
}

export async function removeCustomerTag(customerId: string, tag: string): Promise<void> {
  const manual = getStored<CrmCustomerSummary[]>(KEYS.CUSTOMERS, []);
  const updated = manual.map((c) => {
    if (c.id === customerId) {
      return { ...c, tags: c.tags.filter((t) => t !== tag) };
    }
    return c;
  });
  setStored(KEYS.CUSTOMERS, updated);
}

export interface CreateCustomerPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  hotel?: string | null;
  notes?: string | null;
  tags?: string[];
  customerSource?: CrmLeadSource | string;
}

export interface CreateCustomerResult {
  customer: CrmCustomerSummary;
  isExisting: boolean;
  message: string;
}

export async function createCrmCustomer(payload: CreateCustomerPayload): Promise<CreateCustomerResult> {
  const all = await getCrmCustomers();
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanPhone = (payload.phone || '').replace(/[^0-9]/g, '');

  // Deduplication check: check email or phone
  const existing = all.find((c) => {
    if (c.email.trim().toLowerCase() === cleanEmail) return true;
    if (cleanPhone && c.phone) {
      const p = c.phone.replace(/[^0-9]/g, '');
      if (p.length >= 7 && p === cleanPhone) return true;
    }
    return false;
  });

  if (existing) {
    // Intelligent deduplication & enrichment
    const manual = getStored<CrmCustomerSummary[]>(KEYS.CUSTOMERS, []);
    const mergedTags = Array.from(new Set([...existing.tags, ...(payload.tags || [])]));
    const updatedSummary: CrmCustomerSummary = {
      ...existing,
      fullName: existing.fullName || payload.fullName.trim(),
      phone: payload.phone || existing.phone,
      whatsapp: payload.whatsapp || existing.whatsapp || payload.phone,
      country: payload.country || existing.country,
      hotel: payload.hotel || existing.hotel,
      notes: payload.notes ? (existing.notes ? `${existing.notes}\n${payload.notes}` : payload.notes) : existing.notes,
      tags: mergedTags,
      customerSource: existing.customerSource || payload.customerSource || 'Website',
      updatedAt: new Date().toISOString(),
    };

    const nextManual = manual.some((m) => m.id === existing.id || m.email.toLowerCase() === cleanEmail)
      ? manual.map((m) => (m.id === existing.id || m.email.toLowerCase() === cleanEmail ? updatedSummary : m))
      : [...manual, updatedSummary];

    setStored(KEYS.CUSTOMERS, nextManual);

    await logTimelineEvent({
      id: `ev-${Date.now()}`,
      customerId: existing.id,
      customerName: existing.fullName,
      type: 'account_created',
      title: `Customer Record Merged: ${existing.fullName}`,
      description: `Identified by ${cleanEmail === existing.email.toLowerCase() ? 'email' : 'phone'} match. Contact details intelligently updated without duplicate creation.`,
      timestamp: new Date().toISOString(),
      badgeColor: 'amber',
    });

    return {
      customer: updatedSummary,
      isExisting: true,
      message: `Existing traveler profile located for ${existing.fullName} (${existing.email}). Profile updated and linked.`,
    };
  }

  // Create new customer
  const newId = `cust-${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
  const newCustomer: CrmCustomerSummary = {
    id: newId,
    fullName: payload.fullName.trim(),
    email: cleanEmail,
    phone: payload.phone || null,
    whatsapp: payload.whatsapp || payload.phone || null,
    country: payload.country || 'International',
    hotel: payload.hotel || null,
    notes: payload.notes || null,
    tags: payload.tags && payload.tags.length > 0 ? payload.tags : ['New'],
    firstBookingDate: null,
    latestBookingDate: null,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenueEur: 0,
    outstandingAmountEur: 0,
    lastContactDate: new Date().toISOString(),
    customerSource: payload.customerSource || 'Website',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const manual = getStored<CrmCustomerSummary[]>(KEYS.CUSTOMERS, []);
  setStored(KEYS.CUSTOMERS, [newCustomer, ...manual]);

  // If Supabase is configured, create in public.customers
  if (isSupabaseConfigured()) {
    try {
      const parts = newCustomer.fullName.split(' ');
      await supabase.from('customers').insert({
        first_name: parts[0] || 'Traveler',
        last_name: parts.slice(1).join(' ') || '',
        email: newCustomer.email,
        phone: newCustomer.phone || '',
        whatsapp: newCustomer.whatsapp,
        country: newCustomer.country || 'International',
        hotel: newCustomer.hotel,
      });
    } catch {
      // ignore
    }
  }

  await logTimelineEvent({
    id: `ev-${Date.now()}`,
    customerId: newCustomer.id,
    customerName: newCustomer.fullName,
    type: 'account_created',
    title: `New Customer Enrolled: ${newCustomer.fullName}`,
    description: `Created via ${newCustomer.customerSource} with country ${newCustomer.country}.`,
    timestamp: newCustomer.createdAt,
    badgeColor: 'blue',
  });

  return {
    customer: newCustomer,
    isExisting: false,
    message: `Customer profile created for ${newCustomer.fullName}.`,
  };
}

export async function updateCrmCustomer(
  id: string,
  updates: Partial<CrmCustomerSummary>
): Promise<CrmCustomerSummary | null> {
  const manual = getStored<CrmCustomerSummary[]>(KEYS.CUSTOMERS, []);
  let updatedCust: CrmCustomerSummary | null = null;
  const next = manual.map((c) => {
    if (c.id === id) {
      updatedCust = { ...c, ...updates, updatedAt: new Date().toISOString() };
      return updatedCust;
    }
    return c;
  });

  if (!updatedCust) {
    const all = await getCrmCustomers();
    const found = all.find((c) => c.id === id);
    if (found) {
      updatedCust = { ...found, ...updates, updatedAt: new Date().toISOString() };
      next.push(updatedCust);
    }
  }

  setStored(KEYS.CUSTOMERS, next);
  return updatedCust;
}

export async function deleteCrmCustomer(id: string): Promise<void> {
  const manual = getStored<CrmCustomerSummary[]>(KEYS.CUSTOMERS, []);
  setStored(KEYS.CUSTOMERS, manual.filter((c) => c.id !== id));
}

export async function recordCustomerPayment(
  customerId: string,
  amountEur: number,
  paymentMethod: string,
  reference?: string
): Promise<void> {
  const all = await getCrmCustomers();
  const customer = all.find((c) => c.id === customerId);
  if (!customer) return;

  const newOutstanding = Math.max(0, customer.outstandingAmountEur - amountEur);
  await updateCrmCustomer(customerId, {
    outstandingAmountEur: newOutstanding,
    totalRevenueEur: customer.totalRevenueEur + amountEur,
  });

  await logTimelineEvent({
    id: `ev-${Date.now()}`,
    customerId,
    customerName: customer.fullName,
    type: 'payment_recorded',
    title: `Payment Recorded: €${amountEur.toFixed(2)} (${paymentMethod})`,
    description: `Settled via ${paymentMethod}${reference ? ` [Ref: ${reference}]` : ''}. Outstanding balance: €${newOutstanding.toFixed(2)}.`,
    timestamp: new Date().toISOString(),
    badgeColor: 'emerald',
  });
}

export async function convertInquiryToCustomer(inquiryId: string): Promise<CreateCustomerResult> {
  const inquiries = await listInquiries();
  const inq = inquiries.find((i) => i.id === inquiryId);
  if (!inq) {
    throw new Error('Inquiry not found.');
  }

  return await createCrmCustomer({
    fullName: inq.customer_name,
    email: inq.email,
    phone: inq.phone || null,
    whatsapp: inq.phone || null,
    country: 'International',
    notes: `Converted from Inquiry (${inq.subject}):\n${inq.message}`,
    customerSource: 'Website',
    tags: ['Inquiry Lead'],
  });
}

export async function convertLeadToCustomer(leadId: string): Promise<CreateCustomerResult> {
  const leads = await getLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) {
    throw new Error('Lead not found.');
  }

  const result = await createCrmCustomer({
    fullName: lead.name,
    email: lead.email,
    phone: lead.phone || null,
    whatsapp: lead.whatsapp || lead.phone || null,
    country: lead.country || 'International',
    hotel: lead.hotel || null,
    notes: lead.notes || `Converted from Lead (Interested in ${lead.interestedTourTitle || 'tours'})`,
    customerSource: lead.source,
    tags: ['Converted Lead'],
  });

  // Advance lead stage to 'booked'
  await updateLeadStage(leadId, 'booked');

  return result;
}

// ==============================================================================
// 9. CRM DASHBOARD METRICS
// ==============================================================================

export async function getCrmDashboardMetrics(): Promise<CrmDashboardMetrics> {
  const [leads, inquiries, bookings, followUps, customers] = await Promise.all([
    getLeads(),
    listInquiries(),
    bookingRepository.listBookings(),
    getCrmFollowUps(),
    getCrmCustomers(),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const nowMs = Date.now();
  const weekStartMs = nowMs - 7 * 86400000;

  const newLeads = leads.filter((l) => l.stage === 'new').length;
  const openInquiries = inquiries.filter((i) => i.status === 'new' || i.status === 'contacted').length;

  const bookingsToday = bookings.filter((b) => b.createdAt?.startsWith(todayStr) || b.date === todayStr).length;
  const bookingsThisWeek = bookings.filter((b) => new Date(b.createdAt || b.date).getTime() >= weekStartMs).length;

  const activeFollowUps = followUps.filter((f) => !f.isCompleted);
  const overdueFollowUps = activeFollowUps.filter((f) => new Date(f.scheduledFor).getTime() < nowMs).length;

  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.pricing?.totalEur || 0), 0);

  const outstanding = bookings
    .filter((b) => b.status === 'confirmed' && b.paymentMethod === 'pay_at_pickup')
    .reduce((sum, b) => sum + (b.pricing?.totalEur || 0), 0);

  const bookedLeads = leads.filter((l) => l.stage === 'booked' || l.stage === 'completed').length;
  const conversionRate = leads.length > 0 ? Math.round((bookedLeads / leads.length) * 100) : 24;

  return {
    newLeadsCount: newLeads,
    openInquiriesCount: openInquiries,
    bookingsTodayCount: bookingsToday,
    bookingsThisWeekCount: bookingsThisWeek,
    followUpsDueCount: activeFollowUps.length,
    overdueFollowUpsCount: overdueFollowUps,
    newCustomersCount: customers.length,
    conversionRatePercent: conversionRate,
    totalRevenueEur: totalRevenue,
    outstandingPaymentsEur: outstanding,
  };
}

// ==============================================================================
// 10. GLOBAL CRM SEARCH ENGINE
// ==============================================================================

export async function globalCrmSearch(query: string): Promise<{
  customers: CrmCustomerSummary[];
  leads: CrmLead[];
  bookings: Booking[];
}> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { customers: [], leads: [], bookings: [] };
  }

  const [allCustomers, allLeads, allBookings] = await Promise.all([
    getCrmCustomers(),
    getLeads(),
    bookingRepository.listBookings(),
  ]);

  const matchedCustomers = allCustomers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.whatsapp && c.whatsapp.includes(q))
  );

  const matchedLeads = allLeads.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.phone && l.phone.includes(q))
  );

  const matchedBookings = allBookings.filter(
    (b) =>
      b.bookingReference.toLowerCase().includes(q) ||
      b.customer?.email?.toLowerCase().includes(q) ||
      b.customer?.phoneNumber?.includes(q) ||
      b.tourTitle?.toLowerCase().includes(q)
  );

  return {
    customers: matchedCustomers.slice(0, 10),
    leads: matchedLeads.slice(0, 10),
    bookings: matchedBookings.slice(0, 10),
  };
}
