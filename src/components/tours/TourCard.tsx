import React from 'react';
import { motion } from 'motion/react';
import { Star, Clock, MapPin, CheckCircle2, ArrowRight, Heart, Eye, Scale } from 'lucide-react';
import { Tour, CurrencyConfig } from '../../types';
import { formatPrice } from '../../data/toursData';
import { useWishlist } from '../../contexts/WishlistContext';
import { useComparison } from '../../contexts/ComparisonContext';

interface TourCardProps {
  tour: Tour;
  currency: CurrencyConfig;
  onViewTour: (tour: Tour) => void;
  onBookNow?: (tour: Tour) => void;
  onQuickView?: (tour: Tour) => void;
}

export const TourCard: React.FC<TourCardProps> = ({
  tour,
  currency,
  onViewTour,
  onBookNow,
  onQuickView,
}) => {
  const { isFavorite, toggleFavorite } = useWishlist();
  const { isCompared, toggleCompare } = useComparison();

  const favorite = isFavorite(tour.slug);
  const compared = isCompared(tour.slug);

  return (
    <motion.article 
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg border border-[#E8E3DA] overflow-hidden flex flex-col hover:border-stone-400 hover:shadow-lg transition-shadow duration-200 group h-full relative"
    >
      {/* Photo with subtle hover zoom */}
      <div 
        className="relative aspect-[16/10] overflow-hidden bg-stone-100 cursor-pointer"
        onClick={() => onViewTour(tour)}
      >
        <img
          src={tour.primaryImage}
          alt={tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient vignette for badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />

        {/* Badge */}
        {tour.badge && (
          <div className="absolute top-2.5 left-2.5 bg-[#0E1B2A]/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full tracking-wide shadow-xs">
            {tour.badge}
          </div>
        )}

        {/* Quick View Button on Image Hover */}
        {onQuickView && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(tour);
            }}
            className="absolute inset-0 m-auto w-28 h-9 rounded-full bg-white/95 text-stone-900 text-xs font-semibold shadow-lg flex items-center justify-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-105 z-10"
          >
            <Eye className="w-3.5 h-3.5 text-[#0A6C74]" />
            <span>Quick View</span>
          </button>
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(tour.slug, tour.title);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-20 ${
            favorite
              ? 'bg-rose-50 text-rose-600 shadow-md scale-105'
              : 'bg-black/40 text-white hover:bg-white hover:text-stone-900'
          }`}
          title={favorite ? 'Remove from saved' : 'Save to wishlist'}
          aria-label={favorite ? 'Remove from saved' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${favorite ? 'fill-current text-rose-600' : ''}`} />
        </button>

        {/* Free Cancellation Tag */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/95 text-emerald-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs flex items-center">
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
            <span className="text-stone-300">•</span>
            <span className="truncate max-w-[120px]">{tour.category}</span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center text-stone-600 shrink-0">
              <Clock className="w-3 h-3 mr-1 text-stone-400 shrink-0" />
              {tour.durationHours}h
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
          <div className="text-[11px] text-stone-500 flex items-center mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0"></span>
            <span className="truncate">{tour.pickupInfo}</span>
          </div>
        </div>

        {/* Compare Checkbox & Pricing Row */}
        <div>
          {/* Quick comparison toggle button */}
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

            {onQuickView && (
              <button
                type="button"
                onClick={() => onQuickView(tour)}
                className="text-stone-400 hover:text-[#0A6C74] transition-colors"
              >
                Quick details
              </button>
            )}
          </div>

          {/* Pricing & Primary Action */}
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-[10px] uppercase font-bold text-stone-500">From</span>
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
                className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded transition-all"
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => (onBookNow ? onBookNow(tour) : onViewTour(tour))}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0A6C74] hover:bg-[#08565C] rounded transition-all shadow-xs flex items-center space-x-1 group/btn"
              >
                <span>Book</span>
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
