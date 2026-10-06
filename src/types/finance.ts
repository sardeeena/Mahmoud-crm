export type FinancePaymentMethod =
  | 'Cash'
  | 'Card'
  | 'Bank Transfer'
  | 'Online Payment'
  | 'Other';

export type FinancePaymentStatus =
  | 'Pending'
  | 'Paid'
  | 'Partially Paid'
  | 'Failed'
  | 'Refunded';

export interface FinancePayment {
  id: string;
  bookingId: string;
  bookingReference: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  amount: number;
  currency: string; // 'EUR' | 'USD' | 'GBP' | 'EGP'
  paymentMethod: FinancePaymentMethod;
  paymentStatus: FinancePaymentStatus;
  paymentDate: string;
  transactionReference: string;
  notes: string | null;
  recordedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'tour' | 'extra' | 'pickup' | 'discount' | 'tax';
}

export interface CompanyBillingDetails {
  name: string;
  tagline: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxRegistrationNumber: string;
  commercialRegistryNumber: string;
  bankName: string;
  iban: string;
  swiftBic: string;
}

export interface FinanceInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0042"
  bookingId: string;
  bookingReference: string;
  customerId: string | null;
  issueDate: string;
  dueDate: string;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    hotel?: string | null;
    roomNumber?: string | null;
    country?: string | null;
  };
  tourTitle: string;
  tourDate: string;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
  paid: number;
  balance: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  companyDetails: CompanyBillingDetails;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceRefund {
  id: string;
  bookingId: string;
  bookingReference: string;
  paymentId?: string | null;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  reason: string;
  refundMethod: 'Card Reversal' | 'Cash Return' | 'Bank Wire' | 'Store Credit / Voucher' | 'Other';
  transactionReference: string;
  processedBy: string;
  notes?: string | null;
  createdAt: string;
}

export interface OutstandingBalanceItem {
  bookingId: string;
  bookingReference: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  hotel: string | null;
  tourTitle: string;
  tourDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  dueDate: string;
  status: 'overdue' | 'due_today' | 'upcoming';
  paymentStatus: FinancePaymentStatus;
}

export interface FinancialReportData {
  currency: string;
  totals: {
    totalRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
    totalRefunded: number;
    totalDiscounts: number;
    transactionsCount: number;
    bookingsCount: number;
  };
  revenueByDate: Array<{
    date: string;
    amount: number;
    bookingsCount: number;
  }>;
  revenueByTour: Array<{
    tourId: string;
    tourTitle: string;
    amount: number;
    bookingsCount: number;
  }>;
  revenueByDestination: Array<{
    destination: string;
    amount: number;
    bookingsCount: number;
  }>;
  paymentsReceivedByMethod: Array<{
    method: string;
    amount: number;
    transactionsCount: number;
  }>;
  refundsList: FinanceRefund[];
}
