import React, { useState, useEffect } from 'react';
import {
  FileText,
  Edit3,
  RotateCcw,
  Save,
  CheckCircle2,
  Copy,
  Search,
  Filter,
  Eye,
  Mail,
  MessageSquare,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  listTemplates,
  saveTemplate,
  DEFAULT_TEMPLATES,
  renderTemplateVariables,
} from '../../../services/communicationService';
import {
  CommunicationTemplate,
  TemplateKey,
} from '../../../types/communication';
import { useToast } from '../../../contexts/ToastContext';

interface CommunicationsTemplatesProps {
  onNavigateTab?: (tabId: string, param?: string) => void;
}

const TEMPLATE_DESCRIPTIONS: Record<TemplateKey, string> = {
  booking_received: 'Triggered upon customer web reservation checkout. Confirms order intake.',
  booking_confirmed: 'Official excursion boarding voucher with hotel lobby pickup time.',
  payment_received: 'Financial receipt sent when card, bank wire, or online deposit is booked.',
  payment_reminder: 'Sent for remaining pier balance due before vessel departure.',
  pickup_reminder: 'Sent 18-24 hours prior to departure reminding guests of exact lobby pickup.',
  booking_cancelled: 'Formal cancellation notice detailing any maritime refund eligibility.',
  booking_completed: 'Debrief message sent post-excursion thanking travelers for sailing.',
  review_request: 'Post-tour review invitation with direct Google/TripAdvisor link.',
  customer_followup: 'Concierge check-in offering island charters, quad safaris, or diving.',
};

const SAMPLE_VARS = {
  customer_name: 'Sarah Jenkins',
  booking_reference: 'RSV-2026-8941',
  tour_name: 'Giftun Island VIP Yacht & Snorkeling Cruise',
  tour_date: '2026-10-15',
  pickup_time: '07:30 AM',
  hotel: 'Steigenberger ALDAU Beach Hotel, Hurghada',
  total: '360.00',
  balance: '120.00',
  payment_status: 'Partially Paid',
};

