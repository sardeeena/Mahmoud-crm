import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  RefreshCw,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  FileText,
  User,
  ShieldCheck,
  Eye,
  Download,
} from 'lucide-react';
import {
  listPayments,
  recordPayment,
  listInvoices,
} from '../../../services/financeService';
import {
  FinancePayment,
  FinancePaymentMethod,
  FinancePaymentStatus,
} from '../../../types/finance';
import { bookingRepository } from '../../../services/bookingRepository';
import { Booking } from '../../../types/booking';
import { useToast } from '../../../contexts/ToastContext';

interface FinancePaymentsProps {
  onNavigateTab?: (tabId: string, param?: string) => void;
}

export const FinancePayments: React.FC<FinancePaymentsProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<FinancePayment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  // New Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>('');
  const [amountInput, setAmountInput] = useState<number>(0);
  const [currencyInput, setCurrencyInput] = useState<string>('EUR');
  const [methodInput, setMethodInput] = useState<FinancePaymentMethod>('Cash');
  const [statusInput, setStatusInput] = useState<FinancePaymentStatus>('Paid');
  const [txRefInput, setTxRefInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [recordedByInput, setRecordedByInput] = useState<string>('Finance Cashier');
  const [savingAction, setSavingAction] = useState(false);

  // Payment Detail Modal
  const [viewingPayment, setViewingPayment] = useState<FinancePayment | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allP, allB] = await Promise.all([
        listPayments(),
        bookingRepository.listBookings(),
      ]);
      setPayments(allP);
      setBookings(allB);
      if (allB.length > 0 && !selectedBookingRef) {
        setSelectedBookingRef(allB[0].bookingReference);
        setAmountInput(allB[0].pricing?.totalEur || 50);
      }
    } catch (err) {
      console.warn('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selected booking changes in modal, auto-update amount
  const handleBookingSelect = (ref: string) => {
    setSelectedBookingRef(ref);
    const b = bookings.find((item) => item.bookingReference === ref);
    if (b) {
      // Calculate remaining unpaid balance
      const bPayments = payments.filter(
        (p) => (p.bookingReference === ref || p.bookingId === b.bookingId) && p.paymentStatus === 'Paid'
      );
      const paidSoFar = bPayments.reduce((sum, p) => sum + p.amount, 0);
      const total = b.pricing?.totalEur || 0;
      const remaining = Math.max(0, total - paidSoFar);
      setAmountInput(remaining > 0 ? remaining : total);
    }
  };

  const handleOpenRecordPayment = () => {
    if (bookings.length > 0) {
      handleBookingSelect(bookings[0].bookingReference);
    }
    setTxRefInput(`TXN-${Date.now().toString(36).toUpperCase()}`);
    setNotesInput('Collected at marina pier desk prior to embarkation.');
    setIsModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingRef || amountInput <= 0) {
      showToast('Please select a booking and enter a valid payment amount.', 'error');
      return;
    }

    const b = bookings.find((item) => item.bookingReference === selectedBookingRef);
    if (!b) return;

    setSavingAction(true);
    try {
      await recordPayment({
        bookingId: b.bookingId || b.bookingReference,
        bookingReference: b.bookingReference,
        customerId: (b as any).customerId || null,
        customerName: `${b.customer.firstName} ${b.customer.lastName}`,
        customerEmail: b.customer.email,
        customerPhone: b.customer.phoneNumber
          ? `${b.customer.countryCode || ''} ${b.customer.phoneNumber}`
          : null,
        amount: Number(amountInput),
        currency: currencyInput,
        paymentMethod: methodInput,
        paymentStatus: statusInput,
        transactionReference: txRefInput.trim(),
        notes: notesInput.trim() || null,
        recordedBy: recordedByInput.trim() || 'Finance Cashier',
      });

      showToast(`Payment of €${amountInput} successfully logged for ${b.bookingReference}.`, 'success');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setSavingAction(false);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.paymentStatus !== statusFilter) return false;
      if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;
      if (currencyFilter !== 'all' && p.currency !== currencyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
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
  }, [payments, statusFilter, methodFilter, currencyFilter, searchQuery]);

  // Aggregate metrics
  const totalPaidEur = payments
    .filter((p) => p.paymentStatus === 'Paid' && p.currency === 'EUR')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPendingEur = payments
    .filter((p) => p.paymentStatus === 'Pending' && p.currency === 'EUR')
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusBadge = (status: FinancePaymentStatus) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Partially Paid':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Pending':
        return 'bg-stone-800 text-stone-300 border-stone-700';
      case 'Failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Refunded':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-stone-800 text-stone-300';
    }
  };

  const exportPaymentsCsv = () => {
    const headers = [
      'Date',
      'Transaction Ref',
      'Booking Ref',
      'Customer Name',
      'Email',
      'Amount',
      'Currency',
      'Method',
      'Status',
      'Recorded By',
      'Notes',
    ];
    const rows = filteredPayments.map((p) => [
      p.paymentDate.split('T')[0],
      p.transactionReference,
      p.bookingReference,
      `"${p.customerName}"`,
      p.customerEmail,
      p.amount,
      p.currency,
      p.paymentMethod,
      p.paymentStatus,
      `"${p.recordedBy}"`,
      `"${p.notes || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payments_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported payments ledger to CSV.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Treasury & Cash Register
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-[#2dd4bf]" />
            <span>Payments Ledger</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Authoritative financial transaction logs. Every receipt, gateway settlement, card swipe, and cash collection is auditable.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={exportPaymentsCsv}
            className="px-3 py-1.5 bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white rounded text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenRecordPayment}
            className="px-3.5 py-1.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-4">
          <span className="text-[10px] uppercase text-stone-500 font-bold block mb-1">
            Total Settled (EUR)
          </span>
          <div className="font-mono font-bold text-xl text-emerald-400">
            €{totalPaidEur.toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            {payments.filter((p) => p.paymentStatus === 'Paid').length} verified transactions
          </span>
        </div>

        <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-4">
          <span className="text-[10px] uppercase text-stone-500 font-bold block mb-1">
            Pending Collections (EUR)
          </span>
          <div className="font-mono font-bold text-xl text-amber-400">
            €{totalPendingEur.toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Pay-at-pickup & awaiting settlement
          </span>
        </div>

        <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-4">
          <span className="text-[10px] uppercase text-stone-500 font-bold block mb-1">
            Cash Collections
          </span>
          <div className="font-mono font-bold text-xl text-stone-200">
            €{payments
              .filter((p) => p.paymentMethod === 'Cash' && p.paymentStatus === 'Paid')
              .reduce((s, p) => s + p.amount, 0)
              .toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Pier desk & tour guide handoffs
          </span>
        </div>

        <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-4">
          <span className="text-[10px] uppercase text-stone-500 font-bold block mb-1">
            Online & Card Gateway
          </span>
          <div className="font-mono font-bold text-xl text-[#2dd4bf]">
            €{payments
              .filter((p) => (p.paymentMethod === 'Online Payment' || p.paymentMethod === 'Card') && p.paymentStatus === 'Paid')
              .reduce((s, p) => s + p.amount, 0)
              .toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Stripe / Paymob / Credit Card
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by customer, booking reference, or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-stone-200 placeholder-stone-500 focus:outline-none text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1">
            <span className="text-stone-500 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded px-2.5 py-1 text-stone-300 text-xs focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-stone-500 text-[11px]">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded px-2.5 py-1 text-stone-300 text-xs focus:outline-none"
            >
              <option value="all">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online Payment">Online Payment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-stone-500 text-[11px]">Currency:</span>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded px-2.5 py-1 text-stone-300 text-xs focus:outline-none"
            >
              <option value="all">All Currencies</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EGP">EGP</option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-1.5 bg-stone-900 border border-stone-800 rounded text-stone-400 hover:text-white cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-stone-400">
            <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading financial transactions...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-16 text-center text-stone-500 space-y-2">
            <CreditCard className="w-10 h-10 mx-auto text-stone-600 mb-1" />
            <p className="text-sm font-semibold text-stone-300">No payment transactions found</p>
            <p className="text-xs">Adjust your search filters or record a new transaction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900/80 border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Booking</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-sans">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {p.transactionReference}
                    </td>

                    <td className="py-3 px-4 font-mono text-stone-300">
                      <span className="font-semibold">{p.bookingReference}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{p.customerName}</div>
                      <div className="text-[11px] text-stone-500 truncate max-w-[160px]">
                        {p.customerEmail}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-stone-400 font-mono text-[11px]">
                      {new Date(p.paymentDate).toLocaleDateString()} {p.paymentDate.split('T')[1]?.substring(0, 5)}
                    </td>

                    <td className="py-3 px-4 text-stone-300">
                      <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-emerald-400">
                      {p.currency === 'EUR' ? '€' : p.currency === 'USD' ? '$' : p.currency === 'GBP' ? '£' : ''}
                      {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {p.currency}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                          p.paymentStatus
                        )}`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-stone-400 text-[11px]">
                      {p.recordedBy}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setViewingPayment(p)}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white rounded text-[11px] cursor-pointer transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-stone-950 border border-stone-800 rounded-2xl max-w-xl w-full p-6 text-xs text-stone-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-[#2dd4bf]" />
                <h2 className="text-base font-bold text-white">Record Cash / Card Settlement</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              {/* Target Booking Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                  Associate Reservation / Booking
                </label>
                <select
                  value={selectedBookingRef}
                  onChange={(e) => handleBookingSelect(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-[#0A6C74]"
                  required
                >
                  {bookings.map((b) => (
                    <option key={b.bookingReference} value={b.bookingReference}>
                      {b.bookingReference} &bull; {b.customer.firstName} {b.customer.lastName} &bull; {b.tourTitle} (€{b.pricing?.totalEur || 0}) [{b.paymentStatus}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                    Amount Received
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amountInput}
                    onChange={(e) => setAmountInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-[#0A6C74]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={currencyInput}
                    onChange={(e) => setCurrencyInput(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EGP">EGP (Egyptian Pound)</option>
                  </select>
                </div>
              </div>

              {/* Payment Method & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={methodInput}
                    onChange={(e) => setMethodInput(e.target.value as FinancePaymentMethod)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                  >
                    <option value="Cash">Cash (Pier / Guide / Desk)</option>
                    <option value="Card">Card (POS Terminal)</option>
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Online Payment">Online Payment Gateway</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as FinancePaymentStatus)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                  >
                    <option value="Paid">Paid (Settled in full or partial tranche)</option>
                    <option value="Pending">Pending (Awaiting clearance)</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>
              </div>

              {/* Reference Number & Recorded By */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                    Transaction / Receipt Reference
                  </label>
                  <input
                    type="text"
                    value={txRefInput}
                    onChange={(e) => setTxRefInput(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none"
                    placeholder="e.g. REC-CASH-4912"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                    Cashier / Staff Member
                  </label>
                  <input
                    type="text"
                    value={recordedByInput}
                    onChange={(e) => setRecordedByInput(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                  Audit Notes / Reason
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                  placeholder="e.g. Guest paid remaining 50% balance in cash at Hurghada Marina boarding gate."
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="px-4 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold cursor-pointer shadow flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingAction ? 'Saving...' : 'Confirm & Log Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT DETAILS MODAL */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-stone-950 border border-stone-800 rounded-2xl max-w-lg w-full p-6 text-xs text-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Payment Receipt Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800 flex justify-between items-center">
                <span className="text-stone-400">Amount Paid:</span>
                <span className="text-lg font-bold text-emerald-400">
                  €{viewingPayment.amount.toFixed(2)} {viewingPayment.currency}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-stone-900/40 rounded border border-stone-800/80">
                  <span className="text-stone-500 block">Transaction Reference</span>
                  <span className="text-white font-bold">{viewingPayment.transactionReference}</span>
                </div>

                <div className="p-2 bg-stone-900/40 rounded border border-stone-800/80">
                  <span className="text-stone-500 block">Booking Reference</span>
                  <span className="text-[#2dd4bf] font-bold">{viewingPayment.bookingReference}</span>
                </div>

                <div className="p-2 bg-stone-900/40 rounded border border-stone-800/80">
                  <span className="text-stone-500 block">Method</span>
                  <span className="text-white">{viewingPayment.paymentMethod}</span>
                </div>

                <div className="p-2 bg-stone-900/40 rounded border border-stone-800/80">
                  <span className="text-stone-500 block">Status</span>
                  <span className="text-emerald-300 font-bold">{viewingPayment.paymentStatus}</span>
                </div>

                <div className="p-2 bg-stone-900/40 rounded border border-stone-800/80">
                  <span className="text-stone-500 block">Payment Date</span>
                  <span className="text-white">{new Date(viewingPayment.paymentDate).toLocaleString()}</span>
                </div>

                <div className="p-2 bg-stone-900/40 rounded border border-stone-800/80">
                  <span className="text-stone-500 block">Recorded By</span>
                  <span className="text-white">{viewingPayment.recordedBy}</span>
                </div>
              </div>

              <div className="p-3 bg-stone-900/40 rounded border border-stone-800/80 font-sans text-xs">
                <span className="text-stone-500 block font-mono text-[10px] mb-0.5">CUSTOMER DETAILS</span>
                <div className="font-bold text-white">{viewingPayment.customerName}</div>
                <div className="text-stone-400 text-[11px]">{viewingPayment.customerEmail}</div>
                {viewingPayment.customerPhone && (
                  <div className="text-stone-400 text-[11px]">{viewingPayment.customerPhone}</div>
                )}
              </div>

              {viewingPayment.notes && (
                <div className="p-3 bg-stone-900/40 rounded border border-stone-800/80 font-sans text-xs">
                  <span className="text-stone-500 block font-mono text-[10px] mb-0.5">STAFF NOTES</span>
                  <p className="text-stone-300 italic">{viewingPayment.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
