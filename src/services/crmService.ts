import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  CrmLead,
  LeadStage,
  LeadSource,
  CrmTask,
  TaskStatus,
  TaskPriority,
  CrmCommunication,
  CrmNote,
  CrmActivity,
  CrmCustomerDetail,
  CrmDashboardMetrics,
} from '../types/crm';
import { bookingRepository } from './bookingRepository';
import { listInquiries } from './inquiryService';
import { Booking } from '../types/booking';

export type {
  CrmLead,
  LeadStage,
  LeadSource,
  CrmTask,
  TaskStatus,
  TaskPriority,
  CrmCommunication,
  CrmNote,
  CrmActivity,
  CrmCustomerDetail,
  CrmDashboardMetrics,
};

const LOCAL_LEADS_KEY = 'rse_crm_leads';
const LOCAL_TASKS_KEY = 'rse_crm_tasks';
const LOCAL_COMMS_KEY = 'rse_crm_comms';
const LOCAL_NOTES_KEY = 'rse_crm_notes';
const LOCAL_ACTIVITIES_KEY = 'rse_crm_activities';
const LOCAL_CUSTOMERS_EXTRA_KEY = 'rse_crm_customers_extra';

// Realistic sample seed data for tourism operators in Hurghada / Red Sea
const INITIAL_LEADS: CrmLead[] = [
  {
    id: 'lead-001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@gmail.com',
    phone: '+44 7911 123456',
    whatsapp: '+44 7911 123456',
    country: 'United Kingdom',
    hotel: 'Steigenberger ALDAU Beach Hotel, Hurghada',
    source: 'Website',
    interestedTourTitle: 'Giftun Island VIP Yacht & Snorkeling Cruise',
    travelDate: '2026-10-15',
    numberOfGuests: 4,
    estimatedValue: 360,
    currency: 'EUR',
    stage: 'Quotation Sent',
    notes: 'Family with two teenagers. Interested in private snorkeling guide.',
    assignedStaffName: 'Captain Tarek',
    followUpDate: '2026-10-07T10:00:00.000Z',
    createdAt: '2026-10-04T09:20:00.000Z',
    updatedAt: '2026-10-05T14:30:00.000Z',
  },
  {
    id: 'lead-002',
    name: 'Markus Weber',
    email: 'markus.weber@web.de',
    phone: '+49 170 9876543',
    whatsapp: '+49 170 9876543',
    country: 'Germany',
    hotel: 'Mövenpick Resort El Gouna',
    source: 'WhatsApp',
    interestedTourTitle: 'Red Sea Mega Safari: Quad, Dune Buggy & Bedouin Dinner',
    travelDate: '2026-10-12',
    numberOfGuests: 2,
    estimatedValue: 170,
    currency: 'EUR',
    stage: 'Interested',
    notes: 'Requested pickup from El Gouna marina. Prefers sunset quad tour.',
    assignedStaffName: 'Mona Zaki (Concierge)',
    followUpDate: '2026-10-06T14:00:00.000Z',
    createdAt: '2026-10-05T11:15:00.000Z',
    updatedAt: '2026-10-05T16:00:00.000Z',
  },
  {
    id: 'lead-003',
    name: 'Elena Rostova',
    email: 'elena.rostova@yandex.ru',
    phone: '+7 903 555-1212',
    whatsapp: '+7 903 555-1212',
    country: 'Russia',
    hotel: 'Baron Palace Sahl Hasheesh',
    source: 'Hotel',
    interestedTourTitle: 'Private Luxury Speedboat Charter & Dolphin Encounter',
    travelDate: '2026-10-20',
    numberOfGuests: 5,
    estimatedValue: 650,
    currency: 'EUR',
    stage: 'Booking Pending',
    notes: 'Celebrating husband birthday. Asked for champagne and fruit basket onboard.',
    assignedStaffName: 'Ahmed Fathy',
    followUpDate: '2026-10-06T09:00:00.000Z',
    createdAt: '2026-10-03T16:45:00.000Z',
    updatedAt: '2026-10-05T18:20:00.000Z',
  },
  {
    id: 'lead-004',
    name: 'Luca Moretti',
    email: 'luca.moretti@libero.it',
    phone: '+39 347 1122334',
    whatsapp: '+39 347 1122334',
    country: 'Italy',
    hotel: 'Jaz Makadina, Makadi Bay',
    source: 'Instagram',
    interestedTourTitle: 'Scuba Diving Intro at Abu Ramada Reef',
    travelDate: '2026-10-25',
    numberOfGuests: 2,
    estimatedValue: 240,
    currency: 'EUR',
    stage: 'Contacted',
    notes: 'First time diving. Wants Italian-speaking divemaster.',
    assignedStaffName: 'Captain Tarek',
    followUpDate: '2026-10-08T11:30:00.000Z',
    createdAt: '2026-10-05T08:00:00.000Z',
    updatedAt: '2026-10-05T08:30:00.000Z',
  },
  {
    id: 'lead-005',
    name: 'David Van Houten',
    email: 'david.vh@kpnmail.nl',
    phone: '+31 6 12345678',
    country: 'Netherlands',
    hotel: 'Premier Le Reve Hotel, Sahl Hasheesh',
    source: 'Google',
    interestedTourTitle: 'Luxor Day Tour: Valley of Kings & Karnak Temple',
    travelDate: '2026-10-18',
    numberOfGuests: 2,
    estimatedValue: 320,
    currency: 'EUR',
    stage: 'New',
    notes: 'Inquired via website form regarding private limousine transfer.',
    assignedStaffName: null,
    followUpDate: '2026-10-06T12:00:00.000Z',
    createdAt: '2026-10-06T06:10:00.000Z',
    updatedAt: '2026-10-06T06:10:00.000Z',
  },
];

