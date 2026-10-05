import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  CreditCard,
  MessageCircle,
  Clock,
  AlertTriangle,
  Download,
  Trash2,
  Eye,
  ExternalLink,
  ChevronRight,
  Shield,
  Tag,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  getCrmCustomers,
  createCrmCustomer,
  deleteCrmCustomer,
} from '../../../services/crmService';
import { CrmCustomerSummary, CrmLeadSource } from '../../../types/crm';
import { CrmCustomerProfileModal } from './CrmCustomerProfileModal';
import { useToast } from '../../../contexts/ToastContext';

interface CrmCustomersViewProps {
  onViewBookingDetails?: (ref: string) => void;
}

export const CrmCustomersView: React.FC<CrmCustomersViewProps> = ({
  onViewBookingDetails,
}) => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<CrmCustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [balanceFilter, setBalanceFilter] = useState<boolean>(false);

  // Selected Customer for Profile View
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // New Customer Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newCountry, setNewCountry] = useState('Germany');
  const [newHotel, setNewHotel] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newSource, setNewSource] = useState<CrmLeadSource>('Website');
  const [newTagsStr, setNewTagsStr] = useState('');
  const [creating, setCreating] = useState(false);

  // Delete modal
  const [customerToDelete, setCustomerToDelete] = useState<CrmCustomerSummary | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCrmCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load CRM customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.whatsapp && c.whatsapp.includes(q)) ||
        (c.hotel && c.hotel.toLowerCase().includes(q)) ||
        (c.country && c.country.toLowerCase().includes(q));

      const matchesTag =
        tagFilter === 'all' || (c.tags && c.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()));

      const matchesSource = sourceFilter === 'all' || c.customerSource === sourceFilter;

      const matchesBalance = !balanceFilter || c.outstandingAmountEur > 0;

      return matchesSearch && matchesTag && matchesSource && matchesBalance;
    });
  }, [customers, search, tagFilter, sourceFilter, balanceFilter]);

  // Available tags collection
  const allTags = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [customers]);

  // Aggregate stats
  const totalRevenue = useMemo(
    () => customers.reduce((sum, c) => sum + c.totalRevenueEur, 0),
    [customers]
  );
  const totalOutstanding = useMemo(
    () => customers.reduce((sum, c) => sum + c.outstandingAmountEur, 0),
    [customers]
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Name and email are required.', 'error');
      return;
    }

    setCreating(true);
    try {
      const tags = newTagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const result = await createCrmCustomer({
        fullName: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || null,
        whatsapp: newWhatsapp.trim() || newPhone.trim() || null,
        country: newCountry.trim() || 'International',
        hotel: newHotel.trim() || null,
        notes: newNotes.trim() || null,
        customerSource: newSource,
        tags,
      });

      showToast(result.message, result.isExisting ? 'info' : 'success');
      setIsCreateModalOpen(false);
      resetCreateForm();
      loadData();
      // Open profile modal
      setSelectedCustomerId(result.customer.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to create customer', 'error');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewWhatsapp('');
    setNewCountry('Germany');
    setNewHotel('');
    setNewNotes('');
    setNewSource('Website');
    setNewTagsStr('');
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCrmCustomer(customerToDelete.id);
      showToast(`Customer record for ${customerToDelete.fullName} removed.`, 'info');
      setCustomerToDelete(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record', 'error');
    }
  };

  const handleExportCsv = () => {
    if (customers.length === 0) return;
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'WhatsApp',
      'Country',
      'Hotel',
      'Total Bookings',
      'Completed Bookings',
      'Total Spent EUR',
      'Outstanding EUR',
      'Customer Source',
      'Created Date',
    ];

    const rows = filteredCustomers.map((c) => [
      `"${c.fullName.replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.whatsapp || ''}"`,
      `"${c.country || ''}"`,
      `"${c.hotel || ''}"`,
      c.totalBookings,
      c.completedBookings,
      c.totalRevenueEur.toFixed(2),
      c.outstandingAmountEur.toFixed(2),
      `"${c.customerSource}"`,
      `"${c.createdAt.split('T')[0]}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rse_crm_customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#2dd4bf]" />
            <span>Customers Management Module</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Unified traveler profiles, reservation histories, multi-channel messaging, and payment tracking.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Customer</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-xs text-stone-400 flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-[#2dd4bf]" />
            <span>Total Customers</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1.5">{customers.length}</div>
          <span className="text-[11px] text-stone-500">Travelers in CRM system</span>
        </div>

        <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-xs text-stone-400 flex items-center space-x-1">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>VIP / High-Value</span>
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1.5">
            {customers.filter((c) => c.tags?.includes('VIP') || c.totalRevenueEur >= 200).length}
          </div>
          <span className="text-[11px] text-stone-500">&gt; €200 spend or tagged VIP</span>
        </div>

        <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-xs text-stone-400 flex items-center space-x-1">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lifetime Revenue</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5">
            €{totalRevenue.toFixed(0)}
          </div>
          <span className="text-[11px] text-stone-500">Gross across all bookings</span>
        </div>

        <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-xs text-stone-400 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Outstanding Balance</span>
          </div>
          <div className={`text-2xl font-bold mt-1.5 ${totalOutstanding > 0 ? 'text-amber-400' : 'text-stone-400'}`}>
            €{totalOutstanding.toFixed(0)}
          </div>
          <span className="text-[11px] text-stone-500">Pay-at-pickup collections</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by traveler name, email, phone, WhatsApp, hotel, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-900 border border-stone-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tag Filter */}
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-2 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-2 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="Website">Website</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Google">Google</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="Hotel">Hotel</option>
            <option value="Referral">Referral</option>
            <option value="Walk-in">Walk-in</option>
          </select>

          {/* Outstanding Balance Toggle */}
          <button
            type="button"
            onClick={() => setBalanceFilter(!balanceFilter)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center space-x-1 ${
              balanceFilter
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-stone-900 text-stone-400 border-stone-700/80 hover:text-stone-200'
            }`}
          >
            <span>Balance Due</span>
          </button>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 text-center text-stone-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#2dd4bf] mb-2" />
            <p className="text-sm">Retrieving travelers database...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-20 text-center text-stone-500">
            <Users className="w-10 h-10 mx-auto text-stone-600 mb-2" />
            <p className="text-sm font-medium text-stone-400">No travelers found</p>
            <p className="text-xs text-stone-500 mt-1">Try modifying your search or tag filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-900/60 text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Traveler Name</th>
                  <th className="py-3 px-4">Contact (Email / Phone)</th>
                  <th className="py-3 px-4">Nationality & Hotel</th>
                  <th className="py-3 px-4 text-center">Bookings</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Latest Booking</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-stone-800/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCustomerId(cust.id)}
                  >
                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#0A6C74]/20 border border-[#0A6C74]/40 flex items-center justify-center text-[#2dd4bf] font-bold text-xs shrink-0">
                          {cust.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-[#2dd4bf] transition-colors">
                            {cust.fullName}
                          </div>
                          <div className="text-[10px] text-stone-500 flex items-center space-x-1.5 mt-0.5">
                            <span className="capitalize">{cust.customerSource}</span>
                            <span>•</span>
                            <span>{new Date(cust.createdAt).toLocaleDateString('en-GB')}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-0.5">
                        <a
                          href={`mailto:${cust.email}`}
                          className="text-[#2dd4bf] hover:underline block font-mono text-[11px]"
                        >
                          {cust.email}
                        </a>
                        <div className="flex items-center space-x-2 text-[11px]">
                          {cust.phone ? (
                            <span className="text-stone-300 font-mono">{cust.phone}</span>
                          ) : (
                            <span className="text-stone-600 italic">No phone</span>
                          )}
                          {cust.whatsapp && (
                            <a
                              href={`https://wa.me/${cust.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="text-emerald-400 hover:text-emerald-300"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Nationality & Hotel */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-stone-200">{cust.country || 'International'}</div>
                      <div className="text-[11px] text-stone-400 truncate max-w-[150px]">
                        {cust.hotel || 'Hotel to be confirmed'}
                      </div>
                    </td>

                    {/* Bookings */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-bold text-stone-100">{cust.totalBookings}</div>
                      <div className="text-[10px] text-stone-500">
                        {cust.completedBookings} completed
                        {cust.cancelledBookings > 0 ? `, ${cust.cancelledBookings} cxl` : ''}
                      </div>
                    </td>

                    {/* Total Revenue */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-emerald-400 font-mono">
                        €{cust.totalRevenueEur.toFixed(2)}
                      </div>
                    </td>

                    {/* Outstanding Balance */}
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className={`font-bold font-mono ${
                          cust.outstandingAmountEur > 0 ? 'text-amber-400' : 'text-stone-500'
                        }`}
                      >
                        €{cust.outstandingAmountEur.toFixed(2)}
                      </div>
                    </td>

                    {/* Latest Booking */}
                    <td className="py-3.5 px-4">
                      {cust.latestBookingDate ? (
                        <span className="text-stone-300">
                          {new Date(cust.latestBookingDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-stone-600 italic">No bookings</span>
                      )}
                    </td>

                    {/* Tags */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {cust.tags && cust.tags.length > 0 ? (
                          cust.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-stone-600 text-[10px] italic">No tags</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerId(cust.id)}
                          className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors"
                          title="Open Full Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerToDelete(cust)}
                          className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded transition-colors"
                          title="Delete customer record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Full Profile Modal */}
      {selectedCustomerId && (
        <CrmCustomerProfileModal
          customerEmailOrId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onUpdated={loadData}
          onViewBookingDetails={onViewBookingDetails}
        />
      )}

      {/* Create Customer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#2dd4bf]" />
                <span>Create New Customer Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Klaus Becker"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="klaus.becker@example.de"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+49 170 1234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="+49 170 1234567"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Country / Nationality</label>
                  <input
                    type="text"
                    placeholder="Germany"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Hurghada Hotel / Resort</label>
                  <input
                    type="text"
                    placeholder="e.g. Steigenberger ALDAU Beach Hotel"
                    value={newHotel}
                    onChange={(e) => setNewHotel(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Customer Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as CrmLeadSource)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Website">Website</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Google">Google</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Hotel">Hotel Concierge</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in Pier</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Initial Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="VIP, Diver, German Speaker"
                    value={newTagsStr}
                    onChange={(e) => setNewTagsStr(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Initial Staff Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Special requests or contact preferences..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-stone-950/70 border border-stone-800 rounded text-[11px] text-stone-400 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#2dd4bf] shrink-0" />
                <span>
                  <strong>Deduplication Safeguard:</strong> If this email or phone is already recorded, the system will merge details into the existing traveler record rather than generating duplicates.
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded font-medium flex items-center space-x-1"
                >
                  {creating ? <span>Processing...</span> : <span>Create / Link Customer</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Customer Removal</span>
            </h3>
            <p className="text-xs text-stone-300">
              Are you sure you want to delete the CRM record for <strong>{customerToDelete.fullName}</strong> ({customerToDelete.email})? Historical bookings will remain preserved in accounting.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
