import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Building,
  User,
  Send,
  Calendar,
  Clock,
  RefreshCw,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import {
  getCrmConversations,
  logCommunication,
  getCrmCustomers,
} from '../../../services/crmService';
import {
  CrmConversationMessage,
  CrmCommunicationChannel,
  CrmCustomerSummary,
} from '../../../types/crm';
import { useToast } from '../../../contexts/ToastContext';

export const CrmConversationsView: React.FC = () => {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<CrmConversationMessage[]>([]);
  const [customers, setCustomers] = useState<CrmCustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<'all' | CrmCommunicationChannel>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [search, setSearch] = useState('');

  // Log Message Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [channel, setChannel] = useState<CrmCommunicationChannel>('whatsapp');
  const [direction, setDirection] = useState<'outbound' | 'inbound'>('outbound');
  const [sender, setSender] = useState('Captain Ahmed');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [msgs, c] = await Promise.all([getCrmConversations(), getCrmCustomers()]);
      setConversations(msgs);
      setCustomers(c);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredConversations = useMemo(() => {
    return conversations.filter((m) => {
      if (channelFilter !== 'all' && m.channel !== channelFilter) return false;
      if (directionFilter !== 'all' && m.direction !== directionFilter) return false;

      const q = search.trim().toLowerCase();
      if (q) {
        const matches =
          m.customerName.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q) ||
          (m.subject && m.subject.toLowerCase().includes(q)) ||
          (m.customerEmail && m.customerEmail.toLowerCase().includes(q)) ||
          (m.customerPhone && m.customerPhone.includes(q)) ||
          m.sender.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [conversations, channelFilter, directionFilter, search]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSaving(true);
    try {
      let custName = customName.trim();
      let email = customEmail.trim() || null;
      let phone = customPhone.trim() || null;

      if (selectedCustomerId) {
        const found = customers.find((c) => c.id === selectedCustomerId);
        if (found) {
          custName = found.fullName;
          email = found.email;
          phone = found.phone || found.whatsapp || null;
        }
      }

      if (!custName) {
        showToast('Please select or enter the traveler name.', 'error');
        setSaving(false);
        return;
      }

      await logCommunication({
        customerId: selectedCustomerId || null,
        customerName: custName,
        customerEmail: email,
        customerPhone: phone,
        channel,
        direction,
        sender: direction === 'outbound' ? sender : custName,
        recipient: direction === 'outbound' ? custName : 'Red Sea Operations',
        subject: subject.trim() || null,
        message: message.trim(),
      });

      showToast('Conversation logged into traveler history.', 'success');
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to log conversation', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setCustomName('');
    setCustomEmail('');
    setCustomPhone('');
    setSubject('');
    setMessage('');
    setChannel('whatsapp');
    setDirection('outbound');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-[#2dd4bf]" />
            <span>Multi-Channel Conversations</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Unified communications log across WhatsApp, email, phone calls, and marina pier desk interactions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Communication</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search messages, travelers, subjects, or staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-900 border border-stone-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-2 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="phone">Phone Call</option>
            <option value="pier_desk">Pier / Marina Desk</option>
            <option value="website_chat">Website Chat</option>
          </select>

          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value as any)}
            className="bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-2 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Directions</option>
            <option value="outbound">Outbound (Sent)</option>
            <option value="inbound">Inbound (Received)</option>
          </select>
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-24 text-center text-stone-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#2dd4bf] mb-2" />
            <p className="text-sm">Loading communications...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-20 text-center text-stone-500 bg-stone-950/40 border border-dashed border-stone-800 rounded-xl">
            <MessageSquare className="w-10 h-10 mx-auto text-stone-600 mb-2" />
            <p className="text-sm font-medium text-stone-400">No conversations found</p>
            <p className="text-xs text-stone-500 mt-1">Try modifying your channel or search filters.</p>
          </div>
        ) : (
          filteredConversations.map((msg) => (
            <div
              key={msg.id}
              className="bg-stone-950/60 border border-stone-800 rounded-xl p-4.5 space-y-2 hover:border-stone-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      msg.channel === 'whatsapp'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : msg.channel === 'email'
                        ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                        : msg.channel === 'phone'
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-stone-800 text-stone-300 border-stone-700'
                    }`}
                  >
                    {msg.channel}
                  </span>

                  <span className="font-semibold text-white">
                    {msg.customerName}
                  </span>

                  <span className="text-[11px] text-stone-500">
                    ({msg.direction === 'outbound' ? 'Sent by' : 'Received from'}: {msg.sender})
                  </span>
                </div>

                <span className="text-[11px] text-stone-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(msg.timestamp).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>
              </div>

              {msg.subject && (
                <div className="text-xs font-semibold text-stone-200">
                  Subject: {msg.subject}
                </div>
              )}

              <p className="text-xs text-stone-300 bg-stone-900/60 p-3 rounded-lg border border-stone-800/80 leading-relaxed whitespace-pre-wrap">
                {msg.message}
              </p>

              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                <span>Recipient: {msg.recipient}</span>
                {msg.customerPhone && msg.channel === 'whatsapp' && (
                  <a
                    href={`https://wa.me/${msg.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Reply on WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Log Communication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-[#2dd4bf]" />
                <span>Log Traveler Communication</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Select Customer (Optional)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    if (e.target.value) {
                      const found = customers.find((c) => c.id === e.target.value);
                      if (found) {
                        setCustomName(found.fullName);
                        setCustomEmail(found.email);
                        setCustomPhone(found.phone || found.whatsapp || '');
                      }
                    }
                  }}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="">-- Choose Customer or Enter Below --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedCustomerId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-stone-400 block mb-1">
                      Traveler Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Elena Rostova"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-stone-400 block mb-1">Contact Phone / Email</label>
                    <input
                      type="text"
                      placeholder="+7 916 555 4321"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as CrmCommunicationChannel)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone Call</option>
                    <option value="pier_desk">Pier / Marina Desk</option>
                    <option value="website_chat">Website Chat</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as any)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="outbound">Outbound (Sent)</option>
                    <option value="inbound">Inbound (Received)</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Staff Member</label>
                  <select
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Captain Ahmed">Captain Ahmed</option>
                    <option value="Mina Samir">Mina Samir</option>
                    <option value="Captain Farouk">Captain Farouk</option>
                    <option value="Concierge Desk">Concierge Desk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Subject / Excursion Topic (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dolphin House schedule change"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">
                  Message Content / Call Summary <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of conversation, questions answered, pickup arrangements agreed..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded font-medium flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{saving ? 'Logging...' : 'Save Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
