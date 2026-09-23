import React from 'react';
import { 
  Ship, 
  Waves, 
  Compass, 
  Sun, 
  Anchor, 
  Landmark, 
  ArrowRight 
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
    <section id="categories-section" className="py-16 sm:py-20 bg-white border-b border-[#E8E3DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0A6C74] mb-2">
            <span className="w-4 h-0.5 bg-[#0A6C74]"></span>
            <span>Curated Activities</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl text-[#0E1B2A] tracking-tight">
            Explore by Experience
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            Whether you seek calm shallow turquoise lagoons, offshore dolphin reef encounters, or sunset quad biking across desert mountain canyons.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOUR_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className="group relative rounded-sm overflow-hidden border border-[#E8E3DA] bg-stone-900 cursor-pointer h-72 flex flex-col justify-end p-6 hover:border-stone-400 transition-all duration-300"
            >
              {/* Background Photography */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              {/* Refined gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1B2A] via-[#0E1B2A]/60 to-transparent" />

              {/* Category Card Details */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-10 h-10 rounded-sm bg-[#0A6C74]/90 flex items-center justify-center border border-white/20">
                    {getIcon(cat.iconName)}
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-300 bg-black/40 px-2.5 py-1 rounded-xs backdrop-blur-xs border border-white/10">
                    {cat.tourCount} Excursions
                  </span>
                </div>

                <h3 className="font-display text-lg font-semibold text-white group-hover:text-[#60C3CC] transition-colors mb-1.5 flex items-center justify-between">
                  <span>{cat.name}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all text-[#60C3CC]" />
                </h3>

                <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
