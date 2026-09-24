import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Clock, 
  MapPin, 
  Check, 
  ArrowRight, 
  Filter,
  CheckCircle2,
  Heart,
  Eye,
  Scale
} from 'lucide-react';
import { Tour, CurrencyConfig } from '../../types';
import { formatPrice } from '../../data/toursData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useComparison } from '../../contexts/ComparisonContext';
import { TourPreviewModal } from './TourPreviewModal';
import { QuickBookModal } from './QuickBookModal';

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
  const { t } = useLanguage();
  const { isFavorite, toggleFavorite } = useWishlist();
  const { isCompared, toggleCompare } = useComparison();
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');

  // Modal states for Quick View & Quick Book
  const [previewTour, setPreviewTour] = useState<Tour | null>(null);
  const [quickBookTargetTour, setQuickBookTargetTour] = useState<Tour | null>(null);

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
              {t('popular.title')}
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-xl">
              {t('popular.subtitle')}
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

        {/* Animated Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-8 no-scrollbar text-xs sm:text-sm font-medium">
          {categories.map((cat) => {
            const isSelected = selectedCategoryTab === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryTab(cat)}
                className={`relative px-4 py-2 rounded-full whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#0E1B2A] text-white border-[#0E1B2A] shadow-sm font-semibold'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                }`}
              >
                {cat === 'All' ? 'All Experiences' : cat}
              </button>
            );
          })}
        </div>

        {/* Tours Grid with Motion Animations */}
        {filteredTours.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E8E3DA] p-12 text-center my-6">
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
            {filteredTours.map((tour) => {
              const favorite = isFavorite(tour.slug);
              const compared = isCompared(tour.slug);

              return (
                <motion.article 
                  key={tour.id}
                  id={`tour-card-${tour.id}`}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-lg border border-[#E8E3DA] overflow-hidden flex flex-col hover:border-stone-400 hover:shadow-lg transition-shadow duration-200 group relative"
                >
                  {/* Tour Image with Badges & Hover Quick View */}
                  <div 
                    className="relative aspect-[16/10] overflow-hidden bg-stone-100 cursor-pointer"
                    onClick={() => onSelectTour(tour)}
                  >
                    <img
                      src={tour.primaryImage}
                      alt={tour.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />

                    {/* Gradient overlay for top badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />

                    {/* Badge */}
                    {tour.badge && (
                      <div className="absolute top-2.5 left-2.5 bg-[#0E1B2A]/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full tracking-wide shadow-xs">
                        {tour.badge}
                      </div>
                    )}

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(tour.slug, tour.title);
                      }}
                      className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
                        favorite
                          ? 'bg-rose-50 text-rose-600 shadow-md scale-105'
                          : 'bg-black/40 text-white hover:bg-white hover:text-stone-900'
                      }`}
                      title={favorite ? 'Remove from saved' : 'Save to wishlist'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favorite ? 'fill-current text-rose-600' : ''}`} />
                    </button>

                    {/* Quick View Button on Image Center */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTour(tour);
                      }}
                      className="absolute inset-0 m-auto w-28 h-8 rounded-full bg-white/95 text-stone-900 text-xs font-semibold shadow-lg flex items-center justify-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-105 z-10"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0A6C74]" />
                      <span>Quick View</span>
                    </button>

                    {/* Free Cancellation Tag */}
                    <div className="absolute bottom-2.5 left-2.5 bg-white/95 text-emerald-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      Free 24h Cancellation
                    </div>
                  </div>

                  {/* Tour Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta bar: Destination & Duration */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1.5">
                        <span className="flex items-center text-[#0A6C74] font-semibold">
                          <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
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
                      <ul className="text-[11px] text-stone-600 space-y-1 mb-3">
                        {tour.highlights.slice(0, 2).map((hl, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="w-3 h-3 text-[#0A6C74] mr-1.5 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Compare & Pricing Row */}
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100 text-[11px]">
                        <button
                          type="button"
                          onClick={() => toggleCompare(tour.slug, tour.title)}
                          className={`flex items-center space-x-1 font-medium transition-colors ${
                            compared
                              ? 'text-[#0A6C74] font-semibold'
                              : 'text-stone-400 hover:text-stone-700'
                          }`}
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>{compared ? 'In Comparison' : 'Compare'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewTour(tour)}
                          className="text-stone-400 hover:text-[#0A6C74] transition-colors"
                        >
                          Quick details
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-stone-500">From</span>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-base sm:text-lg font-bold text-[#0E1B2A]">
                              {formatPrice(tour.priceEur, currency)}
                            </span>
                            <span className="text-[11px] text-stone-600 font-medium">/{t('popular.perPerson')}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectTour(tour)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                          >
                            {t('popular.viewDetails')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickBookTargetTour(tour)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0A6C74] hover:bg-[#08565C] rounded transition-colors shadow-xs"
                          >
                            {t('popular.quickBook')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* View all excursions CTA */}
        {onViewAllExcursions && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={onViewAllExcursions}
              className="inline-flex items-center px-6 py-3 bg-[#0E1B2A] hover:bg-[#16283D] text-white text-xs sm:text-sm font-semibold rounded-full transition-all shadow-sm space-x-2 hover:scale-[1.02]"
            >
              <span>{t('popular.viewAll')}</span>
              <ArrowRight className="w-4 h-4 text-[#60C3CC]" />
            </button>
          </div>
        )}

      </div>

      {/* Connected Tour Preview Modal */}
      <TourPreviewModal
        tour={previewTour}
        currency={currency}
        onClose={() => setPreviewTour(null)}
        onBookNow={(t) => {
          setPreviewTour(null);
          onQuickBook(t);
        }}
      />

      {/* Connected Direct Quick Book Modal */}
      <QuickBookModal
        tour={quickBookTargetTour}
        currency={currency}
        onClose={() => setQuickBookTargetTour(null)}
        onSuccess={() => {
          if (quickBookTargetTour) {
            onQuickBook(quickBookTargetTour);
          }
        }}
      />
    </section>
  );
};
