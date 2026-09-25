import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Award, 
  Compass, 
  Sparkles,
  Waves,
  Eye,
  Thermometer,
  Wind
} from 'lucide-react';
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
      {/* High-quality background image with smooth slow ambient zoom */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1.03, opacity: 0.35 }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85')`,
        }}
        aria-hidden="true"
      />

      {/* Decorative ambient gradient light orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#0A6C74]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#60C3CC]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle deep marine gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0E1B2A]/90 via-[#0E1B2A]/80 to-[#0E1B2A]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
        
        {/* Top Live Reef & Marine Conditions Ticker */}
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center gap-2 mb-6"
        >
          {/* Active Status Badge */}
          <div className="inline-flex items-center space-x-2 bg-[#16283D]/90 border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs text-slate-200 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-semibold tracking-wide text-white">{t('hero.badge')}</span>
            <span className="text-slate-600">|</span>
            <span className="text-[#60C3CC] font-semibold">{t('hero.guestsHosted')}</span>
          </div>

          {/* Live Marine Condition Badges (Red Sea Real-time telemetry) */}
          <div className="hidden sm:inline-flex items-center space-x-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-[11px] text-slate-300 backdrop-blur-md">
            <span className="flex items-center space-x-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>Water 26°C</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Visibility 28m</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center space-x-1">
              <Waves className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dolphin Pods Active</span>
            </span>
          </div>
        </motion.div>

        {/* Clear, Practical Tourism Headline */}
        <div className="max-w-3xl mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.12] mb-4"
          >
            {t('hero.title1')}{' '}
            <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#60C3CC] to-[#A3E8ED]">
              {t('hero.title2')}
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base lg:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl"
          >
            {t('hero.subtitle')}
          </motion.p>
        </div>

        {/* Booking / Search Module */}
        <motion.div 
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="w-full max-w-5xl mb-8"
        >
          <SearchModule onSearch={onSearch} resultCount={resultCount} />
        </motion.div>

        {/* Practical Trust Guarantees */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-5 border-t border-slate-800/80 text-xs text-slate-300"
        >
          <div className="flex items-center space-x-2.5 group cursor-default">
            <div className="w-8 h-8 rounded-lg bg-[#16283D] flex items-center justify-center text-[#60C3CC] border border-slate-700/60 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4 shrink-0" />
            </div>
            <span className="font-medium">{t('hero.guarantee1')}</span>
          </div>

          <div className="flex items-center space-x-2.5 group cursor-default">
            <div className="w-8 h-8 rounded-lg bg-[#16283D] flex items-center justify-center text-[#60C3CC] border border-slate-700/60 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4 shrink-0" />
            </div>
            <span className="font-medium">{t('hero.guarantee2')}</span>
          </div>

          <div className="flex items-center space-x-2.5 group cursor-default">
            <div className="w-8 h-8 rounded-lg bg-[#16283D] flex items-center justify-center text-[#60C3CC] border border-slate-700/60 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4 shrink-0" />
            </div>
            <span className="font-medium">{t('hero.guarantee3')}</span>
          </div>

          <div className="flex items-center space-x-2.5 group cursor-default">
            <div className="w-8 h-8 rounded-lg bg-[#16283D] flex items-center justify-center text-[#60C3CC] border border-slate-700/60 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4 shrink-0" />
            </div>
            <span className="font-medium">{t('hero.guarantee4')}</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
