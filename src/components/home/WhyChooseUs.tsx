import React from 'react';
import { motion } from 'motion/react';
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
            <span>Direct Local Operator</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl text-[#0E1B2A] tracking-tight">
            Why Book Directly With Us
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            We operate our own boats, desert vehicles, and hotel transfers in Hurghada and El Gouna. You get honest prices, direct support, and experienced local captains.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRUST_PILLARS.map((pillar, idx) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: idx * 0.07 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-xl border border-[#E8E3DA] bg-[#FAF8F5] flex flex-col justify-between hover:border-stone-400 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-white border border-[#E8E3DA] flex items-center justify-center mb-4 shadow-2xs group-hover:scale-105 transition-transform">
                  {getIcon(pillar.iconName)}
                </div>
                <h3 className="font-display text-base font-semibold text-[#0E1B2A] mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center text-[11px] text-[#0A6C74] font-medium">
                <FileCheck2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>Verified Direct Fleet Standard</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
