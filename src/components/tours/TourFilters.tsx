import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  MapPin,
  Clock,
  Compass,
  Star
} from 'lucide-react';
import { CurrencyConfig } from '../../types';

export interface FilterState {
  destinations: string[];
  activities: string[];
  durations: string[];
  tourTypes: string[];
  maxPrice: number;
  minRating: number;
  pickupOnly: boolean;
  languages: string[];
}

export const INITIAL_FILTERS: FilterState = {
  destinations: [],
  activities: [],
  durations: [],
  tourTypes: [],
  maxPrice: 300,
  minRating: 0,
  pickupOnly: false,
  languages: [],
};

interface TourFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClear: () => void;
  currency: CurrencyConfig;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalFilteredCount: number;
}

export const TourFilters: React.FC<TourFiltersProps> = ({
  filters,
  onChange,
  onClear,
  currency,
  isOpenMobile,
  onCloseMobile,
  totalFilteredCount,
}) => {
  const destinationsList = [
    'Hurghada',
    'El Gouna',
    'Makadi Bay',
    'Sahl Hasheesh',
    'Safaga',
    'Marsa Alam'
  ];

  const activitiesList = [
    'Snorkeling',
    'Diving',
    'Boat Trip',
    'Island',
    'Safari',
    'Quad',
    'Water Sports',
    'Private Tour'
  ];

  const durationsList = ['Half Day', 'Full Day', 'Multi Day'];
  const tourTypesList = ['Shared', 'Private'];
  const languagesList = ['English', 'German', 'French', 'Italian', 'Russian'];

  const handleToggle = (key: keyof FilterState, value: string) => {
    const list = filters[key] as string[];
    const next = list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];
    onChange({ ...filters, [key]: next });
  };

  const hasActiveFilters = 
    filters.destinations.length > 0 ||
    filters.activities.length > 0 ||
    filters.durations.length > 0 ||
    filters.tourTypes.length > 0 ||
    filters.maxPrice < 300 ||
    filters.minRating > 0 ||
    filters.pickupOnly ||
    filters.languages.length > 0;

  const content = (
    <div className="space-y-6 text-xs text-stone-700">
      
      {/* Active filters / Clear */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <span className="font-bold uppercase tracking-wider text-[11px] text-stone-900 flex items-center">
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-[#0A6C74]" />
          Filter Excursions
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-semibold text-[#0A6C74] hover:text-[#08565C] flex items-center"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Clear all
          </button>
        )}
      </div>

      {/* Destination filter */}
      <div>
        <label className="block font-bold text-stone-900 text-xs mb-2">
          Destination
        </label>
        <div className="space-y-1.5">
          {destinationsList.map((dest) => {
            const checked = filters.destinations.includes(dest);
            return (
              <label 
                key={dest} 
                className="flex items-center space-x-2 text-xs cursor-pointer hover:text-stone-900 select-none py-0.5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle('destinations', dest)}
                  className="rounded border-stone-300 text-[#0A6C74] focus:ring-[#0A6C74] w-3.5 h-3.5"
                />
                <span className={checked ? 'font-semibold text-[#0E1B2A]' : 'text-stone-600'}>
                  {dest}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Activity filter */}
      <div className="pt-4 border-t border-stone-200">
        <label className="block font-bold text-stone-900 text-xs mb-2">
          Activity / Experience
        </label>
        <div className="space-y-1.5">
          {activitiesList.map((act) => {
            const checked = filters.activities.includes(act);
            return (
              <label 
                key={act} 
                className="flex items-center space-x-2 text-xs cursor-pointer hover:text-stone-900 select-none py-0.5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle('activities', act)}
                  className="rounded border-stone-300 text-[#0A6C74] focus:ring-[#0A6C74] w-3.5 h-3.5"
                />
                <span className={checked ? 'font-semibold text-[#0E1B2A]' : 'text-stone-600'}>
                  {act}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Duration filter */}
      <div className="pt-4 border-t border-stone-200">
        <label className="block font-bold text-stone-900 text-xs mb-2">
          Duration
        </label>
        <div className="space-y-1.5">
          {durationsList.map((dur) => {
            const checked = filters.durations.includes(dur);
            return (
              <label 
                key={dur} 
                className="flex items-center space-x-2 text-xs cursor-pointer hover:text-stone-900 select-none py-0.5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle('durations', dur)}
                  className="rounded border-stone-300 text-[#0A6C74] focus:ring-[#0A6C74] w-3.5 h-3.5"
                />
                <span className={checked ? 'font-semibold text-[#0E1B2A]' : 'text-stone-600'}>
                  {dur}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Tour Type */}
      <div className="pt-4 border-t border-stone-200">
        <label className="block font-bold text-stone-900 text-xs mb-2">
          Tour Type
        </label>
        <div className="space-y-1.5">
          {tourTypesList.map((type) => {
            const checked = filters.tourTypes.includes(type);
            return (
              <label 
                key={type} 
                className="flex items-center space-x-2 text-xs cursor-pointer hover:text-stone-900 select-none py-0.5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle('tourTypes', type)}
                  className="rounded border-stone-300 text-[#0A6C74] focus:ring-[#0A6C74] w-3.5 h-3.5"
                />
                <span className={checked ? 'font-semibold text-[#0E1B2A]' : 'text-stone-600'}>
                  {type === 'Shared' ? 'Small Group (Shared)' : 'Private Charter (Exclusive)'}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="pt-4 border-t border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <label className="font-bold text-stone-900 text-xs">
            Max Price
          </label>
          <span className="font-semibold text-[#0A6C74] text-xs">
            Up to €{filters.maxPrice}
          </span>
        </div>
        <input
          type="range"
          min="20"
          max="300"
          step="5"
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-[#0A6C74] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-stone-400 mt-1">
          <span>€20</span>
          <span>€150</span>
          <span>€300+</span>
        </div>
      </div>

      {/* Rating */}
      <div className="pt-4 border-t border-stone-200">
        <label className="block font-bold text-stone-900 text-xs mb-2">
          Rating
        </label>
        <div className="space-y-1.5">
          {[
            { label: 'All Ratings', value: 0 },
            { label: '4.8 & higher', value: 4.8 },
            { label: '4.9 & higher', value: 4.9 },
          ].map((r) => (
            <label 
              key={r.value}
              className="flex items-center space-x-2 text-xs cursor-pointer hover:text-stone-900 select-none py-0.5"
            >
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === r.value}
                onChange={() => onChange({ ...filters, minRating: r.value })}
                className="text-[#0A6C74] focus:ring-[#0A6C74]"
              />
              <span className={filters.minRating === r.value ? 'font-semibold text-[#0E1B2A]' : 'text-stone-600'}>
                {r.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Hotel Pickup Checkbox */}
      <div className="pt-4 border-t border-stone-200">
        <label className="flex items-center space-x-2 text-xs cursor-pointer hover:text-stone-900 select-none">
          <input
            type="checkbox"
            checked={filters.pickupOnly}
            onChange={(e) => onChange({ ...filters, pickupOnly: e.target.checked })}
            className="rounded border-stone-300 text-[#0A6C74] focus:ring-[#0A6C74] w-3.5 h-3.5"
          />
          <span className="font-semibold text-stone-800">
            Hotel Lobby Pickup Included
          </span>
        </label>
      </div>

      {/* Languages */}
      <div className="pt-4 border-t border-stone-200">
        <label className="block font-bold text-stone-900 text-xs mb-2">
          Guide Languages
        </label>
        <div className="space-y-1.5">
          {languagesList.map((lang) => {
            const checked = filters.languages.includes(lang);
            return (
              <label 
                key={lang} 
                className="flex items-center space-x-2 text-xs cursor-pointer hover:text-stone-900 select-none py-0.5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle('languages', lang)}
                  className="rounded border-stone-300 text-[#0A6C74] focus:ring-[#0A6C74] w-3.5 h-3.5"
                />
                <span className={checked ? 'font-semibold text-[#0E1B2A]' : 'text-stone-600'}>
                  {lang}
                </span>
              </label>
            );
          })}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border border-[#E8E3DA] rounded-sm p-5 self-start sticky top-24">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <span className="font-display font-bold text-base text-[#0E1B2A]">
                Filters ({totalFilteredCount} Tours)
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable filters */}
            <div className="p-4 overflow-y-auto flex-1">
              {content}
            </div>

            {/* Mobile Footer Apply */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center space-x-3">
              <button
                type="button"
                onClick={onClear}
                className="w-1/3 py-2.5 px-3 border border-stone-300 rounded text-xs font-semibold text-stone-700 bg-white"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-2/3 py-2.5 px-4 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold"
              >
                View {totalFilteredCount} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
