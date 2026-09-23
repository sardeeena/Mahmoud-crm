import React from 'react';
import { Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { REVIEWS_DATA } from '../../data/toursData';

export const ReviewsSection: React.FC = () => {
  return (
    <section id="reviews-section" className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-[#E8E3DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0A6C74] mb-2">
              <span className="w-4 h-0.5 bg-[#0A6C74]"></span>
              <span>Authentic Guest Experiences</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl text-[#0E1B2A] tracking-tight">
              What Travelers Say
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-xl">
              Reviews collected following verified excursion completion from international guests staying in Hurghada, El Gouna, and Makadi Bay.
            </p>
          </div>

          {/* Aggregate Rating Badge */}
          <div className="bg-white border border-[#E8E3DA] p-4 rounded-sm flex items-center space-x-4 self-start md:self-auto shadow-xs">
            <div className="text-center">
              <span className="font-display text-3xl font-bold text-[#0E1B2A] block leading-none">4.9</span>
              <div className="flex text-[#C28D32] mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
            </div>
            <div className="h-10 w-px bg-stone-200"></div>
            <div>
              <span className="text-xs font-bold text-stone-900 block">4,800+ Verified Bookings</span>
              <span className="text-[11px] text-stone-500">98% recommendation rate</span>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS_DATA.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-sm border border-[#E8E3DA] p-5 flex flex-col justify-between hover:border-stone-400 transition-colors shadow-xs"
            >
              <div>
                {/* Rating and Date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-[#C28D32]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-400">{rev.date}</span>
                </div>

                {/* Excursion tag */}
                <div className="mb-3">
                  <span className="text-[11px] font-semibold text-[#0A6C74] bg-[#E8F3F4] px-2 py-0.5 rounded-xs inline-block">
                    {rev.tourTitle}
                  </span>
                </div>

                {/* Review text */}
                <p className="text-xs text-stone-700 leading-relaxed italic mb-4">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author info */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-900 block">{rev.authorName}</span>
                  <span className="text-[11px] text-stone-500">{rev.country} • {rev.travelerType}</span>
                </div>
                {rev.verifiedBooking && (
                  <div className="flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