export const CommunicationsTemplates: React.FC<CommunicationsTemplatesProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<TemplateKey>('booking_received');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Edit State
  const [editingName, setEditingName] = useState('');
  const [editingChannel, setEditingChannel] = useState<'Email' | 'WhatsApp' | 'Both'>('Both');
  const [editingSubject, setEditingSubject] = useState('');
  const [editingBody, setEditingBody] = useState('');
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [previewTab, setPreviewTab] = useState<'editor' | 'preview'>('editor');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await listTemplates();
      setTemplates(all);
      const active = all.find((t) => t.templateKey === selectedTemplateKey) || all[0];
      if (active) {
        setSelectedTemplateKey(active.templateKey);
        setEditingName(active.name);
        setEditingChannel(active.channel);
        setEditingSubject(active.subject || '');
        setEditingBody(active.bodyText);
        setEditingIsActive(active.isActive);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectTemplate = (t: CommunicationTemplate) => {
    setSelectedTemplateKey(t.templateKey);
    setEditingName(t.name);
    setEditingChannel(t.channel);
    setEditingSubject(t.subject || '');
    setEditingBody(t.bodyText);
    setEditingIsActive(t.isActive);
  };

  const handleInsertVariable = (v: string) => {
    setEditingBody((prev) => `${prev} {{${v}}}`);
  };

  const handleSave = async () => {
    const current = templates.find((t) => t.templateKey === selectedTemplateKey);
    if (!current) return;

    if (!editingName.trim()) {
      showToast('Template name cannot be empty', 'error');
      return;
    }
    if (!editingBody.trim()) {
      showToast('Template body text cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      const updated: CommunicationTemplate = {
        ...current,
        name: editingName.trim(),
        channel: editingChannel,
        subject: editingSubject.trim() || null,
        bodyText: editingBody.trim(),
        isActive: editingIsActive,
      };

      await saveTemplate(updated);
      showToast(`Template "${updated.name}" saved successfully`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    const defaultTmpl = DEFAULT_TEMPLATES.find((t) => t.templateKey === selectedTemplateKey);
    if (!defaultTmpl) return;

    if (window.confirm(`Reset template "${defaultTmpl.name}" back to system defaults?`)) {
      setSaving(true);
      try {
        await saveTemplate(defaultTmpl);
        showToast(`Template reset to system default`, 'info');
        await loadData();
      } catch (err: any) {
        showToast(err?.message || 'Failed to reset template', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (channelFilter !== 'all' && t.channel !== channelFilter && t.channel !== 'Both') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.templateKey.toLowerCase().includes(q) ||
        (t.subject && t.subject.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const selectedTemplate = templates.find((t) => t.templateKey === selectedTemplateKey);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Communication Templates
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                9 Standard Categories
              </span>
            </h1>
            <p className="text-xs text-stone-400">
              Manage dynamic variables and reusable formats for automated booking, payment, and departure alerts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onNavigateTab?.('comm_email')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-teal-400" />
            <span>Go to Email</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab?.('comm_whatsapp')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Go to WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Template List on Left / Template Editor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 9 Standard Templates List */}
        <div className="lg:col-span-4 bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h2 className="text-sm font-semibold text-white">Event Templates</h2>
            <span className="text-[11px] text-stone-400">{filteredTemplates.length} templates</span>
          </div>

          {/* Search & Channel Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center space-x-1 text-[10px]">
              {(['all', 'Email', 'WhatsApp', 'Both'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannelFilter(ch)}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    channelFilter === ch
                      ? 'bg-teal-600 text-white'
                      : 'bg-stone-950 text-stone-400 hover:text-white border border-stone-800'
                  }`}
                >
                  {ch === 'all' ? 'All Channels' : ch}
                </button>
              ))}
            </div>
          </div>

          {/* Template Cards */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredTemplates.map((t) => {
              const isSelected = t.templateKey === selectedTemplateKey;
              return (
                <div
                  key={t.id || t.templateKey}
                  onClick={() => handleSelectTemplate(t)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-stone-800/90 border-teal-500 shadow-md'
                      : 'bg-stone-950/60 hover:bg-stone-950 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{t.name}</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-stone-900 border border-stone-700 text-stone-300">
                      {t.channel}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                    {TEMPLATE_DESCRIPTIONS[t.templateKey] || t.bodyText}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
                    <span className="font-mono text-teal-400">{t.templateKey}</span>
                    <span>{t.isActive ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Template Editor & Simulation */}
        <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-lg space-y-4">
          {selectedTemplate ? (
            <>
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-teal-400" />
                    Configure Template: {editingName}
                  </h2>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {TEMPLATE_DESCRIPTIONS[selectedTemplate.templateKey]}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('editor')}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        previewTab === 'editor' ? 'bg-teal-600 text-white shadow' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('preview')}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        previewTab === 'preview' ? 'bg-teal-600 text-white shadow' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 transition-colors"
                    title="Reset to default template"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Template Parameters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">
                    Channel Compatibility
                  </label>
                  <select
                    value={editingChannel}
                    onChange={(e) => setEditingChannel(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Both">Both (Email &amp; WhatsApp)</option>
                    <option value="Email">Email Only</option>
                    <option value="WhatsApp">WhatsApp Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">
                    Template Status
                  </label>
                  <select
                    value={editingIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingIsActive(e.target.value === 'active')}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="active">Active &amp; Available</option>
                    <option value="inactive">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Subject Line (Email) */}
              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  Email Subject Line <span className="text-stone-500">(Supports variables)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excursion Confirmation: {{tour_name}} (Ref: {{booking_reference}})"
                  value={editingSubject}
                  onChange={(e) => setEditingSubject(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Supported Dynamic Variables */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-stone-400">Insert Variable Pill:</span>
                  <span className="text-[10px] text-stone-500">Injected dynamically when sending</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'customer_name',
                    'booking_reference',
                    'tour_name',
                    'tour_date',
                    'pickup_time',
                    'hotel',
                    'total',
                    'balance',
                    'payment_status',
                  ].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="px-2 py-0.5 bg-stone-950 hover:bg-stone-800 text-[10px] font-mono text-teal-300 border border-stone-800 hover:border-teal-500/40 rounded transition-colors"
                    >
                      +{`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor Tab vs Live Simulation Preview */}
              {previewTab === 'editor' ? (
                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">
                    Template Message Body <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={12}
                    value={editingBody}
                    onChange={(e) => setEditingBody(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-xs text-stone-200 font-mono focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-[11px] font-medium text-stone-400">
                    Live Rendering Simulation (With Sample Red Sea Reservation)
                  </label>

                  {/* Rendered Preview Card */}
                  <div className="bg-stone-950 border border-stone-800 rounded-lg p-4 space-y-3">
                    {editingSubject && (
                      <div className="border-b border-stone-800 pb-2 text-xs">
                        <span className="text-stone-500 font-medium">Subject Preview:</span>{' '}
                        <span className="text-white font-semibold">
                          {renderTemplateVariables(editingSubject, SAMPLE_VARS)}
                        </span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap text-xs text-stone-200 font-serif leading-relaxed bg-stone-900/50 p-4 rounded border border-stone-800/80">
                      {renderTemplateVariables(editingBody, SAMPLE_VARS)}
                    </div>

                    <div className="text-[10px] text-stone-500 italic">
                      Variables replaced: Sarah Jenkins (Guest), RSV-2026-8941 (Ref), Giftun Island VIP Yacht (Tour), 07:30 AM (Pickup), Steigenberger ALDAU (Hotel), €360.00 (Total), €120.00 (Balance).
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg transition-colors font-medium"
                >
                  Reset to Default
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center space-x-2 px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all ${
                    saving ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Template Changes'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-stone-500 text-xs">
              Select a template from the left column to begin editing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
