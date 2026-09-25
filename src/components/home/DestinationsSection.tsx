import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, ArrowUpRight } from 'lucide-react';
import { POPULAR_DESTINATIONS } from '../../data/toursData';

interface DestinationsSectionProps {
  onSelectDestination: (destName: string) => void;
}

export const DestinationsSection: React.FC<DestinationsSectionProps> = ({ onSelectDestination }) => {
  return (
    <section id="destinations-section" className="py-16 sm:py-24 bg-[#FAF8F5] border-b border-[#E8E3DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0A6C74] mb-2">
              <span className="w-5 h-0.5 bg-[#0A6C74] rounded-full"></span>
              <span>Red Sea Coastal Regions</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl text-[#0E1B2A] tracking-tight">
              Destinations We Serve
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Daily scheduled boat departures and door-to-door hotel transfers covering the premier coastal hubs of the Egyptian Red Sea.
            </p>
          </div>
          <div className="text-xs text-stone-500 flex items-center bg-white px-3.5 py-2 rounded-xl border border-stone-200/80 shadow-2xs">
            <Navigation className="w-4 h-4 text-[#0A6C74] mr-2 shrink-0" />
            <span>Complimentary hotel pickup from all main resorts</span>
          </div>
        </div>

        {/* Destination Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_DESTINATIONS.map((dest, idx) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              whileHover={{ y: -6 }}
              onClick={() => onSelectDestination(dest.name)}
              className={`group bg-white rounded-2xl border border-[#E8E3DA] overflow-hidden cursor-pointer hover:border-[#0A6C74]/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                idx === 0 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div>
                {/* Photo container */}
                <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute top-3 left-3 bg-[#0E1B2A]/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/10 shadow-sm font-mono">
                    {dest.tourCount} Excursions
                  </div>
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md text-stone-800 text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs border border-stone-200/50">
                    {dest.distanceFromAirport}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-[#0E1B2A] group-hover:text-[#0A6C74] transition-colors flex items-center">
                      <MapPin className="w-4 h-4 text-[#0A6C74] mr-1.5 shrink-0" />
                      {dest.name}
                    </h3>
                    <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-[#0A6C74] group-hover:text-white transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs text-[#0A6C74] font-semibold">
                    {dest.tagline}
                  </p>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {dest.description}
                  </p>

                  {/* Highlights unboxed with typographic separators */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-stone-500">
                    {dest.highlights.map((hl, i) => (
                      <span key={i} className="inline-flex items-center">
                        <span className="text-stone-700 font-medium">{hl}</span>
                        {i < dest.highlights.length - 1 && <span className="text-stone-300 ml-1.5">·</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action strip */}
              <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between text-xs font-semibold text-[#0A6C74] group-hover:bg-[#E8F3F4]/40 transition-colors">
                <span>View {dest.name} Schedule & Rates</span>
                <span className="text-stone-400 group-hover:translate-x-1 group-hover:text-[#0A6C74] transition-all">→</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
