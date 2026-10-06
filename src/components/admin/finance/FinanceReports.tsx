import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Compass,
  MapPin,
  CreditCard,
  RotateCcw,
  Tag,
  AlertCircle,
  Download,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import {
  getFinancialReports,
  getOutstandingBalances,
  listRefunds,
} from '../../../services/financeService';
import { FinancialReportData, OutstandingBalanceItem, FinanceRefund } from '../../../types/finance';
import { useToast } from '../../../contexts/ToastContext';

type ReportTab =
  | 'by_date'
  | 'by_tour'
  | 'by_destination'
  | 'payments_received'
  | 'outstanding_aging'
  | 'refunds_disputes';

export const FinanceReports: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ReportTab>('by_date');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [report, setReport] = useState<FinancialReportData | null>(null);
  const [balances, setBalances] = useState<OutstandingBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, bData] = await Promise.all([
        getFinancialReports(
          selectedCurrency,
          startDate && endDate ? { start: startDate, end: endDate } : undefined
        ),
        getOutstandingBalances(),
      ]);
      setReport(rData);
      setBalances(bData);
    } catch (err) {
      console.warn('Failed to load financial reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCurrency, startDate, endDate]);

  const currencySymbol =
    selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'USD' ? '$' : selectedCurrency === 'GBP' ? '£' : 'EGP ';

  const handleExportCSV = () => {
    let filename = `financial_report_${activeTab}_${selectedCurrency}_${new Date().toISOString().split('T')[0]}.csv`;
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeTab === 'by_date') {
      headers = ['Date', 'Currency', 'Bookings Count', 'Gross Revenue'];
      rows = (report?.revenueByDate || []).map((d) => [
        d.date,
        selectedCurrency,
        d.bookingsCount,
        d.amount,
      ]);
    } else if (activeTab === 'by_tour') {
      headers = ['Tour Title', 'Currency', 'Bookings Confirmed', 'Total Revenue'];
      rows = (report?.revenueByTour || []).map((t) => [
        `"${t.tourTitle}"`,
        selectedCurrency,
        t.bookingsCount,
        t.amount,
      ]);
    } else if (activeTab === 'by_destination') {
      headers = ['Destination Sector', 'Currency', 'Bookings Count', 'Total Revenue'];
      rows = (report?.revenueByDestination || []).map((d) => [
        `"${d.destination}"`,
        selectedCurrency,
        d.bookingsCount,
        d.amount,
      ]);
    } else if (activeTab === 'payments_received') {
      headers = ['Payment Gateway / Method', 'Currency', 'Transactions Count', 'Total Settled'];
      rows = (report?.paymentsReceivedByMethod || []).map((m) => [
        `"${m.method}"`,
        selectedCurrency,
        m.transactionsCount,
        m.amount,
      ]);
    } else if (activeTab === 'outstanding_aging') {
      headers = ['Booking Ref', 'Customer', 'Due Date', 'Status', 'Total', 'Paid', 'Outstanding'];
      rows = balances.map((b) => [
        b.bookingReference,
        `"${b.customerName}"`,
        b.dueDate,
        b.status.toUpperCase(),
        b.totalAmount,
        b.paidAmount,
        b.balanceAmount,
      ]);
    } else {
      headers = ['Refund Ref', 'Booking Ref', 'Customer', 'Date', 'Currency', 'Amount', 'Method', 'Reason'];
      rows = (report?.refundsList || []).map((r) => [
        r.transactionReference,
        r.bookingReference,
        `"${r.customerName}"`,
        r.createdAt.split('T')[0],
        r.currency,
        r.amount,
        `"${r.refundMethod}"`,
        `"${r.reason}"`,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Audit Statements & Analytics
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-[#2dd4bf]" />
            <span>Comprehensive Financial Reports</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Accounting statements by tour date, excursion title, marine sector, payment gateway, receivables aging, and refund debits.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Currency & Date Filters */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-stone-400 font-medium">Currency:</span>
          {['EUR', 'USD', 'GBP', 'EGP'].map((cur) => (
            <button
              key={cur}
              type="button"
              onClick={() => setSelectedCurrency(cur)}
              className={`px-2.5 py-1 rounded font-bold font-mono cursor-pointer transition-colors ${
                selectedCurrency === cur
                  ? 'bg-[#0A6C74] text-white shadow-xs'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              {cur}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className="text-stone-500 text-[11px]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-200 text-xs font-mono"
            />
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-stone-500 text-[11px]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-stone-900 border border-stone-800 rounded text-stone-200 text-xs font-mono"
            />
          </div>

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-stone-400 hover:text-white text-[11px] underline cursor-pointer"
            >
              Clear Dates
            </button>
          )}

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

      {/* Report Dimension Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-stone-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('by_date')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
            activeTab === 'by_date'
              ? 'bg-stone-800 text-white border border-stone-700'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Revenue by Date</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('by_tour')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
            activeTab === 'by_tour'
              ? 'bg-stone-800 text-white border border-stone-700'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Revenue by Excursion</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('by_destination')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
            activeTab === 'by_destination'
              ? 'bg-stone-800 text-white border border-stone-700'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Revenue by Sector</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments_received')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
            activeTab === 'payments_received'
              ? 'bg-stone-800 text-white border border-stone-700'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payments Received</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outstanding_aging')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
            activeTab === 'outstanding_aging'
              ? 'bg-stone-800 text-white border border-stone-700'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Receivables Aging</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('refunds_disputes')}
          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors ${
            activeTab === 'refunds_disputes'
              ? 'bg-stone-800 text-white border border-stone-700'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refunds & Discounts</span>
        </button>
      </div>

      {/* REPORT CONTENT TABLES */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-xs">
        {/* 1. REVENUE BY DATE */}
        {activeTab === 'by_date' && (
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Departure Date</th>
                <th className="py-3 px-4 text-center">Bookings Count</th>
                <th className="py-3 px-4 text-right">Gross Booked Value</th>
                <th className="py-3 px-4 text-right">Average Booking Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {report?.revenueByDate.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-500 font-sans">
                    No departure revenue recorded for selected date window in {selectedCurrency}.
                  </td>
                </tr>
              ) : (
                report?.revenueByDate.map((item) => (
                  <tr key={item.date} className="hover:bg-stone-900/40">
                    <td className="py-3 px-4 text-white font-bold">{item.date}</td>
                    <td className="py-3 px-4 text-center text-stone-300">{item.bookingsCount}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      {currencySymbol}{item.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-stone-400">
                      {currencySymbol}{(item.amount / (item.bookingsCount || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 2. REVENUE BY TOUR */}
        {activeTab === 'by_tour' && (
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Excursion Title</th>
                <th className="py-3 px-4 text-center">Confirmed Bookings</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-4 text-right">Volume Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {report?.revenueByTour.map((tour) => {
                const totalGross = report.totals.totalRevenue || 1;
                const percent = ((tour.amount / totalGross) * 100).toFixed(1);

                return (
                  <tr key={tour.tourId} className="hover:bg-stone-900/40">
                    <td className="py-3 px-4 font-sans text-white font-bold">{tour.tourTitle}</td>
                    <td className="py-3 px-4 text-center text-stone-300">{tour.bookingsCount}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      {currencySymbol}{tour.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-stone-400">{percent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 3. REVENUE BY DESTINATION */}
        {activeTab === 'by_destination' && (
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Sector / Destination</th>
                <th className="py-3 px-4 text-center">Total Departures</th>
                <th className="py-3 px-4 text-right">Gross Booked Value</th>
                <th className="py-3 px-4 text-right">Sector Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {report?.revenueByDestination.map((dest) => {
                const totalGross = report.totals.totalRevenue || 1;
                const percent = ((dest.amount / totalGross) * 100).toFixed(1);

                return (
                  <tr key={dest.destination} className="hover:bg-stone-900/40">
                    <td className="py-3 px-4 font-sans text-white font-bold">{dest.destination}</td>
                    <td className="py-3 px-4 text-center text-stone-300">{dest.bookingsCount}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      {currencySymbol}{dest.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-stone-400">{percent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 4. PAYMENTS RECEIVED BY METHOD */}
        {activeTab === 'payments_received' && (
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Payment Channel / Gateway</th>
                <th className="py-3 px-4 text-center">Settled Transactions</th>
                <th className="py-3 px-4 text-right">Total Net Amount</th>
                <th className="py-3 px-4 text-right">Average Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {report?.paymentsReceivedByMethod.map((item) => (
                <tr key={item.method} className="hover:bg-stone-900/40">
                  <td className="py-3 px-4 font-sans text-white font-bold">{item.method}</td>
                  <td className="py-3 px-4 text-center text-stone-300">{item.transactionsCount}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                    {currencySymbol}{item.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-stone-400">
                    {currencySymbol}{(item.amount / (item.transactionsCount || 1)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 5. RECEIVABLES AGING */}
        {activeTab === 'outstanding_aging' && (
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Aging Status</th>
                <th className="py-3 px-4 text-right">Contracted</th>
                <th className="py-3 px-4 text-right">Paid So Far</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {balances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500 font-sans">
                    Zero receivables outstanding! All customer balances settled.
                  </td>
                </tr>
              ) : (
                balances.map((b) => (
                  <tr key={b.bookingReference} className="hover:bg-stone-900/40">
                    <td className="py-3 px-4 text-white font-bold">{b.bookingReference}</td>
                    <td className="py-3 px-4 font-sans text-stone-200">{b.customerName}</td>
                    <td className="py-3 px-4 text-stone-400 text-[11px]">{b.dueDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === 'overdue'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : b.status === 'due_today'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-stone-400">€{b.totalAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">€{b.paidAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400">€{b.balanceAmount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 6. REFUNDS & DISCOUNTS */}
        {activeTab === 'refunds_disputes' && (
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 border-b border-stone-800 text-stone-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Refund Ref</th>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Debit Reversal</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Audited Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {report?.refundsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500 font-sans">
                    Zero refunds or disputes recorded in {selectedCurrency}.
                  </td>
                </tr>
              ) : (
                report?.refundsList.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-900/40">
                    <td className="py-3 px-4 text-red-400 font-bold">{r.transactionReference}</td>
                    <td className="py-3 px-4 text-stone-200">{r.bookingReference}</td>
                    <td className="py-3 px-4 font-sans text-white">{r.customerName}</td>
                    <td className="py-3 px-4 text-stone-400 text-[11px]">{r.createdAt.split('T')[0]}</td>
                    <td className="py-3 px-4 text-right text-red-400 font-bold">
                      -{currencySymbol}{r.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-stone-300 font-sans">{r.refundMethod}</td>
                    <td className="py-3 px-4 text-stone-400 font-sans max-w-[200px] truncate" title={r.reason}>
                      {r.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
