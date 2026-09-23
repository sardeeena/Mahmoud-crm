import React, { useState } from 'react';
import { 
  Phone, 
  Clock, 
  Menu, 
  X, 
  Search, 
  CalendarCheck, 
  MessageCircle, 
  Globe, 
  ChevronDown,
  Compass
} from 'lucide-react';
import { CurrencyConfig, CurrencyCode } from '../../types';
import { CURRENCY_CONFIGS } from '../../data/toursData';

interface HeaderProps {
  currentCurrency: CurrencyConfig;
  onCurrencyChange: (currency: CurrencyConfig) => void;
  onOpenMyBooking?: () => void;
  onNavigateSection?: (sectionId: string) => void;
  onNavigateHome?: () => void;
  onNavigateExcursions?: () => void;
  onNavigateBooking?: (tourSlug?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCurrency,
  onCurrencyChange,
  onOpenMyBooking,
  onNavigateSection,
  onNavigateHome,
  onNavigateExcursions,
  onNavigateBooking,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

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
      {/* Top Utility Bar */}
      <div className="bg-[#0E1B2A] text-slate-300 text-xs py-2 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-5 text-[11px] sm:text-xs">
            <span className="flex items-center text-slate-200 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
              Licensed Egyptian Tour Operator #2491/ETB
            </span>
            <span className="hidden md:inline-flex items-center text-slate-400">
              <Clock className="w-3.5 h-3.5 mr-1 text-[#0A6C74]" />
              Free 24h Cancellation on all boat trips & safaris
            </span>
          </div>

          <div className="flex items-center space-x-4 ml-auto">
            {/* Direct WhatsApp Hotline */}
            <a 
              href="https://wa.me/201023456789" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Pier Desk: </span>+20 102 345 6789
            </a>

            <div className="h-3 w-px bg-slate-700"></div>

            {/* Currency Selector */}
            <div className="relative">
              <button
                type="button"
                id="currency-selector-button"
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center space-x-1 text-slate-200 hover:text-white py-0.5 px-1.5 rounded transition-colors"
                aria-expanded={currencyDropdownOpen}
              >
                <span>{currentCurrency.code} ({currentCurrency.symbol})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {currencyDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-32 bg-[#16283D] border border-slate-700 rounded-md shadow-xl py-1 z-50 text-xs"
                  onMouseLeave={() => setCurrencyDropdownOpen(false)}
                >
                  {Object.keys(CURRENCY_CONFIGS).map((codeKey) => {
                    const curr = CURRENCY_CONFIGS[codeKey];
                    return (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => {
                          onCurrencyChange(curr);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-colors ${
                          currentCurrency.code === curr.code
                            ? 'bg-[#0A6C74] text-white font-medium'
                            : 'text-slate-200 hover:bg-slate-700/60'
                        }`}
                      >
                        <span>{curr.code}</span>
                        <span className="text-slate-400">{curr.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Language indicator */}
            <div className="hidden lg:flex items-center text-slate-400 space-x-1 pl-1">
              <Globe className="w-3 h-3 text-slate-400" />
              <span>EN</span>
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
              Hurghada & Sinai Maritime Tours
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center space-x-7 text-sm font-medium text-[#16283D]" aria-label="Main Navigation">
          <button 
            type="button"
            onClick={handleExcursionsClick} 
            className="hover:text-[#0A6C74] transition-colors py-1"
          >
            All Excursions
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('destinations-section')} 
            className="hover:text-[#0A6C74] transition-colors py-1"
          >
            Destinations
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('categories-section')} 
            className="hover:text-[#0A6C74] transition-colors py-1"
          >
            Experiences
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('why-us-section')} 
            className="hover:text-[#0A6C74] transition-colors py-1"
          >
            Why Choose Us
          </button>
          <button 
            type="button"
            onClick={() => handleNavClick('reviews-section')} 
            className="hover:text-[#0A6C74] transition-colors py-1"
          >
            Guest Reviews
          </button>
        </nav>

        {/* Action Controls */}
        <div className="hidden sm:flex items-center space-x-2.5">
          <button
            type="button"
            id="my-booking-header-btn"
            onClick={onOpenMyBooking}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-[#16283D] bg-stone-100 hover:bg-stone-200 border border-[#E8E3DA] rounded-sm transition-all"
          >
            <CalendarCheck className="w-3.5 h-3.5 mr-1.5 text-[#0A6C74]" />
            Find My Booking
          </button>

          <button
            type="button"
            onClick={handleExcursionsClick}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-sm shadow-2xs transition-all"
          >
            <Search className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
            Explore
          </button>

          <button
            type="button"
            id="book-excursion-header-btn"
            onClick={handleBookingClick}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-[#0A6C74] hover:bg-[#08565C] rounded-sm shadow-sm transition-all"
          >
            Book Excursion
          </button>
        </div>


        {/* Mobile menu button */}
        <div className="flex items-center space-x-2 lg:hidden">
          <button
            type="button"
            onClick={onOpenMyBooking}
            className="p-2 text-stone-700 hover:text-[#0A6C74] rounded-sm border border-stone-200"
            title="My Booking"
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
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8E3DA] bg-[#FAF8F5] px-5 py-5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3.5 text-base font-medium text-[#0E1B2A]">
            <button
              type="button"
              onClick={handleExcursionsClick}
              className="text-left py-2 px-3 rounded hover:bg-stone-100 text-[#0A6C74] font-semibold flex items-center justify-between"
            >
              <span>Explore All Excursions</span>
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('tours-section')}
              className="text-left py-2 px-3 rounded hover:bg-stone-100"
            >
              Popular Tours & Island Trips
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('destinations-section')}
              className="text-left py-2 px-3 rounded hover:bg-stone-100"
            >
              Destinations (Hurghada, El Gouna, Marsa Alam)
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('categories-section')}
              className="text-left py-2 px-3 rounded hover:bg-stone-100"
            >
              Experience Categories
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('why-us-section')}
              className="text-left py-2 px-3 rounded hover:bg-stone-100"
            >
              Safety & Guarantee Standards
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('reviews-section')}
              className="text-left py-2 px-3 rounded hover:bg-stone-100"
            >
              Customer Reviews
            </button>

            <div className="pt-3 border-t border-stone-200 flex flex-col space-y-2">
              <button
                type="button"
                onClick={handleBookingClick}
                className="w-full py-2.5 px-4 text-center font-bold text-sm bg-[#0A6C74] text-white rounded shadow-sm"
              >
                Book Excursion
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenMyBooking) onOpenMyBooking();
                }}
                className="w-full py-2.5 px-4 text-center font-semibold text-sm bg-stone-100 text-stone-800 rounded border border-stone-300"
              >
                Find My Booking (Status & Voucher)
              </button>
              <a
                href="https://wa.me/201023456789"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 text-center font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact Pier Desk on WhatsApp</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
