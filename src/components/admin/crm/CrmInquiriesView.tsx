import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageCircle,
  Mail,
  Phone,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  User,
  Compass,
  FileText,
  Send,
  Calendar,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  Target,
  CalendarCheck,
  Check,
} from 'lucide-react';
import {
  listInquiries,
  updateInquiryStatus,
  deleteInquiry,
} from '../../../services/inquiryService';
import {
  convertInquiryToLead,
  convertInquiryToCustomer,
  logCommunication,
  scheduleFollowUp,
} from '../../../services/crmService';
import { DbInquiry } from '../../../types/database';
import { useToast } from '../../../contexts/ToastContext';

interface CrmInquiriesViewProps {
  onNavigateTab?: (tab: string, param?: string) => void;
}

export const CrmInquiriesView: React.FC<CrmInquiriesViewProps> = ({
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<DbInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'resolved'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<DbInquiry | null>(null);

  // Conversion / Action Loading
  const [actionLoading, setActionLoading] = useState(false);

  // Quick reply modal
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyChannel, setReplyChannel] = useState<'whatsapp' | 'email'>('whatsapp');

  // Delete modal
  const [inquiryToDelete, setInquiryToDelete] = useState<DbInquiry | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listInquiries();
      setInquiries(data);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inq.customer_name.toLowerCase().includes(q) ||
        inq.email.toLowerCase().includes(q) ||
        (inq.phone && inq.phone.toLowerCase().includes(q)) ||
        inq.subject.toLowerCase().includes(q) ||
        inq.message.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [inquiries, statusFilter, searchQuery]);

  const handleStatusChange = async (id: string, newStatus: DbInquiry['status']) => {
    const success = await updateInquiryStatus(id, newStatus);
    if (success) {
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
      );
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast(`Inquiry marked as ${newStatus}.`, 'info');
    } else {
      showToast('Failed to update status', 'error');
    }
  };

  const handleConvertToLead = async (inq: DbInquiry) => {
    setActionLoading(true);
    try {
      const lead = await convertInquiryToLead(inq.id);
      await updateInquiryStatus(inq.id, 'contacted');
      showToast(`Inquiry converted to Lead in pipeline for "${lead.name}".`, 'success');
      loadData();
      if (onNavigateTab) {
        onNavigateTab('crm_leads');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to convert to lead', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToCustomer = async (inq: DbInquiry) => {
    setActionLoading(true);
    try {
      const result = await convertInquiryToCustomer(inq.id);
      await updateInquiryStatus(inq.id, 'contacted');
      showToast(result.message, result.isExisting ? 'info' : 'success');
      loadData();
      if (onNavigateTab) {
        onNavigateTab('crm_customers');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to convert to customer', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToBooking = (inq: DbInquiry) => {
    showToast(`Initiating booking for ${inq.customer_name}...`, 'info');
    if (onNavigateTab) {
      onNavigateTab('bookings');
    }
  };

  const handleSendQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !replyMessage.trim()) return;
    try {
      await logCommunication({
        customerName: selectedInquiry.customer_name,
        customerEmail: selectedInquiry.email,
        customerPhone: selectedInquiry.phone || undefined,
        channel: replyChannel,
        direction: 'outbound',
        sender: 'Concierge Desk',
        recipient: selectedInquiry.customer_name,
        subject: `Re: ${selectedInquiry.subject}`,
        message: replyMessage.trim(),
      });
      await updateInquiryStatus(selectedInquiry.id, 'contacted');
      showToast('Communication logged and status updated to contacted.', 'success');
      setIsReplyOpen(false);
      setReplyMessage('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to log reply', 'error');
    }
  };

  const handleDelete = async () => {
    if (!inquiryToDelete) return;
    const success = await deleteInquiry(inquiryToDelete.id);
    if (success) {
      setInquiries((prev) => prev.filter((i) => i.id !== inquiryToDelete.id));
      if (selectedInquiry?.id === inquiryToDelete.id) setSelectedInquiry(null);
      setInquiryToDelete(null);
      showToast('Inquiry removed.', 'info');
    } else {
      showToast('Failed to delete inquiry.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-[#2dd4bf]" />
            <span>Concierge & Excursion Inquiries</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Incoming traveler questions, custom charter quotes, and conversion pipelines.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-stone-400">
            Open:{' '}
            <strong className="text-white">
              {inquiries.filter((i) => i.status === 'new' || i.status === 'contacted').length}
            </strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search inquiries by traveler name, email, phone, subject, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-900 border border-stone-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-stone-900 border border-stone-700/80 rounded-lg px-3 py-2 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Statuses ({inquiries.length})</option>
            <option value="new">New ({inquiries.filter((i) => i.status === 'new').length})</option>
            <option value="contacted">Contacted ({inquiries.filter((i) => i.status === 'contacted').length})</option>
            <option value="resolved">Resolved ({inquiries.filter((i) => i.status === 'resolved').length})</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table / Feed */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 text-center text-stone-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#2dd4bf] mb-2" />
            <p className="text-sm">Loading inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="py-20 text-center text-stone-500">
            <CheckCircle2 className="w-10 h-10 mx-auto text-stone-600 mb-2" />
            <p className="text-sm font-medium text-stone-400">No inquiries found</p>
            <p className="text-xs text-stone-500 mt-1">Inbox is clear or no entries match your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-900/60 text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Traveler</th>
                  <th className="py-3 px-4">Subject & Excursion</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-4">Date Received</th>
                  <th className="py-3 px-4 text-right">Conversion Actions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredInquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    className="hover:bg-stone-800/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedInquiry(inq)}
                  >
                    {/* Status Badge */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inq.status}
                        onChange={(e) => handleStatusChange(inq.id, e.target.value as any)}
                        className={`text-[10px] font-bold uppercase rounded px-2 py-1 border focus:outline-none ${
                          inq.status === 'new'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : inq.status === 'contacted'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        <option value="new">NEW</option>
                        <option value="contacted">CONTACTED</option>
                        <option value="resolved">RESOLVED</option>
                      </select>
                    </td>

                    {/* Traveler */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white group-hover:text-[#2dd4bf] transition-colors">
                        {inq.customer_name}
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                        {inq.email}
                      </div>
                      {inq.phone && (
                        <div className="text-[10px] text-stone-500 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{inq.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-stone-200">{inq.subject}</div>
                    </td>

                    {/* Message */}
                    <td className="py-3.5 px-4">
                      <p className="text-stone-300 truncate max-w-xs">{inq.message}</p>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-stone-400 whitespace-nowrap">
                      {new Date(inq.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Conversion Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleConvertToLead(inq)}
                          className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[11px] font-medium transition-colors flex items-center space-x-1"
                          title="Convert to Lead Pipeline"
                        >
                          <Target className="w-3 h-3" />
                          <span>To Lead</span>
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleConvertToCustomer(inq)}
                          className="px-2 py-1 bg-[#0A6C74]/20 hover:bg-[#0A6C74]/30 text-[#2dd4bf] border border-[#0A6C74]/40 rounded text-[11px] font-medium transition-colors flex items-center space-x-1"
                          title="Convert to Customer Profile"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>To Customer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConvertToBooking(inq)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-medium transition-colors flex items-center space-x-1"
                          title="Convert to Booking"
                        >
                          <CalendarCheck className="w-3 h-3" />
                          <span>To Booking</span>
                        </button>
                      </div>
                    </td>

                    {/* Quick Row Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => setSelectedInquiry(inq)}
                          className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setInquiryToDelete(inq)}
                          className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded transition-colors"
                          title="Delete Inquiry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer / Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#0A6C74]/20 border border-[#0A6C74]/40 flex items-center justify-center text-[#2dd4bf] font-bold">
                  {selectedInquiry.customer_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedInquiry.customer_name}
                  </h3>
                  <div className="text-xs text-stone-400 flex items-center space-x-2">
                    <span>{selectedInquiry.email}</span>
                    {selectedInquiry.phone && <span>• {selectedInquiry.phone}</span>}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-lg">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="font-semibold text-white text-sm">
                    {selectedInquiry.subject}
                  </span>
                  <span>Received: {new Date(selectedInquiry.created_at).toLocaleString('en-GB')}</span>
                </div>
                <div className="bg-stone-900 p-3 rounded text-stone-200 whitespace-pre-wrap leading-relaxed">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Conversion Buttons Row */}
              <div className="bg-stone-950/40 border border-stone-800 p-3.5 rounded-lg space-y-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  CRM Workflow Conversions:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleConvertToLead(selectedInquiry)}
                    className="p-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-center font-medium transition-colors"
                  >
                    Convert to Pipeline Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConvertToCustomer(selectedInquiry)}
                    className="p-2.5 bg-[#0A6C74]/20 hover:bg-[#0A6C74]/30 text-[#2dd4bf] border border-[#0A6C74]/40 rounded text-center font-medium transition-colors"
                  >
                    Convert to Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConvertToBooking(selectedInquiry)}
                    className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-center font-medium transition-colors"
                  >
                    Create Reservation
                  </button>
                </div>
              </div>

              {/* Quick Reply Form */}
              <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                    Log Communication / Reply
                  </span>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1 text-stone-300 cursor-pointer">
                      <input
                        type="radio"
                        name="replyChan"
                        value="whatsapp"
                        checked={replyChannel === 'whatsapp'}
                        onChange={() => setReplyChannel('whatsapp')}
                      />
                      <span>WhatsApp</span>
                    </label>
                    <label className="flex items-center space-x-1 text-stone-300 cursor-pointer">
                      <input
                        type="radio"
                        name="replyChan"
                        value="email"
                        checked={replyChannel === 'email'}
                        onChange={() => setReplyChannel('email')}
                      />
                      <span>Email</span>
                    </label>
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder={`Write reply sent to ${selectedInquiry.customer_name} via ${replyChannel}...`}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-white text-xs"
                />

                <div className="flex justify-between items-center">
                  {selectedInquiry.phone && (
                    <a
                      href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center space-x-1 text-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Open WhatsApp Web Chat</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleSendQuickReply}
                    className="px-3 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded font-medium flex items-center space-x-1 ml-auto"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log Outbound Reply</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {inquiryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Inquiry Removal</span>
            </h3>
            <p className="text-xs text-stone-300">
              Are you sure you want to delete the inquiry from <strong>{inquiryToDelete.customer_name}</strong>?
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setInquiryToDelete(null)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
