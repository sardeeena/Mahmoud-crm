import React from 'react';
import { motion } from 'motion/react';
import { 
  Ship, 
  Waves, 
  Compass, 
  Sun, 
  Anchor, 
  Landmark, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { TOUR_CATEGORIES } from '../../data/toursData';

interface ExperienceCategoriesProps {
  onSelectCategory: (categoryName: string) => void;
}

export const ExperienceCategories: React.FC<ExperienceCategoriesProps> = ({ onSelectCategory }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Ship': return <Ship className="w-5 h-5 text-white" />;
      case 'Waves': return <Waves className="w-5 h-5 text-white" />;
      case 'Compass': return <Compass className="w-5 h-5 text-white" />;
      case 'Sun': return <Sun className="w-5 h-5 text-white" />;
      case 'Anchor': return <Anchor className="w-5 h-5 text-white" />;
      case 'Landmark': return <Landmark className="w-5 h-5 text-white" />;
      default: return <Compass className="w-5 h-5 text-white" />;
    }
  };

  return (
    <section id="categories-section" className="py-16 sm:py-24 bg-white dark:bg-[#0A1118] border-b border-[#E8E3DA] dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0A6C74] dark:text-[#60C3CC] mb-2">
            <span className="w-5 h-0.5 bg-[#0A6C74] dark:bg-[#60C3CC] rounded-full"></span>
            <span>Curated Marine & Desert Adventures</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl text-[#0E1B2A] dark:text-white tracking-tight">
            Explore by Experience
          </h2>
          <p className="text-stone-600 dark:text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Whether you seek calm shallow turquoise lagoons, offshore dolphin reef encounters, or sunset quad biking across desert mountain canyons.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOUR_CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
              whileHover={{ y: -6 }}
              onClick={() => onSelectCategory(cat.name)}
              className="group relative rounded-2xl overflow-hidden border border-[#E8E3DA] dark:border-slate-700/80 bg-stone-100 dark:bg-stone-900 cursor-pointer h-80 flex flex-col justify-end p-6 hover:border-[#0A6C74]/70 hover:shadow-2xl transition-all duration-300"
            >
              {/* Background Photography with smooth slow zoom */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              
              {/* Refined gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/60 to-black/20 group-hover:via-stone-900/40 transition-colors" />

              {/* Category Card Details */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:bg-[#0A6C74] transition-all">
                    {getIcon(cat.iconName)}
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-white/90 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 font-mono">
                    {cat.tourCount} Excursions
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-white group-hover:text-[#60C3CC] transition-colors flex items-center justify-between">
                  <span>{cat.name}</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all text-[#60C3CC]">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </h3>

                <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
