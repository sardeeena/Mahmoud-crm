import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Clock, Phone, Sparkles, ShieldCheck } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { getWhatsAppSupportUrl } from '../../services/exportService';

interface WhatsAppFloatingButtonProps {
  currentPath?: string;
  phoneNumber?: string;
  displayNumber?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  currentPath = '',
  phoneNumber = APP_CONFIG.WHATSAPP_NUMBER,
  displayNumber = APP_CONFIG.WHATSAPP_DISPLAY,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showTeaser, setShowTeaser] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Quick preset inquiry templates
  const inquiryPresets = [
    {
      label: '🚤 Tour Availability',
      message: 'Hello, I would like to check availability for upcoming boat tours this week.',
    },
    {
      label: '🚐 Hotel Pickup Question',
      message: 'Hello, could you please confirm hotel pickup areas and transfer times for my hotel?',
    },
    {
      label: '🛥️ Private Boat Charter',
      message: 'Hello, I would like to ask about chartering a private boat or speedboat.',
    },
    {
      label: '🎟️ Booking Assistance',
      message: 'Hello, I need help with an existing booking.',
    },
  ];

  // Show subtle teaser after 3 seconds on initial visit if not interacted with
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTeaser(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Dismiss popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Calculate clean WhatsApp deep-link
  const directUrl = getWhatsAppSupportUrl(
    undefined,
    customMessage.trim() || undefined
  );

  const handleLaunchWhatsApp = (msgText?: string) => {
    const textToSend = msgText || customMessage.trim();
    const url = getWhatsAppSupportUrl(undefined, textToSend || undefined);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    setShowTeaser(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setShowTeaser(false);
  };

  // Adjust bottom clearance for mobile views where bottom booking bar is present
  const isTourOrBooking = currentPath.includes('/tour/') || currentPath === '/booking';
  const bottomPositionClass = isTourOrBooking
    ? 'bottom-20 lg:bottom-6'
    : 'bottom-5 sm:bottom-6';

  return (
    <div
      className={`fixed right-4 sm:right-6 ${bottomPositionClass} z-50 flex flex-col items-end print:hidden select-none`}
      aria-label="WhatsApp Support Widget"
    >
      {/* Interactive Popover Dialog */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="whatsapp-chat-header"
          className="mb-3 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 origin-bottom-right"
        >
          {/* Card Header (Branded Red Sea Maritime Green) */}
          <div className="bg-[#0A6C74] text-white p-4 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="text-xl">⚓</span>
                  </div>
                  {/* Glowing live status indicator */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0A6C74] rounded-full"></span>
                </div>
                <div>
                  <h3 id="whatsapp-chat-header" className="font-semibold text-sm tracking-wide text-white flex items-center gap-1.5">
                    Tour Support Desk
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  </h3>
                  <div className="flex items-center text-[11px] text-teal-100 font-light space-x-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Online Now · Direct WhatsApp</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-teal-100/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close WhatsApp chat popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-teal-100/90 font-mono">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-300" />
                {displayNumber}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-200">
                <Clock className="w-3 h-3" />
                Quick reply
              </span>
            </div>
          </div>

          {/* Chat Body & Inquiry Presets */}
          <div className="p-4 bg-[#FAF8F5] space-y-3.5 text-xs text-stone-700 max-h-[65vh] overflow-y-auto">
            {/* Operator Welcome Bubble */}
            <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm border border-stone-200/70 text-stone-800 leading-relaxed space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium pb-1 border-b border-stone-100">
                <span>Hurghada Operations Desk</span>
                <span>Just now</span>
              </div>
              <p>
                Hello! 🌊 Have questions about tour availability, pickups, or private boat trips?
              </p>
              <p className="text-stone-500 text-[11px]">
                Choose a topic below or send us a message directly on WhatsApp.
              </p>
            </div>

            {/* Quick Inquiry Buttons */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                Quick Inquiries
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {inquiryPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLaunchWhatsApp(preset.message)}
                    className="w-full text-left px-3 py-2 bg-white hover:bg-teal-50/80 hover:border-teal-300 border border-stone-200/80 rounded-xl text-[11px] font-medium text-stone-700 hover:text-[#0A6C74] transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <span>{preset.label}</span>
                    <span className="text-stone-400 group-hover:text-[#0A6C74] group-hover:translate-x-0.5 transition-all text-xs">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Inquiry Box */}
            <div className="pt-1">
              <label htmlFor="whatsapp-custom-inquiry" className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Custom Question
              </label>
              <div className="relative">
                <textarea
                  id="whatsapp-custom-inquiry"
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="e.g. Can we book 6 guests for Orange Bay this Thursday?"
                  className="w-full p-2.5 pr-8 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#0A6C74] focus:ring-1 focus:ring-[#0A6C74] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleLaunchWhatsApp();
                    }
                  }}
                />
              </div>
            </div>

            {/* Action Button: Start WhatsApp Chat */}
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setIsOpen(false);
                setShowTeaser(false);
              }}
              className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] text-xs"
            >
              {/* WhatsApp Authentic SVG Icon */}
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.405z" />
              </svg>
              <span>Open in WhatsApp</span>
              <Send className="w-3.5 h-3.5" />
            </a>

            <div className="text-center text-[10px] text-stone-400 flex items-center justify-center gap-1">
              <span>Licensed Tour Operator in Hurghada</span>
              <span>·</span>
              <span>Quick response</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Teaser Pill (Shows briefly or on initial load to draw gentle attention) */}
      {!isOpen && showTeaser && (
        <div className="mb-2 bg-white/95 backdrop-blur-md text-stone-800 px-3.5 py-2 rounded-full shadow-lg border border-stone-200 text-xs flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-stone-700">Need help? Chat with us on WhatsApp</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTeaser(false);
            }}
            className="text-stone-400 hover:text-stone-600 ml-1 p-0.5"
            aria-label="Dismiss message"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Primary Floating WhatsApp Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id="floating-whatsapp-btn"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Chat with us on WhatsApp (+20 102 345 6789)"
        className={`group relative flex items-center justify-center w-14 h-14 sm:w-15 sm:h-15 rounded-full shadow-xl focus:outline-hidden focus:ring-4 focus:ring-emerald-400/40 transition-all duration-300 ${
          isOpen
            ? 'bg-stone-800 text-white rotate-90 scale-95 shadow-md'
            : 'bg-[#25D366] hover:bg-[#20bd5a] text-white hover:scale-105 active:scale-95'
        }`}
      >
        {/* Pulsing Aura Effect when closed */}
        {!isOpen && (
          <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-pulse pointer-events-none"></span>
        )}

        {isOpen ? (
          <X className="w-6 h-6 stroke-[2.5]" />
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Authentic WhatsApp SVG */}
            <svg
              className="w-7 h-7 fill-current drop-shadow-xs transform transition-transform group-hover:scale-110"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.405z" />
            </svg>
            {/* Live Green Online Badge */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-300 border-2 border-white rounded-full"></span>
          </div>
        )}
      </button>
    </div>
  );
};
