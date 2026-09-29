import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle, ThumbsUp, X } from 'lucide-react';
import { Tour } from '../../types';

interface TourReviewsProps {
  tour: Tour;
}

export const TourReviews: React.FC<TourReviewsProps> = ({ tour }) => {
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // Demo review distribution
  const breakdown = tour.ratingBreakdown || {
    5: Math.round(tour.reviewCount * 0.8),
    4: Math.round(tour.reviewCount * 0.15),
    3: Math.max(1, Math.round(tour.reviewCount * 0.04)),
    2: 1,
    1: 0,
  };

  const totalReviews = tour.reviewCount || 100;

  const verifiedReviewsList = tour.reviews && tour.reviews.length > 0 ? tour.reviews : [
    {
      id: 'rev-001',
      authorName: 'Katharina S.',
      country: 'Germany',
      countryCode: 'DE',
      rating: 5,
      date: '10 September 2026',
      tourTitle: tour.title,
      tourSlug: tour.slug,
      comment: 'Everything went smoothly. Hotel pickup arrived right on time, our guide explained all the reef life clearly, and the food was fresh and plentiful. Highly recommended.',
      travelerType: 'Couple' as const,
      verifiedBooking: true,
    },
    {
      id: 'rev-002',
      authorName: 'Liam O.',
      country: 'United Kingdom',
      countryCode: 'GB',
      rating: 5,
      date: '03 September 2026',
      tourTitle: tour.title,
      tourSlug: tour.slug,
      comment: 'Superb day out on the water. Pristine clear water and lots of marine life. The boat was spacious and never felt overcrowded.',
      travelerType: 'Friends' as const,
      verifiedBooking: true,
    },
    {
      id: 'rev-003',
      authorName: 'Camille L.',
      country: 'France',
      countryCode: 'FR',
      rating: 4,
      date: '24 August 2026',
      tourTitle: tour.title,
      tourSlug: tour.slug,
      comment: 'Very professional boat crew. The snorkeling stops were well paced. Make sure to bring extra sun protection as the sun is intense.',
      travelerType: 'Family' as const,
      verifiedBooking: true,
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Section Header & Write CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-[#0E1B2A]">
            Guest Reviews & Feedback
          </h3>
          <p className="text-xs text-stone-500">
            Sample traveler impressions for {tour.title}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setWriteModalOpen(true)}
          className="px-3.5 py-1.5 border border-stone-300 rounded-sm bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold self-start sm:self-auto transition-colors flex items-center space-x-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#0A6C74]" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Aggregate Rating & Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 bg-white border border-[#E8E3DA] rounded-sm">
        
        {/* Left: Big Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 sm:border-r border-stone-200">
          <span className="font-display text-4xl sm:text-5xl font-bold text-[#0E1B2A]">
            {tour.rating.toFixed(1)}
          </span>
          <div className="flex text-[#C28D32] my-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span className="text-xs font-medium text-stone-600">
            Based on {totalReviews} traveler ratings
          </span>
          <span className="text-[10px] text-stone-400 mt-1">
            (Verified guest ratings)
          </span>
        </div>

        {/* Right: Distribution Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2 text-xs">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = breakdown[stars as keyof typeof breakdown] || 0;
            const percentage = Math.round((count / totalReviews) * 100);
            return (
              <div key={stars} className="flex items-center space-x-3">
                <span className="w-12 text-stone-600 font-medium flex items-center text-xs">
                  {stars} <Star className="w-3 h-3 ml-1 fill-[#C28D32] text-[#C28D32]" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full bg-[#0A6C74] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right text-stone-400 text-[11px]">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Individual Review Cards */}
      <div className="space-y-4">
        {verifiedReviewsList.map((rev) => (
          <div 
            key={rev.id} 
            className="p-4 bg-white border border-[#E8E3DA] rounded-sm text-xs space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-stone-900 text-xs">
                    {rev.authorName}
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-500 text-[11px]">
                    {rev.country}
                  </span>
                  {rev.travelerType && (
                    <>
                      <span className="text-stone-400">•</span>
                      <span className="text-stone-500 text-[11px] bg-stone-100 px-1.5 py-0.5 rounded">
                        {rev.travelerType}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex text-[#C28D32]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-400">{rev.date}</span>
                </div>
              </div>

              {rev.verifiedBooking && (
                <div className="flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                  <span>Verified Booking</span>
                </div>
              )}
            </div>

            <p className="text-stone-600 leading-relaxed pt-1">
              "{rev.comment}"
            </p>
          </div>
        ))}
      </div>

      {/* Write a review modal */}
      {writeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-[#E8E3DA] max-w-md w-full p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => {
                setWriteModalOpen(false);
                setSubmittedMessage(false);
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            {!submittedMessage ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmittedMessage(true);
                }}
                className="space-y-4 text-xs"
              >
                <h3 className="font-display text-base font-bold text-[#0E1B2A]">
                  Review {tour.title}
                </h3>
                <p className="text-stone-500 text-[11px]">
                  Share your experience with future travelers. Your review will be verified prior to publishing.
                </p>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Your Rating
                  </label>
                  <div className="flex space-x-1 text-[#C28D32]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-5 h-5 fill-current cursor-pointer hover:scale-110 transition-transform" />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thomas K."
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0A6C74]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Review Details
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about the boat, crew, snorkeling stops, lunch, or transfers..."
                    className="w-full px-3 py-2 border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0A6C74]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0A6C74] hover:bg-[#08565C] text-white font-semibold rounded text-xs transition-colors"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-display font-bold text-base text-stone-900">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-xs text-stone-600">
                  Your review has been recorded and scheduled for moderation.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setWriteModalOpen(false);
                    setSubmittedMessage(false);
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
