import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  Search,
  Filter,
  Phone,
  Printer,
  Download,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  Building,
} from 'lucide-react';
import {
  getDailyPickupSchedule,
  updatePickupScheduleStatus,
} from '../../../services/operationsService';
import { PickupScheduleItem, PickupStatus } from '../../../types/operations';
import { useToast } from '../../../contexts/ToastContext';

export const OperationsPickupSchedule: React.FC = () => {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [pickups, setPickups] = useState<PickupScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDailyPickupSchedule(selectedDate);
      setPickups(data);
    } catch (err) {
      console.warn('Failed to load pickup schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const filteredPickups = useMemo(() => {
    return pickups.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.hotelName.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.bookingReference.toLowerCase().includes(q) ||
          (item.pickupArea && item.pickupArea.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [pickups, statusFilter, searchQuery]);

  const handleStatusChange = async (bookingRef: string, newStatus: PickupStatus) => {
    await updatePickupScheduleStatus(bookingRef, newStatus);
    setPickups((prev) =>
      prev.map((p) => (p.bookingReference === bookingRef ? { ...p, status: newStatus } : p))
    );
    showToast(`Pickup status for ${bookingRef} updated to "${newStatus}".`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: PickupStatus) => {
    switch (status) {
      case 'Waiting':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Picked Up':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'No Show':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Cancelled':
        return 'bg-stone-800 text-stone-400 border-stone-700';
      default:
        return 'bg-stone-800 text-stone-300';
    }
  };

  const totalPassengers = pickups.reduce((sum, p) => sum + p.passengerCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Fleet Transfers & Shuttles
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Car className="w-6 h-6 text-[#2dd4bf]" />
            <span>Daily Hotel Pickup Schedule</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Dispatch run sheet for resort transfer shuttles, limousines, and marina arrival desks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Run Sheet</span>
          </button>
        </div>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block text-black p-4 border-b-2 border-black">
        <h1 className="text-lg font-bold uppercase">HOTEL PICKUP RUN SHEET & DISPATCH SCHEDULE</h1>
        <p className="text-xs">Date: {selectedDate} &bull; Total Guests: {totalPassengers}</p>
      </div>

      {/* Filters Bar */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hotel name, traveler, or booking ref..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-stone-400 text-xs hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded text-stone-300 focus:outline-none"
          >
            <option value="all">All Statuses ({pickups.length})</option>
            <option value="Waiting">Waiting</option>
            <option value="Picked Up">Picked Up</option>
            <option value="No Show">No Show</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Schedule Table */}
      {loading ? (
        <div className="p-16 text-center text-stone-400 print:hidden">
          <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Compiling hotel pickup routes...</p>
        </div>
      ) : filteredPickups.length === 0 ? (
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-12 text-center text-stone-400 print:hidden">
          <Car className="w-8 h-8 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No hotel pickups scheduled for {selectedDate}</p>
          <p className="text-xs text-stone-500">All guests may be arriving directly at the pier.</p>
        </div>
      ) : (
        <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-xs print:bg-white print:border-black print:text-black">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900 border-b border-stone-800 text-stone-400 uppercase tracking-wider text-[10px] print:bg-gray-100 print:text-black">
                <tr>
                  <th className="py-3 px-4 font-mono">Pickup Time</th>
                  <th className="py-3 px-4">Hotel / Resort</th>
                  <th className="py-3 px-4">Customer & Phone</th>
                  <th className="py-3 px-4">Tour & Reference</th>
                  <th className="py-3 px-4 text-center font-mono">Pax</th>
                  <th className="py-3 px-4">Driver / Vehicle</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right print:hidden">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80 print:divide-gray-300">
                {filteredPickups.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white text-sm print:text-black">
                      {item.pickupTime}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white print:text-black">{item.hotelName}</div>
                      <div className="text-[10px] text-stone-400 print:text-black">
                        Area: {item.pickupArea} {item.roomNumber && `&bull; Room: ${item.roomNumber}`}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-200 print:text-black">{item.customerName}</div>
                      {item.customerPhone && (
                        <div className="text-[10px] text-stone-400 font-mono print:text-black">
                          {item.customerPhone}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-200 print:text-black truncate max-w-xs">
                        {item.tourTitle}
                      </div>
                      <div className="text-[10px] font-mono text-[#2dd4bf] print:text-black">
                        {item.bookingReference}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-white print:text-black">
                      {item.passengerCount}
                    </td>

                    <td className="py-3 px-4 text-stone-300 print:text-black">
                      {item.driverVehicle || 'Van #01'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(
                          item.status
                        )} print:text-black print:border-black`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right print:hidden space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.bookingReference, 'Picked Up')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer ${
                          item.status === 'Picked Up'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-300'
                        }`}
                      >
                        Picked Up
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.bookingReference, 'No Show')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer ${
                          item.status === 'No Show'
                            ? 'bg-red-600 text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-300'
                        }`}
                      >
                        No Show
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
