import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Printer,
  Download,
  Edit2,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Compass,
  Users,
  RefreshCw,
  Plus,
  Ship,
  Anchor,
  CheckCircle2,
} from 'lucide-react';
import {
  getPassengerManifest,
  updateManifestPassenger,
} from '../../../services/operationsService';
import { PassengerManifestItem } from '../../../types/operations';
import { ALL_TOURS } from '../../../data/toursData';
import { useToast } from '../../../contexts/ToastContext';

export const OperationsManifests: React.FC = () => {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [tourFilter, setTourFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [passengers, setPassengers] = useState<PassengerManifestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Edit passenger modal
  const [editingPassenger, setEditingPassenger] = useState<PassengerManifestItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editNationality, setEditNationality] = useState('');
  const [editPassport, setEditPassport] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('Not specified');
  const [savingAction, setSavingAction] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPassengerManifest(
        selectedDate,
        tourFilter === 'all' ? undefined : tourFilter
      );
      setPassengers(data);
    } catch (err) {
      console.warn('Failed to load passenger manifest:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, tourFilter]);

  const filteredPassengers = useMemo(() => {
    return passengers.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.fullName.toLowerCase().includes(q) ||
          p.bookingReference.toLowerCase().includes(q) ||
          (p.nationality && p.nationality.toLowerCase().includes(q)) ||
          (p.passportOrId && p.passportOrId.toLowerCase().includes(q)) ||
          (p.hotel && p.hotel.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [passengers, searchQuery]);

  const handleEditClick = (p: PassengerManifestItem) => {
    setEditingPassenger(p);
    setEditFullName(p.fullName);
    setEditNationality(p.nationality || '');
    setEditPassport(p.passportOrId || '');
    setEditDob(p.dateOfBirth || '');
    setEditGender(p.gender || 'Not specified');
  };

  const handleSavePassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPassenger) return;
    setSavingAction(true);
    try {
      await updateManifestPassenger(editingPassenger.id, {
        fullName: editFullName.trim(),
        nationality: editNationality.trim(),
        passportOrId: editPassport.trim() || null,
        dateOfBirth: editDob || null,
        gender: editGender,
      });

      setPassengers((prev) =>
        prev.map((p) =>
          p.id === editingPassenger.id
            ? {
                ...p,
                fullName: editFullName.trim(),
                nationality: editNationality.trim(),
                passportOrId: editPassport.trim() || null,
                dateOfBirth: editDob || null,
                gender: editGender,
              }
            : p
        )
      );

      showToast('Passenger manifest credentials updated.', 'success');
      setEditingPassenger(null);
    } catch {
      showToast('Failed to update passenger record', 'error');
    } finally {
      setSavingAction(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportManifestCSV = () => {
    const headers = [
      'Booking Ref',
      'Passenger Name',
      'Nationality',
      'Passport/ID',
      'Date of Birth',
      'Gender',
      'Tour Excursion',
      'Departure Date',
      'Pickup Hotel',
      'Special Requests',
    ];

    const rows = filteredPassengers.map((p) => [
      `"${p.bookingReference}"`,
      `"${p.fullName}"`,
      `"${p.nationality || ''}"`,
      `"${p.passportOrId || ''}"`,
      `"${p.dateOfBirth || ''}"`,
      `"${p.gender || ''}"`,
      `"${p.tourTitle}"`,
      `"${p.tourDate}"`,
      `"${p.hotel || ''}"`,
      `"${p.specialRequests || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `coast_guard_manifest_${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported manifest for ${filteredPassengers.length} passengers.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Naval & Coast Guard Documentation
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-[#2dd4bf]" />
            <span>Harbor Passenger Manifest</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Egyptian Coast Guard and Maritime Authority passenger register. All embarked guests must be verified before pier departure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-stone-900 border border-stone-800 text-stone-300 hover:text-white rounded text-xs cursor-pointer"
          >
            {showSensitiveData ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showSensitiveData ? 'Mask Passports' : 'Reveal Passports'}</span>
          </button>

          <button
            type="button"
            onClick={exportManifestCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-stone-900 border border-stone-800 text-stone-300 hover:text-white rounded text-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Manifest</span>
          </button>
        </div>
      </div>

      {/* Printable Coast Guard Official Header (Visible during print) */}
      <div className="hidden print:block text-black p-4 border-b-2 border-black space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wider">
              RED SEA GOVERNORATE &bull; HARBOR AUTHORITY
            </h1>
            <p className="text-xs font-serif">Coast Guard Official Passenger Clearance Manifest</p>
          </div>
          <div className="text-right text-xs font-mono">
            <div>Departure Date: {selectedDate}</div>
            <div>Port: Hurghada Marina Terminal</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded text-white text-xs font-mono"
          />

          <select
            value={tourFilter}
            onChange={(e) => setTourFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded text-stone-300 focus:outline-none max-w-xs"
          >
            <option value="all">All Excursions</option>
            {ALL_TOURS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passenger, passport, or hotel..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-800 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>
      </div>

      {/* Manifest Table */}
      {loading ? (
        <div className="p-16 text-center text-stone-400 print:hidden">
          <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Compiling manifest records...</p>
        </div>
      ) : filteredPassengers.length === 0 ? (
        <div className="bg-stone-950 border border-stone-800 rounded-xl p-12 text-center text-stone-400 print:hidden">
          <FileText className="w-8 h-8 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No passengers registered for {selectedDate}</p>
          <p className="text-xs text-stone-500">Pick another date to view manifests.</p>
        </div>
      ) : (
        <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-xs print:bg-white print:border-black print:text-black">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900 border-b border-stone-800 text-stone-400 uppercase tracking-wider text-[10px] print:bg-gray-100 print:text-black">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Passenger Full Name</th>
                  <th className="py-3 px-3">Nationality</th>
                  <th className="py-3 px-3 font-mono">Passport / ID</th>
                  <th className="py-3 px-3 font-mono">Date of Birth</th>
                  <th className="py-3 px-3">Tour & Reference</th>
                  <th className="py-3 px-3">Pickup Hotel</th>
                  <th className="py-3 px-3 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80 print:divide-gray-300">
                {filteredPassengers.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-stone-900/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-stone-500">{idx + 1}</td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white print:text-black flex items-center space-x-1.5">
                        <span>{p.fullName}</span>
                        {p.isLeadPassenger && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-stone-800 text-[#2dd4bf] print:text-black print:border">
                            LEAD
                          </span>
                        )}
                      </div>
                      {p.specialRequests && (
                        <div className="text-[10px] text-amber-300/80 truncate max-w-xs">
                          Note: {p.specialRequests}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-stone-300 print:text-black">
                      {p.nationality || 'International'}
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      {p.passportOrId ? (
                        showSensitiveData ? (
                          <span className="text-white font-semibold print:text-black">
                            {p.passportOrId}
                          </span>
                        ) : (
                          <span className="text-stone-400 blur-xs hover:blur-none select-none transition-all">
                            {p.passportOrId}
                          </span>
                        )
                      ) : (
                        <span className="text-amber-400/80 text-[10px] italic">Pending Check-in</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-stone-300 print:text-black">
                      {p.dateOfBirth || '—'}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-medium text-stone-200 print:text-black truncate max-w-xs">
                        {p.tourTitle}
                      </div>
                      <div className="text-[10px] font-mono text-[#2dd4bf] print:text-black">
                        {p.bookingReference}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-stone-300 print:text-black">
                      {p.hotel || 'Direct Harbor'}
                    </td>

                    <td className="py-2.5 px-3 text-right print:hidden">
                      <button
                        type="button"
                        onClick={() => handleEditClick(p)}
                        className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 cursor-pointer"
                        title="Edit credentials"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Printable Signature Footer */}
          <div className="hidden print:flex justify-between items-end p-8 pt-16 text-black border-t-2 border-black text-xs font-serif">
            <div>
              <p>Captain / Master Signature: _______________________</p>
              <p className="mt-2 text-[10px]">Vessel Master Verification</p>
            </div>
            <div>
              <p>Coast Guard Harbor Stamp: _______________________</p>
              <p className="mt-2 text-[10px]">Naval Security Clearance Terminal</p>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PASSENGER CREDENTIALS MODAL */}
      {editingPassenger && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-[#2dd4bf]" />
              <span>Update Passenger Credentials</span>
            </h3>

            <p className="text-stone-300 text-[11px]">
              Booking Ref: <strong className="text-white font-mono">{editingPassenger.bookingReference}</strong>
            </p>

            <form onSubmit={handleSavePassenger} className="space-y-3">
              <div>
                <label className="block text-stone-300 font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Country / Nationality *</label>
                <input
                  type="text"
                  required
                  value={editNationality}
                  onChange={(e) => setEditNationality(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-semibold mb-1">Passport / National ID Number</label>
                <input
                  type="text"
                  value={editPassport}
                  onChange={(e) => setEditPassport(e.target.value)}
                  placeholder="e.g. C12345678"
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  >
                    <option value="Not specified">Not specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingPassenger(null)}
                  className="px-3 py-1.5 bg-stone-800 text-stone-300 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="px-4 py-1.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded font-semibold cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
