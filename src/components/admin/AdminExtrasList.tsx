import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Compass, 
  AlertTriangle, 
  RotateCcw,
  Tag,
  DollarSign,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { DbTourExtra, DbTour } from '../../types/database';
import { 
  getTourExtras, 
  getTourCustomExtraPrices, 
  saveTourCustomExtraPrices, 
  adminListTours, 
  notifyCatalogueDataChanged,
  formatSupabaseError 
} from '../../services/tourService';
import { useToast } from '../../contexts/ToastContext';
import { AdminTab } from './AdminLayout';

interface AdminExtrasListProps {
  onNavigateTab?: (tab: AdminTab, param?: string) => void;
}

export const AdminExtrasList: React.FC<AdminExtrasListProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const [extras, setExtras] = useState<DbTourExtra[]>([]);
  const [tours, setTours] = useState<DbTour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string>('all');
  const [tourCustomPrices, setTourCustomPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingExtra, setEditingExtra] = useState<Partial<DbTourExtra> | null>(null);
  const [assignedTourIds, setAssignedTourIds] = useState<string[]>([]);
  const [extraToDelete, setExtraToDelete] = useState<DbTourExtra | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [extrasData, toursData] = await Promise.all([
        getTourExtras(),
        adminListTours(),
      ]);
      setExtras(extrasData);
      setTours(toursData);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load tour extras from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When a specific tour is selected, load its custom extra prices
  useEffect(() => {
    if (selectedTourId && selectedTourId !== 'all') {
      const custom = getTourCustomExtraPrices(selectedTourId);
      setTourCustomPrices(custom || {});
    } else {
      setTourCustomPrices({});
    }
  }, [selectedTourId]);

  const handleOpenEdit = async (extra: Partial<DbTourExtra> | null) => {
    if (!extra) {
      setEditingExtra(null);
      setAssignedTourIds([]);
      return;
    }

    setEditingExtra(extra);

    if (extra.id && isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('tour_assigned_extras')
          .select('tour_id')
          .eq('extra_id', extra.id);
        if (data) {
          setAssignedTourIds(data.map((r: any) => r.tour_id));
        } else {
          setAssignedTourIds([]);
        }
      } catch {
        setAssignedTourIds([]);
      }
    } else {
      // For a new extra, default to assigning to all safari tours if name includes quad/safari, else all tours
      setAssignedTourIds([]);
    }
  };

  const handleUpdateTourPrice = (extraId: string, newPrice: number) => {
    if (selectedTourId === 'all') return;
    const updated = {
      ...tourCustomPrices,
      [extraId]: newPrice,
    };
    setTourCustomPrices(updated);
    saveTourCustomExtraPrices(selectedTourId, updated);
    notifyCatalogueDataChanged('extras');
    showToast(`Price updated for this tour: €${newPrice}`, 'success');
  };

  const handleResetTourPrice = (extraId: string) => {
    if (selectedTourId === 'all') return;
    const updated = { ...tourCustomPrices };
    delete updated[extraId];
    setTourCustomPrices(updated);
    saveTourCustomExtraPrices(selectedTourId, updated);
    notifyCatalogueDataChanged('extras');
    showToast('Reset to default catalogue price.', 'info');
  };

  const handleSave = async () => {
    if (!editingExtra || !editingExtra.name) return;
    setSaving(true);

    const priceEur = Number(editingExtra.price_eur) || 15;
    const pricingType = editingExtra.pricing_type || 'per_booking';
    const currency = editingExtra.currency || 'EUR';
    const minQty = Math.max(1, Number(editingExtra.min_quantity) || 1);
    const maxQty = Math.max(minQty, Number(editingExtra.max_quantity) || 10);
    const isActive = editingExtra.is_active ?? true;

    if (!isSupabaseConfigured()) {
      let savedId = editingExtra.id;
      if (editingExtra.id) {
        setExtras(extras.map((e) => (e.id === editingExtra.id ? ({ ...e, ...editingExtra, price_eur: priceEur, pricing_type: pricingType } as DbTourExtra) : e)));
      } else {
        savedId = `extra-${Date.now()}`;
        const newE: DbTourExtra = {
          id: savedId,
          name: editingExtra.name,
          description: editingExtra.description || '',
          price_eur: priceEur,
          currency,
          pricing_type: pricingType,
          is_active: isActive,
          sort_order: extras.length + 1,
          image_url: editingExtra.image_url || undefined,
          min_quantity: minQty,
          max_quantity: maxQty,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setExtras([...extras, newE]);
      }
      setSaving(false);
      setEditingExtra(null);
      notifyCatalogueDataChanged('extras');
      showToast('Tour extra saved successfully (in-memory state)', 'success');
      return;
    }

    try {
      let savedExtraId = editingExtra.id;

      if (editingExtra.id && !editingExtra.id.startsWith('extra-')) {
        await supabase
          .from('tour_extras')
          .update({
            name: editingExtra.name,
            description: editingExtra.description,
            price_eur: priceEur,
            pricing_type: pricingType,
            currency,
            is_active: isActive,
            image_url: editingExtra.image_url || null,
            min_quantity: minQty,
            max_quantity: maxQty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingExtra.id);
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('tour_extras')
          .insert({
            name: editingExtra.name,
            description: editingExtra.description,
            price_eur: priceEur,
            pricing_type: pricingType,
            currency,
            is_active: isActive,
            image_url: editingExtra.image_url || null,
            min_quantity: minQty,
            max_quantity: maxQty,
            sort_order: extras.length + 1,
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;
        savedExtraId = inserted?.id;
      }

      // Sync tour assignments in tour_assigned_extras
      if (savedExtraId) {
        await supabase.from('tour_assigned_extras').delete().eq('extra_id', savedExtraId);
        if (assignedTourIds.length > 0) {
          const links = assignedTourIds.map((tid) => ({
            tour_id: tid,
            extra_id: savedExtraId!,
          }));
          await supabase.from('tour_assigned_extras').insert(links);
        }
      }

      await loadData();
      showToast('Tour extra and excursion assignments saved successfully', 'success');
      setEditingExtra(null);
      notifyCatalogueDataChanged('extras');
    } catch (err: any) {
      showToast(formatSupabaseError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteExtra = async () => {
    if (!extraToDelete) return;
    setIsDeleting(true);

    if (!isSupabaseConfigured()) {
      setExtras(extras.filter((e) => e.id !== extraToDelete.id));
      showToast(`Tour extra "${extraToDelete.name}" removed from local state.`, 'info');
      setExtraToDelete(null);
      setIsDeleting(false);
      notifyCatalogueDataChanged('extras');
      return;
    }

    try {
      await supabase.from('tour_assigned_extras').delete().eq('extra_id', extraToDelete.id);
      const { error } = await supabase.from('tour_extras').delete().eq('id', extraToDelete.id);
      if (error) throw error;
      showToast(`Tour extra "${extraToDelete.name}" deleted successfully.`, 'success');
      await loadData();
      setExtraToDelete(null);
      notifyCatalogueDataChanged('extras');
    } catch (err: any) {
      showToast(formatSupabaseError(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const extraOverrideCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    tours.forEach((tour) => {
      const customPrices = getTourCustomExtraPrices(tour.id);
      Object.keys(customPrices).forEach((extraId) => {
        counts[extraId] = (counts[extraId] || 0) + 1;
      });
    });
    return counts;
  }, [tours]);

  const filteredExtras = extras.filter((extra) => {
    const q = searchQuery.toLowerCase();
    return extra.name.toLowerCase().includes(q) || (extra.description || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Excursion Selector */}
      <div className="bg-stone-900 border border-stone-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-[#0A6C74]" />
            Dynamic Tour Extras & Add-on Management
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Manage optional excursion add-ons, pricing models (per person, per vehicle, per item, or per booking), and excursion assignments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => handleOpenEdit({
              name: '',
              description: '',
              price_eur: 20,
              pricing_type: 'per_person',
              currency: 'EUR',
              min_quantity: 1,
              max_quantity: 10,
              is_active: true,
            })}
            className="px-3.5 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Add-on</span>
          </button>
        </div>
      </div>

      {/* Excursion Pricing Filter Context */}
      <div className="bg-stone-900/60 border border-stone-800/80 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-[#0A6C74]" />
          <span className="font-semibold text-stone-200">Excursion Price Customization Mode:</span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedTourId}
            onChange={(e) => setSelectedTourId(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 bg-stone-950 border border-stone-700 rounded text-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#0A6C74]"
          >
            <option value="all">Global Catalogue Defaults (All Excursions)</option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {selectedTourId === 'all'
                ? `Global Catalogue Add-ons (${filteredExtras.length})`
                : `Customizing Excursion: ${tours.find((t) => t.id === selectedTourId)?.title || selectedTourId}`}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search add-on title or description..."
              className="pl-8 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#0A6C74] w-full sm:w-60"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading tour extras...</div>
        ) : filteredExtras.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            {searchQuery ? 'No extras match your search query.' : 'No tour extras available.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/60 text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-800">
                <tr>
                  <th className="p-3.5">Add-on Name & Description</th>
                  <th className="p-3.5">Pricing Method</th>
                  <th className="p-3.5">Default Price</th>
                  {selectedTourId !== 'all' ? (
                    <>
                      <th className="p-3.5">Custom Price For Tour</th>
                      <th className="p-3.5 text-right">Action</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3.5">Tour Overrides</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredExtras.map((extra) => {
                  const customPrice = tourCustomPrices[extra.id];
                  const hasCustom = customPrice !== undefined && customPrice !== null && !isNaN(customPrice);
                  const effectivePrice = hasCustom ? customPrice : extra.price_eur;
                  const overrideCount = extraOverrideCounts[extra.id] || 0;

                  return (
                    <tr key={extra.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">{extra.name}</span>
                          {!extra.is_active && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800 text-red-300">
                              Inactive
                            </span>
                          )}
                        </div>
                        <span className="text-stone-400 text-[11px] line-clamp-1 block mt-0.5">
                          {extra.description || '—'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-stone-800 text-stone-300">
                          {extra.pricing_type === 'per_person' ? 'Per Guest' :
                           extra.pricing_type === 'per_vehicle' ? 'Per Vehicle' :
                           extra.pricing_type === 'per_item' ? 'Per Item' : 'Flat Per Booking'}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-semibold text-stone-300">
                        €{extra.price_eur}
                      </td>

                      {selectedTourId === 'all' ? (
                        <>
                          <td className="p-3.5">
                            {overrideCount > 0 ? (
                              <span className="text-[11px] text-amber-400 font-medium">
                                {overrideCount} excursion(s) customized
                              </span>
                            ) : (
                              <span className="text-stone-500 text-[11px]">Using default</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(extra)}
                              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs transition-colors"
                              title="Edit extra catalogue defaults and tour assignments"
                            >
                              <Edit className="w-3.5 h-3.5 inline mr-1" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setExtraToDelete(extra)}
                              className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/60 rounded text-xs transition-colors"
                              title="Delete extra"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-stone-400 text-xs">€</span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={effectivePrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val >= 0) {
                                    handleUpdateTourPrice(extra.id, val);
                                  }
                                }}
                                className={`w-20 px-2 py-1 rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#0A6C74] ${
                                  hasCustom
                                    ? 'bg-[#0A6C74]/20 border border-[#0A6C74] text-white'
                                    : 'bg-stone-950 border border-stone-800 text-stone-300'
                                }`}
                              />
                              {hasCustom && (
                                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                                  Custom
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            {hasCustom && (
                              <button
                                type="button"
                                onClick={() => handleResetTourPrice(extra.id)}
                                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs transition-colors flex items-center space-x-1 ml-auto"
                                title="Reset to standard catalogue price"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset Default</span>
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Tour Extra Modal */}
      {editingExtra && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl text-xs my-8">
            <h3 className="text-base font-bold text-white">
              {editingExtra.id ? 'Edit Add-on & Excursion Assignments' : 'Create Dynamic Tour Add-on'}
            </h3>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">Add-on Title</label>
                <input
                  type="text"
                  value={editingExtra.name || ''}
                  onChange={(e) => setEditingExtra({ ...editingExtra, name: e.target.value })}
                  placeholder="e.g. Single Quad, Buggy, VIP Van Transfer"
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={editingExtra.description || ''}
                  onChange={(e) => setEditingExtra({ ...editingExtra, description: e.target.value })}
                  placeholder="Details, gear included, specifications..."
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">Image URL (Optional)</label>
                <input
                  type="text"
                  value={editingExtra.image_url || ''}
                  onChange={(e) => setEditingExtra({ ...editingExtra, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">Price Amount</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingExtra.price_eur ?? 20}
                    onChange={(e) => setEditingExtra({ ...editingExtra, price_eur: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">Pricing Method</label>
                  <select
                    value={editingExtra.pricing_type || 'per_person'}
                    onChange={(e) => setEditingExtra({ ...editingExtra, pricing_type: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  >
                    <option value="per_person">Per Guest / Person</option>
                    <option value="per_vehicle">Per Vehicle (Quad, Buggy, Van)</option>
                    <option value="per_item">Per Item (Snorkel gear, towel)</option>
                    <option value="per_booking">Per Booking (Flat order fee)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">Min Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editingExtra.min_quantity ?? 1}
                    onChange={(e) => setEditingExtra({ ...editingExtra, min_quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">Max Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editingExtra.max_quantity ?? 10}
                    onChange={(e) => setEditingExtra({ ...editingExtra, max_quantity: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                </div>
              </div>

              {/* Excursion Assignments Multi-Select */}
              <div className="pt-2 border-t border-stone-800">
                <label className="text-stone-300 block mb-1.5 font-semibold">
                  Assign to Excursions ({assignedTourIds.length} selected)
                </label>
                <p className="text-[11px] text-stone-500 mb-2">
                  Only excursions checked below will display this add-on to customers during booking.
                </p>

                <div className="max-h-36 overflow-y-auto space-y-1.5 bg-stone-950 p-2.5 rounded border border-stone-800">
                  {tours.map((tour) => {
                    const isChecked = assignedTourIds.includes(tour.id);
                    return (
                      <label
                        key={tour.id}
                        className="flex items-center space-x-2 text-stone-300 hover:text-white cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedTourIds([...assignedTourIds, tour.id]);
                            } else {
                              setAssignedTourIds(assignedTourIds.filter((id) => id !== tour.id));
                            }
                          }}
                          className="rounded border-stone-700 bg-stone-900 text-[#0A6C74] focus:ring-0"
                        />
                        <span className="text-xs truncate">{tour.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="extra-active-toggle"
                  checked={editingExtra.is_active ?? true}
                  onChange={(e) => setEditingExtra({ ...editingExtra, is_active: e.target.checked })}
                  className="rounded border-stone-700 bg-stone-900 text-[#0A6C74] focus:ring-0"
                />
                <label htmlFor="extra-active-toggle" className="text-stone-300 text-xs font-semibold cursor-pointer">
                  Active in Catalogue
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setEditingExtra(null)}
                className="px-3.5 py-1.5 bg-stone-800 text-stone-300 hover:bg-stone-700 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Add-on'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tour Extra Confirmation Modal */}
      {extraToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center space-x-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Tour Extra</h3>
            </div>
            <p className="text-stone-300 leading-relaxed">
              Are you sure you want to delete optional extra <strong className="text-white">"{extraToDelete.name}"</strong> (€{extraToDelete.price_eur})?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setExtraToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteExtra}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
