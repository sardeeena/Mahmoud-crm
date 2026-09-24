import React, { useState } from 'react';
import { Tour, CurrencyConfig } from '../../types';
import { TourCard } from './TourCard';
import { SearchX, RotateCcw } from 'lucide-react';
import { TourPreviewModal } from '../home/TourPreviewModal';

interface TourGridProps {
  tours: Tour[];
  currency: CurrencyConfig;
  onViewTour: (tour: Tour) => void;
  onBookNow?: (tour: Tour) => void;
  onClearFilters?: () => void;
}

export const TourGrid: React.FC<TourGridProps> = ({
  tours,
  currency,
  onViewTour,
  onBookNow,
  onClearFilters,
}) => {
  const [quickViewTour, setQuickViewTour] = useState<Tour | null>(null);

  if (tours.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E8E3DA] p-12 text-center my-4">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-500">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="font-display text-lg font-bold text-[#0E1B2A] mb-1">
          No excursions match your selected filters
        </h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto mb-5">
          Try expanding your price range, clearing specific activities, or choosing another destination.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white text-xs font-semibold rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tours.map((tour) => (
          <TourCard
            key={tour.id}
            tour={tour}
            currency={currency}
            onViewTour={onViewTour}
            onBookNow={onBookNow}
            onQuickView={(t) => setQuickViewTour(t)}
          />
        ))}
      </div>

      {/* Connected Quick View Modal */}
      <TourPreviewModal
        tour={quickViewTour}
        currency={currency}
        onClose={() => setQuickViewTour(null)}
        onBookNow={(tour) => {
          setQuickViewTour(null);
          if (onBookNow) onBookNow(tour);
          else onViewTour(tour);
        }}
      />
    </>
  );
};
