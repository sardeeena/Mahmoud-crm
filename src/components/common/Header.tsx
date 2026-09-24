import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Menu, 
  X, 
  Search, 
  CalendarCheck, 
  MessageCircle, 
  Globe, 
  ChevronDown,
  Compass,
  Check,
  Heart,
  Scale
} from 'lucide-react';
import { CurrencyConfig } from '../../types';
import { CURRENCY_CONFIGS } from '../../data/toursData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useComparison } from '../../contexts/ComparisonContext';
import { LanguageCode } from '../../types/i18n';
import { WeatherConditionsBar } from './WeatherConditionsBar';

interface HeaderProps {
  currentCurrency: CurrencyConfig;
  onCurrencyChange: (currency: CurrencyConfig) => void;
  onOpenMyBooking?: () => void;
  onNavigateSection?: (sectionId: string) => void;
  onNavigateHome?: () => void;
  onNavigateExcursions?: () => void;
  onNavigateBooking?: (tourSlug?: string) => void;
  onOpenWishlist?: () => void;
  onOpenCompare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCurrency,
  onCurrencyChange,
  onOpenMyBooking,
  onNavigateSection,
  onNavigateHome,
  onNavigateExcursions,
  onNavigateBooking,
  onOpenWishlist,
  onOpenCompare,
}) => {
  const { language, setLanguage, currentLanguageConfig, supportedLanguages, t } = useLanguage();
  const { wishlistCount } = useWishlist();
  const { comparisonCount } = useComparison();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  const currencyRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleExcursionsClick = () => {
    setMobileMenuOpen(false);
    if (onNavigateExcursions) {
      onNavigateExcursions();
    } else {
      handleNavClick('tours-section');
    }
  };

  const handleBookingClick = () => {
    setMobileMenuOpen(false);
    if (onNavigateBooking) {
      onNavigateBooking();
    } else if (onNavigateExcursions) {
      onNavigateExcursions();
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E3DA] transition-all">
      {/* Real-time Maritime Weather & Sea Conditions Bar */}
      <WeatherConditionsBar />

      {/* Top Utility Bar */}
      <div className="bg-[#0E1B2A] text-slate-300 text-xs py-2 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-5 text-[11px] sm:text-xs">
            <span className="flex items-center text-slate-200 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
              {t('top.licensed')}
            </span>
            <span className="hidden md:inline-flex items-center text-slate-400">
              <Clock className="w-3.5 h-3.5 mr-1 text-[#0A6C74]" />
              {t('top.cancellation')}
            </span>
          </div>

          <div className="flex items-center space-x-3.5 ml-auto">
            {/* Direct WhatsApp Hotline */}
            <a 
              href="https://wa.me/201023456789" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-emerald-400 hover:text-emerald-300 transition-colors text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">{t('top.pierDesk')}: </span>+20 102 345 6789
            </a>

            <div className="h-3 w-px bg-slate-700"></div>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={languageRef}>
              <button
                type="button"
                id="language-selector-button"
                onClick={() => {
                  setLanguageDropdownOpen(!languageDropdownOpen);
                  setCurrencyDropdownOpen(false);
                }}
                className="flex items-center space-x-1.5 text-slate-200 hover:text-white py-0.5 px-2 rounded hover:bg-slate-800/80 transition-colors"
                aria-expanded={languageDropdownOpen}
                aria-haspopup="listbox"
                aria-label={`Current language: ${currentLanguageConfig.name}. Click to change language.`}
              >
                <span className="text-sm leading-none" aria-hidden="true">{currentLanguageConfig.flag}</span>
                <span className="font-semibold text-xs tracking-wider">{currentLanguageConfig.code.toUpperCase()}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${languageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {languageDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    role="listbox"
                    aria-label="Select website language"
                    className="absolute right-0 mt-1.5 w-44 bg-[#16283D] border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs overflow-hidden"
                  >
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-700/60 tracking-wider">
                      {t('top.language')}
                    </div>
                    {supportedLanguages.map((langItem) => {
                      const isSelected = language === langItem.code;
                      return (
                        <button
                          key={langItem.code}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setLanguage(langItem.code as LanguageCode);
                            setLanguageDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#0A6C74] text-white font-medium'
                              : 'text-slate-200 hover:bg-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base leading-none" aria-hidden="true">{langItem.flag}</span>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-white">{langItem.localName}</span>
                              <span className="text-[10px] text-slate-400">{langItem.name}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-3 w-px bg-slate-700"></div>

            {/* Currency Selector */}
            <div className="relative" ref={currencyRef}>
              <button
                type="button"
                id="currency-selector-button"
                onClick={() => {
                  setCurrencyDropdownOpen(!currencyDropdownOpen);
                  setLanguageDropdownOpen(false);
                }}
                className="flex items-center space-x-1 text-slate-200 hover:text-white py-0.5 px-1.5 rounded hover:bg-slate-800/80 transition-colors text-xs"
                aria-expanded={currencyDropdownOpen}
              >
                <span>{currentCurrency.code} ({currentCurrency.symbol})</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {currencyDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1.5 w-32 bg-[#16283D] border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs overflow-hidden"
                  >
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-700/60 tracking-wider">
                      {t('top.currency')}
                    </div>
                    {Object.keys(CURRENCY_CONFIGS).map((codeKey) => {
                      const curr = CURRENCY_CONFIGS[codeKey];
                      const isSelected = currentCurrency.code === curr.code;
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => {
                            onCurrencyChange(curr);
                            setCurrencyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#0A6C74] text-white font-medium'
                              : 'text-slate-200 hover:bg-slate-700/60'
                          }`}
                        >
                          <span>{curr.code}</span>
                          <span className="text-slate-400">{curr.symbol}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <a 
          href="/" 
          onClick={handleLogoClick}
          className="flex items-center space-x-3 group"
          id="brand-logo-link"
        >
          <div className="w-10 h-10 rounded-sm bg-[#0E1B2A] flex items-center justify-center text-[#E8E3DA] border border-[#0A6C74]/40 group-hover:border-[#0A6C74] transition-colors">
            <Compass className="w-6 h-6 text-[#0A6C74]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-semibold tracking-wider text-lg sm:text-xl text-[#0E1B2A] leading-tight">
              RED SEA <span className="text-[#0A6C74] font-medium">EXCURSIONS</span>
            </span>
            <span className="text-[10px] tracking-[0.16em] uppercase text-stone-500 font-medium">
              {t('nav.brandSubtitle')}
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center space-x-7 text-sm font-medium text-[#16283D]" aria-label="Main Navigation">
          <button 
            type="button"
            onClick={handleExcursionsClick} 
            className="hover:text-[#0A6C74] transition-colors py-1 cursor-pointer"
          >
            {t('nav.allExcursions')}
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('destinations-section')} 
            className="hover:text-[#0A6C74] transition-colors py-1 cursor-pointer"
          >
            {t('nav.destinations')}
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('categories-section')} 
            className="hover:text-[#0A6C74] transition-colors py-1 cursor-pointer"
          >
            {t('nav.experiences')}
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('why-us-section')} 
            className="hover:text-[#0A6C74] transition-colors py-1 cursor-pointer"
          >
            {t('nav.whyChooseUs')}
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('reviews-section')} 
            className="hover:text-[#0A6C74] transition-colors py-1 cursor-pointer"
          >
            {t('nav.guestReviews')}
          </button>
        </nav>

        {/* Action Controls */}
        <div className="hidden sm:flex items-center space-x-2">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="relative p-2 text-stone-700 hover:text-rose-600 bg-stone-100 hover:bg-rose-50 border border-stone-200 rounded-sm transition-colors cursor-pointer"
            title="Saved Excursions"
            aria-label={`View ${wishlistCount} saved excursions`}
          >
            <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Compare Button */}
          {comparisonCount > 0 && (
            <button
              type="button"
              onClick={onOpenCompare}
              className="relative p-2 text-stone-700 hover:text-[#0A6C74] bg-stone-100 hover:bg-[#E8F3F4] border border-stone-200 rounded-sm transition-colors cursor-pointer"
              title="Compare Excursions"
              aria-label={`Compare ${comparisonCount} excursions`}
            >
              <Scale className="w-4 h-4 text-[#0A6C74]" />
              <span className="absolute -top-1 -right-1 bg-[#0A6C74] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {comparisonCount}
              </span>
            </button>
          )}

          {/* Find My Booking */}
          <button
            type="button"
            id="my-booking-header-btn"
            onClick={onOpenMyBooking}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-[#16283D] bg-stone-100 hover:bg-stone-200 border border-[#E8E3DA] rounded-sm transition-all cursor-pointer"
          >
            <CalendarCheck className="w-3.5 h-3.5 mr-1.5 text-[#0A6C74]" />
            {t('nav.findMyBooking')}
          </button>

          {/* Explore */}
          <button
            type="button"
            onClick={handleExcursionsClick}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-sm shadow-2xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
            {t('nav.explore')}
          </button>

          {/* Book Excursion */}
          <button
            type="button"
            id="book-excursion-header-btn"
            onClick={handleBookingClick}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#0A6C74] hover:bg-[#08565C] rounded-sm shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
          >
            {t('nav.bookExcursion')}
          </button>
        </div>

        {/* Mobile menu button & Wishlist icon */}
        <div className="flex items-center space-x-2 lg:hidden">
          <button
            type="button"
            onClick={onOpenWishlist}
            className="relative p-2 text-stone-700 hover:text-rose-600 rounded-sm border border-stone-200"
            title="Saved Excursions"
          >
            <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenMyBooking}
            className="p-2 text-stone-700 hover:text-[#0A6C74] rounded-sm border border-stone-200"
            title={t('nav.findMyBooking')}
          >
            <CalendarCheck className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#0E1B2A] hover:bg-stone-100 rounded-sm border border-stone-200"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-[#E8E3DA] bg-[#FAF8F5] px-5 py-5 shadow-lg overflow-hidden"
          >
            <nav className="flex flex-col space-y-3.5 text-base font-medium text-[#0E1B2A]">
              {/* Mobile Language Selector */}
              <div className="p-3 bg-stone-100 rounded-lg border border-stone-200 space-y-2">
                <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#0A6C74]" />
                  {t('mobile.selectLanguage')}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {supportedLanguages.map((langItem) => {
                    const isSelected = language === langItem.code;
                    return (
                      <button
                        key={langItem.code}
                        type="button"
                        onClick={() => {
                          setLanguage(langItem.code as LanguageCode);
                        }}
                        className={`py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#0A6C74] text-white shadow-xs'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span aria-hidden="true">{langItem.flag}</span>
                        <span>{langItem.code.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wishlist link in mobile */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenWishlist) onOpenWishlist();
                }}
                className="text-left py-2 px-3 rounded hover:bg-stone-100 text-rose-600 font-semibold flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Saved Excursions</span>
                </div>
                <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {wishlistCount}
                </span>
              </button>

              {comparisonCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenCompare) onOpenCompare();
                  }}
                  className="text-left py-2 px-3 rounded hover:bg-stone-100 text-[#0A6C74] font-semibold flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Scale className="w-4 h-4" />
                    <span>Compare Excursions</span>
                  </div>
                  <span className="bg-[#E8F3F4] text-[#0A6C74] text-xs px-2 py-0.5 rounded-full font-bold">
                    {comparisonCount}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExcursionsClick}
                className="text-left py-2 px-3 rounded hover:bg-stone-100 text-[#0A6C74] font-semibold flex items-center justify-between"
              >
                <span>{t('nav.allExcursions')}</span>
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('tours-section')}
                className="text-left py-2 px-3 rounded hover:bg-stone-100"
              >
                {t('mobile.popularTours')}
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('destinations-section')}
                className="text-left py-2 px-3 rounded hover:bg-stone-100"
              >
                {t('mobile.destinationsDetailed')}
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('categories-section')}
                className="text-left py-2 px-3 rounded hover:bg-stone-100"
              >
                {t('mobile.categories')}
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('why-us-section')}
                className="text-left py-2 px-3 rounded hover:bg-stone-100"
              >
                {t('mobile.safety')}
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('reviews-section')}
                className="text-left py-2 px-3 rounded hover:bg-stone-100"
              >
                {t('mobile.reviews')}
              </button>

              <div className="pt-3 border-t border-stone-200 flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={handleBookingClick}
                  className="w-full py-2.5 px-4 text-center font-bold text-sm bg-[#0A6C74] text-white rounded shadow-sm"
                >
                  {t('nav.bookExcursion')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenMyBooking) onOpenMyBooking();
                  }}
                  className="w-full py-2.5 px-4 text-center font-semibold text-sm bg-stone-100 text-stone-800 rounded border border-stone-300"
                >
                  {t('mobile.findBookingSubtitle')}
                </button>
                <a
                  href="https://wa.me/201023456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 text-center font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t('mobile.contactWhatsApp')}</span>
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