const INITIAL_TASKS: CrmTask[] = [
  {
    id: 'task-001',
    title: 'Call Markus Weber regarding El Gouna pickup time',
    description: 'Verify resort security clearance and confirm 15:30 pier departure.',
    leadId: 'lead-002',
    leadName: 'Markus Weber',
    assignedStaffName: 'Mona Zaki (Concierge)',
    dueDate: '2026-10-06T14:00:00.000Z',
    priority: 'High',
    status: 'Pending',
    isFollowUp: true,
    createdAt: '2026-10-05T11:30:00.000Z',
    updatedAt: '2026-10-05T11:30:00.000Z',
  },
  {
    id: 'task-002',
    title: 'Follow up on Luxor private charter quotation for David',
    description: 'Check Egyptologist guide availability for English & Dutch.',
    leadId: 'lead-005',
    leadName: 'David Van Houten',
    assignedStaffName: 'Ahmed Fathy',
    dueDate: '2026-10-06T12:00:00.000Z',
    priority: 'Medium',
    status: 'Pending',
    isFollowUp: true,
    createdAt: '2026-10-06T06:15:00.000Z',
    updatedAt: '2026-10-06T06:15:00.000Z',
  },
  {
    id: 'task-003',
    title: 'Collect Coast Guard manifest copies for Baron Palace guests',
    description: 'Need passport photos for naval clearance prior to speed boat departure.',
    leadId: 'lead-003',
    leadName: 'Elena Rostova',
    assignedStaffName: 'Captain Tarek',
    dueDate: '2026-10-07T08:00:00.000Z',
    priority: 'Urgent',
    status: 'In Progress',
    isFollowUp: false,
    createdAt: '2026-10-05T17:00:00.000Z',
    updatedAt: '2026-10-05T17:00:00.000Z',
  },
  {
    id: 'task-004',
    title: 'Confirm fruit platter & flowers for VIP yacht charter',
    description: 'Order from Hurghada Marina gourmet provisioning desk.',
    assignedStaffName: 'Mona Zaki (Concierge)',
    dueDate: '2026-10-08T16:00:00.000Z',
    priority: 'Medium',
    status: 'Pending',
    isFollowUp: false,
    createdAt: '2026-10-05T14:00:00.000Z',
    updatedAt: '2026-10-05T14:00:00.000Z',
  },
];

const INITIAL_ACTIVITIES: CrmActivity[] = [
  {
    id: 'act-001',
    eventType: 'lead_created',
    title: 'New Lead Created',
    description: 'David Van Houten submitted inquiry for Luxor Day Tour from website form.',
    actor: 'System (Web Form)',
    createdAt: '2026-10-06T06:10:00.000Z',
  },
  {
    id: 'act-002',
    eventType: 'communication',
    title: 'WhatsApp Message Sent',
    description: 'Quotation sent to Sarah Jenkins for Giftun Island VIP Yacht.',
    actor: 'Captain Tarek',
    createdAt: '2026-10-05T14:30:00.000Z',
  },
  {
    id: 'act-003',
    eventType: 'stage_changed',
    title: 'Lead Moved to Booking Pending',
    description: 'Elena Rostova accepted private speed boat charter package.',
    actor: 'Ahmed Fathy',
    createdAt: '2026-10-05T18:20:00.000Z',
  },
  {
    id: 'act-004',
    eventType: 'task_created',
    title: 'Follow-up Task Scheduled',
    description: 'Call Markus Weber regarding El Gouna pickup time tomorrow.',
    actor: 'Mona Zaki (Concierge)',
    createdAt: '2026-10-05T11:30:00.000Z',
  },
];

// Helper storage functions
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ------------------------------------------------------------------------------
// LEADS SERVICE
// ------------------------------------------------------------------------------

export async function listLeads(filter?: {
  stage?: string;
  search?: string;
  staff?: string;
}): Promise<CrmLead[]> {
  let leads = getLocal<CrmLead[]>(LOCAL_LEADS_KEY, INITIAL_LEADS);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        leads = data.map((d) => ({
          id: d.id,
          name: d.name,
          email: d.email || '',
          phone: d.phone,
          whatsapp: d.whatsapp,
          country: d.country,
          hotel: d.hotel,
          source: (d.source as LeadSource) || 'Website',
          interestedTourId: d.interested_tour_id,
          interestedTourTitle: d.interested_tour_title,
          travelDate: d.travel_date,
          numberOfGuests: d.number_of_guests || 1,
          estimatedValue: Number(d.estimated_value) || 0,
          currency: d.currency || 'EUR',
          stage: (d.stage as LeadStage) || 'New',
          notes: d.notes,
          assignedStaffId: d.assigned_staff_id,
          assignedStaffName: d.assigned_staff_name,
          customerId: d.customer_id,
          followUpDate: d.follow_up_date,
          lostReason: d.lost_reason,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        setLocal(LOCAL_LEADS_KEY, leads);
      }
    } catch {
      // fallback to cached leads
    }
  }

  return leads.filter((l) => {
    if (filter?.stage && filter.stage !== 'all' && l.stage !== filter.stage) return false;
    if (filter?.staff && filter.staff !== 'all' && l.assignedStaffName !== filter.staff)
      return false;
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.phone && l.phone.includes(q)) ||
        (l.hotel && l.hotel.toLowerCase().includes(q)) ||
        (l.interestedTourTitle && l.interestedTourTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });
}

