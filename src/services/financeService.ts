import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  FinancePayment,
  FinancePaymentMethod,
  FinancePaymentStatus,
  FinanceInvoice,
  InvoiceLineItem,
  FinanceRefund,
  OutstandingBalanceItem,
  FinancialReportData,
  CompanyBillingDetails,
} from '../types/finance';
import { bookingRepository } from './bookingRepository';
import { Booking } from '../types/booking';

const LOCAL_PAYMENTS_KEY = 'rse_fin_payments';
const LOCAL_INVOICES_KEY = 'rse_fin_invoices';
const LOCAL_REFUNDS_KEY = 'rse_fin_refunds';

export const COMPANY_DETAILS: CompanyBillingDetails = {
  name: 'Red Sea Voyages S.A.E.',
  tagline: 'Premier Marine Excursions & Desert Expeditions',
  address: 'Hurghada Marina Boulevard, Pier 3, Unit 14B',
  city: 'Hurghada, Red Sea Governorate',
  country: 'Arab Republic of Egypt',
  phone: '+20 100 456 7890',
  email: 'finance@redseavoyages.com',
  website: 'www.redseavoyages.com',
  taxRegistrationNumber: 'EG-TAX-489-102-881',
  commercialRegistryNumber: 'CR-92841-HUR',
  bankName: 'Commercial International Bank (CIB Egypt) - Hurghada Marina Branch',
  iban: 'EG4200100014000001099238472',
  swiftBic: 'CIBEEGCX',
};

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

/**
 * Automatically derives seed payments from existing system bookings
 * if the finance ledger is empty.
 */
async function ensureSeedPayments(): Promise<FinancePayment[]> {
  const current = getLocal<FinancePayment[]>(LOCAL_PAYMENTS_KEY, []);
  if (current.length > 0) return current;

  const bookings = await bookingRepository.listBookings();
  const generated: FinancePayment[] = [];

  bookings.forEach((b) => {
    const total = b.pricing?.totalEur || 0;
    if (b.paymentStatus === 'paid') {
      generated.push({
        id: `pay-${b.bookingReference}-01`,
        bookingId: b.bookingId || b.bookingReference,
        bookingReference: b.bookingReference,
        customerId: (b as any).customerId || null,
        customerName: `${b.customer.firstName} ${b.customer.lastName}`,
        customerEmail: b.customer.email,
        customerPhone: b.customer.phoneNumber
          ? `${b.customer.countryCode || ''} ${b.customer.phoneNumber}`
          : null,
        amount: total,
        currency: 'EUR',
        paymentMethod: b.paymentMethod === 'pay_online' ? 'Online Payment' : 'Cash',
        paymentStatus: 'Paid',
        paymentDate: b.createdAt || new Date().toISOString(),
        transactionReference: `TXN-${b.bookingReference.replace(/[^a-zA-Z0-9]/g, '')}`,
        notes: 'Full payment confirmed at reservation booking.',
        recordedBy: 'Booking Gateway',
        createdAt: b.createdAt || new Date().toISOString(),
      });
    } else if (b.paymentStatus === 'partially_paid') {
      const partialAmount = Math.round(total * 0.5);
      generated.push({
        id: `pay-${b.bookingReference}-01`,
        bookingId: b.bookingId || b.bookingReference,
        bookingReference: b.bookingReference,
        customerId: (b as any).customerId || null,
        customerName: `${b.customer.firstName} ${b.customer.lastName}`,
        customerEmail: b.customer.email,
        customerPhone: b.customer.phoneNumber
          ? `${b.customer.countryCode || ''} ${b.customer.phoneNumber}`
          : null,
        amount: partialAmount,
        currency: 'EUR',
        paymentMethod: 'Card',
        paymentStatus: 'Partially Paid',
        paymentDate: b.createdAt || new Date().toISOString(),
        transactionReference: `DEP-${b.bookingReference.replace(/[^a-zA-Z0-9]/g, '')}`,
        notes: 'Deposit received. Outstanding balance due at hotel pickup.',
        recordedBy: 'Pier Desk Staff',
        createdAt: b.createdAt || new Date().toISOString(),
      });
    }
  });

  setLocal(LOCAL_PAYMENTS_KEY, generated);
  return generated;
}

