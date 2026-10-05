import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Filter,
  Search,
  Calendar,
  User,
  CreditCard,
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  Star,
  FileText,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { getGlobalTimeline } from '../../../services/crmService';
import { CrmTimelineEvent } from '../../../types/crm';

export const CrmTimelineView: React.FC = () => {
  const [events, setEvents] = useState<CrmTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getGlobalTimeline(150);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load activity timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (typeFilter !== 'all') {
        if (typeFilter === 'bookings' && !ev.type.includes('booking')) return false;
        if (typeFilter === 'inquiries' && !ev.type.includes('inquiry')) return false;
        if (typeFilter === 'payments' && !ev.type.includes('payment')) return false;
        if (typeFilter === 'comms' && !ev.type.includes('communication')) return false;
        if (typeFilter === 'notes' && !ev.type.includes('note')) return false;
      }

      const q = search.trim().toLowerCase();
      if (q) {
        const matches =
          ev.title.toLowerCase().includes(q) ||
          ev.description.toLowerCase().includes(q) ||
          (ev.customerName && ev.customerName.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [events, typeFilter, search]);

  const getMarkerColor = (ev: CrmTimelineEvent) => {
    if (ev.badgeColor === 'emerald' || ev.type === 'booking_created') return 'bg-emerald-500 ring-emerald-500/20';
    if (ev.badgeColor === 'amber' || ev.type === 'inquiry_created') return 'bg-amber-500 ring-amber-500/20';
    if (ev.badgeColor === 'red' || ev.type === 'cancellation') return 'bg-red-500 ring-red-500/20';
    if (ev.badgeColor === 'purple' || ev.type === 'staff_note') return 'bg-purple-500 ring-purple-500/20';
    if (ev.badgeColor === 'sky' || ev.type === 'communication') return 'bg-sky-500 ring-sky-500/20';
    return 'bg-blue-500 ring-blue-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#2dd4bf]" />
            <span>Company Activity Timeline</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Real-time combined chronological stream of customer enrollments, reservations, inquiry submissions, and staff notes.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search timeline events, travelers, or booking details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-900 border border-stone-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-2 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Activity Events ({events.length})</option>
            <option value="bookings">Bookings & Reservations</option>
            <option value="inquiries">Inquiries & Quotes</option>
            <option value="payments">Payments Recorded</option>
            <option value="comms">Communications & Chats</option>
            <option value="notes">Internal Staff Notes</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-6 shadow-sm">
        {loading ? (
          <div className="py-24 text-center text-stone-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#2dd4bf] mb-2" />
            <p className="text-sm">Synthesizing operational events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 text-center text-stone-500">
            <CheckCircle2 className="w-10 h-10 mx-auto text-stone-600 mb-2" />
            <p className="text-sm font-medium text-stone-400">No activity events found</p>
            <p className="text-xs text-stone-500 mt-1">Try resetting your search query.</p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
            {filteredEvents.map((ev) => (
              <div key={ev.id} className="relative group text-xs">
                {/* Timeline Dot Marker */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1 w-3.5 h-3.5 rounded-full ring-4 ${getMarkerColor(
                    ev
                  )}`}
                />

                <div className="bg-stone-900/50 border border-stone-800 hover:border-stone-700 rounded-xl p-4 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">
                        {ev.title}
                      </span>
                      {ev.customerName && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-stone-300">
                          {ev.customerName}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-stone-400 flex items-center space-x-1 shrink-0">
                      <Calendar className="w-3 h-3 text-stone-500" />
                      <span>{new Date(ev.timestamp).toLocaleString('en-GB')}</span>
                    </span>
                  </div>

                  <p className="text-stone-300 text-xs leading-relaxed">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
