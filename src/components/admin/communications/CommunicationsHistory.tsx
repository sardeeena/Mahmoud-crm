import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Mail,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  User,
  Calendar,
  Download,
  Printer,
  Eye,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  listCommunicationMessages,
} from '../../../services/communicationService';
import {
  CommunicationMessage,
  MessageDeliveryStatus,
  CommunicationChannel,
} from '../../../types/communication';
import { useToast } from '../../../contexts/ToastContext';

interface CommunicationsHistoryProps {
  onNavigateTab?: (tabId: string, param?: string) => void;
}

export const CommunicationsHistory: React.FC<CommunicationsHistoryProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();

  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  // Modal Inspection
  const [selectedMessage, setSelectedMessage] = useState<CommunicationMessage | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await listCommunicationMessages();
      setMessages(all);
    } catch (err) {
      console.error('Failed to load communication history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (channelFilter !== 'all' && m.channel !== channelFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (providerFilter !== 'all') {
        if (providerFilter === 'Not configured' && m.providerName !== 'Not configured') return false;
        if (providerFilter !== 'Not configured' && m.providerName.toLowerCase() !== providerFilter.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.customerName.toLowerCase().includes(q) ||
          m.recipientAddress.toLowerCase().includes(q) ||
          (m.bookingReference && m.bookingReference.toLowerCase().includes(q)) ||
          (m.subject && m.subject.toLowerCase().includes(q)) ||
          m.content.toLowerCase().includes(q) ||
          (m.providerMessageId && m.providerMessageId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [messages, channelFilter, statusFilter, providerFilter, searchQuery]);

  const exportCsv = () => {
    if (filteredMessages.length === 0) {
      showToast('No communication records to export', 'info');
      return;
    }

    const headers = [
      'ID',
      'Channel',
      'Customer Name',
      'Recipient Address',
      'Booking Reference',
      'Template Key',
      'Subject',
      'Delivery Status',
      'Provider Name',
      'Provider Message ID',
      'Failure Reason',
      'Sent At',
      'Delivered At',
      'Staff Actor',
      'Created At',
    ];

    const rows = filteredMessages.map((m) => [
      m.id,
      m.channel,
      `"${m.customerName || ''}"`,
      `"${m.recipientAddress}"`,
      m.bookingReference || '',
      m.templateKey || '',
      `"${(m.subject || '').replace(/"/g, '""')}"`,
      m.status,
      m.providerName,
      m.providerMessageId || '',
      `"${(m.failureReason || '').replace(/"/g, '""')}"`,
      m.sentAt || '',
      m.deliveredAt || '',
      `"${m.staffName}"`,
      m.createdAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `communication_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Communication audit log exported as CSV', 'success');
  };

  // Metrics
  const totalCount = messages.length;
  const sentCount = messages.filter((m) => m.status === 'Sent').length;
  const deliveredCount = messages.filter((m) => m.status === 'Delivered').length;
  const failedCount = messages.filter((m) => m.status === 'Failed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Communication History &amp; Audit Trail
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                Audited Log
              </span>
            </h1>
            <p className="text-xs text-stone-400">
              Complete dispatch log across Email and WhatsApp with strict delivery state tracking
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-stone-400" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={loadData}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <span className="text-[11px] font-medium text-stone-400">Total Logged Messages</span>
          <div className="text-2xl font-bold text-white mt-1">{totalCount}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Email &amp; WhatsApp events</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <span className="text-[11px] font-medium text-stone-400">Sent / Dispatched</span>
          <div className="text-2xl font-bold text-sky-400 mt-1">{sentCount}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Accepted by provider gateway</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <span className="text-[11px] font-medium text-stone-400">Confirmed Delivered</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{deliveredCount}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Handset/Inbox confirmed</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow">
          <span className="text-[11px] font-medium text-stone-400">Failed / Unconfigured</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{failedCount}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Provider missing or bounced</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search recipient, guest name, booking ref, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Channels</option>
              <option value="Email">Email Only</option>
              <option value="WhatsApp">WhatsApp Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="Sent">Sent</option>
              <option value="Delivered">Delivered</option>
              <option value="Queued">Queued</option>
              <option value="Failed">Failed</option>
            </select>

            {/* Provider Filter */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Gateways</option>
              <option value="resend">Resend</option>
              <option value="sendgrid">SendGrid</option>
              <option value="meta_cloud">Meta Cloud API</option>
              <option value="twilio">Twilio</option>
              <option value="Not configured">Not configured</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-stone-400">
          Showing {filteredMessages.length} of {messages.length} total logged events
        </div>
      </div>

      {/* History Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-950/80 border-b border-stone-800 text-stone-400 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Recipient / Guest</th>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Subject / Template</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Gateway Provider</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-stone-300">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    No communications found matching the current search &amp; filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => {
                  const isEmail = msg.channel === 'Email';
                  const isFailed = msg.status === 'Failed';
                  const isSent = msg.status === 'Sent';
                  const isDelivered = msg.status === 'Delivered';

                  return (
                    <tr
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className="hover:bg-stone-800/40 cursor-pointer transition-colors"
                    >
                      {/* Channel */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${
                            isEmail
                              ? 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          {isEmail ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                          {msg.channel}
                        </span>
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{msg.customerName}</div>
                        <div className="text-[11px] font-mono text-stone-400 truncate max-w-[180px]">
                          {msg.recipientAddress}
                        </div>
                      </td>

                      {/* Booking Ref */}
                      <td className="py-3 px-4">
                        {msg.bookingReference ? (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateTab?.('bookings', msg.bookingReference || undefined);
                            }}
                            className="text-teal-400 hover:text-teal-300 font-mono font-medium underline"
                          >
                            {msg.bookingReference}
                          </span>
                        ) : (
                          <span className="text-stone-600">-</span>
                        )}
                      </td>

                      {/* Subject / Template */}
                      <td className="py-3 px-4">
                        <div className="text-stone-200 truncate max-w-[220px]">
                          {msg.subject || msg.templateKey || '(Direct message)'}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate max-w-[220px]">
                          {msg.content.substring(0, 50)}...
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isDelivered && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        )}
                        {isSent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            <Clock className="w-3 h-3" /> Sent
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" /> Failed
                          </span>
                        )}
                      </td>

                      {/* Provider */}
                      <td className="py-3 px-4">
                        {msg.providerName === 'Not configured' ? (
                          <span className="text-amber-400 text-[11px] font-medium">Not configured</span>
                        ) : (
                          <span className="text-stone-300 font-mono text-[11px]">{msg.providerName}</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-stone-400 text-[11px] whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString()}{' '}
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* View Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMessage(msg);
                          }}
                          className="p-1 hover:bg-stone-800 text-stone-400 hover:text-white rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Inspection Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                {selectedMessage.channel === 'Email' ? (
                  <Mail className="w-5 h-5 text-teal-400" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                )}
                <h3 className="text-base font-bold text-white">
                  {selectedMessage.channel} Dispatch Audit Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="text-stone-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Recipient:</span>
                <span className="text-white font-medium">{selectedMessage.recipientAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Customer Name:</span>
                <span className="text-white">{selectedMessage.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Strict Delivery Status:</span>
                <span className="font-semibold text-teal-400">{selectedMessage.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Gateway Provider:</span>
                <span className="text-white">{selectedMessage.providerName}</span>
              </div>
              {selectedMessage.providerMessageId && (
                <div className="flex justify-between py-1 border-b border-stone-800/60 font-mono">
                  <span className="text-stone-400">Provider Message ID:</span>
                  <span className="text-stone-300">{selectedMessage.providerMessageId}</span>
                </div>
              )}
              {selectedMessage.bookingReference && (
                <div className="flex justify-between py-1 border-b border-stone-800/60">
                  <span className="text-stone-400">Booking Reference:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMessage(null);
                      onNavigateTab?.('bookings', selectedMessage.bookingReference || undefined);
                    }}
                    className="text-teal-400 hover:text-teal-300 font-semibold underline"
                  >
                    {selectedMessage.bookingReference}
                  </button>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Staff Dispatcher:</span>
                <span className="text-stone-300">{selectedMessage.staffName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">Logged Timestamp:</span>
                <span className="text-stone-300">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
              </div>

              {selectedMessage.failureReason && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-900/60 rounded text-rose-300 mt-2">
                  <strong>Failure Reason:</strong> {selectedMessage.failureReason}
                </div>
              )}
            </div>

            <div>
              <span className="block text-xs font-medium text-stone-400 mb-1">Delivered Content:</span>
              <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 text-xs text-stone-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                {selectedMessage.content}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              {selectedMessage.customerId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMessage(null);
                    onNavigateTab?.('crm_timeline');
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View on Customer Timeline
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg transition-colors ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