// ------------------------------------------------------------------------------
// 1. PAYMENTS LEDGER
// ------------------------------------------------------------------------------

export async function listPayments(filter?: {
  bookingId?: string;
  customerId?: string;
  status?: string;
  method?: string;
  currency?: string;
  search?: string;
}): Promise<FinancePayment[]> {
  let payments = await ensureSeedPayments();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('payment_date', { ascending: false });

      if (!error && data) {
        payments = data.map((d) => ({
          id: d.id,
          bookingId: d.booking_id,
          bookingReference: (d as any).booking_reference || d.booking_id,
          customerId: d.customer_id,
          customerName: (d as any).customer_name || 'Guest',
          customerEmail: (d as any).customer_email || '',
          customerPhone: (d as any).customer_phone || null,
          amount: Number(d.amount),
          currency: d.currency || 'EUR',
          paymentMethod: d.payment_method as FinancePaymentMethod,
          paymentStatus: d.status as FinancePaymentStatus,
          paymentDate: d.payment_date,
          transactionReference: d.transaction_reference || `TXN-${d.id.substring(0, 8)}`,
          notes: d.notes,
          recordedBy: d.recorded_by || 'Staff',
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        setLocal(LOCAL_PAYMENTS_KEY, payments);
      }
    } catch {
      // ignore
    }
  }

  return payments.filter((p) => {
    if (filter?.bookingId && p.bookingId !== filter.bookingId && p.bookingReference !== filter.bookingId) return false;
    if (filter?.customerId && p.customerId !== filter.customerId) return false;
    if (filter?.status && filter.status !== 'all' && p.paymentStatus !== filter.status) return false;
    if (filter?.method && filter.method !== 'all' && p.paymentMethod !== filter.method) return false;
    if (filter?.currency && filter.currency !== 'all' && p.currency !== filter.currency) return false;
    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase();
      return (
        p.bookingReference.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerEmail.toLowerCase().includes(q) ||
        p.transactionReference.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });
}

export async function recordPayment(paymentData: {
  bookingId: string;
  bookingReference: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  amount: number;
  currency: string;
  paymentMethod: FinancePaymentMethod;
  paymentStatus: FinancePaymentStatus;
  paymentDate?: string;
  transactionReference?: string;
  notes?: string | null;
  recordedBy?: string;
}): Promise<FinancePayment> {
  const allPayments = await listPayments();
  const paymentDate = paymentData.paymentDate || new Date().toISOString();
  const txRef =
    paymentData.transactionReference?.trim() ||
    `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newPayment: FinancePayment = {
    id: `pay-${Date.now().toString(36)}`,
    bookingId: paymentData.bookingId,
    bookingReference: paymentData.bookingReference,
    customerId: paymentData.customerId || null,
    customerName: paymentData.customerName,
    customerEmail: paymentData.customerEmail,
    customerPhone: paymentData.customerPhone || null,
    amount: Number(paymentData.amount),
    currency: paymentData.currency || 'EUR',
    paymentMethod: paymentData.paymentMethod,
    paymentStatus: paymentData.paymentStatus,
    paymentDate,
    transactionReference: txRef,
    notes: paymentData.notes || null,
    recordedBy: paymentData.recordedBy || 'Finance Staff',
    createdAt: new Date().toISOString(),
  };

  const updatedPayments = [newPayment, ...allPayments];
  setLocal(LOCAL_PAYMENTS_KEY, updatedPayments);

  // Recalculate booking payment status in bookingRepository
  try {
    const allBookings = await bookingRepository.listBookings();
    const targetBooking = allBookings.find(
      (b) => b.bookingReference === paymentData.bookingReference || b.bookingId === paymentData.bookingId
    );

    if (targetBooking) {
      const bookingPayments = updatedPayments.filter(
        (p) =>
          (p.bookingReference === targetBooking.bookingReference || p.bookingId === targetBooking.bookingId) &&
          p.paymentStatus === 'Paid'
      );
      const totalPaid = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
      const bookingTotal = targetBooking.pricing?.totalEur || 0;

      let nextStatus: any = 'pending';
      if (totalPaid >= bookingTotal) {
        nextStatus = 'paid';
      } else if (totalPaid > 0) {
        nextStatus = 'partially_paid';
      }

      await bookingRepository.updateBooking({
        ...targetBooking,
        paymentStatus: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Failed to update booking status after payment:', err);
  }

  // Sync with Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('payment_transactions').insert({
        id: newPayment.id.startsWith('pay-') ? undefined : newPayment.id,
        booking_id: newPayment.bookingId,
        customer_id: newPayment.customerId,
        amount: newPayment.amount,
        currency: newPayment.currency,
        payment_method: newPayment.paymentMethod,
        status: newPayment.paymentStatus,
        transaction_reference: newPayment.transactionReference,
        notes: newPayment.notes,
        recorded_by: newPayment.recordedBy,
        payment_date: newPayment.paymentDate,
      });
    } catch {
      // ignore
    }
  }

  return newPayment;
}

// ------------------------------------------------------------------------------
// 2. INVOICE GENERATION & MANAGEMENT
// ------------------------------------------------------------------------------

export async function listInvoices(filter?: {
  bookingId?: string;
  status?: string;
  search?: string;
}): Promise<FinanceInvoice[]> {
  let invoices = getLocal<FinanceInvoice[]>(LOCAL_INVOICES_KEY, []);

  // If no invoices exist, generate invoices from bookings
  if (invoices.length === 0) {
    const bookings = await bookingRepository.listBookings();
    const payments = await listPayments();

    invoices = bookings.map((b, idx) => {
      const bookingPayments = payments.filter(
        (p) =>
          (p.bookingReference === b.bookingReference || p.bookingId === b.bookingId) &&
          p.paymentStatus === 'Paid'
      );
      const paidAmount = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
      const total = b.pricing?.totalEur || 0;
      const subtotal = b.pricing?.subtotalEur || total;
      const discount = b.pricing?.discountEur || 0;
      const balance = Math.max(0, total - paidAmount);

      let invoiceStatus: FinanceInvoice['status'] = 'issued';
      if (balance <= 0) invoiceStatus = 'paid';
      else if (paidAmount > 0) invoiceStatus = 'partially_paid';

      const lineItems: InvoiceLineItem[] = [
        {
          id: `line-${b.bookingReference}-01`,
          description: `${b.tourTitle} - Excursion Package (${b.guests.adults} Adults${
            b.guests.children > 0 ? `, ${b.guests.children} Children` : ''
          })`,
          quantity: 1,
          unitPrice: subtotal,
          total: subtotal,
          type: 'tour',
        },
      ];

      if (b.pickup.feeEur > 0) {
        lineItems.push({
          id: `line-${b.bookingReference}-pickup`,
          description: `Hotel Pickup Transfer (${b.pickup.hotelName || b.pickup.locationName || 'Hurghada'})`,
          quantity: (b.guests.adults || 1) + (b.guests.children || 0),
          unitPrice: b.pickup.feeEur,
          total: b.pricing?.pickupSubtotalEur || b.pickup.feeEur,
          type: 'pickup',
        });
      }

      if (b.extras && b.extras.length > 0) {
        b.extras.forEach((e, eIdx) => {
          lineItems.push({
            id: `line-${b.bookingReference}-ext-${eIdx}`,
            description: `Extra: ${e.name}`,
            quantity: e.quantity || 1,
            unitPrice: e.priceEur,
            total: e.amountEur || e.priceEur,
            type: 'extra',
          });
        });
      }

      const invNum = `INV-2026-${String(idx + 101).padStart(4, '0')}`;

      return {
        id: `inv-${b.bookingReference}`,
        invoiceNumber: invNum,
        bookingId: b.bookingId || b.bookingReference,
        bookingReference: b.bookingReference,
        customerId: (b as any).customerId || null,
        issueDate: b.createdAt ? b.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: b.date ? b.date.split('T')[0] : new Date().toISOString().split('T')[0],
        customer: {
          name: `${b.customer.firstName} ${b.customer.lastName}`,
          email: b.customer.email,
          phone: b.customer.phoneNumber
            ? `${b.customer.countryCode || ''} ${b.customer.phoneNumber}`
            : null,
          hotel: b.pickup.hotelName || b.customer.hotelName || null,
          roomNumber: b.pickup.roomNumber || b.customer.roomNumber || null,
          country: b.customer.country || null,
        },
        tourTitle: b.tourTitle,
        tourDate: b.date,
        guests: {
          adults: b.guests.adults || 1,
          children: b.guests.children || 0,
          infants: b.guests.infants || 0,
        },
        lineItems,
        subtotal,
        discount,
        taxRatePercent: 0,
        taxAmount: 0,
        total,
        paid: paidAmount,
        balance,
        currency: 'EUR',
        status: invoiceStatus,
        companyDetails: COMPANY_DETAILS,
        notes: 'Thank you for exploring the Red Sea with Red Sea Voyages. Certified Marine Safety & Environmental Compliant.',
        createdAt: b.createdAt || new Date().toISOString(),
        updatedAt: b.updatedAt || new Date().toISOString(),
      };
    });

    setLocal(LOCAL_INVOICES_KEY, invoices);
  }

  return invoices.filter((inv) => {
    if (filter?.bookingId && inv.bookingId !== filter.bookingId && inv.bookingReference !== filter.bookingId)
      return false;
    if (filter?.status && filter.status !== 'all' && inv.status !== filter.status) return false;
    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.bookingReference.toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        inv.customer.email.toLowerCase().includes(q) ||
        inv.tourTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export async function generateInvoiceForBooking(bookingReference: string): Promise<FinanceInvoice | null> {
  const existingInvoices = await listInvoices();
  const existing = existingInvoices.find(
    (inv) => inv.bookingReference === bookingReference || inv.bookingId === bookingReference
  );
  if (existing) return existing;

  const bookings = await bookingRepository.listBookings();
  const b = bookings.find((item) => item.bookingReference === bookingReference || item.bookingId === bookingReference);
  if (!b) return null;

  const payments = await listPayments();
  const bookingPayments = payments.filter(
    (p) =>
      (p.bookingReference === b.bookingReference || p.bookingId === b.bookingId) &&
      p.paymentStatus === 'Paid'
  );
  const paidAmount = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
  const total = b.pricing?.totalEur || 0;
  const subtotal = b.pricing?.subtotalEur || total;
  const discount = b.pricing?.discountEur || 0;
  const balance = Math.max(0, total - paidAmount);

  const lineItems: InvoiceLineItem[] = [
    {
      id: `line-${b.bookingReference}-01`,
      description: `${b.tourTitle} - Excursion Package (${b.guests.adults} Adults${
        b.guests.children > 0 ? `, ${b.guests.children} Children` : ''
      })`,
      quantity: 1,
      unitPrice: subtotal,
      total: subtotal,
      type: 'tour',
    },
  ];

  if (b.pickup.feeEur > 0) {
    lineItems.push({
      id: `line-${b.bookingReference}-pickup`,
      description: `Hotel Pickup Transfer (${b.pickup.hotelName || b.pickup.locationName || 'Hurghada'})`,
      quantity: (b.guests.adults || 1) + (b.guests.children || 0),
      unitPrice: b.pickup.feeEur,
      total: b.pricing?.pickupSubtotalEur || b.pickup.feeEur,
      type: 'pickup',
    });
  }

  const invoiceCount = existingInvoices.length + 1;
  const newInvoice: FinanceInvoice = {
    id: `inv-${b.bookingReference}`,
    invoiceNumber: `INV-2026-${String(invoiceCount + 100).padStart(4, '0')}`,
    bookingId: b.bookingId || b.bookingReference,
    bookingReference: b.bookingReference,
    customerId: (b as any).customerId || null,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: b.date ? b.date.split('T')[0] : new Date().toISOString().split('T')[0],
    customer: {
      name: `${b.customer.firstName} ${b.customer.lastName}`,
      email: b.customer.email,
      phone: b.customer.phoneNumber
        ? `${b.customer.countryCode || ''} ${b.customer.phoneNumber}`
        : null,
      hotel: b.pickup.hotelName || b.customer.hotelName || null,
      roomNumber: b.pickup.roomNumber || b.customer.roomNumber || null,
      country: b.customer.country || null,
    },
    tourTitle: b.tourTitle,
    tourDate: b.date,
    guests: {
      adults: b.guests.adults || 1,
      children: b.guests.children || 0,
      infants: b.guests.infants || 0,
    },
    lineItems,
    subtotal,
    discount,
    taxRatePercent: 0,
    taxAmount: 0,
    total,
    paid: paidAmount,
    balance,
    currency: 'EUR',
    status: balance <= 0 ? 'paid' : paidAmount > 0 ? 'partially_paid' : 'issued',
    companyDetails: COMPANY_DETAILS,
    notes: 'Official Commercial Invoice. All activities governed by Egyptian Red Sea Maritime Safety Regulations.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newInvoice, ...existingInvoices];
  setLocal(LOCAL_INVOICES_KEY, updated);
  return newInvoice;
}

// ------------------------------------------------------------------------------
// 3. CONTROLLED REFUND MANAGEMENT (Immutable Audit Trail)
// ------------------------------------------------------------------------------

export async function listRefunds(filter?: {
  bookingId?: string;
  search?: string;
}): Promise<FinanceRefund[]> {
  let refunds = getLocal<FinanceRefund[]>(LOCAL_REFUNDS_KEY, []);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('refund_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        refunds = data.map((d) => ({
          id: d.id,
          bookingId: d.booking_id,
          bookingReference: (d as any).booking_reference || d.booking_id,
          paymentId: d.payment_id,
          customerId: d.customer_id,
          customerName: (d as any).customer_name || 'Guest',
          customerEmail: (d as any).customer_email || '',
          amount: Number(d.amount),
          currency: d.currency || 'EUR',
          reason: d.reason,
          refundMethod: d.refund_method as any,
          transactionReference: d.transaction_reference || `REF-${d.id.substring(0, 8)}`,
          processedBy: d.processed_by || 'Staff',
          notes: d.notes,
          createdAt: d.created_at,
        }));
        setLocal(LOCAL_REFUNDS_KEY, refunds);
      }
    } catch {
      // ignore
    }
  }

  return refunds.filter((r) => {
    if (filter?.bookingId && r.bookingId !== filter.bookingId && r.bookingReference !== filter.bookingId) return false;
    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase();
      return (
        r.bookingReference.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.transactionReference.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export async function processRefund(refundData: {
  bookingId: string;
  bookingReference: string;
  paymentId?: string | null;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  reason: string;
  refundMethod: FinanceRefund['refundMethod'];
  notes?: string | null;
  processedBy?: string;
}): Promise<{ success: boolean; error?: string; refund?: FinanceRefund }> {
  // 1. Audit Check: Verify refund amount does not exceed total paid amount for this booking
  const payments = await listPayments({ bookingId: refundData.bookingReference });
  const totalPaid = payments
    .filter((p) => p.paymentStatus === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const existingRefunds = await listRefunds({ bookingId: refundData.bookingReference });
  const totalAlreadyRefunded = existingRefunds.reduce((sum, r) => sum + r.amount, 0);
  const maxAvailableToRefund = Math.max(0, totalPaid - totalAlreadyRefunded);

  if (refundData.amount <= 0) {
    return { success: false, error: 'Refund amount must be greater than zero.' };
  }

  if (refundData.amount > maxAvailableToRefund) {
    return {
      success: false,
      error: `Cannot refund €${refundData.amount}. Maximum refundable balance is €${maxAvailableToRefund} (€${totalPaid} paid minus €${totalAlreadyRefunded} previous refunds).`,
    };
  }

  const txRef = `REF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newRefund: FinanceRefund = {
    id: `ref-${Date.now().toString(36)}`,
    bookingId: refundData.bookingId,
    bookingReference: refundData.bookingReference,
    paymentId: refundData.paymentId || null,
    customerId: refundData.customerId || null,
    customerName: refundData.customerName,
    customerEmail: refundData.customerEmail,
    amount: Number(refundData.amount),
    currency: refundData.currency || 'EUR',
    reason: refundData.reason.trim(),
    refundMethod: refundData.refundMethod,
    transactionReference: txRef,
    processedBy: refundData.processedBy || 'Finance Auditor',
    notes: refundData.notes || null,
    createdAt: new Date().toISOString(),
  };

  const allRefunds = await listRefunds();
  setLocal(LOCAL_REFUNDS_KEY, [newRefund, ...allRefunds]);

  // Update booking payment status (full refund or partial)
  try {
    const allBookings = await bookingRepository.listBookings();
    const targetBooking = allBookings.find(
      (b) => b.bookingReference === refundData.bookingReference || b.bookingId === refundData.bookingId
    );

    if (targetBooking) {
      const newTotalRefunded = totalAlreadyRefunded + newRefund.amount;
      const isFullRefund = newTotalRefunded >= totalPaid;

      await bookingRepository.updateBooking({
        ...targetBooking,
        paymentStatus: isFullRefund ? 'refunded' : 'partially_paid',
        status: isFullRefund ? 'cancelled' : targetBooking.status,
        cancellationReason: isFullRefund ? `Refunded: ${newRefund.reason}` : targetBooking.cancellationReason,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Failed to update booking status after refund:', err);
  }

  // Sync with Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('refund_records').insert({
        id: newRefund.id.startsWith('ref-') ? undefined : newRefund.id,
        booking_id: newRefund.bookingId,
        payment_id: newRefund.paymentId,
        customer_id: newRefund.customerId,
        amount: newRefund.amount,
        currency: newRefund.currency,
        reason: newRefund.reason,
        refund_method: newRefund.refundMethod,
        transaction_reference: newRefund.transactionReference,
        processed_by: newRefund.processedBy,
        notes: newRefund.notes,
      });
    } catch {
      // ignore
    }
  }

  return { success: true, refund: newRefund };
}

// ------------------------------------------------------------------------------
// 4. OUTSTANDING BALANCES TRACKING
// ------------------------------------------------------------------------------

export async function getOutstandingBalances(filter?: {
  status?: string;
  currency?: string;
  search?: string;
}): Promise<OutstandingBalanceItem[]> {
  const bookings = await bookingRepository.listBookings();
  const payments = await listPayments();
  const todayStr = new Date().toISOString().split('T')[0];

  const items: OutstandingBalanceItem[] = [];

  bookings.forEach((b) => {
    if (b.status === 'cancelled') return;

    const totalAmount = b.pricing?.totalEur || 0;
    const bookingPayments = payments.filter(
      (p) =>
        (p.bookingReference === b.bookingReference || p.bookingId === b.bookingId) &&
        p.paymentStatus === 'Paid'
    );
    const paidAmount = bookingPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceAmount = Math.max(0, totalAmount - paidAmount);

    if (balanceAmount > 0) {
      const tourDate = b.date ? b.date.split('T')[0] : '';
      let status: OutstandingBalanceItem['status'] = 'upcoming';

      if (tourDate < todayStr) {
        status = 'overdue';
      } else if (tourDate === todayStr) {
        status = 'due_today';
      }

      items.push({
        bookingId: b.bookingId || b.bookingReference,
        bookingReference: b.bookingReference,
        customerId: (b as any).customerId || null,
        customerName: `${b.customer.firstName} ${b.customer.lastName}`,
        customerEmail: b.customer.email,
        customerPhone: b.customer.phoneNumber
          ? `${b.customer.countryCode || ''} ${b.customer.phoneNumber}`
          : null,
        hotel: b.pickup.hotelName || b.customer.hotelName || 'Direct Marina',
        tourTitle: b.tourTitle,
        tourDate: b.date,
        totalAmount,
        paidAmount,
        balanceAmount,
        currency: 'EUR',
        dueDate: b.date,
        status,
        paymentStatus: paidAmount > 0 ? 'Partially Paid' : 'Pending',
      });
    }
  });

  return items
    .filter((item) => {
      if (filter?.status && filter.status !== 'all' && item.status !== filter.status) return false;
      if (filter?.currency && filter.currency !== 'all' && item.currency !== filter.currency) return false;
      if (filter?.search?.trim()) {
        const q = filter.search.toLowerCase();
        return (
          item.bookingReference.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.customerEmail.toLowerCase().includes(q) ||
          item.tourTitle.toLowerCase().includes(q) ||
          (item.hotel && item.hotel.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

// ------------------------------------------------------------------------------
// 5. FINANCIAL REPORTS & ANALYTICS (CURRENCY RESPECTFUL)
// ------------------------------------------------------------------------------

export async function getFinancialReports(
  targetCurrency: string = 'EUR',
  dateRange?: { start?: string; end?: string }
): Promise<FinancialReportData> {
  const bookings = await bookingRepository.listBookings();
  const payments = await listPayments();
  const refunds = await listRefunds();

  // Filter bookings and payments strictly matching targetCurrency
  const currencyBookings = bookings.filter((b) => {
    const cur = 'EUR'; // Base database catalog currency
    if (cur !== targetCurrency) return false;
    if (b.status === 'cancelled') return false;
    const bDate = b.date ? b.date.split('T')[0] : '';
    if (dateRange?.start && bDate < dateRange.start) return false;
    if (dateRange?.end && bDate > dateRange.end) return false;
    return true;
  });

  const currencyPayments = payments.filter((p) => {
    if (p.currency !== targetCurrency) return false;
    if (p.paymentStatus !== 'Paid') return false;
    const pDate = p.paymentDate.split('T')[0];
    if (dateRange?.start && pDate < dateRange.start) return false;
    if (dateRange?.end && pDate > dateRange.end) return false;
    return true;
  });

  const currencyRefunds = refunds.filter((r) => {
    if (r.currency !== targetCurrency) return false;
    const rDate = r.createdAt.split('T')[0];
    if (dateRange?.start && rDate < dateRange.start) return false;
    if (dateRange?.end && rDate > dateRange.end) return false;
    return true;
  });

  // Calculate Totals
  const totalRevenue = currencyBookings.reduce((sum, b) => sum + (b.pricing?.totalEur || 0), 0);
  const totalPaid = currencyPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = currencyRefunds.reduce((sum, r) => sum + r.amount, 0);
  const totalDiscounts = currencyBookings.reduce((sum, b) => sum + (b.pricing?.discountEur || 0), 0);
  const totalOutstanding = Math.max(0, totalRevenue - totalPaid);

  // Revenue by Date
  const dateMap = new Map<string, { amount: number; bookingsCount: number }>();
  currencyBookings.forEach((b) => {
    const d = b.date ? b.date.split('T')[0] : 'Undated';
    const current = dateMap.get(d) || { amount: 0, bookingsCount: 0 };
    current.amount += b.pricing?.totalEur || 0;
    current.bookingsCount += 1;
    dateMap.set(d, current);
  });

  const revenueByDate = Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, amount: data.amount, bookingsCount: data.bookingsCount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Revenue by Tour
  const tourMap = new Map<string, { tourTitle: string; amount: number; bookingsCount: number }>();
  currencyBookings.forEach((b) => {
    const current = tourMap.get(b.tourId) || { tourTitle: b.tourTitle, amount: 0, bookingsCount: 0 };
    current.amount += b.pricing?.totalEur || 0;
    current.bookingsCount += 1;
    tourMap.set(b.tourId, current);
  });

  const revenueByTour = Array.from(tourMap.entries())
    .map(([tourId, data]) => ({
      tourId,
      tourTitle: data.tourTitle,
      amount: data.amount,
      bookingsCount: data.bookingsCount,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Revenue by Destination
  const destMap = new Map<string, { amount: number; bookingsCount: number }>();
  currencyBookings.forEach((b) => {
    const dest = b.tourDestination || 'Hurghada';
    const current = destMap.get(dest) || { amount: 0, bookingsCount: 0 };
    current.amount += b.pricing?.totalEur || 0;
    current.bookingsCount += 1;
    destMap.set(dest, current);
  });

  const revenueByDestination = Array.from(destMap.entries())
    .map(([destination, data]) => ({
      destination,
      amount: data.amount,
      bookingsCount: data.bookingsCount,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Payments Received by Method
  const methodMap = new Map<string, { amount: number; transactionsCount: number }>();
  currencyPayments.forEach((p) => {
    const m = p.paymentMethod;
    const current = methodMap.get(m) || { amount: 0, transactionsCount: 0 };
    current.amount += p.amount;
    current.transactionsCount += 1;
    methodMap.set(m, current);
  });

  const paymentsReceivedByMethod = Array.from(methodMap.entries())
    .map(([method, data]) => ({
      method,
      amount: data.amount,
      transactionsCount: data.transactionsCount,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    currency: targetCurrency,
    totals: {
      totalRevenue,
      totalPaid,
      totalOutstanding,
      totalRefunded,
      totalDiscounts,
      transactionsCount: currencyPayments.length,
      bookingsCount: currencyBookings.length,
    },
    revenueByDate,
    revenueByTour,
    revenueByDestination,
    paymentsReceivedByMethod,
    refundsList: currencyRefunds,
  };
}
