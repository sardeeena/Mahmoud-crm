import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Clock, MapPin, Award } from 'lucide-react';
import { SearchModule } from './SearchModule';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeroProps {
  onSearch: (filters: { destination: string; category: string; date: string; guests: number }) => void;
  resultCount?: number;
}

export const Hero: React.FC<HeroProps> = ({ onSearch, resultCount }) => {
  const { t } = useLanguage();

  return (
    <section className="relative w-full bg-[#0E1B2A] text-white overflow-hidden">
      {/* High-quality background image with editorial darkening overlay */}
      <motion.div 
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1.02, opacity: 0.28 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0 bg-cover bg-center mix-blend-luminosity"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85')`,
        }}
        aria-hidden="true"
      />
      {/* Subtle deep marine gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0E1B2A]/90 via-[#0E1B2A]/75 to-[#0E1B2A]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-12 sm:pb-16">
        
        {/* Verification Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 bg-[#16283D] border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs text-slate-300 mb-6 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium tracking-wide">{t('hero.badge')}</span>
          <span className="text-slate-500">|</span>
          <span className="text-[#0D838C] font-semibold">{t('hero.guestsHosted')}</span>
        </motion.div>

        {/* Clear, Practical Tourism Headline */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mb-8"
        >
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.15] mb-4">
            {t('hero.title1')} <br className="hidden sm:inline" />
            <span className="italic font-serif text-[#60C3CC]">{t('hero.title2')}</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
            {t('hero.subtitle')}
          </p>
        </motion.div>

        {/* Booking / Search Module */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-5xl mb-8"
        >
          <SearchModule onSearch={onSearch} resultCount={resultCount} />
        </motion.div>

        {/* Practical Trust Guarantees */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-4 border-t border-slate-800 text-xs text-slate-300"
        >
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0D838C] shrink-0" />
            <span>{t('hero.guarantee1')}</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-[#0D838C] shrink-0" />
            <span>{t('hero.guarantee2')}</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <MapPin className="w-4 h-4 text-[#0D838C] shrink-0" />
            <span>{t('hero.guarantee3')}</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <Award className="w-4 h-4 text-[#0D838C] shrink-0" />
            <span>{t('hero.guarantee4')}</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
