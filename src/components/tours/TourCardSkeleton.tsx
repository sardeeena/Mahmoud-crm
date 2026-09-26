import React from 'react';

interface TourCardSkeletonProps {
  className?: string;
}

/**
 * High-fidelity Skeleton Loader mirroring TourCard geometry and aesthetic.
 * Incorporates subtle wave shimmer and warm stone colors matching the luxury palette.
 */
export const TourCardSkeleton: React.FC<TourCardSkeletonProps> = ({ className = '' }) => {
  return (
    <article
      className={`bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden flex flex-col h-full relative shadow-xs select-none ${className}`}
      aria-hidden="true"
      role="status"
      aria-label="Loading excursion details"
    >
      {/* Photo Skeleton */}
      <div className="relative aspect-[16/10] bg-stone-200 animate-shimmer overflow-hidden">
        {/* Badge Placeholder */}
        <div className="absolute top-3 left-3 w-24 h-5 bg-stone-300/80 rounded-full" />

        {/* Wishlist Button Placeholder */}
        <div className="absolute top-3 right-3 w-8 h-8 bg-stone-300/80 rounded-full" />

        {/* Cancellation Badge Placeholder */}
        <div className="absolute bottom-3 left-3 w-36 h-4.5 bg-stone-300/70 rounded-full" />
      </div>

      {/* Content Skeleton */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Metadata Row: Destination · Category · Duration */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-16 h-3 bg-stone-200 rounded animate-shimmer" />
            <span className="text-stone-300">·</span>
            <div className="w-24 h-3 bg-stone-200 rounded animate-shimmer" />
            <span className="text-stone-300">·</span>
            <div className="w-10 h-3 bg-stone-200 rounded animate-shimmer" />
          </div>

          {/* Title Placeholder (2 lines) */}
          <div className="space-y-1.5 mb-2.5">
            <div className="w-11/12 h-4.5 bg-stone-200 rounded animate-shimmer" />
            <div className="w-3/4 h-4.5 bg-stone-200 rounded animate-shimmer" />
          </div>

          {/* Description Placeholder (2 lines) */}
          <div className="space-y-1.5 mb-3">
            <div className="w-full h-3 bg-stone-100 rounded animate-shimmer" />
            <div className="w-5/6 h-3 bg-stone-100 rounded animate-shimmer" />
          </div>

          {/* Rating Placeholder */}
          <div className="flex items-center space-x-1.5 mb-2">
            <div className="flex space-x-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-3.5 h-3.5 bg-amber-100/80 rounded-xs" />
              ))}
            </div>
            <div className="w-6 h-3.5 bg-stone-200 rounded ml-1 animate-shimmer" />
            <span className="text-stone-300">·</span>
            <div className="w-16 h-3 bg-stone-150 bg-stone-200/70 rounded animate-shimmer" />
          </div>

          {/* Pickup Info Placeholder */}
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-200 shrink-0" />
            <div className="w-44 h-3 bg-stone-100 rounded animate-shimmer" />
          </div>
        </div>

        {/* Pricing & Footer Actions Skeleton */}
        <div className="pt-3 border-t border-stone-100 space-y-2.5">
          {/* Quick comparison line */}
          <div className="flex items-center justify-between">
            <div className="w-20 h-3 bg-stone-200/80 rounded animate-shimmer" />
            <div className="w-16 h-3 bg-stone-100 rounded animate-shimmer" />
          </div>

          {/* Pricing Row */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="w-8 h-2.5 bg-stone-200 rounded mb-1 animate-shimmer" />
              <div className="flex items-baseline space-x-1">
                <div className="w-16 h-5 bg-stone-200 rounded animate-shimmer" />
                <div className="w-12 h-3 bg-stone-100 rounded animate-shimmer" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-1.5">
              <div className="w-14 h-8 bg-stone-100 rounded-xl" />
              <div className="w-18 h-8 bg-stone-200 rounded-xl animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

interface TourGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Renders a responsive grid of TourCardSkeleton items.
 */
export const TourGridSkeleton: React.FC<TourGridSkeletonProps> = ({
  count = 8,
  className = '',
}) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
      aria-busy="true"
      aria-live="polite"
    >
      {[...Array(count)].map((_, index) => (
        <TourCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default TourCardSkeleton;
