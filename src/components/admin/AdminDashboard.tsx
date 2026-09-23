import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Clock,
  Compass,
  FileEdit,
  DollarSign,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import { adminListTours } from '../../services/tourService';
import { bookingRepository } from '../../services/bookingRepository';
import { DbTour } from '../../types/database';
import { Booking } from '../../types/booking';
import { AdminTab } from './AdminLayout';

interface AdminDashboardProps {
  onNavigateTab: (tab: AdminTab, param?: string) => void;
  onPreviewTour: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onPreviewTour,
}) => {
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<DbTour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [toursData, bookingsData] = await Promise.all([
          adminListTours(),
          bookingRepository.listBookings(),
        ]);
        setTours(toursData);
        setBookings(bookingsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.date === todayStr);
  const upcomingBookings = bookings.filter((b) => b.date >= todayStr && b.status !== 'cancelled');
  const pendingBookings = bookings.filter((b) => b.status === 'pending' || b.paymentStatus === 'pending');
  const publishedTours = tours.filter((t) => t.status === 'published');
  const draftTours = tours.filter((t) => t.status === 'draft');
  const totalRevenueEur = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.pricing?.totalEur || 0), 0);

  const popularTours = [...tours]
    .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Real-time status across Supabase reservations, tour inventory, and operational readiness.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onNavigateTab('tour_new')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Tour</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('bookings')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-semibold transition-colors"
          >
            <CalendarCheck className="w-4 h-4 text-[#2dd4bf]" />
            <span>Manage Bookings</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Bookings */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today's Departures</span>
            <Calendar className="w-4 h-4 text-[#2dd4bf]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{todayBookings.length}</span>
            <span className="text-[10px] text-stone-400">reservations</span>
          </div>
          <div className="mt-2 text-[10px] text-stone-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Scheduled for {todayStr}</span>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Upcoming Bookings</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{upcomingBookings.length}</span>
            <span className="text-[10px] text-stone-400">confirmed guests</span>
          </div>
          <p className="mt-2 text-[10px] text-stone-400">Future scheduled dates</p>
        </div>

        {/* Pending Bookings */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Attention</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-300">{pendingBookings.length}</span>
            <span className="text-[10px] text-stone-400">pay-on-pickup / draft</span>
          </div>
          <p className="mt-2 text-[10px] text-stone-400">Awaiting check-in or arrival</p>
        </div>

        {/* Total Confirmed Revenue */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Booking Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">€{totalRevenueEur.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-stone-400">EUR</span>
          </div>
          <p className="mt-2 text-[10px] text-stone-400">From active reservations</p>
        </div>
      </div>

      {/* Secondary Metric Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Published Tours */}
        <div
          onClick={() => onNavigateTab('tours')}
          className="bg-stone-950/60 border border-stone-800 hover:border-stone-700 rounded-lg p-4 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-[#0A6C74]/20 border border-[#0A6C74]/40 flex items-center justify-center text-[#2dd4bf]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Published Tours</p>
              <p className="text-lg font-bold text-white">{publishedTours.length} Live</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-500" />
        </div>

        {/* Draft Tours */}
        <div
          onClick={() => onNavigateTab('tours')}
          className="bg-stone-950/60 border border-stone-800 hover:border-stone-700 rounded-lg p-4 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Drafts / In Review</p>
              <p className="text-lg font-bold text-amber-200">{draftTours.length} Unpublished</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-500" />
        </div>

        {/* Database Status */}
        <div
          onClick={() => onNavigateTab('settings')}
          className="bg-stone-950/60 border border-stone-800 hover:border-stone-700 rounded-lg p-4 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-stone-800 flex items-center justify-center text-stone-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-stone-400">PostgreSQL RLS Security</p>
              <p className="text-xs font-semibold text-emerald-300">Enforced & Active</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-stone-500" />
        </div>
      </div>

      {/* Main Grid: Recent Bookings & Popular Tours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Table (2 cols) */}
        <div className="lg:col-span-2 bg-stone-950 border border-stone-800 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Customer Bookings</h2>
              <p className="text-[11px] text-stone-400">Live booking entries from Supabase database</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('bookings')}
              className="text-xs text-[#2dd4bf] hover:underline font-medium"
            >
              View all ({bookings.length})
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {bookings.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                No customer bookings recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-900/60 text-stone-400 border-b border-stone-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Ref & Guest</th>
                    <th className="py-2.5 px-4 font-semibold">Tour</th>
                    <th className="py-2.5 px-4 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold">Total</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-stone-300">
                  {bookings.slice(0, 6).map((booking) => (
                    <tr key={booking.bookingReference} className="hover:bg-stone-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-white block text-[11px]">
                          {booking.bookingReference}
                        </span>
                        <span className="text-[11px] text-stone-400 truncate block max-w-[140px]">
                          {booking.customer.firstName} {booking.customer.lastName}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <span className="truncate block font-medium text-stone-200">
                          {booking.tourTitle}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {booking.guests.adults} Adults{booking.guests.children > 0 ? `, ${booking.guests.children} Children` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-stone-300">
                        {booking.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        €{booking.pricing.totalEur}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                            booking.status === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : booking.status === 'cancellation_requested'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Popular Tours Widget (1 col) */}
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="text-sm font-semibold text-white">Top Excursions</h2>
              <button
                type="button"
                onClick={() => onNavigateTab('tours')}
                className="text-xs text-[#2dd4bf] hover:underline"
              >
                All Tours
              </button>
            </div>

            <div className="divide-y divide-stone-800/60 mt-2">
              {popularTours.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between space-x-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-stone-200 truncate">{t.title}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-stone-400 mt-0.5">
                      <span>€{t.price}</span>
                      <span>•</span>
                      <span>★ {t.rating} ({t.review_count})</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onPreviewTour(t.slug)}
                      className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
                      title="Preview public page"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('tour_edit', t.id)}
                      className="px-2 py-1 text-[11px] bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-800/80 mt-4">
            <button
              type="button"
              onClick={() => onNavigateTab('tour_new')}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold rounded border border-stone-800 transition-colors flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Experience</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
