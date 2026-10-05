import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  ChevronRight,
  ArrowRight,
  User,
  MapPin,
  DollarSign,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  getLeads,
  createLead,
  updateLead,
  updateLeadStage,
  deleteLead,
} from '../../../services/crmService';
import { adminListTours } from '../../../services/tourService';
import { CrmLead, CrmLeadStage, CrmLeadSource } from '../../../types/crm';
import { DbTour } from '../../../types/database';
import { useToast } from '../../../contexts/ToastContext';

const STAGES: { id: CrmLeadStage; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'interested', label: 'Interested', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'quotation_sent', label: 'Quotation Sent', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'booking_pending', label: 'Booking Pending', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'booked', label: 'Booked', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'completed', label: 'Completed', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { id: 'lost', label: 'Lost', color: 'bg-stone-700/40 text-stone-400 border-stone-700' },
];

const SOURCES: CrmLeadSource[] = [
  'Website',
  'WhatsApp',
  'Facebook',
  'Instagram',
  'Google',
  'Phone',
  'Email',
  'Hotel',
  'Referral',
  'Walk-in',
  'Other',
];

interface CrmLeadsViewProps {
  onConvertLeadToBooking?: (lead: CrmLead) => void;
}

export const CrmLeadsView: React.FC<CrmLeadsViewProps> = ({ onConvertLeadToBooking }) => {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [tours, setTours] = useState<DbTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Partial<CrmLead> | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [leadToDelete, setLeadToDelete] = useState<CrmLead | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allLeads, allTours] = await Promise.all([getLeads(), adminListTours()]);
      setLeads(allLeads);
      setTours(allTours);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingLead({
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      country: '',
      hotel: '',
      source: 'Website',
      stage: 'new',
      guestsCount: 2,
      estimatedValueEur: 70,
      assignedStaff: 'Captain Farouk',
      notes: '',
      followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lead: CrmLead) => {
    setEditingLead({ ...lead });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead?.name || !editingLead?.email) {
      showToast('Name and email are required for leads.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingLead.id) {
        await updateLead(editingLead.id, editingLead);
        showToast(`Lead "${editingLead.name}" updated.`, 'success');
      } else {
        await createLead(editingLead as any);
        showToast(`New lead "${editingLead.name}" added to pipeline.`, 'success');
      }
      setIsModalOpen(false);
      setEditingLead(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save lead', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (leadId: string, nextStage: CrmLeadStage) => {
    try {
      await updateLeadStage(leadId, nextStage);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: nextStage } : l))
      );
      showToast(`Lead moved to ${nextStage.replace('_', ' ').toUpperCase()}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to move lead stage', 'error');
    }
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try {
      await deleteLead(leadToDelete.id);
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      showToast(`Lead "${leadToDelete.name}" deleted.`, 'info');
      setLeadToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete lead', 'error');
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (selectedSource !== 'all' && l.source !== selectedSource) return false;
    if (selectedStage !== 'all' && l.stage !== selectedStage) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.phone && l.phone.includes(q)) ||
        (l.hotel && l.hotel.toLowerCase().includes(q)) ||
        (l.interestedTourTitle && l.interestedTourTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Target className="w-5 h-5 text-[#2dd4bf]" />
            <span>Lead Pipeline & Opportunity Tracker</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Track inquiries from initial contact through quotation, deposit collection, and completed bookings.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded border border-stone-800 bg-stone-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded transition-colors flex items-center space-x-1 cursor-pointer ${
                viewMode === 'kanban' ? 'bg-[#0A6C74] text-white' : 'text-stone-400 hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors flex items-center space-x-1 cursor-pointer ${
                viewMode === 'table' ? 'bg-[#0A6C74] text-white' : 'text-stone-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-950 border border-stone-800 rounded-lg p-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, hotel..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded text-stone-200 focus:outline-none focus:border-[#0A6C74]"
          >
            <option value="all">All Sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {viewMode === 'table' && (
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded text-stone-200 focus:outline-none focus:border-[#0A6C74]"
            >
              <option value="all">All Stages</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="flex space-x-3 overflow-x-auto pb-4 text-xs">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
            const totalStageValue = stageLeads.reduce((sum, l) => sum + (l.estimatedValueEur || 0), 0);

            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 bg-stone-950 border border-stone-800 rounded-xl p-3 flex flex-col space-y-3"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-stone-200 text-xs">{stage.label}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-stone-800 text-stone-400">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono">
                    €{totalStageValue.toFixed(0)}
                  </span>
                </div>

                {/* Stage Cards */}
                <div className="space-y-2.5 min-h-[300px]">
                  {stageLeads.length === 0 ? (
                    <div className="h-28 border border-dashed border-stone-850 rounded-lg flex items-center justify-center text-stone-600 text-[11px]">
                      No leads
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-stone-900/90 border border-stone-800 hover:border-stone-700 rounded-lg p-3 space-y-2 shadow-xs transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-white text-xs leading-tight">
                              {lead.name}
                            </h4>
                            <span className="text-[10px] text-stone-400">{lead.source}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(lead)}
                              className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800"
                              title="Edit Lead"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLeadToDelete(lead)}
                              className="p-1 text-stone-400 hover:text-red-400 rounded hover:bg-stone-800"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {lead.interestedTourTitle && (
                          <div className="text-[11px] text-[#2dd4bf] font-medium truncate">
                            {lead.interestedTourTitle}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800/60 font-mono">
                          <span>€{lead.estimatedValueEur || 0}</span>
                          <span>{lead.guestsCount || 1} guest(s)</span>
                        </div>

                        {/* Stage Selector Dropdown */}
                        <div className="pt-1">
                          <select
                            value={lead.stage}
                            onChange={(e) => handleStageChange(lead.id, e.target.value as CrmLeadStage)}
                            className="w-full text-[10px] bg-stone-950 border border-stone-800 rounded py-1 px-1.5 text-stone-300 focus:outline-none focus:border-[#0A6C74]"
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                Move to: {s.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quick Contact Buttons */}
                        <div className="flex items-center space-x-2 pt-1">
                          {lead.whatsapp && (
                            <a
                              href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800 text-[10px] flex items-center justify-center space-x-1 flex-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[10px] flex items-center justify-center space-x-1 flex-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-xs text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-900 text-stone-400 uppercase tracking-wider border-b border-stone-800 text-[10px]">
                <tr>
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Interested Tour</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Est. Value</th>
                  <th className="py-3 px-4">Assigned</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850 text-stone-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-stone-900/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {lead.name}
                      {lead.hotel && <p className="text-[10px] text-stone-400 font-normal">{lead.hotel}</p>}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div>{lead.email}</div>
                      {lead.phone && <div className="text-stone-400 font-mono">{lead.phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#2dd4bf]">
                      {lead.interestedTourTitle || 'General Excursions'}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <span className="px-2 py-0.5 bg-stone-900 rounded border border-stone-800">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as CrmLeadStage)}
                        className="text-[10px] bg-stone-900 border border-stone-800 rounded py-1 px-1.5 text-stone-300"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                      €{lead.estimatedValueEur || 0}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-stone-400">
                      {lead.assignedStaff || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(lead)}
                          className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeadToDelete(lead)}
                          className="p-1.5 text-stone-400 hover:text-red-400 rounded hover:bg-stone-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && editingLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Target className="w-4 h-4 text-[#2dd4bf]" />
                <span>{editingLead.id ? 'Edit Lead' : 'Create New Lead'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Lead Name *</label>
                  <input
                    type="text"
                    required
                    value={editingLead.name || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingLead.phone || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={editingLead.whatsapp || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Hotel / Resort</label>
                  <input
                    type="text"
                    value={editingLead.hotel || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, hotel: e.target.value })}
                    placeholder="e.g. Rixos Magawish"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Source</label>
                  <select
                    value={editingLead.source || 'Website'}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, source: e.target.value as CrmLeadSource })
                    }
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Interested Tour</label>
                <select
                  value={editingLead.interestedTourTitle || ''}
                  onChange={(e) =>
                    setEditingLead({ ...editingLead, interestedTourTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                >
                  <option value="">-- Select Excursion --</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.title}>
                      {t.title} (€{t.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={editingLead.guestsCount ?? 2}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, guestsCount: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Est. Value (€)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingLead.estimatedValueEur ?? 70}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        estimatedValueEur: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Stage</label>
                  <select
                    value={editingLead.stage || 'new'}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, stage: e.target.value as CrmLeadStage })
                    }
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={editingLead.followUpDate || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Notes / Preferences</label>
                <textarea
                  rows={3}
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  placeholder="e.g. Vegetarian lunch request, wants morning pickup..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded font-semibold disabled:opacity-50 cursor-pointer shadow"
                >
                  {saving ? 'Saving...' : editingLead.id ? 'Save Changes' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center space-x-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Lead</h3>
            </div>
            <p className="text-stone-300 leading-relaxed">
              Are you sure you want to permanently delete lead <strong className="text-white">"{leadToDelete.name}"</strong>?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
