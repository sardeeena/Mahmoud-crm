import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Wind,
  Droplets,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Anchor,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  listWeatherBulletins,
  createWeatherBulletin,
} from '../../../services/operationsService';
import { DbWeatherBulletin } from '../../../types/database';
import { useToast } from '../../../contexts/ToastContext';

export const OperationsWeather: React.FC = () => {
  const { showToast } = useToast();
  const [bulletins, setBulletins] = useState<DbWeatherBulletin[]>([]);
  const [loading, setLoading] = useState(true);

  // New bulletin modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<DbWeatherBulletin>>({
    harbor_location: 'Hurghada Marina',
    water_temperature_c: 26.5,
    air_temperature_c: 31.0,
    swell_height_m: 0.45,
    wind_speed_knots: 8.5,
    wind_direction: 'NNW (Gentle Marine Breeze)',
    visibility_meters: 35,
    coast_guard_cleared: true,
    advisory_notes: 'Optimal marine conditions for Giftun Island crossings and coral reef snorkeling. Coast Guard green flag active.',
    bulletin_date: new Date().toISOString().split('T')[0],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listWeatherBulletins();
      setBulletins(data);
    } catch (err) {
      console.warn('Failed to load weather bulletins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWeatherBulletin(formData);
      showToast('Maritime weather bulletin published.', 'success');
      setIsModalOpen(false);
      await loadData();
    } catch {
      showToast('Error publishing weather bulletin', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Marine Conditions & Harbor Clearance
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <CloudSun className="w-6 h-6 text-[#2dd4bf]" />
            <span>Maritime Weather Bulletins</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Authoritative maritime telemetry, water temperature, swell height, wind velocity, and Coast Guard port clearance.
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Weather Bulletin</span>
          </button>
        </div>
      </div>

      {/* Bulletins Feed */}
      {loading ? (
        <div className="p-16 text-center text-stone-400">
          <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading marine conditions bulletins...</p>
        </div>
      ) : bulletins.length === 0 ? (
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-12 text-center text-stone-400">
          <CloudSun className="w-8 h-8 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No weather bulletins recorded</p>
          <p className="text-xs text-stone-500">Publish a harbor conditions update above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bulletins.map((item, idx) => (
            <div
              key={item.id}
              className={`bg-stone-950 border rounded-xl p-5 space-y-4 shadow-xs transition-colors ${
                idx === 0
                  ? 'border-[#0A6C74] ring-1 ring-[#0A6C74]/50'
                  : 'border-stone-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      item.coast_guard_cleared ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <h3 className="font-bold text-white text-base">{item.harbor_location}</h3>
                  {idx === 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A6C74]/30 text-[#2dd4bf] border border-[#0A6C74]/40">
                      LATEST BULLETIN
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-stone-400 text-xs font-mono">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  <span>Date: {item.bulletin_date}</span>
                </div>
              </div>

              {/* Weather Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800/80">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Water Temp</span>
                  <span className="text-white font-bold font-mono text-sm">{item.water_temperature_c}°C</span>
                </div>

                <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800/80">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Air Temp</span>
                  <span className="text-white font-bold font-mono text-sm">{item.air_temperature_c}°C</span>
                </div>

                <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800/80">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Swell Height</span>
                  <span className="text-white font-bold font-mono text-sm">{item.swell_height_m} meters</span>
                </div>

                <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800/80">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Wind Speed</span>
                  <span className="text-white font-bold font-mono text-sm">{item.wind_speed_knots} knots</span>
                </div>

                <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800/80">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Underwater Vis</span>
                  <span className="text-white font-bold font-mono text-sm">{item.visibility_meters}m</span>
                </div>

                <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800/80">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Coast Guard</span>
                  <span
                    className={`font-bold uppercase text-xs ${
                      item.coast_guard_cleared ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {item.coast_guard_cleared ? 'CLEARED' : 'RESTRICTED'}
                  </span>
                </div>
              </div>

              {item.advisory_notes && (
                <div className="p-3 bg-stone-900/40 rounded-lg border border-stone-800/60 text-stone-300 text-xs">
                  <strong className="text-white block mb-0.5">Maritime Advisory Notes:</strong>
                  <p>{item.advisory_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE BULLETIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <CloudSun className="w-4 h-4 text-[#2dd4bf]" />
              <span>Publish Official Weather Bulletin</span>
            </h3>

            <form onSubmit={handleCreateBulletin} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Harbor Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.harbor_location || 'Hurghada Marina'}
                    onChange={(e) => setFormData({ ...formData, harbor_location: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.bulletin_date || ''}
                    onChange={(e) => setFormData({ ...formData, bulletin_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Water Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.water_temperature_c || 26}
                    onChange={(e) => setFormData({ ...formData, water_temperature_c: parseFloat(e.target.value) || 26 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Air Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.air_temperature_c || 31}
                    onChange={(e) => setFormData({ ...formData, air_temperature_c: parseFloat(e.target.value) || 31 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Swell (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.swell_height_m || 0.4}
                    onChange={(e) => setFormData({ ...formData, swell_height_m: parseFloat(e.target.value) || 0.4 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Wind (knots)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.wind_speed_knots || 8}
                    onChange={(e) => setFormData({ ...formData, wind_speed_knots: parseFloat(e.target.value) || 8 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Wind Direction</label>
                  <input
                    type="text"
                    value={formData.wind_direction || 'NNW'}
                    onChange={(e) => setFormData({ ...formData, wind_direction: e.target.value })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Visibility (m)</label>
                  <input
                    type="number"
                    value={formData.visibility_meters || 35}
                    onChange={(e) => setFormData({ ...formData, visibility_meters: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Advisory Notes</label>
                <textarea
                  rows={2}
                  value={formData.advisory_notes || ''}
                  onChange={(e) => setFormData({ ...formData, advisory_notes: e.target.value })}
                  placeholder="e.g. Calm seas in open waters. Giftun crossing clear."
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="coastGuardCleared"
                  checked={Boolean(formData.coast_guard_cleared)}
                  onChange={(e) => setFormData({ ...formData, coast_guard_cleared: e.target.checked })}
                  className="rounded border-stone-800 text-[#0A6C74]"
                />
                <label htmlFor="coastGuardCleared" className="text-stone-300 cursor-pointer">
                  Coast Guard harbor clearance granted (Green Flag)
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
                  Publish Bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
