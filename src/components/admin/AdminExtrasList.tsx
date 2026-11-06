import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit2, Trash2, AlertTriangle, Layers, ArrowRight, RotateCcw } from 'lucide-react';
import {
  getTourExtras,
  adminListTours,
  getTourCustomExtraPrices,
  saveTourCustomExtraPrices,
  notifyCatalogueDataChanged
} from '../../services/tourService';
import { DbTourExtra, DbTour } from '../../types/database';
import { supabase, isSupabaseConfigured, formatSupabaseError } from '../../services/supabaseClient';
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
  const [extraToDelete, setExtraToDelete] = useState<DbTourExtra | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

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

    if (!isSupabaseConfigured()) {
      if (editingExtra.id) {
        setExtras(extras.map((e) => (e.id === editingExtra.id ? ({ ...e, ...editingExtra } as DbTourExtra) : e)));
      } else {
        const newE: DbTourExtra = {
          id: `extra-${Date.now()}`,
          name: editingExtra.name,
          description: editingExtra.description || '',
          price_eur: Number(editingExtra.price_eur) || 15,
          currency: 'EUR',
          pricing_type: editingExtra.pricing_type || 'per_booking',
          is_active: true,
          sort_order: extras.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setExtras([...extras, newE]);
      }
      setSaving(false);
      setEditingExtra(null);
      notifyCatalogueDataChanged('extras');
      return;
    }

    try {
      if (editingExtra.id && !editingExtra.id.startsWith('extra-')) {
        await supabase
          .from('tour_extras')
          .update({
            name: editingExtra.name,
            description: editingExtra.description,
            price_eur: editingExtra.price_eur,
            pricing_type: editingExtra.pricing_type,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingExtra.id);
      } else {
        await supabase.from('tour_extras').insert({
          name: editingExtra.name,
          description: editingExtra.description,
          price_eur: editingExtra.price_eur || 15,
          pricing_type: editingExtra.pricing_type || 'per_booking',
          currency: 'EUR',
          is_active: true,
          sort_order: extras.length + 1,
        });
      }
      await loadData();
      showToast('Tour extra saved successfully', 'success');
      setEditingExtra(null);
      notifyCatalogueDataChanged('extras');
    } catch (err) {
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

  const [searchQuery, setSearchQuery] = useState('');

  // Calculate tour override counts for each extra across all loaded tours
  const extraOverrideCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (!tours || tours.length === 0) return counts;
    
    tours.forEach((t) => {
      const customPrices = getTourCustomExtraPrices(t.id);
      Object.keys(customPrices).forEach((extraId) => {
        counts[extraId] = (counts[extraId] || 0) + 1;
      });
    });
    return counts;
  }, [tours, tourCustomPrices]);

  const filteredExtras = extras.filter((extra) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return extra.name.toLowerCase().includes(q) || (extra.description || '').toLowerCase().includes(q);
  });

  const selectedTour = tours.find((t) => t.id === selectedTourId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-[#2DD4BF]" />
            <span>Optional Tour Extras & Custom Pricing</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Manage global catalogue extras or customize individual excursion prices per trip/tour.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setEditingExtra({
              name: '',
              description: '',
              price_eur: 20,
              pricing_type: 'per_booking',
            })
          }
          className="flex items-center space-x-1.5 px-3 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Extra</span>
        </button>
      </div>

      {/* Scope Selector Bar & Filter */}
      <div className="bg-stone-900 border border-stone-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="p-2 bg-stone-800 rounded-md text-[#2DD4BF] shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex-1 max-w-md">
              <label htmlFor="tour-pricing-scope" className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
                Editing Prices For:
              </label>
              <select
                id="tour-pricing-scope"
                value={selectedTourId}
                onChange={(e) => setSelectedTourId(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-white rounded px-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-[#0A6C74] focus:border-[#0A6C74] outline-none"
              >
                <option value="all">🌐 Global Catalogue (Default Prices)</option>
                <optgroup label="Select Tour to Customize Prices">
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} (€{t.price})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-64">
            <label htmlFor="search-extras" className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Search Extras
            </label>
            <input
              id="search-extras"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full bg-stone-950 border border-stone-700 text-white rounded px-3 py-1.5 text-xs placeholder-stone-500 focus:ring-1 focus:ring-[#0A6C74] focus:border-[#0A6C74] outline-none"
            />
          </div>
        </div>

        {/* Selected Tour Context Banner */}
        {selectedTourId !== 'all' && selectedTour && (
          <div className="mt-2 pt-3 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-stone-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Configuring custom prices specifically for{' '}
                <strong className="text-white">{selectedTour.title}</strong>
              </span>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('tours', selectedTour.id)}
                className="flex items-center space-x-1 text-[#2DD4BF] hover:text-[#5EEAD4] font-medium underline underline-offset-2 cursor-pointer self-start sm:self-auto"
              >
                <span>Open in Tour Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Extras Table */}
      <div className="bg-stone-950 border border-stone-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading tour extras...</div>
        ) : filteredExtras.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            {searchQuery ? 'No extras match your search query.' : 'No tour extras available.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/80 text-stone-400 border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Extra Item</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Pricing Model</th>
                  {selectedTourId === 'all' ? (
                    <>
                      <th className="py-3 px-4 font-semibold">Catalogue Price</th>
                      <th className="py-3 px-4 font-semibold">Tour Customization</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4 font-semibold">Catalogue Default</th>
                      <th className="py-3 px-4 font-semibold">
                        Price for {selectedTour ? selectedTour.title.slice(0, 20) + '...' : 'Tour'} (€)
                      </th>
                      <th className="py-3 px-4 font-semibold text-right">Reset / Overrides</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {filteredExtras.map((extra) => {
                  const customPrice = tourCustomPrices[extra.id];
                  const hasCustom = customPrice !== undefined && customPrice !== null;
                  const effectivePrice = hasCustom ? customPrice : extra.price_eur;
                  const overrideCount = extraOverrideCounts[extra.id] || 0;

                  return (
                    <tr key={extra.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center space-x-2">
                          <span>{extra.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-400 max-w-xs truncate">
                        {extra.description || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-stone-300 capitalize">
                        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px]">
                          {extra.pricing_type === 'per_person' ? 'Per Guest' : 'Flat Per Booking'}
                        </span>
                      </td>

                      {/* MODE: Global Catalogue */}
                      {selectedTourId === 'all' ? (
                        <>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-white text-sm">
                            €{extra.price_eur}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {overrideCount > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Customized on {overrideCount} {overrideCount === 1 ? 'tour' : 'tours'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-stone-400 bg-stone-900 border border-stone-800">
                                Default across all tours
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                            <button
                              type="button"
                              onClick={() => setEditingExtra(extra)}
                              className="p-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
                              title="Edit extra catalogue defaults"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExtraToDelete(extra)}
                              className="p-1.5 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete extra"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </>
                      ) : (
                        /* MODE: Tour-Specific Custom Pricing */
                        <>
                          <td className="py-3 px-4 whitespace-nowrap text-stone-400 font-medium">
                            €{extra.price_eur}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-semibold">
                                  €
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={effectivePrice}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val >= 0) {
                                      handleUpdateTourPrice(extra.id, val);
                                    }
                                  }}
                                  className={`w-24 pl-6 pr-2 py-1 bg-stone-900 border rounded text-xs font-bold text-white transition-colors outline-none focus:ring-1 focus:ring-[#0A6C74] ${
                                    hasCustom
                                      ? 'border-emerald-500/60 ring-1 ring-emerald-500/30'
                                      : 'border-stone-700'
                                  }`}
                                />
                              </div>
                              {hasCustom ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Custom Price
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded text-stone-400 bg-stone-900 border border-stone-800">
                                  Using Default
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {hasCustom && (
                              <button
                                type="button"
                                onClick={() => handleResetTourPrice(extra.id)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
                                title="Reset to standard catalogue price"
                              >
                                <RotateCcw className="w-3 h-3 text-stone-400" />
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

      {editingExtra && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-base font-bold text-white">
              {editingExtra.id ? 'Edit Extra' : 'Create Tour Extra'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">Extra Title</label>
                <input
                  type="text"
                  value={editingExtra.name || ''}
                  onChange={(e) => setEditingExtra({ ...editingExtra, name: e.target.value })}
                  placeholder="e.g. VIP Private Mercedes Van Transfer"
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={editingExtra.description || ''}
                  onChange={(e) => setEditingExtra({ ...editingExtra, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">Price (€)</label>
                  <input
                    type="number"
                    value={editingExtra.price_eur ?? 20}
                    onChange={(e) => setEditingExtra({ ...editingExtra, price_eur: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  />
                </div>

                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">Pricing Type</label>
                  <select
                    value={editingExtra.pricing_type || 'per_booking'}
                    onChange={(e) => setEditingExtra({ ...editingExtra, pricing_type: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded text-white"
                  >
                    <option value="per_booking">Per Booking (Flat)</option>
                    <option value="per_person">Per Guest / Person</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingExtra(null)}
                className="px-3 py-1.5 bg-stone-800 text-stone-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Extra'}
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
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold disabled:opacity-50 cursor-pointer"
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
