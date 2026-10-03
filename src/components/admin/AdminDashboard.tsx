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
  CalendarCheck,
  HelpCircle,
  Users,
  Mail,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  Layers,
  MapPin,
  Sparkles,
  Star,
  Image,
  Car,
  Settings,
} from 'lucide-react';
import { adminListTours } from '../../services/tourService';
import { bookingRepository } from '../../services/bookingRepository';
import { listInquiries } from '../../services/inquiryService';
import { listUnifiedCustomers, UnifiedCustomer } from '../../services/customerService';
import { listNewsletterSubscribers, NewsletterSubscriber } from '../../services/newsletterService';
import { DbTour, DbInquiry } from '../../types/database';
import { Booking } from '../../types/booking';
import { AdminTab } from './AdminLayout';
import { useAuth } from '../../contexts/AuthContext';

interface AdminDashboardProps {
  onNavigateTab: (tab: AdminTab, param?: string) => void;
  onPreviewTour: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onPreviewTour,
}) => {
  const { checkAdminAccess } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<DbTour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<DbInquiry[]>([]);
  const [customers, setCustomers] = useState<UnifiedCustomer[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [toursData, bookingsData, inquiriesData, customersData, subscribersData] = await Promise.all([
        adminListTours(),
        bookingRepository.listBookings(),
        listInquiries(),
        listUnifiedCustomers(),
        listNewsletterSubscribers(),
      ]);
      setTours(toursData);
      setBookings(bookingsData);
      setInquiries(inquiriesData);
      setCustomers(customersData);
      setSubscribers(subscribersData);
    } catch (err) {
      console.warn('Dashboard refresh warning:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);

      // Verify the user's role in the 'profiles' table directly on dashboard mount
      const isAuthorized = await checkAdminAccess();
      if (!isAuthorized) {
        return;
      }

      try {
        const [toursData, bookingsData, inquiriesData, customersData, subscribersData] = await Promise.all([
          adminListTours(),
          bookingRepository.listBookings(),
          listInquiries(),
          listUnifiedCustomers(),
          listNewsletterSubscribers(),
        ]);
        if (!isCancelled) {
          setTours(toursData);
          setBookings(bookingsData);
          setInquiries(inquiriesData);
          setCustomers(customersData);
          setSubscribers(subscribersData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    // Listen for real-time newsletter subscriptions
    const handleNewsletterUpdate = () => {
      listNewsletterSubscribers().then((subData) => {
        if (!isCancelled) setSubscribers(subData);
      }).catch(() => {});
    };

    window.addEventListener('rse_newsletter_updated', handleNewsletterUpdate);
    window.addEventListener('storage', handleNewsletterUpdate);

    return () => {
      isCancelled = true;
      window.removeEventListener('rse_newsletter_updated', handleNewsletterUpdate);
      window.removeEventListener('storage', handleNewsletterUpdate);
    };
  }, [checkAdminAccess]);

  // Compute metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.date === todayStr);
  const upcomingBookings = bookings.filter((b) => b.date >= todayStr && b.status !== 'cancelled');
  const pendingBookings = bookings.filter((b) => b.status === 'pending' || b.paymentStatus === 'pending');
  const publishedTours = tours.filter((t) => t.status === 'published');
  const totalRevenueEur = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.pricing?.totalEur || 0), 0);

  const newInquiries = inquiries.filter((i) => i.status === 'new');
  const activeSubscribers = subscribers.filter((s) => s.status === 'subscribed');

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
            Real-time management for reservations, traveler help requests, customer profiles, and newsletter subscriptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-semibold transition-colors cursor-pointer"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#2dd4bf] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('tour_new')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tour</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('bookings')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-semibold transition-colors"
          >
            <CalendarCheck className="w-4 h-4 text-[#2dd4bf]" />
            <span>Bookings ({bookings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('inquiries')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-semibold transition-colors relative"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Help Requests</span>
            {newInquiries.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px]">
                {newInquiries.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Bookings */}
        <div
          onClick={() => onNavigateTab('bookings')}
          className="bg-stone-950/80 border border-stone-800 hover:border-stone-700 rounded-lg p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Bookings</span>
            <CalendarCheck className="w-3.5 h-3.5 text-[#2dd4bf]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-white">{bookings.length}</span>
            <span className="text-[10px] text-stone-400">total</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400 truncate">
            {todayBookings.length} today
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Gross Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-white">€{totalRevenueEur.toLocaleString()}</span>
          </div>
          <div className="mt-1 text-[10px] text-stone-400">
            {upcomingBookings.length} upcoming
          </div>
        </div>

        {/* Help Inquiries */}
        <div
          onClick={() => onNavigateTab('inquiries')}
          className={`border rounded-lg p-3.5 cursor-pointer transition-colors ${
            newInquiries.length > 0
              ? 'bg-amber-950/20 border-amber-800/60 hover:border-amber-700'
              : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              Help Requests
            </span>
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-white">{inquiries.length}</span>
            {newInquiries.length > 0 && (
              <span className="text-[10px] font-bold text-amber-400">({newInquiries.length} new)</span>
            )}
          </div>
          <div className="mt-1 text-[10px] text-stone-400">
            Direct traveler support
          </div>
        </div>

        {/* Customer Directory */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-stone-950/80 border border-stone-800 hover:border-stone-700 rounded-lg p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Customers</span>
            <Users className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-white">{customers.length}</span>
            <span className="text-[10px] text-stone-400">profiles</span>
          </div>
          <div className="mt-1 text-[10px] text-stone-400">
            Registered travelers
          </div>
        </div>

        {/* Newsletter Subscribers */}
        <div
          onClick={() => onNavigateTab('newsletter')}
          className="bg-stone-950/80 border border-stone-800 hover:border-stone-700 rounded-lg p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Newsletter</span>
            <Mail className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-white">{activeSubscribers.length}</span>
            <span className="text-[10px] text-stone-400">active</span>
          </div>
          <div className="mt-1 text-[10px] text-stone-400 font-mono">
            REDSEA15 vouchers
          </div>
        </div>

        {/* Tour Catalog */}
        <div
          onClick={() => onNavigateTab('tours')}
          className="bg-stone-950/80 border border-stone-800 hover:border-stone-700 rounded-lg p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-stone-400 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Tours</span>
            <Compass className="w-3.5 h-3.5 text-[#0A6C74]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-white">{publishedTours.length}</span>
            <span className="text-[10px] text-stone-400">published</span>
          </div>
          <div className="mt-1 text-[10px] text-stone-400">
            {tours.length} total experiences
          </div>
        </div>
      </div>

      {/* Quick Launchpad: Categories & System Sections */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#2dd4bf]" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Management Sections & Catalog Categories
            </h2>
          </div>
          <span className="text-[11px] text-stone-400">Direct navigation shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('categories')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-[#0A6C74] text-stone-300 hover:text-white transition-all text-center group cursor-pointer"
          >
            <Layers className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Categories</span>
            <span className="text-[9px] text-stone-500">Activities</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('destinations')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-[#0A6C74] text-stone-300 hover:text-white transition-all text-center group cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-sky-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Destinations</span>
            <span className="text-[9px] text-stone-500">Resort zones</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('pickup')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-[#0A6C74] text-stone-300 hover:text-white transition-all text-center group cursor-pointer"
          >
            <Car className="w-4 h-4 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Pickup Zones</span>
            <span className="text-[9px] text-stone-500">Transfers & fees</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('extras')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-[#0A6C74] text-stone-300 hover:text-white transition-all text-center group cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-pink-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Tour Extras</span>
            <span className="text-[9px] text-stone-500">Add-ons & VIP</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('availability')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-[#0A6C74] text-stone-300 hover:text-white transition-all text-center group cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-teal-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Availability</span>
            <span className="text-[9px] text-stone-500">Daily quotas</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('reviews')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-[#0A6C74] text-stone-300 hover:text-white transition-all text-center group cursor-pointer"
          >
            <Star className="w-4 h-4 text-amber-300 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Reviews</span>
            <span className="text-[9px] text-stone-500">Guest ratings</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('media')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-[#0A6C74] text-stone-300 hover:text-white transition-all text-center group cursor-pointer"
          >
            <Image className="w-4 h-4 text-indigo-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Media</span>
            <span className="text-[9px] text-stone-500">Cloud Storage</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="flex flex-col items-center justify-center p-3 rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-[#0A6C74] text-stone-300 hover:text-white transition-all text-center group cursor-pointer"
          >
            <Settings className="w-4 h-4 text-stone-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-semibold">Settings</span>
            <span className="text-[9px] text-stone-500">PostgreSQL</span>
          </button>
        </div>
      </div>

      {/* Row 2: Inbound Help Requests + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Help Requests Widget */}
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Inbound Help Requests</h2>
                {newInquiries.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {newInquiries.length} New
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('inquiries')}
                className="text-xs text-[#2dd4bf] hover:underline font-medium"
              >
                Manage all ({inquiries.length})
              </button>
            </div>

            <div className="divide-y divide-stone-850 mt-2">
              {inquiries.slice(0, 4).map((inq) => (
                <div key={inq.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {inq.customer_name}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                          inq.status === 'new'
                            ? 'bg-amber-500/20 text-amber-300'
                            : inq.status === 'contacted'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 font-medium truncate mt-0.5">
                      {inq.subject}
                    </p>
                    <p className="text-[10px] text-stone-500 truncate">{inq.message}</p>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 pt-1">
                    {inq.whatsapp && (
                      <a
                        href={`https://wa.me/${inq.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hello ${inq.customer_name}, Red Sea Voyagers concierge desk following up on: ${inq.subject}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-emerald-950/60 text-emerald-400 rounded"
                        title="Quick WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigateTab('inquiries')}
                      className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded text-[10px] font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 mt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('inquiries')}
              className="w-full py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-medium rounded transition-colors text-center"
            >
              Open Help & Concierge Inbox →
            </button>
          </div>
        </div>

        {/* Customer Directory & Newsletter Summary Widget */}
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">Recent Customer Accounts</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('customers')}
                className="text-xs text-[#2dd4bf] hover:underline font-medium"
              >
                Directory ({customers.length})
              </button>
            </div>

            <div className="divide-y divide-stone-850 mt-2">
              {customers.slice(0, 4).map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-white truncate">{c.fullName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-900 border border-stone-800 text-stone-400 capitalize">
                        {c.role}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-stone-400 mt-0.5">
                      <span>{c.email}</span>
                      {c.country && <span>• {c.country}</span>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-white">€{c.totalSpentEur.toFixed(0)}</div>
                    <div className="text-[10px] text-emerald-400">{c.totalBookings} tour(s)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 mt-2 flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px]">
              Newsletter Subscribers: <strong className="text-white">{activeSubscribers.length}</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('newsletter')}
              className="text-[#2dd4bf] hover:underline text-xs font-medium"
            >
              View Subscribers →
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Bookings Table & Top Tours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings Table (2 cols) */}
        <div className="lg:col-span-2 bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center space-x-2">
              <CalendarCheck className="w-4 h-4 text-[#2dd4bf]" />
              <h2 className="text-sm font-semibold text-white">Latest Customer Bookings</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('bookings')}
              className="text-xs text-[#2dd4bf] hover:underline font-medium"
            >
              View all ({bookings.length})
            </button>
          </div>

          <div className="overflow-x-auto flex-1 mt-2">
            {bookings.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                No customer bookings recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-900/60 text-stone-400 border-b border-stone-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Ref & Guest</th>
                    <th className="py-2.5 px-3 font-semibold">Tour</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Total</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-stone-300">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.bookingReference} className="hover:bg-stone-900/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-white block text-[11px]">
                          {booking.bookingReference}
                        </span>
                        <span className="text-[10px] text-stone-400 truncate block max-w-[130px]">
                          {booking.customer.firstName} {booking.customer.lastName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px]">
                        <span className="truncate block font-medium text-stone-200 text-[11px]">
                          {booking.tourTitle}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {booking.guests.adults} Adults{booking.guests.children > 0 ? `, ${booking.guests.children} Children` : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-300 text-[11px]">
                        {booking.date}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap text-[11px]">
                        €{booking.pricing.totalEur}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold capitalize ${
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
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col justify-between">
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

            <div className="divide-y divide-stone-850 mt-2">
              {popularTours.map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between space-x-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-stone-200 truncate">{t.title}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-stone-400 mt-0.5">
                      <span>€{t.price}</span>
                      <span>•</span>
                      <span>★ {t.rating} ({t.review_count})</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onPreviewTour(t.slug)}
                      className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
                      title="Preview public page"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('tour_edit', t.id)}
                      className="px-2 py-0.5 text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 mt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('tour_new')}
              className="w-full py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold rounded border border-stone-800 transition-colors flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Tour</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
