import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { getTourExtras } from '../../services/tourService';
import { DbTourExtra } from '../../types/database';
import { supabase, isSupabaseConfigured, formatSupabaseError } from '../../services/supabaseClient';
import { useToast } from '../../contexts/ToastContext';

export const AdminExtrasList: React.FC = () => {
  const { showToast } = useToast();
  const [extras, setExtras] = useState<DbTourExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExtra, setEditingExtra] = useState<Partial<DbTourExtra> | null>(null);
  const [extraToDelete, setExtraToDelete] = useState<DbTourExtra | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTourExtras();
      setExtras(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      return;
    }

    try {
      const { error } = await supabase.from('tour_extras').delete().eq('id', extraToDelete.id);
      if (error) throw error;
      showToast(`Tour extra "${extraToDelete.name}" deleted successfully.`, 'success');
      await loadData();
      setExtraToDelete(null);
    } catch (err: any) {
      showToast(formatSupabaseError(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">
            Optional Tour Extras & Upgrades
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Configure photography packages, private transport, seafood lunches, and dive experiences.
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
          className="flex items-center space-x-1.5 px-3 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Tour Extra</span>
        </button>
      </div>

      <div className="bg-stone-950 border border-stone-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-900/80 text-stone-400 border-b border-stone-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Extra Item</th>
              <th className="py-3 px-4 font-semibold">Description</th>
              <th className="py-3 px-4 font-semibold">Price</th>
              <th className="py-3 px-4 font-semibold">Pricing Model</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 text-stone-300">
            {extras.map((extra) => (
              <tr key={extra.id} className="hover:bg-stone-900/40 transition-colors">
                <td className="py-3 px-4 font-semibold text-white">
                  {extra.name}
                </td>
                <td className="py-3 px-4 text-stone-400 max-w-sm">
                  {extra.description}
                </td>
                <td className="py-3 px-4 whitespace-nowrap font-bold text-white">
                  €{extra.price_eur}
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-stone-300 capitalize">
                  {extra.pricing_type.replace('_', ' ')}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                  <button
                    type="button"
                    onClick={() => setEditingExtra(extra)}
                    className="p-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit extra"
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
              </tr>
            ))}
          </tbody>
        </table>
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
