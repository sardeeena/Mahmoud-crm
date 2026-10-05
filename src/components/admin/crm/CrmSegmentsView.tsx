import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Users,
  Award,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Globe,
  Compass,
  Download,
  Eye,
  Mail,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { getCrmCustomers } from '../../../services/crmService';
import { CrmCustomerSummary } from '../../../types/crm';
import { CrmCustomerProfileModal } from './CrmCustomerProfileModal';
import { useToast } from '../../../contexts/ToastContext';

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  filterFn: (c: CrmCustomerSummary) => boolean;
}

export const CrmSegmentsView: React.FC = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<CrmCustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSegmentId, setActiveSegmentId] = useState<string>('vip');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCrmCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers for segments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const segments: CustomerSegment[] = useMemo(
    () => [
      {
        id: 'vip',
        name: 'VIP & High-Value Guests',
        description: 'Travelers who have spent €200+ or are tagged as VIP.',
        icon: Award,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        filterFn: (c) => c.tags?.includes('VIP') || c.totalRevenueEur >= 200,
      },
      {
        id: 'repeat',
        name: 'Repeat Excursion Travelers',
        description: 'Loyal guests who booked 2 or more excursions across their holiday.',
        icon: TrendingUp,
        color: 'text-[#2dd4bf] bg-[#0A6C74]/10 border-[#0A6C74]/30',
        filterFn: (c) => c.totalBookings >= 2,
      },
      {
        id: 'balance_due',
        name: 'Outstanding Balance (Pay-at-Pickup)',
        description: 'Guests with pending cash or card collection at hotel pickup or marina pier.',
        icon: AlertTriangle,
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        filterFn: (c) => c.outstandingAmountEur > 0,
      },
      {
        id: 'german',
        name: 'DACH (Germany, Austria, Switzerland)',
        description: 'German-speaking travelers requiring German tour guides and vouchers.',
        icon: Globe,
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        filterFn: (c) =>
          ['germany', 'austria', 'switzerland', 'deutschland'].some((country) =>
            (c.country || '').toLowerCase().includes(country)
          ),
      },
      {
        id: 'uk_international',
        name: 'UK & International Travelers',
        description: 'English-speaking travelers from United Kingdom, USA, and worldwide.',
        icon: Compass,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        filterFn: (c) =>
          ['united kingdom', 'uk', 'england', 'united states', 'usa', 'canada', 'australia'].some(
            (country) => (c.country || '').toLowerCase().includes(country)
          ) || !c.country,
      },
    ],
    []
  );

  const activeSegment = segments.find((s) => s.id === activeSegmentId) || segments[0];

  const segmentCustomers = useMemo(() => {
    return customers.filter(activeSegment.filterFn);
  }, [customers, activeSegment]);

  const segmentTotalRevenue = useMemo(() => {
    return segmentCustomers.reduce((sum, c) => sum + c.totalRevenueEur, 0);
  }, [segmentCustomers]);

  const handleExportSegment = () => {
    if (segmentCustomers.length === 0) return;
    const headers = ['Full Name', 'Email', 'Phone', 'Country', 'Hotel', 'Total Spent EUR', 'Tags'];
    const rows = segmentCustomers.map((c) => [
      `"${c.fullName.replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.country || ''}"`,
      `"${c.hotel || ''}"`,
      c.totalRevenueEur.toFixed(2),
      `"${(c.tags || []).join('; ')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rse_segment_${activeSegment.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#2dd4bf]" />
            <span>Customer Segments & Cohorts</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Targeted customer segmentation for personalized concierge, language-specific guides, and VIP offerings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportSegment}
          disabled={segmentCustomers.length === 0}
          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 border border-stone-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export {activeSegment.name} CSV</span>
        </button>
      </div>

      {/* Segment Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {segments.map((s) => {
          const count = customers.filter(s.filterFn).length;
          const isSelected = s.id === activeSegmentId;
          const Icon = s.icon;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSegmentId(s.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-stone-900 border-[#2dd4bf] shadow-md ring-1 ring-[#2dd4bf]/40'
                  : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-white">{count}</span>
              </div>
              <div className="text-xs font-semibold text-stone-200 mt-2 line-clamp-1">{s.name}</div>
              <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">{s.description}</p>
            </button>
          );
        })}
      </div>

      {/* Active Segment Summary & Data Table */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/40">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>{activeSegment.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0A6C74]/20 text-[#2dd4bf]">
                {segmentCustomers.length} Travelers
              </span>
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">{activeSegment.description}</p>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div>
              <span className="text-stone-500 block text-[10px] uppercase">Cohort Total Spend</span>
              <span className="font-bold text-emerald-400 font-mono">
                €{segmentTotalRevenue.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] uppercase">Average Value</span>
              <span className="font-bold text-stone-200 font-mono">
                €{segmentCustomers.length > 0 ? (segmentTotalRevenue / segmentCustomers.length).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-stone-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#2dd4bf] mb-2" />
            <p className="text-sm">Calculating customer cohorts...</p>
          </div>
        ) : segmentCustomers.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <Users className="w-10 h-10 mx-auto text-stone-600 mb-2" />
            <p className="text-sm font-medium text-stone-400">No travelers in this segment</p>
            <p className="text-xs text-stone-500 mt-1">
              Customers will automatically populate when criteria are satisfied.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-900/60 text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Traveler</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Country & Hotel</th>
                  <th className="py-3 px-4 text-center">Bookings</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {segmentCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-stone-800/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedCustomerId(cust.id)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white group-hover:text-[#2dd4bf] transition-colors">
                        {cust.fullName}
                      </div>
                      <div className="text-[10px] text-stone-500 capitalize">{cust.customerSource}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-300">
                      <div>{cust.email}</div>
                      {cust.phone && <div className="text-[10px] text-stone-500">{cust.phone}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-stone-200">{cust.country || 'International'}</div>
                      <div className="text-[11px] text-stone-400 truncate max-w-[140px]">
                        {cust.hotel || 'Pending Hotel'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-stone-200">
                      {cust.totalBookings}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400 font-mono">
                      €{cust.totalRevenueEur.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className={cust.outstandingAmountEur > 0 ? 'text-amber-400 font-bold' : 'text-stone-500'}>
                        €{cust.outstandingAmountEur.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {cust.tags?.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-stone-800 text-stone-300 border border-stone-700 font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerId(cust.id)}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs transition-colors flex items-center space-x-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomerId && (
        <CrmCustomerProfileModal
          customerEmailOrId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onUpdated={loadData}
        />
      )}
    </div>
  );
};
