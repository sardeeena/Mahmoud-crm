import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  MessageCircle,
  Mail,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Check,
  CalendarDays,
} from 'lucide-react';
import {
  getCrmFollowUps,
  scheduleFollowUp,
  completeFollowUp,
  getCrmCustomers,
} from '../../../services/crmService';
import { CrmFollowUp, CrmCustomerSummary } from '../../../types/crm';
import { useToast } from '../../../contexts/ToastContext';

export const CrmFollowUpsView: React.FC = () => {
  const { showToast } = useToast();
  const [followUps, setFollowUps] = useState<CrmFollowUp[]>([]);
  const [customers, setCustomers] = useState<CrmCustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState<'all' | 'due' | 'overdue' | 'completed'>('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Schedule Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [fupNotes, setFupNotes] = useState('');
  const [fupDate, setFupDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [fupStaff, setFupStaff] = useState('Captain Ahmed');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, c] = await Promise.all([getCrmFollowUps(), getCrmCustomers()]);
      setFollowUps(f);
      setCustomers(c);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const nowMs = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];

  const overdueList = useMemo(() => {
    return followUps.filter(
      (f) => !f.isCompleted && new Date(f.scheduledFor).getTime() < nowMs
    );
  }, [followUps, nowMs]);

  const filteredFollowUps = useMemo(() => {
    return followUps.filter((f) => {
      const isOverdue = !f.isCompleted && new Date(f.scheduledFor).getTime() < nowMs;
      const isDueToday = !f.isCompleted && f.scheduledFor.startsWith(todayStr);

      if (tabFilter === 'overdue' && !isOverdue) return false;
      if (tabFilter === 'due' && !isDueToday && !isOverdue) return false;
      if (tabFilter === 'completed' && !f.isCompleted) return false;

      if (staffFilter !== 'all' && f.assignedStaff !== staffFilter) return false;

      const q = search.trim().toLowerCase();
      if (q) {
        const matches =
          f.customerName.toLowerCase().includes(q) ||
          f.notes.toLowerCase().includes(q) ||
          (f.customerPhone && f.customerPhone.includes(q)) ||
          (f.customerEmail && f.customerEmail.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [followUps, tabFilter, staffFilter, search, nowMs, todayStr]);

  const handleComplete = async (id: string) => {
    try {
      await completeFollowUp(id);
      showToast('Follow-up marked as completed.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete follow-up', 'error');
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fupNotes.trim()) return;

    setSaving(true);
    try {
      let name = customName.trim();
      let email = customEmail.trim() || null;
      let phone = customPhone.trim() || null;

      if (selectedCustomerId) {
        const found = customers.find((c) => c.id === selectedCustomerId);
        if (found) {
          name = found.fullName;
          email = found.email;
          phone = found.phone || found.whatsapp || null;
        }
      }

      if (!name) {
        showToast('Please specify a traveler or select from existing customers.', 'error');
        setSaving(false);
        return;
      }

      await scheduleFollowUp({
        customerId: selectedCustomerId || null,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        notes: fupNotes.trim(),
        scheduledFor: fupDate,
        assignedStaff: fupStaff,
      });

      showToast('Traveler follow-up scheduled.', 'success');
      setIsModalOpen(false);
      resetModal();
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule follow-up', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    setSelectedCustomerId('');
    setCustomName('');
    setCustomPhone('');
    setCustomEmail('');
    setFupNotes('');
    setFupDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setFupStaff('Captain Ahmed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#2dd4bf]" />
            <span>Traveler Follow-ups & Reminders</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Proactive customer touchpoints, reservation confirmations, and quotation follow-ups.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Follow-up</span>
        </button>
      </div>

      {/* OVERDUE ALERT BANNER (Prominently shown if overdue follow-ups exist) */}
      {overdueList.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {overdueList.length} Overdue Follow-up{overdueList.length > 1 ? 's' : ''} Require Immediate Attention!
              </div>
              <p className="text-xs text-red-300 mt-0.5">
                Staff promised to contact these travelers to answer tour inquiries or confirm excursions. Contact them now before they book elsewhere.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTabFilter('overdue')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap self-start sm:self-auto transition-colors"
          >
            Review Overdue ({overdueList.length})
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 text-xs font-medium overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              tabFilter === 'all'
                ? 'bg-stone-800 text-white font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            All Follow-ups ({followUps.length})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('due')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              tabFilter === 'due'
                ? 'bg-[#0A6C74] text-white font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Due Today & Overdue
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              tabFilter === 'overdue'
                ? 'bg-red-600 text-white font-semibold'
                : 'text-red-400 hover:text-red-300'
            }`}
          >
            Overdue ({overdueList.length})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              tabFilter === 'completed'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Completed ({followUps.filter((f) => f.isCompleted).length})
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search traveler or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none"
            />
          </div>

          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Staff</option>
            <option value="Captain Ahmed">Captain Ahmed</option>
            <option value="Mina Samir">Mina Samir</option>
            <option value="Captain Farouk">Captain Farouk</option>
          </select>
        </div>
      </div>

      {/* Follow-up Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-24 text-center text-stone-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#2dd4bf] mb-2" />
            <p className="text-sm">Loading scheduled follow-ups...</p>
          </div>
        ) : filteredFollowUps.length === 0 ? (
          <div className="py-16 text-center text-stone-500 bg-stone-950/40 border border-dashed border-stone-800 rounded-xl">
            <CheckCircle2 className="w-10 h-10 mx-auto text-stone-600 mb-2" />
            <p className="text-sm font-medium text-stone-400">No follow-ups in this view</p>
            <p className="text-xs text-stone-500 mt-1">All scheduled touchpoints are handled.</p>
          </div>
        ) : (
          filteredFollowUps.map((fup) => {
            const isOverdue =
              !fup.isCompleted && new Date(fup.scheduledFor).getTime() < nowMs;

            return (
              <div
                key={fup.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  fup.isCompleted
                    ? 'bg-stone-950/30 border-stone-800/80 opacity-70'
                    : isOverdue
                    ? 'bg-red-500/10 border-red-500/30 shadow-sm'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-sm">
                      {fup.customerName}
                    </span>
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                        OVERDUE
                      </span>
                    )}
                    {fup.isCompleted && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                        COMPLETED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-200 font-medium">
                    &ldquo;{fup.notes}&rdquo;
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400 pt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      <span>
                        Due: <strong>{new Date(fup.scheduledFor).toLocaleDateString('en-GB')}</strong>
                      </span>
                    </span>
                    <span>•</span>
                    <span>Assigned to: <strong className="text-stone-300">{fup.assignedStaff}</strong></span>
                    {fup.customerPhone && (
                      <>
                        <span>•</span>
                        <a
                          href={`tel:${fup.customerPhone}`}
                          className="text-stone-300 hover:text-white flex items-center space-x-1 font-mono"
                        >
                          <Phone className="w-3 h-3 text-[#2dd4bf]" />
                          <span>{fup.customerPhone}</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {fup.customerPhone && (
                    <a
                      href={`https://wa.me/${fup.customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors"
                      title="Open WhatsApp chat"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {!fup.isCompleted ? (
                    <button
                      type="button"
                      onClick={() => handleComplete(fup.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-stone-500 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Done</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Follow-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#2dd4bf]" />
                <span>Schedule Customer Follow-up</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Select Existing Customer (Optional)</label>
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
                  <option value="">-- Choose Traveler or Enter Below --</option>
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
                      placeholder="e.g. Marcus Schneider"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-stone-400 block mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="+49 171 2345678"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-stone-400 block mb-1">
                  Follow-up Action / Notes <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call customer tomorrow about Luxor tour."
                  value={fupNotes}
                  onChange={(e) => setFupNotes(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-400 block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={fupDate}
                    onChange={(e) => setFupDate(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Assign Staff</label>
                  <select
                    value={fupStaff}
                    onChange={(e) => setFupStaff(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Captain Ahmed">Captain Ahmed</option>
                    <option value="Mina Samir">Mina Samir</option>
                    <option value="Captain Farouk">Captain Farouk</option>
                  </select>
                </div>
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
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium"
                >
                  {saving ? 'Scheduling...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
