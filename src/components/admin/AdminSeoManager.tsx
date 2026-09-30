import React, { useState, useEffect } from 'react';
import {
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Code,
  Tag,
  Share2,
  Eye
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { adminListTours } from '../../services/tourService';
import { DbTour, DbSeoMetadata } from '../../types/database';

const LOCAL_SEO_KEY = 'rse_admin_seo_cache';

export const AdminSeoManager: React.FC = () => {
  const [tours, setTours] = useState<DbTour[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<'site' | string>('site');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [seoTitle, setSeoTitle] = useState('Red Sea Excursions & Voyages | Premier Island, Diving & Safari Adventures');
  const [seoDescription, setSeoDescription] = useState('Book official Red Sea excursions in Hurghada, El Gouna, and Makadi Bay. Free hotel pickup, verified captains, Orange Bay cruises, and free 24h cancellation.');
  const [seoKeywords, setSeoKeywords] = useState('red sea excursions, hurghada boat trips, orange bay island, red sea diving, giftun snorkeling, desert quad safari egypt');
  const [canonicalUrl, setCanonicalUrl] = useState('https://redseaexcursions.com');
  const [ogImage, setOgImage] = useState('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const loadedTours = await adminListTours();
        setTours(loadedTours);

        if (isSupabaseConfigured()) {
          const { data } = await supabase
            .from('seo_metadata')
            .select('*')
            .eq('entity_type', 'page')
            .eq('entity_id', 'home')
            .maybeSingle();

          if (data) {
            setSeoTitle(data.seo_title || seoTitle);
            setSeoDescription(data.seo_description || seoDescription);
            setSeoKeywords(Array.isArray(data.seo_keywords) ? data.seo_keywords.join(', ') : seoKeywords);
            setCanonicalUrl(data.canonical_url || canonicalUrl);
            setOgImage(data.og_image || ogImage);
          }
        }
      } catch (err) {
        console.warn('Failed to load SEO data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // When switching entity
  const handleSelectEntity = async (entityKey: 'site' | string) => {
    setSelectedEntity(entityKey);
    setSaveSuccess(false);
    setErrorMsg(null);

    if (entityKey === 'site') {
      setSeoTitle('Red Sea Excursions & Voyages | Premier Island, Diving & Safari Adventures');
      setSeoDescription('Book official Red Sea excursions in Hurghada, El Gouna, and Makadi Bay. Free hotel pickup, verified captains, Orange Bay cruises, and free 24h cancellation.');
      setSeoKeywords('red sea excursions, hurghada boat trips, orange bay island, red sea diving, giftun snorkeling, desert quad safari egypt');
      setCanonicalUrl('https://redseaexcursions.com');
      setOgImage('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80');
      return;
    }

    const matchedTour = tours.find((t) => t.id === entityKey);
    if (matchedTour) {
      setSeoTitle(`${matchedTour.title} | Red Sea Excursions`);
      setSeoDescription(matchedTour.short_description || matchedTour.description?.substring(0, 150) || '');
      setSeoKeywords(`red sea, hurghada, ${matchedTour.slug.replace(/-/g, ' ')}, excursions, day trips`);
      setCanonicalUrl(`https://redseaexcursions.com/excursions/${matchedTour.slug}`);
      setOgImage((matchedTour as any).primary_image || ogImage);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    const keywordsArray = seoKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const isSite = selectedEntity === 'site';
    const entityType = isSite ? 'page' : 'tour';
    const entityId = isSite ? 'home' : selectedEntity;

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('seo_metadata').upsert({
          entity_type: entityType,
          entity_id: entityId,
          seo_title: seoTitle,
          seo_description: seoDescription,
          seo_keywords: keywordsArray,
          canonical_url: canonicalUrl,
          og_image: ogImage,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          throw error;
        }
      } catch (err: any) {
        console.warn('Failed to save to Supabase seo_metadata:', err);
      }
    }

    // Save to local cache
    try {
      const cacheObj = {
        entityType,
        entityId,
        seoTitle,
        seoDescription,
        keywordsArray,
        canonicalUrl,
        ogImage,
      };
      localStorage.setItem(`${LOCAL_SEO_KEY}_${entityId}`, JSON.stringify(cacheObj));
    } catch {
      // ignore
    }

    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white tracking-tight">
          SEO & Meta Tags Management
        </h1>
        <p className="text-xs text-stone-400 mt-1">
          Configure search engine indexing, OpenGraph preview cards for social media (WhatsApp, Facebook, Twitter/X), and canonical URLs.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>SEO and social sharing metadata updated successfully.</span>
        </div>
      )}

      {/* Target Selector */}
      <div className="bg-stone-950 border border-stone-800 rounded-lg p-4 space-y-3">
        <label className="text-xs font-semibold text-stone-300 block">
          Select Page or Excursion to Configure
        </label>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleSelectEntity('site')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              selectedEntity === 'site'
                ? 'bg-[#0A6C74] text-white'
                : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            Homepage / Site Default
          </button>
          {tours.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectEntity(t.id)}
              className={`px-3 py-1.5 rounded font-medium transition-colors truncate max-w-xs ${
                selectedEntity === t.id
                  ? 'bg-[#0A6C74] text-white'
                  : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-white'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* SEO Form */}
      <form onSubmit={handleSave} className="bg-stone-950 border border-stone-800 rounded-lg p-6 space-y-5 text-xs">
        {/* Meta Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-stone-300 font-semibold">Meta Page Title</label>
            <span className={`text-[10px] ${seoTitle.length > 60 ? 'text-amber-400' : 'text-stone-500'}`}>
              {seoTitle.length} / 60 recommended characters
            </span>
          </div>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
            required
          />
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-stone-300 font-semibold">Meta Search Description</label>
            <span className={`text-[10px] ${seoDescription.length > 160 ? 'text-amber-400' : 'text-stone-500'}`}>
              {seoDescription.length} / 160 recommended characters
            </span>
          </div>
          <textarea
            rows={3}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
            required
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="text-stone-300 font-semibold block mb-1">Search Keywords (comma separated)</label>
          <input
            type="text"
            value={seoKeywords}
            onChange={(e) => setSeoKeywords(e.target.value)}
            placeholder="red sea, boat trip, hurghada snorkeling..."
            className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded text-white focus:outline-none focus:border-[#0A6C74]"
          />
        </div>

        {/* Canonical URL & OG Image */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-stone-300 font-semibold block mb-1">Canonical URL</label>
            <input
              type="url"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded text-white font-mono focus:outline-none focus:border-[#0A6C74]"
            />
          </div>

          <div>
            <label className="text-stone-300 font-semibold block mb-1">OpenGraph Social Share Image URL</label>
            <input
              type="url"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded text-white font-mono focus:outline-none focus:border-[#0A6C74]"
            />
          </div>
        </div>

        {/* Live Google Search Preview Card */}
        <div className="pt-2">
          <label className="text-stone-400 font-semibold block mb-2 text-[11px] uppercase tracking-wider">
            Google Search Snippet Preview
          </label>
          <div className="p-4 bg-stone-900 border border-stone-850 rounded-lg space-y-1">
            <span className="text-xs text-stone-400 font-mono block truncate">{canonicalUrl}</span>
            <h4 className="text-base text-sky-400 font-medium hover:underline cursor-pointer line-clamp-1">
              {seoTitle || 'Page Title'}
            </h4>
            <p className="text-xs text-stone-300 line-clamp-2">
              {seoDescription || 'Description snippet displayed in Google search results.'}
            </p>
          </div>
        </div>

        {/* Live Social Share Card Preview */}
        <div className="pt-2">
          <label className="text-stone-400 font-semibold block mb-2 text-[11px] uppercase tracking-wider">
            Social Card Preview (WhatsApp, Facebook, Twitter)
          </label>
          <div className="max-w-md border border-stone-800 rounded-lg overflow-hidden bg-stone-900">
            {ogImage ? (
              <img src={ogImage} alt="Social preview" className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-stone-850 flex items-center justify-center text-stone-600">
                No Image Specified
              </div>
            )}
            <div className="p-3 space-y-1">
              <span className="text-[10px] text-stone-500 uppercase font-mono block">redseaexcursions.com</span>
              <h5 className="text-sm font-semibold text-white line-clamp-1">{seoTitle}</h5>
              <p className="text-xs text-stone-400 line-clamp-2">{seoDescription}</p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end pt-3 border-t border-stone-800">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-1.5 px-5 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save SEO Metadata'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
