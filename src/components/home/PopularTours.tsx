import React, { useState } from 'react';
import { 
  Star, 
  Clock, 
  MapPin, 
  Users, 
  Check, 
  ArrowRight, 
  Sparkles,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Tour, CurrencyConfig } from '../../types';
import { formatPrice } from '../../data/toursData';

interface PopularToursProps {
  tours: Tour[];
  currency: CurrencyConfig;
  onSelectTour: (tour: Tour) => void;
  onQuickBook: (tour: Tour) => void;
  onViewAllExcursions?: () => void;
  activeFilterSummary?: string;
  onClearFilters?: () => void;
}

export const PopularTours: React.FC<PopularToursProps> = ({
  tours,
  currency,
  onSelectTour,
  onQuickBook,
  onViewAllExcursions,
  activeFilterSummary,
  onClearFilters,
}) => {
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');

  const categories = [
    'All',
    'Boat & Yacht Cruises',
    'Snorkeling Excursions',
    'Scuba Diving (PADI)',
    'Desert Quad & Buggy Safaris',
    'Historical Day Trips (Luxor & Cairo)',
  ];

  const filteredTours = selectedCategoryTab === 'All' 
    ? tours 
    : tours.filter((t) => t.category === selectedCategoryTab);

  return (
    <section id="tours-section" className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-[#E8E3DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0A6C74] mb-2">
              <span className="w-4 h-0.5 bg-[#0A6C74]"></span>
              <span>Handpicked Red Sea Excursions</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl text-[#0E1B2A] tracking-tight">
              Popular Experiences & Excursions
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-xl">
              Verified daily departures with certified marine skippers, sanitized equipment, and hotel transfers included.
            </p>
          </div>

          {activeFilterSummary && (
            <div className="flex items-center bg-stone-100 border border-stone-300 rounded px-3 py-1.5 text-xs text-stone-700 self-start md:self-auto">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-[#0A6C74]" />
              <span className="font-medium mr-2">{activeFilterSummary}</span>
              {onClearFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="text-[#0A6C74] font-semibold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-8 no-scrollbar text-xs sm:text-sm font-medium">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategoryTab(cat)}
              className={`px-4 py-2 rounded-sm whitespace-nowrap transition-all border ${
                selectedCategoryTab === cat
                  ? 'bg-[#0E1B2A] text-white border-[#0E1B2A] shadow-sm font-semibold'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              {cat === 'All' ? 'All Experiences' : cat}
            </button>
          ))}
        </div>

        {/* Tours Grid */}
        {filteredTours.length === 0 ? (
          <div className="bg-white rounded border border-[#E8E3DA] p-12 text-center my-6">
            <p className="text-stone-700 font-semibold text-base mb-1">No excursions match your current filter.</p>
            <p className="text-stone-500 text-xs mb-4">Try clearing your filters or selecting a different category.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryTab('All');
                if (onClearFilters) onClearFilters();
              }}
              className="px-4 py-2 bg-[#0A6C74] text-white text-xs font-semibold rounded hover:bg-[#08565C]"
            >
              Show All Excursions
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTours.map((tour) => (
              <article 
                key={tour.id}
                id={`tour-card-${tour.id}`}
                className="bg-white rounded-sm border border-[#E8E3DA] overflow-hidden flex flex-col hover:border-stone-400 hover:shadow-md transition-all duration-200 group"
              >
                {/* Tour Image with Badges */}
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                  <img
                    src={tour.primaryImage}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Badge */}
                  {tour.badge && (
                    <div className="absolute top-2.5 left-2.5 bg-[#0E1B2A]/90 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-xs tracking-wide">
                      {tour.badge}
                    </div>
                  )}
                  {/* Free Cancellation Tag */}
                  <div className="absolute bottom-2.5 left-2.5 bg-white/95 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-xs shadow-xs flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                    Free 24h Cancellation
                  </div>
                </div>

                {/* Tour Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Meta bar: Destination & Duration */}
                    <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1.5">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 text-[#0A6C74] mr-1 shrink-0" />
                        {tour.destination}
                      </span>
                      <span className="flex items-center text-stone-600">
                        <Clock className="w-3.5 h-3.5 text-stone-400 mr-1 shrink-0" />
                        {tour.durationHours} hrs
                      </span>
                    </div>

                    {/* Title */}
                    <h3 
                      onClick={() => onSelectTour(tour)}
                      className="font-display text-base font-semibold text-[#0E1B2A] leading-snug line-clamp-2 hover:text-[#0A6C74] cursor-pointer mb-2 transition-colors"
                      title={tour.title}
                    >
                      {tour.title}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center space-x-1.5 mb-3 text-xs">
                      <div className="flex items-center text-[#C28D32]">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold text-stone-900 ml-1 text-xs">{tour.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-stone-400">•</span>
                      <span className="text-stone-500 text-[11px]">({tour.reviewCount.toLocaleString()} reviews)</span>
                    </div>

                    {/* Short highlights list */}
                    <ul className="text-[11px] text-stone-600 space-y-1 mb-4">
                      {tour.highlights.slice(0, 2).map((hl, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="w-3 h-3 text-[#0A6C74] mr-1.5 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-auto">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-stone-600">Starting from</span>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-base sm:text-lg font-bold text-[#0E1B2A]">
                          {formatPrice(tour.priceEur, currency)}
                        </span>
                        <span className="text-[11px] text-stone-600 font-medium">/ person</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectTour(tour)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-sm border border-stone-200 transition-colors"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickBook(tour)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0A6C74] hover:bg-[#08565C] rounded-sm transition-colors"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* View all excursions CTA */}
        {onViewAllExcursions && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={onViewAllExcursions}
              className="inline-flex items-center px-6 py-3 bg-[#0E1B2A] hover:bg-[#16283D] text-white text-xs sm:text-sm font-semibold rounded-sm transition-all shadow-sm space-x-2"
            >
              <span>Explore All 24 Red Sea Excursions</span>
              <ArrowRight className="w-4 h-4 text-[#60C3CC]" />
            </button>
          </div>
        )}

      </div>
    </section>

  );
};