export async function createLead(input: Partial<CrmLead>): Promise<CrmLead> {
  const newLead: CrmLead = {
    id: `lead-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    name: input.name || 'Anonymous Inquiry',
    email: input.email || '',
    phone: input.phone || null,
    whatsapp: input.whatsapp || input.phone || null,
    country: input.country || null,
    hotel: input.hotel || null,
    source: input.source || 'Website',
    interestedTourId: input.interestedTourId || null,
    interestedTourTitle: input.interestedTourTitle || null,
    travelDate: input.travelDate || null,
    numberOfGuests: input.numberOfGuests || 1,
    estimatedValue: input.estimatedValue || 0,
    currency: input.currency || 'EUR',
    stage: input.stage || 'New',
    notes: input.notes || null,
    assignedStaffId: input.assignedStaffId || null,
    assignedStaffName: input.assignedStaffName || null,
    customerId: input.customerId || null,
    followUpDate: input.followUpDate || null,
    lostReason: input.lostReason || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const leads = getLocal<CrmLead[]>(LOCAL_LEADS_KEY, INITIAL_LEADS);
  const updated = [newLead, ...leads];
  setLocal(LOCAL_LEADS_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          whatsapp: newLead.whatsapp,
          country: newLead.country,
          hotel: newLead.hotel,
          source: newLead.source,
          interested_tour_id: newLead.interestedTourId,
          interested_tour_title: newLead.interestedTourTitle,
          travel_date: newLead.travelDate,
          number_of_guests: newLead.numberOfGuests,
          estimated_value: newLead.estimatedValue,
          currency: newLead.currency,
          stage: newLead.stage,
          notes: newLead.notes,
          assigned_staff_name: newLead.assignedStaffName,
          follow_up_date: newLead.followUpDate,
        })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        newLead.id = data.id;
      }
    } catch {
      // ignore
    }
  }

  // Record timeline activity
  await recordActivity({
    leadId: newLead.id,
    eventType: 'lead_created',
    title: 'Lead Created',
    description: `${newLead.name} added via ${newLead.source} for ${newLead.interestedTourTitle || 'excursion inquiry'}.`,
    actor: newLead.assignedStaffName || 'Staff Member',
  });

  return newLead;
}

export async function updateLeadStage(
  leadId: string,
  newStage: LeadStage,
  lostReason?: string
): Promise<boolean> {
  const leads = getLocal<CrmLead[]>(LOCAL_LEADS_KEY, INITIAL_LEADS);
  const target = leads.find((l) => l.id === leadId);
  const oldStage = target?.stage || 'Unknown';

  const updated = leads.map((l) =>
    l.id === leadId
      ? {
          ...l,
          stage: newStage,
          lostReason: newStage === 'Lost' ? lostReason || l.lostReason : null,
          updatedAt: new Date().toISOString(),
        }
      : l
  );
  setLocal(LOCAL_LEADS_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('leads')
        .update({
          stage: newStage,
          lost_reason: newStage === 'Lost' ? lostReason : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    } catch {
      // ignore
    }
  }

  await recordActivity({
    leadId,
    eventType: 'stage_changed',
    title: `Stage Changed: ${newStage}`,
    description: `Lead moved from "${oldStage}" to "${newStage}"${lostReason ? ` (Reason: ${lostReason})` : ''}.`,
    actor: 'Admin Staff',
  });

  return true;
}

export async function updateLead(leadId: string, updates: Partial<CrmLead>): Promise<boolean> {
  const leads = getLocal<CrmLead[]>(LOCAL_LEADS_KEY, INITIAL_LEADS);
  const updated = leads.map((l) =>
    l.id === leadId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
  );
  setLocal(LOCAL_LEADS_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
      if (updates.country !== undefined) payload.country = updates.country;
      if (updates.hotel !== undefined) payload.hotel = updates.hotel;
      if (updates.stage !== undefined) payload.stage = updates.stage;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.assignedStaffName !== undefined) payload.assigned_staff_name = updates.assignedStaffName;
      if (updates.followUpDate !== undefined) payload.follow_up_date = updates.followUpDate;
      if (updates.estimatedValue !== undefined) payload.estimated_value = updates.estimatedValue;
      if (updates.travelDate !== undefined) payload.travel_date = updates.travelDate;

      await supabase.from('leads').update(payload).eq('id', leadId);
    } catch {
      // ignore
    }
  }

  return true;
}

export async function deleteLead(leadId: string): Promise<boolean> {
  const leads = getLocal<CrmLead[]>(LOCAL_LEADS_KEY, INITIAL_LEADS);
  setLocal(
    LOCAL_LEADS_KEY,
    leads.filter((l) => l.id !== leadId)
  );

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('leads').delete().eq('id', leadId);
    } catch {
      // ignore
    }
  }

  return true;
}

// ------------------------------------------------------------------------------
// TASKS & FOLLOW-UPS SERVICE
// ------------------------------------------------------------------------------

export async function listTasks(filter?: {
  status?: string;
  staff?: string;
  isFollowUp?: boolean;
}): Promise<CrmTask[]> {
  let tasks = getLocal<CrmTask[]>(LOCAL_TASKS_KEY, INITIAL_TASKS);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        tasks = data.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          customerId: d.customer_id,
          customerName: d.customer_name,
          leadId: d.lead_id,
          leadName: d.lead_name,
          bookingId: d.booking_id,
          bookingReference: d.booking_reference,
          assignedStaffId: d.assigned_staff_id,
          assignedStaffName: d.assigned_staff_name,
          dueDate: d.due_date,
          priority: (d.priority as TaskPriority) || 'Medium',
          status: (d.status as TaskStatus) || 'Pending',
          isFollowUp: Boolean(d.is_follow_up),
          completedAt: d.completed_at,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        setLocal(LOCAL_TASKS_KEY, tasks);
      }
    } catch {
      // ignore
    }
  }

  return tasks.filter((t) => {
    if (filter?.status && filter.status !== 'all' && t.status !== filter.status) return false;
    if (filter?.staff && filter.staff !== 'all' && t.assignedStaffName !== filter.staff)
      return false;
    if (filter?.isFollowUp !== undefined && t.isFollowUp !== filter.isFollowUp) return false;
    return true;
  });
}

export async function createTask(input: Partial<CrmTask>): Promise<CrmTask> {
  const newTask: CrmTask = {
    id: `task-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    title: input.title || 'Untitled Follow-up',
    description: input.description || null,
    customerId: input.customerId || null,
    customerName: input.customerName || null,
    leadId: input.leadId || null,
    leadName: input.leadName || null,
    bookingId: input.bookingId || null,
    bookingReference: input.bookingReference || null,
    assignedStaffId: input.assignedStaffId || null,
    assignedStaffName: input.assignedStaffName || 'Admin Staff',
    dueDate: input.dueDate || new Date(Date.now() + 86400000).toISOString(),
    priority: input.priority || 'Medium',
    status: input.status || 'Pending',
    isFollowUp: input.isFollowUp !== undefined ? input.isFollowUp : true,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const tasks = getLocal<CrmTask[]>(LOCAL_TASKS_KEY, INITIAL_TASKS);
  setLocal(LOCAL_TASKS_KEY, [newTask, ...tasks]);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('crm_tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          customer_id: newTask.customerId,
          customer_name: newTask.customerName,
          lead_id: newTask.leadId,
          lead_name: newTask.leadName,
          booking_id: newTask.bookingId,
          booking_reference: newTask.bookingReference,
          assigned_staff_name: newTask.assignedStaffName,
          due_date: newTask.dueDate,
          priority: newTask.priority,
          status: newTask.status,
          is_follow_up: newTask.isFollowUp,
        })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        newTask.id = data.id;
      }
    } catch {
      // ignore
    }
  }

  await recordActivity({
    customerId: newTask.customerId || undefined,
    leadId: newTask.leadId || undefined,
    eventType: 'task_created',
    title: newTask.isFollowUp ? 'Follow-up Scheduled' : 'Task Assigned',
    description: `${newTask.title} (Assigned to: ${newTask.assignedStaffName})`,
    actor: newTask.assignedStaffName || 'Staff Member',
  });

  return newTask;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<boolean> {
  const tasks = getLocal<CrmTask[]>(LOCAL_TASKS_KEY, INITIAL_TASKS);
  const updated = tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          status: newStatus,
          completedAt: newStatus === 'Completed' ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        }
      : t
  );
  setLocal(LOCAL_TASKS_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('crm_tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'Completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);
    } catch {
      // ignore
    }
  }

  if (newStatus === 'Completed') {
    const target = tasks.find((t) => t.id === taskId);
    await recordActivity({
      customerId: target?.customerId || undefined,
      leadId: target?.leadId || undefined,
      eventType: 'task_completed',
      title: 'Task Completed',
      description: `Completed: ${target?.title || 'Follow-up task'}`,
      actor: target?.assignedStaffName || 'Staff Member',
    });
  }

  return true;
}

