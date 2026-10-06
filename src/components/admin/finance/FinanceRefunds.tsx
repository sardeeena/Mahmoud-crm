import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  Filter,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Calendar,
  FileText,
  ShieldCheck,
  User,
  Download,
} from 'lucide-react';
import {
  listRefunds,
  processRefund,
  listPayments,
} from '../../../services/financeService';
import { FinanceRefund, FinancePayment } from '../../../types/finance';
import { bookingRepository } from '../../../services/bookingRepository';
import { Booking } from '../../../types/booking';
import { useToast } from '../../../contexts/ToastContext';

interface FinanceRefundsProps {
  onNavigateTab?: (tabId: string, param?: string) => void;
}

export const FinanceRefunds: React.FC<FinanceRefundsProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const [refunds, setRefunds] = useState<FinanceRefund[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<FinancePayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  // Process Refund Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundCurrency, setRefundCurrency] = useState<string>('EUR');
  const [refundReason, setRefundReason] = useState<string>('Marine weather advisory - Coast Guard harbour closure');
  const [refundMethod, setRefundMethod] = useState<FinanceRefund['refundMethod']>('Card Reversal');
  const [refundNotes, setRefundNotes] = useState<string>('Authorized by harbor operations supervisor.');
  const [processedBy, setProcessedBy] = useState<string>('Finance Auditor');
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allRef, allB, allP] = await Promise.all([
        listRefunds(),
        bookingRepository.listBookings(),
        listPayments(),
      ]);
      setRefunds(allRef);
      setBookings(allB);
      setPayments(allP);
    } catch (err) {
      console.warn('Failed to load refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter bookings that have actually had payments recorded
  const refundableBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bPayments = payments.filter(
        (p) => (p.bookingReference === b.bookingReference || p.bookingId === b.bookingId) && p.paymentStatus === 'Paid'
      );
      const totalPaid = bPayments.reduce((s, p) => s + p.amount, 0);
      const bRefunds = refunds.filter((r) => r.bookingReference === b.bookingReference || r.bookingId === b.bookingId);
      const totalRefunded = bRefunds.reduce((s, r) => s + r.amount, 0);
      return totalPaid - totalRefunded > 0;
    });
  }, [bookings, payments, refunds]);

  const handleOpenProcessRefund = () => {
    if (refundableBookings.length > 0) {
      const first = refundableBookings[0];
      setSelectedBookingRef(first.bookingReference);
      // Auto set amount to max refundable
      const bPayments = payments.filter(
        (p) => (p.bookingReference === first.bookingReference || p.bookingId === first.bookingId) && p.paymentStatus === 'Paid'
      );
      const totalPaid = bPayments.reduce((s, p) => s + p.amount, 0);
      const bRefunds = refunds.filter((r) => r.bookingReference === first.bookingReference || r.bookingId === first.bookingId);
      const totalRefunded = bRefunds.reduce((s, r) => s + r.amount, 0);
      setRefundAmount(Math.max(0, totalPaid - totalRefunded));
    }
    setIsModalOpen(true);
  };

  const handleBookingSelect = (ref: string) => {
    setSelectedBookingRef(ref);
    const b = bookings.find((item) => item.bookingReference === ref);
    if (b) {
      const bPayments = payments.filter(
        (p) => (p.bookingReference === ref || p.bookingId === b.bookingId) && p.paymentStatus === 'Paid'
      );
      const totalPaid = bPayments.reduce((s, p) => s + p.amount, 0);
      const bRefunds = refunds.filter((r) => r.bookingReference === ref || r.bookingId === b.bookingId);
      const totalRefunded = bRefunds.reduce((s, r) => s + r.amount, 0);
      setRefundAmount(Math.max(0, totalPaid - totalRefunded));
    }
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingRef || refundAmount <= 0) {
      showToast('Please select a reservation and specify a valid refund amount.', 'error');
      return;
    }

    const b = bookings.find((item) => item.bookingReference === selectedBookingRef);
    if (!b) return;

    setProcessing(true);
    try {
      const res = await processRefund({
        bookingId: b.bookingId || b.bookingReference,
        bookingReference: b.bookingReference,
        customerId: (b as any).customerId || null,
        customerName: `${b.customer.firstName} ${b.customer.lastName}`,
        customerEmail: b.customer.email,
        amount: Number(refundAmount),
        currency: refundCurrency,
        reason: refundReason.trim(),
        refundMethod,
        notes: refundNotes.trim() || null,
        processedBy: processedBy.trim() || 'Finance Auditor',
      });

      if (!res.success) {
        showToast(res.error || 'Refund failed audit validation.', 'error');
        return;
      }

      showToast(`Controlled refund of €${refundAmount} recorded. Historical payment ledger preserved.`, 'success');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Error processing refund', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      if (currencyFilter !== 'all' && r.currency !== currencyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.bookingReference.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerEmail.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.transactionReference.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [refunds, currencyFilter, searchQuery]);

  const totalRefundedEur = refunds
    .filter((r) => r.currency === 'EUR')
    .reduce((sum, r) => sum + r.amount, 0);

  const exportRefundsCsv = () => {
    const headers = [
      'Date',
      'Refund Ref',
      'Booking Ref',
      'Customer Name',
      'Amount',
      'Currency',
      'Method',
      'Reason',
      'Processed By',
      'Notes',
    ];
    const rows = filteredRefunds.map((r) => [
      r.createdAt.split('T')[0],
      r.transactionReference,
      r.bookingReference,
      `"${r.customerName}"`,
      r.amount,
      r.currency,
      `"${r.refundMethod}"`,
      `"${r.reason}"`,
      `"${r.processedBy}"`,
      `"${r.notes || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `refunds_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported refunds audit report to CSV.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Audit Trail & Adjustments
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <RotateCcw className="w-6 h-6 text-[#2dd4bf]" />
            <span>Controlled Refunds & Returns</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Compliant financial reversals. Historical payment records are never silently modified or deleted. Every refund creates an immutable debit audit entry.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={exportRefundsCsv}
            className="px-3 py-1.5 bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white rounded text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenProcessRefund}
            className="px-3.5 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Process Refund</span>
          </button>
        </div>
      </div>

      {/* Audit Banner */}
      <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong className="text-white block">Audit Trail Integrity Guarantee</strong>
            <p className="text-stone-400 text-[11px] mt-0.5">
              All reversals are tied to original booking references and require authorized staff credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 font-mono text-xs text-stone-300 shrink-0">
          <div>
            Total Reversals: <strong className="text-red-400">€{totalRefundedEur.toLocaleString()}</strong>
          </div>
          <div>&bull;</div>
          <div>
            Records: <strong className="text-white">{refunds.length}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-500 shrink-0" />
          <input
            type="text"
            placeholder="Search refunds by booking ref, customer, reason, or refund ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-stone-200 placeholder-stone-500 focus:outline-none text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
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

      {/* Refunds Table */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-stone-400">
            <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading refund audit logs...</p>
          </div>
        ) : filteredRefunds.length === 0 ? (
          <div className="p-16 text-center text-stone-500 space-y-2">
            <RotateCcw className="w-10 h-10 mx-auto text-stone-600 mb-1" />
            <p className="text-sm font-semibold text-stone-300">No refund entries on record</p>
            <p className="text-xs">No reversals have been requested or processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900/80 border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Refund Ref</th>
                  <th className="py-3 px-4">Booking</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Audited By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-sans">
                {filteredRefunds.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-red-400">
                      {r.transactionReference}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-stone-200">
                      {r.bookingReference}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{r.customerName}</div>
                      <div className="text-[11px] text-stone-500 truncate max-w-[150px]">
                        {r.customerEmail}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-stone-400 font-mono text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-red-400">
                      -€{r.amount.toFixed(2)} {r.currency}
                    </td>

                    <td className="py-3 px-4 text-stone-300">
                      <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px]">
                        {r.refundMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-stone-300 max-w-[220px]">
                      <span className="line-clamp-1" title={r.reason}>
                        {r.reason}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-stone-400 text-[11px]">
                      {r.processedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROCESS REFUND MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-stone-950 border border-stone-800 rounded-2xl max-w-lg w-full p-6 text-xs text-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-bold text-white">Process Controlled Reversal</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                  Select Paid Reservation
                </label>
                <select
                  value={selectedBookingRef}
                  onChange={(e) => handleBookingSelect(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                  required
                >
                  {refundableBookings.map((b) => (
                    <option key={b.bookingReference} value={b.bookingReference}>
                      {b.bookingReference} &bull; {b.customer.firstName} {b.customer.lastName} &bull; {b.tourTitle} (€{b.pricing?.totalEur || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                    Refund Amount (EUR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-red-400 font-mono font-bold text-sm focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                    Refund Method
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                  >
                    <option value="Card Reversal">Card Gateway Reversal (Stripe/POS)</option>
                    <option value="Cash Return">Cash Handed Over at Pier</option>
                    <option value="Bank Wire">Bank Wire Transfer</option>
                    <option value="Store Credit / Voucher">Store Credit / Future Voucher</option>
                    <option value="Other">Other Adjustment</option>
                  </select>
                </div>
              </div>

              {/* Required Reason */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                  Justification / Reason (Mandatory for Audit)
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                  placeholder="e.g. Coast Guard port closure due to high swell"
                  required
                />
              </div>

              {/* Auditor Name */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                  Auditor / Manager Authorizing
                </label>
                <input
                  type="text"
                  value={processedBy}
                  onChange={(e) => setProcessedBy(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded text-[11px] text-red-300">
                <strong>Financial Audit Notice:</strong> This operation writes an irreversible debit record to the audit ledger. Historical customer receipts remain intact.
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer shadow flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{processing ? 'Processing...' : 'Authorize Refund'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
