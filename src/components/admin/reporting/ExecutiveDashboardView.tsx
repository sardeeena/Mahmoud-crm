import React from 'react';
import {
  DollarSign,
  CalendarCheck,
  Users,
  UserPlus,
  RotateCcw,
  Percent,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { ExecutiveMetrics, DateRangeInterval } from '../../../types/reporting';

interface ExecutiveDashboardViewProps {
  metrics: ExecutiveMetrics;
  interval: DateRangeInterval;
  onNavigateTab?: (tabId: string, param?: string) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  metrics,
  interval,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-medium">Total Gross Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-bold text-white font-display tracking-tight">
              €{metrics.revenueEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-teal-400">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>Contracted Tour Volume</span>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-medium">Confirmed Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-bold text-white font-display tracking-tight">
              {metrics.bookingsCount}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-stone-400">
              <span>Avg Value: €{metrics.averageBookingValueEur.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Total Passengers */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-medium">Total Passengers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-bold text-white font-display tracking-tight">
              {metrics.passengersCount}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-stone-400">
              <span>{metrics.adultsCount} Adults · {metrics.childrenCount} Children</span>
            </div>
          </div>
        </div>

        {/* Outstanding Balances */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-medium">Outstanding Balances</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-bold text-amber-400 font-display tracking-tight">
              €{metrics.outstandingBalancesEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-stone-400">
              <span>Collect at pier check-in</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Customer & Operational Ratios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* New Customers */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>New Customers</span>
            <UserPlus className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            {metrics.newCustomersCount}
          </div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">First-time excursion travelers</span>
        </div>

        {/* Repeat Customers */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Repeat Customers</span>
            <RotateCcw className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            {metrics.repeatCustomersCount}
          </div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Returning Red Sea guests</span>
        </div>

        {/* Conversion Rate */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Conversion Rate</span>
            <Percent className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-400 mt-2">
            {metrics.conversionRate}%
          </div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Inquiries to confirmed departures</span>
        </div>

        {/* Cancellation Rate */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Cancellation Rate</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-2">
            {metrics.cancellationRate}%
          </div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Weather or guest cancellations</span>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Executive Performance Overview · {interval.label}</h3>
          </div>
          <span className="text-xs text-stone-400">Live Supabase Database Sync</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-300">
          <div className="space-y-2 bg-stone-950/60 p-4 rounded-lg border border-stone-800/80">
            <span className="font-semibold text-white block">Commercial Yield</span>
            <p className="text-stone-400 leading-relaxed">
              Gross excursion revenue reached <strong>€{metrics.revenueEur.toLocaleString()}</strong> across <strong>{metrics.bookingsCount}</strong> bookings,
              yielding an Average Booking Value (ABV) of <strong>€{metrics.averageBookingValueEur.toFixed(2)}</strong>.
            </p>
          </div>

          <div className="space-y-2 bg-stone-950/60 p-4 rounded-lg border border-stone-800/80">
            <span className="font-semibold text-white block">Passenger Logistics</span>
            <p className="text-stone-400 leading-relaxed">
              Dispatched <strong>{metrics.passengersCount} guests</strong> ({metrics.adultsCount} adults, {metrics.childrenCount} children, {metrics.infantsCount} infants).
              Cancellation rate stands at <strong>{metrics.cancellationRate}%</strong> with a customer conversion rate of <strong>{metrics.conversionRate}%</strong>.
            </p>
          </div>

          <div className="space-y-2 bg-stone-950/60 p-4 rounded-lg border border-stone-800/80">
            <span className="font-semibold text-white block">Cash Flow &amp; Pier Credit</span>
            <p className="text-stone-400 leading-relaxed">
              Current uncollected pier balance is <strong>€{metrics.outstandingBalancesEur.toLocaleString()}</strong> scheduled for cash or mobile POS collection at Hurghada and El Gouna marinas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
