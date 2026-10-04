import React from 'react';
import { motion } from 'motion/react';
import { Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { REVIEWS_DATA } from '../../data/toursData';

export const ReviewsSection: React.FC = () => {
  return (
    <section id="reviews-section" className="py-16 sm:py-24 bg-[#FAF8F5] dark:bg-[#0A1118] border-b border-[#E8E3DA] dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0A6C74] dark:text-[#60C3CC] mb-2">
              <span className="w-5 h-0.5 bg-[#0A6C74] dark:bg-[#60C3CC] rounded-full"></span>
              <span>Authentic Guest Experiences</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl text-[#0E1B2A] dark:text-white tracking-tight">
              What Travelers Say
            </h2>
            <p className="text-stone-600 dark:text-slate-300 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Reviews collected following verified excursion completion from international guests staying in Hurghada, El Gouna, and Makadi Bay.
            </p>
          </div>

          {/* Aggregate Rating Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-[#132235] border border-[#E8E3DA] dark:border-slate-800 p-4.5 rounded-2xl flex items-center space-x-4 self-start md:self-auto shadow-sm"
          >
            <div className="text-center">
              <span className="font-display text-3xl font-bold text-[#0E1B2A] dark:text-white block leading-none font-mono">4.9</span>
              <div className="flex text-amber-400 mt-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
            </div>
            <div className="h-10 w-px bg-stone-200 dark:bg-slate-700" />
            <div>
              <span className="text-xs font-bold text-stone-900 dark:text-white block">4,800+ Verified Bookings</span>
              <span className="text-[11px] text-stone-500 dark:text-slate-400">98% recommendation rate</span>
            </div>
          </motion.div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS_DATA.map((rev, idx) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-[#132235] rounded-2xl border border-[#E8E3DA] dark:border-slate-800 p-6 flex flex-col justify-between hover:border-[#0A6C74]/50 hover:shadow-xl transition-all duration-300"
            >
              <div>
                {/* Rating and Date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-400 dark:text-slate-500 font-mono">{rev.date}</span>
                </div>

                {/* Excursion tag */}
                <span className="text-xs font-semibold text-[#0A6C74] dark:text-[#60C3CC] block mb-2 line-clamp-1">
                  {rev.tourTitle}
                </span>

                {/* Review Text */}
                <p className="text-xs sm:text-[13px] text-stone-700 dark:text-slate-200 leading-relaxed mb-5 italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Guest Profile */}
              <div className="pt-3.5 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-white block">
                    {rev.authorName}
                  </span>
                  <div className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5">
                    <span>{rev.country}</span>
                    <span aria-hidden="true" className="text-stone-300 dark:text-slate-600">·</span>
                    <span>{rev.travelerType}</span>
                  </div>
                </div>

                {rev.verifiedBooking && (
                  <div className="flex items-center text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
