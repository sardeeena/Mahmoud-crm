import React, { useState, useEffect } from 'react';
import {
  Users,
  Target,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  CreditCard,
  MessageCircle,
  Phone,
  HelpCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  getCrmDashboardMetrics,
  getCrmFollowUps,
  getGlobalTimeline,
  completeFollowUp,
} from '../../../services/crmService';
import { CrmDashboardMetrics, CrmFollowUp, CrmTimelineEvent } from '../../../types/crm';
import { useToast } from '../../../contexts/ToastContext';

interface CrmDashboardViewProps {
  onNavigateTab: (tab: string, param?: string) => void;
  onOpenNewLead: () => void;
  onOpenNewFollowUp: () => void;
}

export const CrmDashboardView: React.FC<CrmDashboardViewProps> = ({
  onNavigateTab,
  onOpenNewLead,
  onOpenNewFollowUp,
}) => {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<CrmDashboardMetrics | null>(null);
  const [followUps, setFollowUps] = useState<CrmFollowUp[]>([]);
  const [timeline, setTimeline] = useState<CrmTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, f, t] = await Promise.all([
        getCrmDashboardMetrics(),
        getCrmFollowUps(),
        getGlobalTimeline(8),
      ]);
      setMetrics(m);
      setFollowUps(f);
      setTimeline(t);
    } catch (err) {
      console.error('Failed to load CRM dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompleteFup = async (id: string) => {
    try {
      await completeFollowUp(id);
      setFollowUps((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isCompleted: true } : f))
      );
      showToast('Follow-up marked as completed.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete follow-up', 'error');
    }
  };

  const overdueFollowUps = followUps.filter(
    (f) => !f.isCompleted && new Date(f.scheduledFor).getTime() < Date.now()
  );

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Target className="w-5 h-5 text-[#2dd4bf]" />
            <span>Tour-Operator CRM Overview</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Real-time pipeline metrics, overdue traveler follow-ups, concierge inquiries, and bookings today.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onOpenNewFollowUp}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded border border-stone-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Schedule Follow-up</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewLead}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Lead</span>
          </button>
        </div>
      </div>

      {/* OVERDUE FOLLOW-UPS CRITICAL BANNER */}
      {overdueFollowUps.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wide">
                Action Required: {overdueFollowUps.length} Overdue Follow-Up{overdueFollowUps.length > 1 ? 's' : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('follow_ups')}
              className="text-[11px] text-red-300 hover:text-white underline font-medium cursor-pointer"
            >
              View All Follow-Ups &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueFollowUps.slice(0, 4).map((fup) => (
              <div
                key={fup.id}
                className="bg-stone-950/80 border border-red-500/20 rounded-lg p-3 flex items-start justify-between gap-3 text-xs"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white truncate">{fup.customerName}</span>
                    <span className="text-[10px] text-red-400 font-mono">
                      Due: {new Date(fup.scheduledFor).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 line-clamp-2">{fup.notes}</p>
                  <span className="text-[10px] text-stone-500 block">Assigned to: {fup.assignedStaff}</span>
                </div>

                <div className="flex flex-col space-y-1 shrink-0">
                  {fup.customerPhone && (
                    <a
                      href={`https://wa.me/${fup.customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800 text-[10px] flex items-center justify-center space-x-1"
                      title="Open WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCompleteFup(fup.id)}
                    className="p-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[10px] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI METRICS GRID */}
      {metrics ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div
            onClick={() => onNavigateTab('leads')}
            className="p-3.5 bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-xl space-y-1.5 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-stone-400">
              <span className="font-medium text-[11px]">New Leads</span>
              <Target className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">{metrics.newLeadsCount}</div>
            <span className="text-[10px] text-sky-400 font-medium">Pipeline active</span>
          </div>

          <div
            onClick={() => onNavigateTab('inquiries')}
            className="p-3.5 bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-xl space-y-1.5 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-stone-400">
              <span className="font-medium text-[11px]">Open Inquiries</span>
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">{metrics.openInquiriesCount}</div>
            <span className="text-[10px] text-amber-400 font-medium">Needs response</span>
          </div>

          <div
            onClick={() => onNavigateTab('customers')}
            className="p-3.5 bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-xl space-y-1.5 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-stone-400">
              <span className="font-medium text-[11px]">Total Customers</span>
              <Users className="w-4 h-4 text-[#2dd4bf]" />
            </div>
            <div className="text-xl font-bold font-mono text-white">{metrics.newCustomersCount}</div>
            <span className="text-[10px] text-[#2dd4bf] font-medium">Verified travelers</span>
          </div>

          <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-stone-400">
              <span className="font-medium text-[11px]">Bookings This Week</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">{metrics.bookingsThisWeekCount}</div>
            <span className="text-[10px] text-emerald-400 font-medium">
              {metrics.bookingsTodayCount} departure(s) today
            </span>
          </div>

          <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-stone-400">
              <span className="font-medium text-[11px]">Total Confirmed Rev</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">€{metrics.totalRevenueEur.toFixed(0)}</div>
            <span className="text-[10px] text-amber-400 font-medium">
              €{metrics.outstandingPaymentsEur.toFixed(0)} pay at pickup
            </span>
          </div>
        </div>
      ) : null}

      {/* Middle Row: Lead Stages Summary & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links & Pipeline Status */}
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#2dd4bf]" />
              <span>CRM Quick Navigation</span>
            </h3>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onNavigateTab('leads')}
              className="w-full flex items-center justify-between p-2.5 rounded bg-stone-900/60 hover:bg-stone-850 text-stone-200 transition-colors text-left"
            >
              <div className="flex items-center space-x-2.5">
                <Target className="w-4 h-4 text-sky-400" />
                <span className="font-medium">Lead Pipeline & Kanban</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-500" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('customers')}
              className="w-full flex items-center justify-between p-2.5 rounded bg-stone-900/60 hover:bg-stone-850 text-stone-200 transition-colors text-left"
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-[#2dd4bf]" />
                <span className="font-medium">Customer Directory & 360° Profiles</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-500" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('tasks')}
              className="w-full flex items-center justify-between p-2.5 rounded bg-stone-900/60 hover:bg-stone-850 text-stone-200 transition-colors text-left"
            >
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-medium">Staff Tasks & Action Items</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-500" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('follow_ups')}
              className="w-full flex items-center justify-between p-2.5 rounded bg-stone-900/60 hover:bg-stone-850 text-stone-200 transition-colors text-left"
            >
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-medium">Scheduled Follow-Ups</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-500" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('conversations')}
              className="w-full flex items-center justify-between p-2.5 rounded bg-stone-900/60 hover:bg-stone-850 text-stone-200 transition-colors text-left"
            >
              <div className="flex items-center space-x-2.5">
                <MessageCircle className="w-4 h-4 text-teal-400" />
                <span className="font-medium">Multi-Channel Conversations</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-500" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('segments')}
              className="w-full flex items-center justify-between p-2.5 rounded bg-stone-900/60 hover:bg-stone-850 text-stone-200 transition-colors text-left"
            >
              <div className="flex items-center space-x-2.5">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="font-medium">Customer Segments & VIPs</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-500" />
            </button>
          </div>
        </div>

        {/* Real-time Activity Timeline Preview */}
        <div className="lg:col-span-2 bg-stone-950 border border-stone-800 rounded-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#2dd4bf]" />
              <span>Recent Operational Activity Timeline</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('timeline')}
              className="text-[#2dd4bf] hover:underline flex items-center space-x-1"
            >
              <span>Full Timeline</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {timeline.length === 0 ? (
            <p className="text-stone-500 py-6 text-center">No recent activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {timeline.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 text-stone-300">
                  <div className="w-2 h-2 rounded-full bg-[#2dd4bf] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate">{event.title}</span>
                      <span className="text-[10px] text-stone-500 font-mono whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 line-clamp-1">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
