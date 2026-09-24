import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Compass, 
  Calendar, 
  Users, 
  Search, 
  ChevronDown, 
  Check, 
  Plus, 
  Minus 
} from 'lucide-react';
import { SearchFilters } from '../../types';
import { POPULAR_DESTINATIONS, TOUR_CATEGORIES } from '../../data/toursData';
import { useLanguage } from '../../contexts/LanguageContext';

interface SearchModuleProps {
  onSearch: (filters: { destination: string; category: string; date: string; guests: number }) => void;
  resultCount?: number;
}

export const SearchModule: React.FC<SearchModuleProps> = ({ onSearch, resultCount }) => {
  const { t } = useLanguage();
  const [destination, setDestination] = useState<string>('All Destinations');
  const [category, setCategory] = useState<string>('All Activities');
  const [date, setDate] = useState<string>('');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);

  const [destOpen, setDestOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  const guestsRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        setGuestsOpen(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setDestOpen(false);
      }
      if (catRef.current && !catRef.current.contains(event.target as Node)) {
        setCatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalGuests = adults + children;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      destination,
      category,
      date,
      guests: totalGuests,
    });
    // Scroll smoothly to results
    const section = document.getElementById('tours-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="search-section" className="w-full relative z-20">
      <form 
        onSubmit={handleSubmit}
        className="bg-white rounded-md shadow-lg border border-[#E8E3DA] p-3 sm:p-4 lg:p-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-2 items-center">
          
          {/* Destination Selector */}
          <div className="lg:col-span-3 relative" ref={destRef}>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 pl-1">
              {t('search.destination')}
            </label>
            <button
              type="button"
              id="search-destination-btn"
              onClick={() => {
                setDestOpen(!destOpen);
                setCatOpen(false);
                setGuestsOpen(false);
              }}
              className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm border border-stone-200 hover:border-stone-400 bg-stone-50/60 text-[#0E1B2A] text-sm focus:outline-none focus:ring-1 focus:ring-[#0A6C74]"
            >
              <div className="flex items-center space-x-2 truncate">
                <MapPin className="w-4 h-4 text-[#0A6C74] shrink-0" />
                <span className="truncate font-medium">{destination === 'All Destinations' ? t('search.allDestinations') : destination}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
            </button>

            {destOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E8E3DA] rounded shadow-xl py-1 z-30 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setDestination('All Destinations'); setDestOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 flex items-center justify-between"
                >
                  <span className="font-semibold text-stone-900">{t('search.allDestinations')}</span>
                  {destination === 'All Destinations' && <Check className="w-3.5 h-3.5 text-[#0A6C74]" />}
                </button>
                {POPULAR_DESTINATIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => { setDestination(d.name); setDestOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-stone-800">{d.name}</span>
                      <span className="block text-[10px] text-stone-400">{d.tourCount} excursions</span>
                    </div>
                    {destination === d.name && <Check className="w-3.5 h-3.5 text-[#0A6C74]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity / Category Selector */}
          <div className="lg:col-span-3 relative" ref={catRef}>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 pl-1">
              {t('search.activity')}
            </label>
            <button
              type="button"
              id="search-category-btn"
              onClick={() => {
                setCatOpen(!catOpen);
                setDestOpen(false);
                setGuestsOpen(false);
              }}
              className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm border border-stone-200 hover:border-stone-400 bg-stone-50/60 text-[#0E1B2A] text-sm focus:outline-none focus:ring-1 focus:ring-[#0A6C74]"
            >
              <div className="flex items-center space-x-2 truncate">
                <Compass className="w-4 h-4 text-[#0A6C74] shrink-0" />
                <span className="truncate font-medium">{category === 'All Activities' ? t('search.allActivities') : category}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
            </button>

            {catOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E8E3DA] rounded shadow-xl py-1 z-30 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setCategory('All Activities'); setCatOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 flex items-center justify-between"
                >
                  <span className="font-semibold text-stone-900">{t('search.allActivities')}</span>
                  {category === 'All Activities' && <Check className="w-3.5 h-3.5 text-[#0A6C74]" />}
                </button>
                {TOUR_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCategory(c.name); setCatOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-stone-800">{c.name}</span>
                      <span className="block text-[10px] text-stone-400">{c.tourCount} options</span>
                    </div>
                    {category === c.name && <Check className="w-3.5 h-3.5 text-[#0A6C74]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Selector */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 pl-1">
              {t('search.date')}
            </label>
            <div className="relative">
              <input
                type="date"
                id="search-date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 rounded-sm border border-stone-200 hover:border-stone-400 bg-stone-50/60 text-[#0E1B2A] text-sm focus:outline-none focus:ring-1 focus:ring-[#0A6C74]"
                placeholder="Select Date"
              />
            </div>
          </div>

          {/* Guests Popover */}
          <div className="lg:col-span-2 relative" ref={guestsRef}>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 pl-1">
              {t('search.guests')}
            </label>
            <button
              type="button"
              id="search-guests-btn"
              onClick={() => {
                setGuestsOpen(!guestsOpen);
                setDestOpen(false);
                setCatOpen(false);
              }}
              className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm border border-stone-200 hover:border-stone-400 bg-stone-50/60 text-[#0E1B2A] text-sm focus:outline-none focus:ring-1 focus:ring-[#0A6C74]"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#0A6C74] shrink-0" />
                <span className="font-medium">{totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            </button>

            {guestsOpen && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-[#E8E3DA] rounded shadow-xl p-3 z-30">
                <div className="flex items-center justify-between py-2 border-b border-stone-100">
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">{t('search.adults')}</span>
                    <span className="text-[11px] text-stone-400">{t('search.ageAdult')}</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-7 h-7 rounded border border-stone-300 flex items-center justify-center text-stone-700 disabled:opacity-30 hover:bg-stone-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-stone-800">{adults}</span>
                    <button
                      type="button"
                      disabled={adults >= 20}
                      onClick={() => setAdults(adults + 1)}
                      className="w-7 h-7 rounded border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="text-xs font-semibold text-stone-800 block">{t('search.children')}</span>
                    <span className="text-[11px] text-stone-400">{t('search.ageChild')}</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-7 h-7 rounded border border-stone-300 flex items-center justify-center text-stone-700 disabled:opacity-30 hover:bg-stone-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-stone-800">{children}</span>
                    <button
                      type="button"
                      disabled={children >= 10}
                      onClick={() => setChildren(children + 1)}
                      className="w-7 h-7 rounded border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 mt-2">
                  <button
                    type="button"
                    onClick={() => setGuestsOpen(false)}
                    className="w-full py-1.5 text-center text-xs font-semibold text-[#0A6C74] hover:bg-stone-50 rounded"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <div className="lg:col-span-1 pt-4 sm:pt-0">
            <button
              type="submit"
              id="search-submit-btn"
              className="w-full h-11 bg-[#0A6C74] hover:bg-[#08565C] text-white font-medium rounded-sm flex items-center justify-center shadow transition-all group"
              title={t('search.submit')}
            >
              <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="lg:hidden ml-2 text-sm font-semibold">{t('search.submit')}</span>
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};
