import React from 'react';
import {
  TrendingUp,
  Compass,
  MapPin,
  DollarSign,
  Share2,
  CalendarCheck,
  Percent,
} from 'lucide-react';
import { SalesMetrics, DateRangeInterval } from '../../../types/reporting';

interface SalesDashboardViewProps {
  metrics: SalesMetrics;
  interval: DateRangeInterval;
  onNavigateTab?: (tabId: string, param?: string) => void;
}

export const SalesDashboardView: React.FC<SalesDashboardViewProps> = ({
  metrics,
  interval,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow">
          <span className="text-xs text-stone-400 font-medium">Sales Volume</span>
          <div className="text-2xl lg:text-3xl font-bold text-white mt-1">
            €{metrics.totalRevenueEur.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-teal-400 mt-1 block">From {metrics.totalBookingsCount} confirmed bookings</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow">
          <span className="text-xs text-stone-400 font-medium">Average Booking Value (ABV)</span>
          <div className="text-2xl lg:text-3xl font-bold text-teal-400 mt-1">
            €{metrics.averageBookingValueEur.toFixed(2)}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Revenue per confirmed reservation</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow">
          <span className="text-xs text-stone-400 font-medium">Demand Conversion Rate</span>
          <div className="text-2xl lg:text-3xl font-bold text-sky-400 mt-1">
            {metrics.conversionRate}%
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Inquiries &amp; quotes converted to bookings</span>
        </div>
      </div>

      {/* Main Breakdown Grid: Tour & Destination Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings & Revenue by Tour */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Sales &amp; Bookings by Excursion</h3>
            </div>
            <span className="text-[11px] text-stone-400">{metrics.bookingsByTour.length} tours active</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {metrics.bookingsByTour.length === 0 ? (
              <p className="text-stone-500 text-xs py-8 text-center">No tour bookings recorded in this date range.</p>
            ) : (
              metrics.bookingsByTour.map((item, idx) => (
                <div key={item.id} className="p-3 bg-stone-950/70 border border-stone-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate max-w-[240px]">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="font-mono text-teal-400 font-bold">
                      €{item.revenueEur.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>{item.count} bookings ({item.percentage}%)</span>
                    <span>Avg: €{(item.count > 0 ? item.revenueEur / item.count : 0).toFixed(0)} / booking</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, item.percentage * 2)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bookings & Revenue by Destination */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Sales &amp; Bookings by Destination</h3>
            </div>
            <span className="text-[11px] text-stone-400">{metrics.bookingsByDestination.length} destinations</span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {metrics.bookingsByDestination.length === 0 ? (
              <p className="text-stone-500 text-xs py-8 text-center">No destination bookings recorded.</p>
            ) : (
              metrics.bookingsByDestination.map((dest) => (
                <div key={dest.id} className="p-3 bg-stone-950/70 border border-stone-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{dest.name}</span>
                    <span className="font-mono text-sky-400 font-bold">
                      €{dest.revenueEur.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>{dest.count} reservations ({dest.percentage}%)</span>
                    <span className="text-stone-500">Destination share</span>
                  </div>

                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, dest.percentage * 1.5)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bookings by Source Channel */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Acquisition Channel &amp; Source Attribution</h3>
          </div>
          <span className="text-[11px] text-stone-400">Attribution channels</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.bookingsBySource.map((src) => (
            <div key={src.source} className="p-4 bg-stone-950 border border-stone-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{src.source}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                  {src.percentage}%
                </span>
              </div>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                €{src.revenueEur.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500">
                {src.count} bookings attributed
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