export async function updateTask(taskId: string, updates: Partial<CrmTask>): Promise<boolean> {
  const tasks = getLocal<CrmTask[]>(LOCAL_TASKS_KEY, INITIAL_TASKS);
  const updated = tasks.map((t) =>
    t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
  );
  setLocal(LOCAL_TASKS_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
      if (updates.assignedStaffName !== undefined) payload.assigned_staff_name = updates.assignedStaffName;
      if (updates.isFollowUp !== undefined) payload.is_follow_up = updates.isFollowUp;

      await supabase.from('crm_tasks').update(payload).eq('id', taskId);
    } catch {
      // ignore
    }
  }

  return true;
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const tasks = getLocal<CrmTask[]>(LOCAL_TASKS_KEY, INITIAL_TASKS);
  setLocal(
    LOCAL_TASKS_KEY,
    tasks.filter((t) => t.id !== taskId)
  );

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('crm_tasks').delete().eq('id', taskId);
    } catch {
      // ignore
    }
  }

  return true;
}

export async function getFollowUpsDue(): Promise<{
  dueToday: CrmTask[];
  overdue: CrmTask[];
  upcoming: CrmTask[];
}> {
  const allTasks = await listTasks({ isFollowUp: true });
  const pendingTasks = allTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled');
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 86400000;

  const dueToday: CrmTask[] = [];
  const overdue: CrmTask[] = [];
  const upcoming: CrmTask[] = [];

  pendingTasks.forEach((t) => {
    if (!t.dueDate) {
      upcoming.push(t);
      return;
    }
    const dueTime = new Date(t.dueDate).getTime();
    if (dueTime < startOfToday) {
      overdue.push(t);
    } else if (dueTime >= startOfToday && dueTime <= endOfToday) {
      dueToday.push(t);
    } else {
      upcoming.push(t);
    }
  });

  return { dueToday, overdue, upcoming };
}

