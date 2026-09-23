import React from 'react';
import { Star, Clock, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { Tour, CurrencyConfig } from '../../types';
import { formatPrice } from '../../data/toursData';

interface TourCardProps {
  tour: Tour;
  currency: CurrencyConfig;
  onViewTour: (tour: Tour) => void;
  onBookNow?: (tour: Tour) => void;
}

export const TourCard: React.FC<TourCardProps> = ({
  tour,
  currency,
  onViewTour,
  onBookNow,
}) => {
  return (
    <article 
      className="bg-white rounded-sm border border-[#E8E3DA] overflow-hidden flex flex-col hover:border-stone-400 hover:shadow-md transition-all duration-200 group h-full"
    >
      {/* Photo with subtle hover zoom */}
      <div 
        className="relative aspect-[16/10] overflow-hidden bg-stone-100 cursor-pointer"
        onClick={() => onViewTour(tour)}
      >
        <img
          src={tour.primaryImage}
          alt={tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badge */}
        {tour.badge && (
          <div className="absolute top-2.5 left-2.5 bg-[#0E1B2A]/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-xs tracking-wide">
            {tour.badge}
          </div>
        )}

        {/* Free Cancellation Tag */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/95 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-xs shadow-xs flex items-center">
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
          <span>Free 24h Cancellation</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Location label */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1.5">
            <span className="flex items-center text-[#0A6C74] font-semibold">
              <MapPin className="w-3 h-3 mr-1 shrink-0" />
              {tour.destination}
            </span>
            <span className="text-stone-400">•</span>
            <span className="truncate max-w-[130px]">{tour.category}</span>
            <span className="text-stone-400">•</span>
            <span className="flex items-center text-stone-600 shrink-0">
              <Clock className="w-3 h-3 mr-1 text-stone-400 shrink-0" />
              {tour.durationCategory}
            </span>
          </div>

          {/* Tour Title */}
          <h3 
            onClick={() => onViewTour(tour)}
            className="font-display text-base font-semibold text-[#0E1B2A] leading-snug line-clamp-2 hover:text-[#0A6C74] cursor-pointer mb-1.5 transition-colors"
            title={tour.title}
          >
            {tour.title}
          </h3>

          {/* Short description */}
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3">
            {tour.shortDescription}
          </p>

          {/* Rating */}
          <div className="flex items-center space-x-1.5 mb-3 text-xs">
            <div className="flex text-[#C28D32]">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3.5 h-3.5 ${i < Math.floor(tour.rating) ? 'fill-current' : 'fill-current opacity-30'}`} 
                />
              ))}
            </div>
            <span className="font-bold text-stone-900 text-xs">{tour.rating.toFixed(1)}</span>
            <span className="text-stone-400">•</span>
            <span className="text-stone-500 text-[11px]">{tour.reviewCount} reviews</span>
          </div>

          {/* Pickup info */}
          <div className="text-[11px] text-stone-500 flex items-center mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0"></span>
            <span className="truncate">{tour.pickupInfo}</span>
          </div>
        </div>

        {/* Pricing & Primary Action */}
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
              onClick={() => onViewTour(tour)}
              className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-sm transition-all"
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => (onBookNow ? onBookNow(tour) : onViewTour(tour))}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0A6C74] hover:bg-[#08565C] rounded-sm transition-all shadow-xs flex items-center space-x-1 group/btn"
            >
              <span>Book</span>
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
