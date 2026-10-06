import React, { useState, useEffect } from 'react';
import {
  Compass,
  Ship,
  Users,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Car,
  FileText,
  Anchor,
} from 'lucide-react';
import {
  getTodayDepartures,
  updateDepartureStatus,
  getLatestWeatherBulletin,
} from '../../../services/operationsService';
import { OperationalDeparture, OperationalStatus } from '../../../types/operations';
import { DbWeatherBulletin } from '../../../types/database';
import { useToast } from '../../../contexts/ToastContext';

interface OperationsDeparturesProps {
  onNavigateTab?: (tabId: string, param?: string) => void;
}

export const OperationsDepartures: React.FC<OperationsDeparturesProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [departures, setDepartures] = useState<OperationalDeparture[]>([]);
  const [weather, setWeather] = useState<DbWeatherBulletin | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deps, wea] = await Promise.all([
        getTodayDepartures(selectedDate),
        getLatestWeatherBulletin(),
      ]);
      setDepartures(deps);
      setWeather(wea);
    } catch (err) {
      console.warn('Failed to load departures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleStatusChange = async (dep: OperationalDeparture, nextStatus: OperationalStatus) => {
    await updateDepartureStatus(dep.id, nextStatus);
    setDepartures((prev) =>
      prev.map((d) => (d.id === dep.id ? { ...d, operationalStatus: nextStatus } : d))
    );
    showToast(`Departure status for "${dep.tourTitle}" updated to ${nextStatus}.`, 'success');
  };

  const getStatusBadge = (status: OperationalStatus) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-stone-800 text-stone-300 border-stone-700';
      case 'Preparing':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Ready':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'Departed':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  const totalPassengers = departures.reduce((sum, d) => sum + d.passengerCount, 0);
  const totalRevenue = departures.reduce((sum, d) => sum + d.paymentSummary.totalEur, 0);
  const outstandingRevenue = departures.reduce((sum, d) => sum + d.paymentSummary.outstandingEur, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Harbor & Safari Dispatch
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Anchor className="w-6 h-6 text-[#2dd4bf]" />
            <span>Today's Departures & Pier Dispatch</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Real-time control center for daily tour launches, vessel allocations, guide check-ins, and passenger manifests.
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
        </div>
      </div>

      {/* Maritime Clearance Banner */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3.5 h-3.5 rounded-full shrink-0 ${
              weather?.coast_guard_cleared ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <div>
            <div className="flex items-center space-x-2">
              <strong className="text-white text-sm">
                Coast Guard Maritime Clearance:{' '}
                {weather?.coast_guard_cleared ? 'GREEN FLAG (CLEARED)' : 'ADVISORY WARNING'}
              </strong>
              <span className="text-[10px] text-stone-400 font-mono">
                {weather?.harbor_location || 'Hurghada Marina'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Water: {weather?.water_temperature_c || 26}°C &bull; Air: {weather?.air_temperature_c || 31}°C &bull; Swell: {weather?.swell_height_m || 0.4}m &bull; Wind: {weather?.wind_speed_knots || 8} kts {weather?.wind_direction || 'NNW'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-stone-300 font-mono text-[11px] shrink-0">
          <div>
            Total Departures: <strong className="text-white">{departures.length}</strong>
          </div>
          <div>&bull;</div>
          <div>
            Travelers: <strong className="text-[#2dd4bf]">{totalPassengers}</strong>
          </div>
          <div>&bull;</div>
          <div>
            Pier Balance Due: <strong className="text-amber-400">€{outstandingRevenue}</strong>
          </div>
        </div>
      </div>

      {/* Departures List */}
      {loading ? (
        <div className="p-16 text-center text-stone-400">
          <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Compiling departure manifest and vessel allocations...</p>
        </div>
      ) : departures.length === 0 ? (
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-12 text-center text-stone-400">
          <Ship className="w-8 h-8 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No departures scheduled for {selectedDate}</p>
          <p className="text-xs text-stone-500">Pick another date or check the Availability Calendar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {departures.map((dep) => {
            const isFull = dep.vesselCapacity ? dep.passengerCount >= dep.vesselCapacity : false;

            return (
              <div
                key={dep.id}
                className="bg-stone-950 border border-stone-800 rounded-xl p-5 space-y-4 hover:border-stone-700 transition-colors shadow-xs"
              >
                {/* Departure Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 font-mono font-bold text-white text-base">
                      {dep.departureTime}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{dep.tourTitle}</h3>
                      <div className="flex items-center space-x-2 text-[11px] text-stone-400 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-stone-500" />
                          <strong className="text-white">{dep.passengerCount}</strong> passengers ({dep.adultCount} Adults, {dep.childCount} Children)
                        </span>
                        <span>&bull;</span>
                        <span>{dep.bookingsCount} Reservations</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Operational Pipeline */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                        dep.operationalStatus
                      )}`}
                    >
                      {dep.operationalStatus}
                    </span>

                    <select
                      value={dep.operationalStatus}
                      onChange={(e) => handleStatusChange(dep, e.target.value as OperationalStatus)}
                      className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded text-stone-200 text-xs focus:outline-none"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready">Ready</option>
                      <option value="Departed">Departed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Logistics Grid: Vessel, Guide, Pickups, and Finances */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  {/* Assigned Vessel */}
                  <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800/80 space-y-1">
                    <span className="text-[10px] text-stone-500 uppercase font-bold flex items-center space-x-1">
                      <Ship className="w-3 h-3 text-[#2dd4bf]" />
                      <span>Assigned Vessel</span>
                    </span>
                    <div className="font-bold text-white text-xs truncate">
                      {dep.vesselName || 'Unassigned Fleet'}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      Capacity: {dep.passengerCount} / {dep.vesselCapacity || '40'} pax
                      {isFull && <span className="text-red-400 font-bold ml-1">(FULL)</span>}
                    </div>
                  </div>

                  {/* Guide / Captain */}
                  <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800/80 space-y-1">
                    <span className="text-[10px] text-stone-500 uppercase font-bold flex items-center space-x-1">
                      <Anchor className="w-3 h-3 text-sky-400" />
                      <span>Captain / Guide</span>
                    </span>
                    <div className="font-bold text-white text-xs truncate">
                      {dep.guideName || 'Unassigned Guide'}
                    </div>
                    <div className="text-[10px] text-stone-400 truncate">
                      Role: {dep.guideRole || 'Captain'}
                    </div>
                  </div>

                  {/* Pickups Summary */}
                  <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800/80 space-y-1">
                    <span className="text-[10px] text-stone-500 uppercase font-bold flex items-center space-x-1">
                      <Car className="w-3 h-3 text-amber-400" />
                      <span>Hotel Pickups</span>
                    </span>
                    <div className="font-bold text-white text-xs">
                      {dep.pickupLocations.length} Pickup Stops
                    </div>
                    <div className="text-[10px] text-stone-400 truncate">
                      {dep.pickupLocations.map((p) => p.name).slice(0, 2).join(', ') || 'Direct Pier'}
                    </div>
                  </div>

                  {/* Financials & Pier Clearance */}
                  <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800/80 space-y-1">
                    <span className="text-[10px] text-stone-500 uppercase font-bold flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span>Financial Balance</span>
                    </span>
                    <div className="font-mono font-bold text-emerald-400 text-xs">
                      €{dep.paymentSummary.totalEur.toLocaleString()} Total
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {dep.paymentSummary.outstandingEur > 0 ? (
                        <span className="text-amber-400 font-mono">
                          €{dep.paymentSummary.outstandingEur} due at pickup
                        </span>
                      ) : (
                        <span className="text-emerald-300">All payments cleared</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pickup Hotel Timing Bar */}
                {dep.pickupLocations.length > 0 && (
                  <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="text-stone-500 font-semibold text-[10px] uppercase">Route Stops:</span>
                    {dep.pickupLocations.map((loc, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300 font-mono text-[10px]"
                      >
                        ⏱️ {loc.time} &bull; {loc.name} ({loc.passengerCount} pax)
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                  <span className="text-[10px] text-stone-500 font-mono">
                    Departure Reference: DEP-{dep.tourId.substring(0, 8)}-{selectedDate}
                  </span>

                  <div className="flex items-center space-x-2">
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('ops_manifests')}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-medium cursor-pointer"
                      >
                        Inspect Manifest
                      </button>
                    )}

                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('ops_assignments')}
                        className="px-3 py-1.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Reassign Fleet/Crew
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
