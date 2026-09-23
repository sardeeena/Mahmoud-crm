import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  Bus, 
  Clock, 
  Headphones, 
  CheckCircle,
  FileCheck2
} from 'lucide-react';
import { TRUST_PILLARS } from '../../data/toursData';

export const WhyChooseUs: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-[#0A6C74]" />;
      case 'Award': return <Award className="w-5 h-5 text-[#0A6C74]" />;
      case 'Bus': return <Bus className="w-5 h-5 text-[#0A6C74]" />;
      case 'Clock': return <Clock className="w-5 h-5 text-[#0A6C74]" />;
      case 'Headphones': return <Headphones className="w-5 h-5 text-[#0A6C74]" />;
      default: return <CheckCircle className="w-5 h-5 text-[#0A6C74]" />;
    }
  };

  return (
    <section id="why-us-section" className="py-16 sm:py-20 bg-white border-b border-[#E8E3DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0A6C74] mb-2">
            <span className="w-4 h-0.5 bg-[#0A6C74]"></span>
            <span>Operational Integrity</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl text-[#0E1B2A] tracking-tight">
            Why Book Your Excursions With Us
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            Unlike online reseller platforms that resell vouchers with unknown sub-contractors, we directly operate our own marine vessels, desert base stations, and transfer fleet in Hurghada and El Gouna.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRUST_PILLARS.map((pillar, idx) => (
            <div
              key={pillar.id}
              className="p-6 rounded-sm border border-[#E8E3DA] bg-[#FAF8F5] flex flex-col justify-between hover:border-stone-400 transition-colors"
            >
              <div>
                <div className="w-10 h-10 rounded-sm bg-white border border-[#E8E3DA] flex items-center justify-center mb-4 shadow-xs">
                  {getIcon(pillar.iconName)}
                </div>
                <h3 className="font-display text-base font-semibold text-[#0E1B2A] mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-200/70 flex items-center text-[11px] font-semibold text-[#0A6C74]">
                <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Verified Standard</span>
              </div>
            </div>
          ))}

          {/* Direct Pier Operations Highlight Card */}
          <div className="p-6 rounded-sm border border-[#0A6C74]/40 bg-[#0E1B2A] text-white flex flex-col justify-between">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-xs bg-[#0A6C74] text-[10px] font-bold tracking-wider uppercase mb-3 text-white">
                Marina Pier Dispatch
              </div>
              <h3 className="font-display text-base font-semibold text-white mb-2">
                Real-Time Harbor Tracking
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Our pier coordinators at Hurghada New Marina and El Gouna Abu Tig coordinate vessel departures with the Red Sea Port Authority daily to ensure optimal sea conditions and passenger safety.
              </p>
            </div>
            
            <div className="mt-5 pt-3 border-t border-slate-700 text-xs text-[#60C3CC] font-medium flex items-center justify-between">
              <span>Egyptian Coast Guard Certified</span>
              <span>✓ Safety Audited</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
