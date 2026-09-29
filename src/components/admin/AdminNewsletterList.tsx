import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Trash2,
  Tag,
  Calendar,
  Send,
  Users,
} from 'lucide-react';
import {
  listNewsletterSubscribers,
  updateSubscriberStatus,
  deleteSubscriber,
  NewsletterSubscriber,
} from '../../services/newsletterService';
import { useToast } from '../../contexts/ToastContext';

export const AdminNewsletterList: React.FC = () => {
  const { showToast } = useToast();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'subscribed' | 'unsubscribed'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listNewsletterSubscribers();
      setSubscribers(data);
    } catch (err) {
      console.error('Failed to load newsletter subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesSearch = !searchQuery || s.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [subscribers, statusFilter, searchQuery]);

  const handleToggleStatus = async (s: NewsletterSubscriber) => {
    const newStatus = s.status === 'subscribed' ? 'unsubscribed' : 'subscribed';
    const success = await updateSubscriberStatus(s.id || s.email, newStatus);
    if (success) {
      setSubscribers((prev) =>
        prev.map((item) =>
          item.email === s.email ? { ...item, status: newStatus } : item
        )
      );
      showToast(`Subscriber ${s.email} marked as ${newStatus}.`, 'success');
    }
  };

  const handleDelete = async (s: NewsletterSubscriber) => {
    if (!window.confirm(`Are you sure you want to remove ${s.email} from the newsletter database?`)) {
      return;
    }
    const success = await deleteSubscriber(s.id || s.email);
    if (success) {
      setSubscribers((prev) => prev.filter((item) => item.email !== s.email));
      showToast('Subscriber removed from database.', 'info');
    }
  };

  const exportCSV = () => {
    const headers = ['Email Address', 'Status', 'Promo Discount Code', 'Source', 'Subscribed Date'];
    const rows = filteredSubscribers.map((s) => [
      `"${s.email}"`,
      `"${s.status}"`,
      `"${s.discountCode || 'REDSEA15'}"`,
      `"${s.source || 'footer'}"`,
      `"${s.createdAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCount = subscribers.length;
  const activeCount = subscribers.filter((s) => s.status === 'subscribed').length;
  const unsubCount = subscribers.filter((s) => s.status === 'unsubscribed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Mail className="w-5 h-5 text-[#2dd4bf]" />
            <span>Newsletter Subscribers</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Travelers subscribed to promotional voucher campaigns, reef clarity updates, and seasonal deals.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Subscribers</span>
          </button>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold shadow transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Total In Database
          </span>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
        </div>
        <div className="bg-stone-950 border border-emerald-900/40 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Active Subscribers</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{activeCount}</p>
        </div>
        <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Unsubscribed
          </span>
          <p className="text-2xl font-bold text-stone-400 mt-1">{unsubCount}</p>
        </div>
        <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Default Voucher Code
          </span>
          <p className="text-lg font-mono font-bold text-amber-300 mt-1.5">REDSEA15</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search email addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <div className="flex rounded-lg bg-stone-900 p-1 border border-stone-800 text-xs w-full sm:w-auto">
            {(['all', 'subscribed', 'unsubscribed'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-[#0A6C74] text-white'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-stone-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0A6C74] mb-2" />
            <p className="text-xs">Loading subscriber list from database...</p>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-2">
            <Mail className="w-10 h-10 mx-auto text-stone-600" />
            <p className="text-sm text-stone-300 font-medium">No subscribers found</p>
            <p className="text-xs text-stone-500">
              Travelers who subscribe to the newsletter will automatically be recorded here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900 border-b border-stone-800 text-stone-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Subscriber Email</th>
                  <th className="py-3 px-4">Source Channel</th>
                  <th className="py-3 px-4">Voucher Code</th>
                  <th className="py-3 px-4">Subscription Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {filteredSubscribers.map((s) => (
                  <tr key={s.id || s.email} className="hover:bg-stone-900/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {s.status === 'subscribed' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Subscribed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-stone-400 border border-stone-700">
                          <XCircle className="w-3 h-3" />
                          <span>Unsubscribed</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {s.email}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="capitalize px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300 text-[11px]">
                        {s.source || 'footer'}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-amber-300">
                      {s.discountCode || 'REDSEA15'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-stone-400 text-[11px]">
                      {new Date(s.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(s)}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded text-[11px] font-medium border border-stone-700 transition-colors"
                      >
                        {s.status === 'subscribed' ? 'Unsubscribe' : 'Reactivate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        className="p-1 hover:bg-red-950/60 text-stone-500 hover:text-red-400 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
