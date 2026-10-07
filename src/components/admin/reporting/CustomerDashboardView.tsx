import React from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Globe,
  Building,
  DollarSign,
  Crown,
  Star,
  ExternalLink,
} from 'lucide-react';
import { CustomerMetrics, DateRangeInterval } from '../../../types/reporting';

interface CustomerDashboardViewProps {
  metrics: CustomerMetrics;
  interval: DateRangeInterval;
  onNavigateTab?: (tabId: string, param?: string) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  metrics,
  interval,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Cards: Cohorts & Lifetime Value */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow">
          <span className="text-xs text-stone-400 font-medium">Total Customer Accounts</span>
          <div className="text-2xl lg:text-3xl font-bold text-white mt-1">
            {metrics.totalCustomersCount}
          </div>
          <span className="text-[11px] text-teal-400 mt-1 block">Unified guests &amp; profiles</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow">
          <span className="text-xs text-stone-400 font-medium">New vs Repeat Guests</span>
          <div className="text-2xl lg:text-3xl font-bold text-sky-400 mt-1">
            {metrics.repeatRatePct}% <span className="text-sm font-normal text-stone-400">Repeat</span>
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            {metrics.newCustomersCount} New · {metrics.repeatCustomersCount} Returning
          </span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow">
          <span className="text-xs text-stone-400 font-medium">Customer Lifetime Value (LTV)</span>
          <div className="text-2xl lg:text-3xl font-bold text-emerald-400 mt-1 font-mono">
            €{metrics.customerLifetimeValueEur.toFixed(2)}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Average total spend per customer</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow">
          <span className="text-xs text-stone-400 font-medium">VIP Tier Cohort</span>
          <div className="text-2xl lg:text-3xl font-bold text-amber-400 mt-1">
            {metrics.topCustomers.filter((c) => c.status === 'VIP').length}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">&ge; €500 or 3+ bookings</span>
        </div>
      </div>

      {/* Middle Grid: Geographic Countries & Resort Hotels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Countries Breakdown */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Guest Origin &amp; Nationalities</h3>
            </div>
            <span className="text-[11px] text-stone-400">{metrics.countriesDistribution.length} countries</span>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {metrics.countriesDistribution.length === 0 ? (
              <p className="text-stone-500 text-xs py-8 text-center">No nationality data found.</p>
            ) : (
              metrics.countriesDistribution.map((item) => (
                <div key={item.country} className="p-3 bg-stone-950/70 border border-stone-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{item.country}</span>
                    <span className="font-mono text-teal-400 font-bold">€{item.revenueEur.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>{item.count} travelers ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, item.percentage * 2)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resort Hotels Distribution */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Resort &amp; Hotel Concentrations</h3>
            </div>
            <span className="text-[11px] text-stone-400">{metrics.hotelsDistribution.length} properties</span>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {metrics.hotelsDistribution.length === 0 ? (
              <p className="text-stone-500 text-xs py-8 text-center">No hotel pickup records found.</p>
            ) : (
              metrics.hotelsDistribution.map((h) => (
                <div key={h.hotel} className="p-3 bg-stone-950/70 border border-stone-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate max-w-[260px]">{h.hotel}</span>
                    <span className="text-sky-400 font-bold">{h.count} guests</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, h.percentage * 3)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Customers Leaderboard */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center space-x-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Top Customers &amp; Highest Lifetime Spenders</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab?.('customers')}
            className="text-xs text-teal-400 hover:text-teal-300 underline font-medium"
          >
            View Customer Directory
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-950 text-stone-400 text-[10px] uppercase tracking-wider border-b border-stone-800">
                <th className="py-2.5 px-3">Guest</th>
                <th className="py-2.5 px-3">Country</th>
                <th className="py-2.5 px-3">Resort / Hotel</th>
                <th className="py-2.5 px-3 text-center">Trips</th>
                <th className="py-2.5 px-3 text-right">Lifetime Spend</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {metrics.topCustomers.map((c, i) => (
                <tr key={c.email || c.id} className="hover:bg-stone-800/40 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {i < 3 && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      {c.name}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono truncate max-w-[160px]">{c.email}</div>
                  </td>
                  <td className="py-2.5 px-3 text-stone-400">{c.country}</td>
                  <td className="py-2.5 px-3 text-stone-400 truncate max-w-[180px]">{c.hotel || 'Direct Marina'}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-white">{c.totalBookings}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    €{c.totalSpentEur.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        c.status === 'VIP'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : c.status === 'New'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-stone-800 text-stone-300 border-stone-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
