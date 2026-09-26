import React from 'react';
import { TourCardSkeleton } from './TourCardSkeleton';

/**
 * Full-page skeleton placeholder for the Tour Detail page.
 * Replaces simple loading spinners with a luxury content placeholder.
 */
export const TourDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-20 select-none" role="status" aria-label="Loading tour details">
      {/* Top Breadcrumb & Actions Bar Skeleton */}
      <div className="bg-white border-b border-[#E8E3DA] py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-16 h-3 bg-stone-200 rounded animate-shimmer" />
            <span className="text-stone-300">/</span>
            <div className="w-24 h-3 bg-stone-200 rounded animate-shimmer" />
            <span className="text-stone-300">/</span>
            <div className="w-32 h-3 bg-stone-100 rounded animate-shimmer" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-stone-100 rounded-full animate-shimmer" />
            <div className="w-8 h-8 bg-stone-100 rounded-full animate-shimmer" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* Title & Header Badges Skeleton */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-24 h-5 bg-teal-100/70 rounded-full animate-shimmer" />
            <div className="w-28 h-5 bg-amber-100/70 rounded-full animate-shimmer" />
          </div>
          <div className="w-3/4 sm:w-2/3 h-8 sm:h-10 bg-stone-200 rounded-lg animate-shimmer" />
          <div className="flex items-center space-x-4 pt-1">
            <div className="w-32 h-4 bg-stone-200 rounded animate-shimmer" />
            <span className="text-stone-300">·</span>
            <div className="w-24 h-4 bg-stone-200 rounded animate-shimmer" />
            <span className="text-stone-300">·</span>
            <div className="w-20 h-4 bg-stone-200 rounded animate-shimmer" />
          </div>
        </div>

        {/* Gallery Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-10 rounded-2xl overflow-hidden border border-[#E8E3DA]">
          <div className="lg:col-span-2 aspect-[16/10] sm:aspect-[21/9] lg:aspect-auto lg:h-[460px] bg-stone-200 animate-shimmer" />
          <div className="hidden lg:grid grid-rows-2 gap-3 h-[460px]">
            <div className="bg-stone-200 animate-shimmer" />
            <div className="bg-stone-200 animate-shimmer" />
          </div>
        </div>

        {/* Main Content & Booking Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Details, Itinerary, Inclusions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Highlights Box */}
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 space-y-4">
              <div className="w-36 h-5 bg-stone-200 rounded animate-shimmer" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-3 bg-stone-50 rounded-xl space-y-2">
                    <div className="w-6 h-6 bg-stone-200 rounded animate-shimmer" />
                    <div className="w-16 h-3 bg-stone-200 rounded animate-shimmer" />
                    <div className="w-20 h-3.5 bg-stone-200 rounded animate-shimmer" />
                  </div>
                ))}
              </div>
            </div>

            {/* Overview Paragraphs */}
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 space-y-3">
              <div className="w-32 h-5 bg-stone-200 rounded animate-shimmer mb-2" />
              <div className="w-full h-3.5 bg-stone-150 bg-stone-100 rounded animate-shimmer" />
              <div className="w-11/12 h-3.5 bg-stone-150 bg-stone-100 rounded animate-shimmer" />
              <div className="w-4/5 h-3.5 bg-stone-150 bg-stone-100 rounded animate-shimmer" />
              <div className="w-2/3 h-3.5 bg-stone-150 bg-stone-100 rounded animate-shimmer" />
            </div>

            {/* Itinerary Timeline Skeleton */}
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 space-y-4">
              <div className="w-40 h-5 bg-stone-200 rounded animate-shimmer mb-4" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="w-10 h-10 rounded-full bg-stone-100 shrink-0 flex items-center justify-center">
                    <div className="w-5 h-5 bg-stone-200 rounded-full animate-shimmer" />
                  </div>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="w-36 h-4 bg-stone-200 rounded animate-shimmer" />
                    <div className="w-5/6 h-3 bg-stone-100 rounded animate-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E8E3DA] p-6 space-y-5 sticky top-24 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="space-y-1">
                  <div className="w-12 h-2.5 bg-stone-200 rounded animate-shimmer" />
                  <div className="w-28 h-7 bg-stone-200 rounded animate-shimmer" />
                </div>
                <div className="w-20 h-4 bg-emerald-100 rounded-full animate-shimmer" />
              </div>

              {/* Form inputs skeleton */}
              <div className="space-y-3">
                <div className="w-24 h-3 bg-stone-200 rounded animate-shimmer" />
                <div className="w-full h-11 bg-stone-100 rounded-xl animate-shimmer" />
              </div>

              <div className="space-y-3">
                <div className="w-28 h-3 bg-stone-200 rounded animate-shimmer" />
                <div className="w-full h-11 bg-stone-100 rounded-xl animate-shimmer" />
              </div>

              <div className="space-y-2 pt-2">
                <div className="w-full h-12 bg-[#0A6C74]/30 rounded-xl animate-shimmer" />
                <div className="w-40 h-3 bg-stone-100 rounded mx-auto animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Related Excursions Skeleton */}
        <div className="mt-16 pt-10 border-t border-[#E8E3DA]">
          <div className="mb-6 space-y-1">
            <div className="w-36 h-3 bg-stone-200 rounded animate-shimmer" />
            <div className="w-48 h-6 bg-stone-200 rounded animate-shimmer" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <TourCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourDetailSkeleton;