// ------------------------------------------------------------------------------
// COMMUNICATIONS & NOTES SERVICE
// ------------------------------------------------------------------------------

export async function listCommunications(filter?: {
  customerId?: string;
  leadId?: string;
}): Promise<CrmCommunication[]> {
  let comms = getLocal<CrmCommunication[]>(LOCAL_COMMS_KEY, []);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('crm_communications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        comms = data.map((d) => ({
          id: d.id,
          customerId: d.customer_id,
          customerName: d.customer_name,
          leadId: d.lead_id,
          bookingId: d.booking_id,
          channel: d.channel,
          direction: d.direction,
          summary: d.summary,
          content: d.content,
          staffName: d.staff_name,
          createdAt: d.created_at,
        }));
        setLocal(LOCAL_COMMS_KEY, comms);
      }
    } catch {
      // ignore
    }
  }

  return comms.filter((c) => {
    if (filter?.customerId && c.customerId !== filter.customerId) return false;
    if (filter?.leadId && c.leadId !== filter.leadId) return false;
    return true;
  });
}

export async function recordCommunication(
  input: Partial<CrmCommunication>
): Promise<CrmCommunication> {
  const newComm: CrmCommunication = {
    id: `comm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    customerId: input.customerId || null,
    customerName: input.customerName || null,
    leadId: input.leadId || null,
    bookingId: input.bookingId || null,
    channel: input.channel || 'WhatsApp',
    direction: input.direction || 'outbound',
    summary: input.summary || 'Customer communication log',
    content: input.content || null,
    staffName: input.staffName || 'Admin Staff',
    createdAt: new Date().toISOString(),
  };

  const comms = getLocal<CrmCommunication[]>(LOCAL_COMMS_KEY, []);
  setLocal(LOCAL_COMMS_KEY, [newComm, ...comms]);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('crm_communications').insert({
        customer_id: newComm.customerId,
        customer_name: newComm.customerName,
        lead_id: newComm.leadId,
        booking_id: newComm.bookingId,
        channel: newComm.channel,
        direction: newComm.direction,
        summary: newComm.summary,
        content: newComm.content,
        staff_name: newComm.staffName,
      });
    } catch {
      // ignore
    }
  }

  // Record timeline activity
  await recordActivity({
    customerId: newComm.customerId || undefined,
    leadId: newComm.leadId || undefined,
    eventType: 'communication',
    title: `${newComm.channel} ${newComm.direction === 'inbound' ? 'Received' : 'Sent'}`,
    description: newComm.summary,
    actor: newComm.staffName,
  });

  return newComm;
}

export async function listNotes(filter?: {
  customerId?: string;
  leadId?: string;
}): Promise<CrmNote[]> {
  let notes = getLocal<CrmNote[]>(LOCAL_NOTES_KEY, []);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        notes = data.map((d) => ({
          id: d.id,
          customerId: d.customer_id,
          leadId: d.lead_id,
          bookingId: d.booking_id,
          content: d.content,
          staffName: d.staff_name,
          isPinned: Boolean(d.is_pinned),
          createdAt: d.created_at,
        }));
        setLocal(LOCAL_NOTES_KEY, notes);
      }
    } catch {
      // ignore
    }
  }

  return notes.filter((n) => {
    if (filter?.customerId && n.customerId !== filter.customerId) return false;
    if (filter?.leadId && n.leadId !== filter.leadId) return false;
    return true;
  });
}

export async function addStaffNote(input: Partial<CrmNote>): Promise<CrmNote> {
  const newNote: CrmNote = {
    id: `note-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    customerId: input.customerId || null,
    leadId: input.leadId || null,
    bookingId: input.bookingId || null,
    content: input.content || '',
    staffName: input.staffName || 'Admin Staff',
    isPinned: Boolean(input.isPinned),
    createdAt: new Date().toISOString(),
  };

  const notes = getLocal<CrmNote[]>(LOCAL_NOTES_KEY, []);
  setLocal(LOCAL_NOTES_KEY, [newNote, ...notes]);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('crm_notes').insert({
        customer_id: newNote.customerId,
        lead_id: newNote.leadId,
        booking_id: newNote.bookingId,
        content: newNote.content,
        staff_name: newNote.staffName,
        is_pinned: newNote.isPinned,
      });
    } catch {
      // ignore
    }
  }

  await recordActivity({
    customerId: newNote.customerId || undefined,
    leadId: newNote.leadId || undefined,
    eventType: 'staff_note',
    title: 'Internal Note Added',
    description: newNote.content,
    actor: newNote.staffName,
  });

  return newNote;
}

