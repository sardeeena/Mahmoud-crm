import React, { useState } from 'react';
import { 
  Star, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Sparkles,
  Share2,
  Heart
} from 'lucide-react';
import { Tour, CurrencyConfig } from '../types';
import { ALL_TOURS, formatPrice } from '../data/toursData';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { TourGallery } from '../components/tours/TourGallery';
import { TourBookingPanel } from '../components/tours/TourBookingPanel';
import { MobileBookingBar } from '../components/tours/MobileBookingBar';
import { Itinerary } from '../components/tours/Itinerary';
import { IncludedExcluded } from '../components/tours/IncludedExcluded';
import { ImportantInformation } from '../components/tours/ImportantInformation';
import { TourReviews } from '../components/tours/TourReviews';
import { RelatedTours } from '../components/tours/RelatedTours';

interface TourDetailPageProps {
  tour: Tour;
  currency: CurrencyConfig;
  allTours?: Tour[];
  onNavigateHome: () => void;
  onNavigateExcursions: () => void;
  onViewTour: (tour: Tour) => void;
  onBookTour: (bookingDetails: {
    tour: Tour;
    date: string;
    adults: number;
    children: number;
    pickupLocation: string;
    selectedExtras: string[];
    totalEur: number;
  }) => void;
  onDirectBookNow?: (tour: Tour) => void;
}

export const TourDetailPage: React.FC<TourDetailPageProps> = ({
  tour,
  currency,
  allTours = ALL_TOURS,
  onNavigateHome,
  onNavigateExcursions,
  onViewTour,
  onBookTour,
  onDirectBookNow,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleMobileBook = () => {
    if (onDirectBookNow) {
      onDirectBookNow(tour);
    } else {
      const el = document.getElementById('booking-panel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24 lg:pb-12">
      
      {/* Breadcrumbs & Share */}
      <div className="flex items-center justify-between">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: onNavigateHome },
            { label: 'Excursions', onClick: onNavigateExcursions },
            { label: tour.title },
          ]}
        />

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 bg-white border border-stone-200 hover:border-stone-300 rounded text-stone-600 text-xs flex items-center space-x-1 transition-colors shadow-2xs"
            title="Copy tour link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {copiedLink ? 'Link Copied!' : 'Share'}
            </span>
          </button>
        </div>
      </div>

      {/* TOP: Image Gallery */}
      <div className="my-4">
        <TourGallery
          primaryImage={tour.primaryImage}
          galleryImages={tour.galleryImages}
          tourTitle={tour.title}
        />
      </div>

      {/* Main Grid: Left Details & Right Booking Sticky Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
        
        {/* Left Column: Comprehensive Details (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8 min-w-0">
          
          {/* Header Info */}
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#0A6C74] font-semibold mb-2">
              <span className="bg-[#E8F3F4] px-2.5 py-0.5 rounded text-[#0A6C74] font-bold uppercase tracking-wider text-[10px]">
                {tour.category}
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center text-stone-600">
                <MapPin className="w-3.5 h-3.5 mr-1 text-[#0A6C74]" />
                {tour.destination}
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center text-stone-600">
                <Clock className="w-3.5 h-3.5 mr-1 text-stone-400" />
                {tour.durationLabel}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0E1B2A] leading-tight mb-3">
              {tour.title}
            </h1>

            {/* Rating & Review count */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex text-[#C28D32]">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(tour.rating) ? 'fill-current' : 'fill-current opacity-30'}`} 
                  />
                ))}
              </div>
              <span className="font-bold text-stone-900 text-sm">
                {tour.rating.toFixed(1)}
              </span>
              <span className="text-stone-400">•</span>
              <span className="text-stone-600 font-medium">
                {tour.reviewCount} customer reviews
              </span>
              <span className="text-stone-400">•</span>
              <span className="text-emerald-700 font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Hotel Pickup Included
              </span>
            </div>
          </div>

          {/* Short description */}
          <div className="p-4 bg-stone-50 border-l-3 border-[#0A6C74] rounded-r text-xs sm:text-sm text-stone-700 leading-relaxed">
            {tour.shortDescription}
          </div>

          {/* About this experience */}
          <div className="space-y-3">
            <h3 className="font-display text-lg font-bold text-[#0E1B2A]">
              About This Experience
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
              {tour.fullDescription}
            </p>
          </div>

          {/* Highlights */}
          <div className="space-y-3">
            <h3 className="font-display text-lg font-bold text-[#0E1B2A]">
              Experience Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tour.highlights.map((hl, idx) => (
                <div key={idx} className="flex items-start text-xs text-stone-700">
                  <div className="p-1 rounded bg-[#E8F3F4] text-[#0A6C74] mr-2.5 mt-0.5 shrink-0">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span className="leading-snug">{hl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ITINERARY */}
          <div className="pt-4 border-t border-stone-200">
            <Itinerary items={tour.itinerary} />
          </div>

          {/* WHAT'S INCLUDED / NOT INCLUDED */}
          <div className="pt-4 border-t border-stone-200">
            <IncludedExcluded
              included={tour.included}
              excluded={tour.excluded}
            />
          </div>

          {/* IMPORTANT INFORMATION */}
          <div className="pt-4 border-t border-stone-200">
            <ImportantInformation tour={tour} />
          </div>

          {/* REVIEWS SECTION */}
          <div className="pt-4 border-t border-stone-200">
            <TourReviews tour={tour} />
          </div>

          {/* RELATED TOURS */}
          <div className="pt-4">
            <RelatedTours
              currentTour={tour}
              allTours={allTours}
              currency={currency}
              onViewTour={onViewTour}
              onBookNow={(relTour) => (onDirectBookNow ? onDirectBookNow(relTour) : handleMobileBook())}
            />
          </div>

        </div>

        {/* Right Column: Sticky Booking Panel (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <TourBookingPanel
            tour={tour}
            currency={currency}
            onBook={onBookTour}
          />
        </div>

      </div>

      {/* Mobile Sticky Booking Bar */}
      <MobileBookingBar
        tour={tour}
        currency={currency}
        onBookNow={handleMobileBook}
      />

    </div>
  );
};
