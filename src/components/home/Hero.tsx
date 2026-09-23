import React from 'react';
import { ShieldCheck, Anchor, Clock, MapPin, Award, CheckCircle } from 'lucide-react';
import { SearchModule } from './SearchModule';

interface HeroProps {
  onSearch: (filters: { destination: string; category: string; date: string; guests: number }) => void;
  resultCount?: number;
}

export const Hero: React.FC<HeroProps> = ({ onSearch, resultCount }) => {
  return (
    <section className="relative w-full bg-[#0E1B2A] text-white overflow-hidden">
      {/* High-quality background image with editorial darkening overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-25 scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85')`,
        }}
        aria-hidden="true"
      />
      {/* Subtle deep marine gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0E1B2A]/90 via-[#0E1B2A]/75 to-[#0E1B2A]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-16 sm:pt-24 pb-14 sm:pb-20">
        
        {/* Verification Pill */}
        <div className="inline-flex items-center space-x-2 bg-[#16283D] border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs text-slate-300 mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-medium tracking-wide">Direct Vessel Operator in Hurghada & El Gouna</span>
          <span className="text-slate-500">|</span>
          <span className="text-[#0D838C] font-semibold">Over 45,000+ Guests Hosted</span>
        </div>

        {/* Clear, Practical Tourism Headline */}
        <div className="max-w-3xl mb-10">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.15] mb-5">
            Explore the Red Sea <br className="hidden sm:inline" />
            <span className="italic font-serif text-[#60C3CC]">Beyond the Shore</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
            Certified reef snorkeling excursions, private yacht charters, and desert quad safaris departing daily from Hurghada, El Gouna, and Makadi Bay. Professional skippers, hotel lobby transfers, and zero middleman markups.
          </p>
        </div>

        {/* Booking / Search Module */}
        <div className="w-full max-w-5xl mb-8">
          <SearchModule onSearch={onSearch} resultCount={resultCount} />
        </div>

        {/* Practical Trust Guarantees */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-4 border-t border-slate-800 text-xs text-slate-300">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0D838C] shrink-0" />
            <span>100% Weather Refund Guarantee</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-[#0D838C] shrink-0" />
            <span>Free 24h Prior Cancellation</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <MapPin className="w-4 h-4 text-[#0D838C] shrink-0" />
            <span>Hotel Lobby Pickup & Return</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <Award className="w-4 h-4 text-[#0D838C] shrink-0" />
            <span>Certified PADI & Marine Guides</span>
          </div>
        </div>

      </div>
    </section>
  );
};