// ------------------------------------------------------------------------------
// TIMELINE ACTIVITIES SERVICE
// ------------------------------------------------------------------------------

export const logActivity = async (act: Partial<CrmActivity>): Promise<void> => {
  return recordActivity(act);
};

export async function recordActivity(act: Partial<CrmActivity>): Promise<void> {
  const newAct: CrmActivity = {
    id: `act-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    customerId: act.customerId || null,
    leadId: act.leadId || null,
    bookingId: act.bookingId || null,
    eventType: act.eventType || 'staff_note',
    title: act.title || 'CRM Event',
    description: act.description || null,
    actor: act.actor || 'System',
    metadata: act.metadata || {},
    createdAt: new Date().toISOString(),
  };

  const activities = getLocal<CrmActivity[]>(LOCAL_ACTIVITIES_KEY, INITIAL_ACTIVITIES);
  setLocal(LOCAL_ACTIVITIES_KEY, [newAct, ...activities]);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('crm_activities').insert({
        customer_id: newAct.customerId,
        lead_id: newAct.leadId,
        booking_id: newAct.bookingId,
        event_type: newAct.eventType,
        title: newAct.title,
        description: newAct.description,
        actor: newAct.actor,
        metadata: newAct.metadata,
      });
    } catch {
      // ignore
    }
  }
}

export async function getGlobalActivityTimeline(limit: number = 50): Promise<CrmActivity[]> {
  let activities = getLocal<CrmActivity[]>(LOCAL_ACTIVITIES_KEY, INITIAL_ACTIVITIES);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        activities = data.map((d) => ({
          id: d.id,
          customerId: d.customer_id,
          leadId: d.lead_id,
          bookingId: d.booking_id,
          eventType: d.event_type,
          title: d.title,
          description: d.description,
          actor: d.actor,
          metadata: d.metadata,
          createdAt: d.created_at,
        }));
        setLocal(LOCAL_ACTIVITIES_KEY, activities);
      }
    } catch {
      // ignore
    }
  }

  return activities.slice(0, limit);
}

// ------------------------------------------------------------------------------
// COMPREHENSIVE CUSTOMER PROFILE & DEDUPLICATION
// ------------------------------------------------------------------------------

export async function findExistingCustomer(
  email?: string,
  phone?: string
): Promise<CrmCustomerDetail | null> {
  if (!email && !phone) return null;
  const customers = await listCrmCustomers();
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';

  return (
    customers.find((c) => {
      if (cleanEmail && c.email.toLowerCase().trim() === cleanEmail) return true;
      if (cleanPhone && c.phone && c.phone.replace(/[^0-9]/g, '') === cleanPhone) return true;
      if (cleanPhone && c.whatsapp && c.whatsapp.replace(/[^0-9]/g, '') === cleanPhone) return true;
      return false;
    }) || null
  );
}

export async function listCrmCustomers(
  searchQuery?: string,
  tagFilter?: string
): Promise<CrmCustomerDetail[]> {
  const [allBookings, allInquiries, extraMeta] = await Promise.all([
    bookingRepository.listBookings(),
    listInquiries(),
    Promise.resolve(getLocal<Record<string, any>>(LOCAL_CUSTOMERS_EXTRA_KEY, {})),
  ]);

  const customerMap = new Map<string, CrmCustomerDetail>();

  // 1. Group bookings by customer email or phone
  allBookings.forEach((b) => {
    const email = (b.customer?.email || '').toLowerCase().trim();
    if (!email) return;

    let cust = customerMap.get(email);
    const bookingDate = b.date || b.createdAt;
    const isCompleted = b.status === 'completed';
    const isCancelled = b.status === 'cancelled';
    const totalEur = b.pricing?.totalEur || 0;
    const isPaid = b.paymentStatus === 'paid';

    if (!cust) {
      const extra = extraMeta[email] || {};
      cust = {
        id: `cust-${email}`,
        fullName: `${b.customer.firstName || ''} ${b.customer.lastName || ''}`.trim() || 'Guest Traveler',
        email,
        phone: `${b.customer.countryCode || ''} ${b.customer.phoneNumber || ''}`.trim() || null,
        whatsapp: b.customer.whatsappNumber || null,
        country: b.customer.country || null,
        hotel: b.pickup.hotelName || b.customer.hotelName || null,
        notes: extra.notes || null,
        tags: extra.tags || ['Customer'],
        firstBookingDate: bookingDate,
        latestBookingDate: bookingDate,
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        outstandingAmount: 0,
        lastContactDate: bookingDate,
        source: extra.source || 'Website Booking',
        createdAt: bookingDate || new Date().toISOString(),
        role: 'customer',
        isRegistered: Boolean((b as any).userId),
        bookings: [],
        inquiries: [],
        communications: [],
        staffNotes: [],
        tasks: [],
        activities: [],
        reviews: [],
      };
      customerMap.set(email, cust);
    }

    cust.bookings.push(b);
    cust.totalBookings += 1;
    if (isCompleted) cust.completedBookings += 1;
    if (isCancelled) cust.cancelledBookings += 1;
    cust.totalRevenue += totalEur;
    if (!isPaid && !isCancelled) {
      cust.outstandingAmount += totalEur;
    }

    if (!cust.firstBookingDate || bookingDate < cust.firstBookingDate) {
      cust.firstBookingDate = bookingDate;
    }
    if (!cust.latestBookingDate || bookingDate > cust.latestBookingDate) {
      cust.latestBookingDate = bookingDate;
      cust.lastContactDate = bookingDate;
    }
  });

  // 2. Correlate with Inquiries to discover potential inquirers who have not booked yet
  allInquiries.forEach((inq) => {
    const email = (inq.email || '').toLowerCase().trim();
    if (!email) return;

    let cust = customerMap.get(email);
    const extra = extraMeta[email] || {};

    if (!cust) {
      cust = {
        id: `cust-inq-${inq.id}`,
        fullName: inq.customer_name || 'Inquiry Contact',
        email,
        phone: inq.phone || null,
        whatsapp: inq.whatsapp || null,
        country: null,
        hotel: null,
        notes: extra.notes || inq.admin_notes || null,
        tags: extra.tags || ['Inquiry Lead'],
        firstBookingDate: null,
        latestBookingDate: null,
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        outstandingAmount: 0,
        lastContactDate: inq.created_at,
        source: inq.source || 'Website Help Form',
        createdAt: inq.created_at || new Date().toISOString(),
        role: 'customer',
        isRegistered: false,
        bookings: [],
        inquiries: [],
        communications: [],
        staffNotes: [],
        tasks: [],
        activities: [],
        reviews: [],
      };
      customerMap.set(email, cust);
    }

    cust.inquiries.push(inq);
  });

  // Convert map to list
  let customerList = Array.from(customerMap.values()).map((c) => {
    // Dynamically assign tags
    const dynamicTags = new Set(c.tags);
    if (c.totalBookings > 2) dynamicTags.add('VIP Repeat');
    if (c.totalRevenue >= 500) dynamicTags.add('High Value');
    if (c.outstandingAmount > 0) dynamicTags.add('Outstanding Balance');
    c.tags = Array.from(dynamicTags);
    return c;
  });

  // Filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    customerList = customerList.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.whatsapp && c.whatsapp.includes(q)) ||
        (c.hotel && c.hotel.toLowerCase().includes(q)) ||
        c.bookings.some((b) => b.bookingReference.toLowerCase().includes(q))
    );
  }

  if (tagFilter && tagFilter !== 'all') {
    customerList = customerList.filter((c) => c.tags.includes(tagFilter));
  }

  return customerList.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCustomerProfile(idOrEmail: string): Promise<CrmCustomerDetail | null> {
  const allCustomers = await listCrmCustomers();
  const found = allCustomers.find(
    (c) => c.id === idOrEmail || c.email.toLowerCase() === idOrEmail.toLowerCase()
  );
  if (!found) return null;

  // Enrich with communications, staff notes, tasks, and activities
  const [comms, notes, tasks, activities] = await Promise.all([
    listCommunications({ customerId: found.id }),
    listNotes({ customerId: found.id }),
    listTasks(),
    getGlobalActivityTimeline(100),
  ]);

  found.communications = comms;
  found.staffNotes = notes;
  found.tasks = tasks.filter(
    (t) => t.customerId === found.id || (t.customerName && t.customerName === found.fullName)
  );

  // Synthesize unified customer activity timeline:
  // combines account created, inquiries, bookings, payments, staff notes, and communications
  const customerActivities: CrmActivity[] = [...activities.filter((a) => a.customerId === found.id)];

  // Add booking created & changed events
  found.bookings.forEach((b) => {
    customerActivities.push({
      id: `act-bk-${b.bookingReference}`,
      customerId: found.id,
      bookingId: b.bookingId || b.bookingReference,
      eventType: 'booking_created',
      title: `Booking Confirmed: ${b.bookingReference}`,
      description: `${b.tourTitle} for ${b.guests.adults} adult(s). Total: €${b.pricing.totalEur}`,
      actor: 'System (Online Checkout)',
      createdAt: b.date || b.createdAt,
    });

    if (b.paymentStatus === 'paid') {
      customerActivities.push({
        id: `act-pay-${b.bookingReference}`,
        customerId: found.id,
        bookingId: b.bookingId || b.bookingReference,
        eventType: 'payment_recorded',
        title: `Payment Received: €${b.pricing.totalEur}`,
        description: `Full payment cleared via ${b.paymentMethod === 'pay_online' ? 'Credit Card' : 'Pier Cash'}`,
        actor: 'Finance Desk',
        createdAt: b.date || b.createdAt,
      });
    }

    if (b.status === 'cancelled') {
      customerActivities.push({
        id: `act-canc-${b.bookingReference}`,
        customerId: found.id,
        bookingId: b.bookingId || b.bookingReference,
        eventType: 'cancellation',
        title: `Booking Cancelled: ${b.bookingReference}`,
        description: b.cancellationReason || 'Cancellation requested by traveler',
        actor: 'Customer / Operations',
        createdAt: (b as any).updatedAt || b.date || b.createdAt,
      });
    }
  });

  // Add inquiries
  found.inquiries.forEach((inq) => {
    customerActivities.push({
      id: `act-inq-${inq.id}`,
      customerId: found.id,
      eventType: 'inquiry_created',
      title: `Inquiry Submitted: ${inq.subject || 'General Request'}`,
      description: inq.message,
      actor: found.fullName,
      createdAt: inq.created_at,
    });
  });

  // Sort activities newest first
  found.activities = customerActivities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return found;
}

export async function updateCustomerMetadata(
  email: string,
  updates: { notes?: string; tags?: string[]; source?: string }
): Promise<void> {
  const extra = getLocal<Record<string, any>>(LOCAL_CUSTOMERS_EXTRA_KEY, {});
  extra[email.toLowerCase()] = {
    ...(extra[email.toLowerCase()] || {}),
    ...updates,
  };
  setLocal(LOCAL_CUSTOMERS_EXTRA_KEY, extra);
}

// ------------------------------------------------------------------------------
// CONVERSION WORKFLOWS
// ------------------------------------------------------------------------------

export async function convertInquiryToLead(inquiry: any): Promise<CrmLead> {
  const lead = await createLead({
    name: inquiry.customer_name,
    email: inquiry.email,
    phone: inquiry.phone,
    whatsapp: inquiry.whatsapp || inquiry.phone,
    source: (inquiry.source as LeadSource) || 'Website',
    interestedTourId: inquiry.tour_id,
    interestedTourTitle: inquiry.admin_notes?.replace('Referenced Tour: ', '') || null,
    notes: `Converted from Inquiry: ${inquiry.message}`,
    stage: 'Contacted',
  });

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('inquiries').update({ status: 'converted' }).eq('id', inquiry.id);
    } catch {
      // ignore
    }
  }

  return lead;
}

export async function convertLeadToCustomer(leadId: string): Promise<string> {
  const leads = await listLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) throw new Error('Lead not found');

  await updateLeadStage(leadId, 'Booked');
  await updateCustomerMetadata(lead.email, {
    notes: lead.notes || undefined,
    tags: ['Converted Lead', 'Active Customer'],
    source: lead.source,
  });

  await recordActivity({
    leadId,
    eventType: 'stage_changed',
    title: 'Lead Converted to Customer',
    description: `${lead.name} successfully booked and transitioned to verified customer.`,
    actor: 'CRM Sales Team',
  });

  return lead.email;
}

// ------------------------------------------------------------------------------
// DASHBOARD KPIS & METRICS
// ------------------------------------------------------------------------------

export async function getCrmDashboardMetrics(): Promise<CrmDashboardMetrics> {
  const [leads, tasks, allBookings, inquiries, customers] = await Promise.all([
    listLeads(),
    listTasks(),
    bookingRepository.listBookings(),
    listInquiries(),
    listCrmCustomers(),
  ]);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  const bookingsToday = allBookings.filter(
    (b) => (b.date && b.date.startsWith(todayStr)) || (b.createdAt && b.createdAt.startsWith(todayStr))
  ).length;

  const bookingsThisWeek = allBookings.filter(
    (b) => (b.date && b.date >= oneWeekAgo) || (b.createdAt && b.createdAt >= oneWeekAgo)
  ).length;

  const { dueToday, overdue } = await getFollowUpsDue();

  const openInquiries = inquiries.filter(
    (i) => i.status === 'new' || i.status === 'contacted' || (i.status as any) === 'in_progress'
  ).length;

  const totalWonLeadsEur = leads
    .filter((l) => l.stage === 'Booked' || l.stage === 'Completed')
    .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  const totalRevenueEur = allBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.pricing?.totalEur || 0), 0);

  const outstandingPaymentsEur = allBookings
    .filter((b) => b.status !== 'cancelled' && b.paymentStatus !== 'paid')
    .reduce((sum, b) => sum + (b.pricing?.totalEur || 0), 0);

  const closedLeads = leads.filter(
    (l) => l.stage === 'Booked' || l.stage === 'Completed' || l.stage === 'Lost'
  ).length;

  const wonLeads = leads.filter((l) => l.stage === 'Booked' || l.stage === 'Completed').length;
  const conversionRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 65;

  return {
    newLeadsCount: leads.filter((l) => l.stage === 'New').length,
    openInquiriesCount: openInquiries,
    bookingsTodayCount: bookingsToday,
    bookingsThisWeekCount: bookingsThisWeek,
    followUpsDueCount: dueToday.length,
    overdueFollowUpsCount: overdue.length,
    newCustomersCount: customers.filter((c) => c.createdAt >= oneWeekAgo).length,
    conversionRate,
    totalRevenueEur,
    outstandingPaymentsEur,
    totalActiveLeads: leads.filter((l) => l.stage !== 'Lost' && l.stage !== 'Completed').length,
    totalWonLeadsEur,
  };
}
