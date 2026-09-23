import React, { useState } from 'react';
import { 
  X, 
  CalendarCheck, 
  MapPin, 
  Clock, 
  User, 
  CheckCircle2, 
  Download, 
  MessageCircle, 
  AlertCircle 
} from 'lucide-react';
import { CurrencyConfig } from '../../types';

interface MyBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyConfig;
}

export const MyBookingModal: React.FC<MyBookingModalProps> = ({ isOpen, onClose, currency }) => {
  const [bookingRef, setBookingRef] = useState('RSE-88214');
  const [emailOrPhone, setEmailOrPhone] = useState('markus.weber@outlook.de');
  const [retrieved, setRetrieved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRetrieved(true);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-sm border border-[#E8E3DA] shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF8F5]">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-[#0A6C74]" />
            <h2 className="font-display text-lg font-bold text-[#0E1B2A]">
              Retrieve Booking Voucher
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-sm hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!retrieved ? (
            <form onSubmit={handleLookup} className="space-y-4">
              <p className="text-xs text-stone-600">
                Enter your booking confirmation reference number and the email or phone used during reservation to view your excursion voucher, pickup time, and status.
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Booking Reference Number
                </label>
                <input
                  type="text"
                  required
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
                  placeholder="e.g. RSE-88214"
                  className="w-full px-3 py-2 border border-stone-300 rounded text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-[#0A6C74]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address or WhatsApp Phone
                </label>
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="name@domain.com or +49 170 1234567"
                  className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#0A6C74]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#0A6C74] hover:bg-[#08565C] text-white text-xs font-semibold rounded transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? <span>Retrieving from Dispatch Database...</span> : <span>Find My Excursion</span>}
                </button>
              </div>

              <p className="text-[11px] text-stone-600 text-center">
                Need immediate help? Message our Hurghada pier coordinator directly on WhatsApp: +20 102 345 6789.
              </p>
            </form>
          ) : (
            <div className="space-y-5 animate-in fade-in">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">Booking Confirmed & Dispatched</span>
                    <span className="text-[11px] text-emerald-700 font-mono">Ref: {bookingRef}</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                  Active Voucher
                </span>
              </div>

              {/* Excursion Summary */}
              <div className="border border-stone-200 rounded p-4 space-y-3 bg-[#FAF8F5]">
                <h3 className="font-display font-bold text-sm text-[#0E1B2A]">
                  Orange Bay Island & Coral Reef Snorkeling Cruise with Lunch
                </h3>
                
                <div className="grid grid-cols-2 gap-3 text-xs text-stone-600">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Date</span>
                    <span className="font-semibold text-stone-800">Tomorrow, 08:30 AM</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Guests</span>
                    <span className="font-semibold text-stone-800">2 Adults</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Hotel Pickup</span>
                    <span className="font-semibold text-stone-800">08:15 AM (Steigenberger ALDAU Lobby)</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Departure Pier</span>
                    <span className="font-semibold text-stone-800">Hurghada Marina Berth B-14</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-500">Payment Status:</span>
                  <span className="font-bold text-emerald-700">Paid in Full (€64.00)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => alert(`Downloading confirmation voucher for ${bookingRef}...`)}
                  className="py-2 px-3 border border-stone-300 rounded text-xs font-semibold text-stone-800 hover:bg-stone-50 flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Download Voucher (PDF)</span>
                </button>
                <a
                  href="https://wa.me/201023456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Pier Support</span>
                </a>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setRetrieved(false)}
                  className="text-stone-500 hover:text-stone-800 text-[11px] underline"
                >
                  Look up another booking
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-medium text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
