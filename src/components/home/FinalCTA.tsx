import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MessageCircle, ShieldCheck, Clock, CalendarCheck } from 'lucide-react';

interface FinalCTAProps {
  onExploreTours: () => void;
  onOpenMyBooking?: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onExploreTours, onOpenMyBooking }) => {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden bg-[#0E1B2A] text-white p-8 sm:p-14 border border-slate-800 shadow-2xl"
        >
          
          {/* Subtle background texture */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80')`,
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E1B2A] via-[#0E1B2A]/90 to-[#0A6C74]/40" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#60C3CC] mb-3">
              <span className="w-4 h-0.5 bg-[#60C3CC]"></span>
              <span>Direct Booking Guarantee</span>
            </div>

            <h2 className="font-display text-2xl sm:text-4xl text-white mb-4 leading-tight">
              Ready to explore the Red Sea?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 mb-8 leading-relaxed">
              Book your tour date online with free cancellation. Hotel pickup is included, and you can choose to pay when our driver picks you up.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                id="final-cta-explore-btn"
                onClick={onExploreTours}
                className="px-6 py-3.5 bg-[#0A6C74] hover:bg-[#08565C] text-white text-xs sm:text-sm font-semibold rounded-full flex items-center justify-center space-x-2 shadow transition-all group hover:scale-[1.02]"
              >
                <span>View All Tours</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="https://wa.me/201023456789"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-emerald-700/90 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-full flex items-center justify-center space-x-2 border border-emerald-600 transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              {onOpenMyBooking && (
                <button
                  type="button"
                  onClick={onOpenMyBooking}
                  className="px-5 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold rounded-full border border-slate-700 transition-all flex items-center justify-center space-x-1.5 hover:text-white"
                >
                  <CalendarCheck className="w-4 h-4 text-slate-400" />
                  <span>Find My Booking</span>
                </button>
              )}
            </div>

            {/* Micro guarantees */}
            <div className="flex flex-wrap items-center gap-5 mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-[#60C3CC]" />
                Instant booking confirmation
              </span>
              <span className="flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#60C3CC]" />
                Licensed Egyptian tour operator
              </span>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
};
