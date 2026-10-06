import React, { useState, useEffect } from 'react';
import {
  Compass,
  Ship,
  Anchor,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  listAssignments,
  saveAssignment,
  listVessels,
  listGuides,
} from '../../../services/operationsService';
import { OperationalAssignment, OperationalStatus } from '../../../types/operations';
import { DbVessel, DbGuide } from '../../../types/database';
import { ALL_TOURS } from '../../../data/toursData';
import { useToast } from '../../../contexts/ToastContext';

export const OperationsAssignments: React.FC = () => {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [assignments, setAssignments] = useState<OperationalAssignment[]>([]);
  const [vessels, setVessels] = useState<DbVessel[]>([]);
  const [guides, setGuides] = useState<DbGuide[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tourId, setTourId] = useState<string>(ALL_TOURS[0]?.id || '');
  const [departureTime, setDepartureTime] = useState<string>('08:30');
  const [vesselId, setVesselId] = useState<string>('');
  const [guideId, setGuideId] = useState<string>('');
  const [status, setStatus] = useState<OperationalStatus>('Scheduled');
  const [notes, setNotes] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [assigns, ves, gui] = await Promise.all([
        listAssignments(selectedDate),
        listVessels(),
        listGuides(),
      ]);
      setAssignments(assigns);
      setVessels(ves);
      setGuides(gui);
      if (ves.length > 0 && !vesselId) setVesselId(ves[0].id);
      if (gui.length > 0 && !guideId) setGuideId(gui[0].id);
    } catch (err) {
      console.warn('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourId || !selectedDate) return;

    const res = await saveAssignment({
      tourId,
      date: selectedDate,
      departureTime,
      vesselId: vesselId || null,
      guideId: guideId || null,
      status,
      notes: notes.trim() || null,
    });

    if (!res.success) {
      showToast(res.error || 'Conflict detected', 'error');
      return;
    }

    showToast('Operational departure assignment confirmed.', 'success');
    setIsModalOpen(false);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Logistics & Crew Dispatch
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Anchor className="w-6 h-6 text-[#2dd4bf]" />
            <span>Tour, Vessel & Captain Assignments</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Allocate marine vessels and licensed tour leaders to daily departures with automated schedule conflict detection.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded text-white text-xs font-mono"
          />

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
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* Assignments Table */}
      {loading ? (
        <div className="p-16 text-center text-stone-400">
          <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Checking operational fleet allocations...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-12 text-center text-stone-400">
          <Ship className="w-8 h-8 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No operational assignments for {selectedDate}</p>
          <p className="text-xs text-stone-500">Create an assignment above to pair a tour with a vessel and skipper.</p>
        </div>
      ) : (
        <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900 border-b border-stone-800 text-stone-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Departure Time</th>
                  <th className="py-3 px-4">Tour / Excursion</th>
                  <th className="py-3 px-4">Assigned Vessel</th>
                  <th className="py-3 px-4">Cap / Marina</th>
                  <th className="py-3 px-4">Captain / Tour Leader</th>
                  <th className="py-3 px-4">Operational Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {assignments.map((item) => {
                  const tour = ALL_TOURS.find((t) => t.id === item.tourId);
                  const vessel = vessels.find((v) => v.id === item.vesselId);
                  const guide = guides.find((g) => g.id === item.guideId);

                  return (
                    <tr key={item.id} className="hover:bg-stone-900/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white text-sm">
                        {item.departureTime}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{tour?.title || 'Tour Departure'}</div>
                        <div className="text-[10px] text-stone-500 font-mono">ID: {item.tourId.substring(0, 8)}</div>
                      </td>

                      <td className="py-3 px-4 text-stone-200">
                        {vessel ? (
                          <div>
                            <span className="font-semibold text-white">{vessel.name}</span>
                            <span className="text-[10px] text-stone-400 block capitalize">
                              {vessel.vessel_type.replace('_', ' ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-400 italic">No vessel assigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-stone-300">
                        {vessel ? (
                          <div>
                            <span className="text-[#2dd4bf] font-bold">{vessel.passenger_capacity} Pax</span>
                            <span className="text-[10px] text-stone-500 block truncate">{vessel.port_marina}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3 px-4 text-stone-200">
                        {guide ? (
                          <div>
                            <span className="font-semibold text-white">{guide.full_name}</span>
                            <span className="text-[10px] text-stone-400 block capitalize">
                              {guide.role.replace('_', ' ')} &bull; {guide.phone || 'No phone'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-400 italic">No guide assigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-900 border border-stone-800 text-stone-300 uppercase">
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-stone-400 text-[11px] max-w-xs truncate">
                        {item.notes || 'Normal departure'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Anchor className="w-4 h-4 text-[#2dd4bf]" />
              <span>Create Daily Operational Assignment</span>
            </h3>

            <p className="text-stone-300 text-[11px]">
              Pair an excursion departure date with an authorized vessel and captain. System automatically blocks double-booking conflicts.
            </p>

            <form onSubmit={handleSaveAssignment} className="space-y-3">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Excursion *</label>
                <select
                  value={tourId}
                  onChange={(e) => setTourId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                >
                  {ALL_TOURS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Departure Date</label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Departure Time</label>
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Assigned Vessel</label>
                  <select
                    value={vesselId}
                    onChange={(e) => setVesselId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  >
                    <option value="">None / External Charter</option>
                    {vessels.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.passenger_capacity} Pax)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Captain / Guide</label>
                  <select
                    value={guideId}
                    onChange={(e) => setGuideId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  >
                    <option value="">None / Subcontractor</option>
                    {guides.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.full_name} ({g.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Ready">Ready</option>
                    <option value="Departed">Departed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Notes / Instructions</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. VIP guests, extra towels on sundeck"
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                </div>
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
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
