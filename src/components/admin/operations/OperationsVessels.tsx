import React, { useState, useEffect } from 'react';
import {
  Ship,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Anchor,
  ShieldCheck,
  Calendar,
  Users,
} from 'lucide-react';
import { listVessels, saveVessel, deleteVessel } from '../../../services/operationsService';
import { DbVessel } from '../../../types/database';
import { useToast } from '../../../contexts/ToastContext';

export const OperationsVessels: React.FC = () => {
  const { showToast } = useToast();
  const [vessels, setVessels] = useState<DbVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<DbVessel | null>(null);
  const [formData, setFormData] = useState<Partial<DbVessel>>({
    name: '',
    vessel_type: 'motor_yacht',
    registration_number: '',
    port_marina: 'Hurghada Marina',
    passenger_capacity: 35,
    crew_capacity: 4,
    year_built: 2022,
    safety_inspection_expiry: '2027-12-31',
    amenities: ['Life Vests', 'First Aid Kit', 'Sundeck'],
    is_active: true,
  });
  const [amenityInput, setAmenityInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listVessels();
      setVessels(data);
    } catch (err) {
      console.warn('Failed to load vessels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVessels = vessels.filter((v) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        (v.registration_number && v.registration_number.toLowerCase().includes(q)) ||
        v.port_marina.toLowerCase().includes(q) ||
        v.vessel_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenCreate = () => {
    setEditingVessel(null);
    setFormData({
      name: '',
      vessel_type: 'motor_yacht',
      registration_number: '',
      port_marina: 'Hurghada Marina',
      passenger_capacity: 35,
      crew_capacity: 4,
      year_built: 2022,
      safety_inspection_expiry: '2027-12-31',
      amenities: ['Life Vests', 'First Aid Kit', 'Sundeck'],
      is_active: true,
    });
    setAmenityInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vessel: DbVessel) => {
    setEditingVessel(vessel);
    setFormData({
      name: vessel.name,
      vessel_type: vessel.vessel_type,
      registration_number: vessel.registration_number || '',
      port_marina: vessel.port_marina,
      passenger_capacity: vessel.passenger_capacity,
      crew_capacity: vessel.crew_capacity || 4,
      year_built: vessel.year_built || 2022,
      safety_inspection_expiry: vessel.safety_inspection_expiry || '',
      amenities: vessel.amenities || [],
      is_active: vessel.is_active,
    });
    setAmenityInput('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    try {
      await saveVessel({
        ...formData,
        id: editingVessel?.id,
      });

      showToast(`Vessel "${formData.name}" saved to fleet register.`, 'success');
      setIsModalOpen(false);
      await loadData();
    } catch {
      showToast('Error saving vessel', 'error');
    }
  };

  const handleDelete = async (vessel: DbVessel) => {
    if (!window.confirm(`Deactivate/Delete vessel "${vessel.name}"?`)) return;
    await deleteVessel(vessel.id);
    setVessels((prev) => prev.filter((v) => v.id !== vessel.id));
    showToast(`Vessel "${vessel.name}" removed.`, 'info');
  };

  const addAmenity = () => {
    if (!amenityInput.trim()) return;
    const current = formData.amenities || [];
    setFormData({ ...formData, amenities: [...current, amenityInput.trim()] });
    setAmenityInput('');
  };

  const removeAmenity = (index: number) => {
    const current = formData.amenities || [];
    setFormData({ ...formData, amenities: current.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Fleet Management
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Ship className="w-6 h-6 text-[#2dd4bf]" />
            <span>Maritime Vessels & Safari Fleet</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Official vessel register with Coast Guard survey licenses, passenger capacities, and harbor moorings.
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
            <span>Register Vessel</span>
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
            placeholder="Search vessel name, registration, or port marina..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>
      </div>

      {/* Vessels Grid */}
      {loading ? (
        <div className="p-16 text-center text-stone-400">
          <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading fleet records...</p>
        </div>
      ) : filteredVessels.length === 0 ? (
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-12 text-center text-stone-400">
          <Ship className="w-8 h-8 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No vessels registered</p>
          <p className="text-xs text-stone-500">Register a boat or safari vehicle above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVessels.map((vessel) => (
            <div
              key={vessel.id}
              className="bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-xl p-5 space-y-3 transition-colors shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{vessel.name}</h3>
                  <div className="text-[10px] text-stone-400 font-mono">
                    Reg: {vessel.registration_number || 'UNREGISTERED'} &bull; {vessel.port_marina}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    vessel.is_active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {vessel.is_active ? 'Active' : 'Drydock'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-800/80">
                <div className="p-2 bg-stone-900/60 rounded border border-stone-800/60">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Type</span>
                  <span className="text-white capitalize">{vessel.vessel_type.replace('_', ' ')}</span>
                </div>

                <div className="p-2 bg-stone-900/60 rounded border border-stone-800/60">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Capacity</span>
                  <span className="text-[#2dd4bf] font-bold font-mono">
                    {vessel.passenger_capacity} Pax (+{vessel.crew_capacity || 4} Crew)
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-stone-400 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Inspection Expiry:{' '}
                    <strong className="text-white font-mono">
                      {vessel.safety_inspection_expiry || 'Current'}
                    </strong>
                  </span>
                </div>

                {vessel.year_built && (
                  <div className="text-[10px] text-stone-500 font-mono">
                    Commissioned: {vessel.year_built}
                  </div>
                )}
              </div>

              {vessel.amenities && vessel.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {vessel.amenities.slice(0, 3).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded text-[9px] bg-stone-900 border border-stone-800 text-stone-300"
                    >
                      {amenity}
                    </span>
                  ))}
                  {vessel.amenities.length > 3 && (
                    <span className="text-[9px] text-stone-500">
                      +{vessel.amenities.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-stone-800 flex items-center justify-end space-x-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(vessel)}
                  className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(vessel)}
                  className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-950 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT VESSEL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Ship className="w-4 h-4 text-[#2dd4bf]" />
              <span>{editingVessel ? 'Update Vessel Details' : 'Register New Fleet Vessel'}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Vessel Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. M/Y Red Sea Star VIP"
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Vessel Type</label>
                  <select
                    value={formData.vessel_type || 'motor_yacht'}
                    onChange={(e) => setFormData({ ...formData, vessel_type: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  >
                    <option value="motor_yacht">Motor Yacht</option>
                    <option value="speedboat">Speedboat</option>
                    <option value="catamaran">Catamaran</option>
                    <option value="glass_bottom">Glass Bottom Boat</option>
                    <option value="semi_submarine">Semi-Submarine</option>
                    <option value="safari_jeep">Safari Jeep / Land Cruiser</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={formData.registration_number || ''}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    placeholder="e.g. HUR-8841-VIP"
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Port / Marina</label>
                  <input
                    type="text"
                    value={formData.port_marina || 'Hurghada Marina'}
                    onChange={(e) => setFormData({ ...formData, port_marina: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Passenger Cap *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.passenger_capacity || 35}
                    onChange={(e) => setFormData({ ...formData, passenger_capacity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Crew Cap</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.crew_capacity || 4}
                    onChange={(e) => setFormData({ ...formData, crew_capacity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Year Built</label>
                  <input
                    type="number"
                    value={formData.year_built || 2022}
                    onChange={(e) => setFormData({ ...formData, year_built: parseInt(e.target.value) || 2022 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Safety Inspection Expiry</label>
                <input
                  type="date"
                  value={formData.safety_inspection_expiry || ''}
                  onChange={(e) => setFormData({ ...formData, safety_inspection_expiry: e.target.value })}
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Onboard Amenities</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    placeholder="e.g. Fresh water shower, GPS, Sonar"
                    className="flex-1 px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(formData.amenities || []).map((amenity, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-300 text-[11px] flex items-center space-x-1"
                    >
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(i)}
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
                  id="isActiveVessel"
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-stone-800 text-[#0A6C74]"
                />
                <label htmlFor="isActiveVessel" className="text-stone-300 cursor-pointer">
                  Vessel is active & available for departure assignment
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
                  Save Vessel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
