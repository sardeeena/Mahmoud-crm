import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Anchor,
} from 'lucide-react';
import { listGuides, saveGuide, deleteGuide } from '../../../services/operationsService';
import { DbGuide } from '../../../types/database';
import { useToast } from '../../../contexts/ToastContext';

export const OperationsGuides: React.FC = () => {
  const { showToast } = useToast();
  const [guides, setGuides] = useState<DbGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<DbGuide | null>(null);
  const [formData, setFormData] = useState<Partial<DbGuide>>({
    full_name: '',
    role: 'captain',
    languages: ['English', 'Arabic'],
    phone: '',
    email: '',
    license_number: '',
    rating: 5.0,
    is_active: true,
  });
  const [langInput, setLangInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listGuides();
      setGuides(data);
    } catch (err) {
      console.warn('Failed to load guides:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGuides = guides.filter((g) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.full_name.toLowerCase().includes(q) ||
        g.role.toLowerCase().includes(q) ||
        (g.phone && g.phone.includes(q)) ||
        (g.license_number && g.license_number.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenCreate = () => {
    setEditingGuide(null);
    setFormData({
      full_name: '',
      role: 'captain',
      languages: ['English', 'Arabic'],
      phone: '',
      email: '',
      license_number: '',
      rating: 5.0,
      is_active: true,
    });
    setLangInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (guide: DbGuide) => {
    setEditingGuide(guide);
    setFormData({
      full_name: guide.full_name,
      role: guide.role,
      languages: guide.languages || [],
      phone: guide.phone || '',
      email: guide.email || '',
      license_number: guide.license_number || '',
      rating: guide.rating || 5.0,
      is_active: guide.is_active,
    });
    setLangInput('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name?.trim()) return;

    try {
      await saveGuide({
        ...formData,
        id: editingGuide?.id,
      });

      showToast(`Personnel "${formData.full_name}" saved to staff roster.`, 'success');
      setIsModalOpen(false);
      await loadData();
    } catch {
      showToast('Error saving guide record', 'error');
    }
  };

  const handleDelete = async (guide: DbGuide) => {
    if (!window.confirm(`Deactivate/Delete guide "${guide.full_name}"?`)) return;
    await deleteGuide(guide.id);
    setGuides((prev) => prev.filter((g) => g.id !== guide.id));
    showToast(`Staff member "${guide.full_name}" removed.`, 'info');
  };

  const addLanguage = () => {
    if (!langInput.trim()) return;
    const current = formData.languages || [];
    setFormData({ ...formData, languages: [...current, langInput.trim()] });
    setLangInput('');
  };

  const removeLanguage = (index: number) => {
    const current = formData.languages || [];
    setFormData({ ...formData, languages: current.filter((_, i) => i !== index) });
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'captain':
        return 'Vessel Captain / Master';
      case 'dive_master':
        return 'PADI Divemaster';
      case 'snorkel_guide':
        return 'Reef Snorkel Guide';
      case 'safari_lead':
        return 'Desert Safari Leader';
      default:
        return 'Tour Guide';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Operational Personnel
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Anchor className="w-6 h-6 text-[#2dd4bf]" />
            <span>Captains, Divemasters & Tour Guides</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Certified marine skippers, multilingual dive instructors, and desert expedition leaders.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-stone-900 border border-stone-800 text-stone-300 hover:text-white rounded text-xs transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Operational Staff</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guide name, role, license, or phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="p-16 text-center text-stone-400">
          <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading operational crew...</p>
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-12 text-center text-stone-400">
          <Users className="w-8 h-8 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No operational staff found</p>
          <p className="text-xs text-stone-500">Register a captain, divemaster, or guide above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuides.map((guide) => (
            <div
              key={guide.id}
              className="bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-xl p-5 space-y-3 transition-colors shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{guide.full_name}</h3>
                  <div className="text-[11px] text-[#2dd4bf] font-semibold">
                    {formatRole(guide.role)}
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-amber-400 font-mono text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{guide.rating ? Number(guide.rating).toFixed(2) : '5.00'}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-stone-300 pt-1 border-t border-stone-800/80">
                {guide.license_number && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-stone-400 font-mono">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Lic: {guide.license_number}</span>
                  </div>
                )}

                {guide.phone && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-stone-400 font-mono">
                    <Phone className="w-3 h-3 text-stone-500 shrink-0" />
                    <span>{guide.phone}</span>
                  </div>
                )}

                {guide.email && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-stone-400 font-mono truncate">
                    <Mail className="w-3 h-3 text-stone-500 shrink-0" />
                    <span className="truncate">{guide.email}</span>
                  </div>
                )}
              </div>

              {guide.languages && guide.languages.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {guide.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded text-[9px] bg-stone-900 border border-stone-800 text-stone-300"
                    >
                      🗣️ {lang}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    guide.is_active
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {guide.is_active ? 'Available' : 'Off Duty'}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(guide)}
                    className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(guide)}
                    className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-950 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT GUIDE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#2dd4bf]" />
              <span>{editingGuide ? 'Update Staff Credentials' : 'Add Operational Personnel'}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Captain Tarek Mansour"
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Operational Role</label>
                  <select
                    value={formData.role || 'captain'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  >
                    <option value="captain">Vessel Captain / Master</option>
                    <option value="dive_master">PADI Divemaster</option>
                    <option value="snorkel_guide">Snorkel Guide</option>
                    <option value="safari_lead">Safari Lead</option>
                    <option value="tour_guide">Tour Guide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">License / Registration</label>
                  <input
                    type="text"
                    value={formData.license_number || ''}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="e.g. EGY-MAR-MASTER-8842"
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+20 100 456 7891"
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="captain@redseavoyages.com"
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Spoken Languages</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={langInput}
                    onChange={(e) => setLangInput(e.target.value)}
                    placeholder="e.g. German, Russian, French"
                    className="flex-1 px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(formData.languages || []).map((lang, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-300 text-[11px] flex items-center space-x-1"
                    >
                      <span>{lang}</span>
                      <button
                        type="button"
                        onClick={() => removeLanguage(i)}
                        className="text-stone-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveGuide"
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-stone-800 text-[#0A6C74]"
                />
                <label htmlFor="isActiveGuide" className="text-stone-300 cursor-pointer">
                  Staff member is active & available on duty roster
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-stone-800 text-stone-300 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded font-semibold cursor-pointer"
                >
                  Save Personnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
