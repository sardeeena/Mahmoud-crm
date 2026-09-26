import React from 'react';
import { 
  Compass, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  MessageCircle,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { NewsletterSubscribe } from './NewsletterSubscribe';

interface FooterProps {
  onSelectDestination?: (dest: string) => void;
  onSelectCategory?: (cat: string) => void;
  onOpenMyBooking?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onOpenResetPassword?: () => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectDestination,
  onSelectCategory,
  onOpenMyBooking,
  onOpenLogin,
  onOpenRegister,
  onOpenResetPassword,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-[#0E1B2A] text-slate-400 text-xs border-t border-slate-800">
      
      {/* Top operational banner */}
      <div className="border-b border-slate-800/80 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded bg-slate-800/70 border border-slate-700 text-[#60C3CC]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-medium block text-xs">Hurghada Office</span>
              <span className="text-[11px] text-slate-400">Hurghada New Marina, Berth B-14, Red Sea, Egypt</span>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 rounded bg-slate-800/70 border border-slate-700 text-[#60C3CC]">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-medium block text-xs">Phone & Support</span>
              <span className="text-[11px] text-slate-400">+20 102 345 6789 (Daily 06:00 – 22:00)</span>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 rounded bg-slate-800/70 border border-slate-700 text-emerald-400">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-medium block text-xs">WhatsApp Support</span>
              <span className="text-[11px] text-slate-400">Quick reply in English, German & Russian</span>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 rounded bg-slate-800/70 border border-slate-700 text-[#60C3CC]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-medium block text-xs">Licensed Operator</span>
              <span className="text-[11px] text-slate-400">Egyptian Tourism Chamber License #2491/ETB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {/* Newsletter Subscription Card */}
        <div className="mb-12">
          <NewsletterSubscribe source="footer" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-3.5">
              <img 
                src="/logo.png" 
                alt="Red Sea Excursions Logo" 
                className="h-12 w-auto object-contain shrink-0 drop-shadow-xs"
              />
              <span className="font-display font-semibold text-white text-lg tracking-wide">
                RED SEA <span className="text-[#60C3CC]">EXCURSIONS</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-5 max-w-sm">
              Local boat tour and safari operator based in Hurghada Marina. Daily snorkeling trips, island visits, and desert safaris with hotel pickup and clear pricing.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Safety inspected boats and licensed local guides</span>
            </div>
          </div>

          {/* Destinations Col */}
          <div>
            <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-3.5">
              Destinations
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectDestination && onSelectDestination('Hurghada')}
                  className="hover:text-white transition-colors"
                >
                  Hurghada Excursions
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectDestination && onSelectDestination('El Gouna')}
                  className="hover:text-white transition-colors"
                >
                  El Gouna Cruises
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectDestination && onSelectDestination('Makadi Bay & Sahl Hasheesh')}
                  className="hover:text-white transition-colors"
                >
                  Makadi Bay & Sahl Hasheesh
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectDestination && onSelectDestination('Marsa Alam')}
                  className="hover:text-white transition-colors"
                >
                  Marsa Alam & Turtle Bay
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectDestination && onSelectDestination('Safaga & Soma Bay')}
                  className="hover:text-white transition-colors"
                >
                  Safaga & Sharm El Naga
                </button>
              </li>
            </ul>
          </div>

          {/* Experience Types */}
          <div>
            <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-3.5">
              Tour Categories
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory && onSelectCategory('Boat & Yacht Cruises')}
                  className="hover:text-white transition-colors"
                >
                  Orange Bay & Giftun Island
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory && onSelectCategory('Snorkeling Excursions')}
                  className="hover:text-white transition-colors"
                >
                  Dolphin House Snorkeling
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory && onSelectCategory('Scuba Diving (PADI)')}
                  className="hover:text-white transition-colors"
                >
                  Certified 2-Tank Boat Dives
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory && onSelectCategory('Desert Quad & Buggy Safaris')}
                  className="hover:text-white transition-colors"
                >
                  ATV Quad & Bedouin Dinner
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory && onSelectCategory('Private Charters & Speedboats')}
                  className="hover:text-white transition-colors"
                >
                  Private Speedboat Charters
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => onSelectCategory && onSelectCategory('Historical Day Trips (Luxor & Cairo)')}
                  className="hover:text-white transition-colors"
                >
                  Luxor & Valley of the Kings
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Area & Trust */}
          <div>
            <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-3.5">
              Customer Support
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  type="button" 
                  onClick={onOpenMyBooking}
                  className="text-[#60C3CC] hover:underline font-medium"
                >
                  My Booking & Voucher
                </button>
              </li>
              {onOpenLogin && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="hover:text-white transition-colors"
                  >
                    Customer Sign In
                  </button>
                </li>
              )}
              {onOpenRegister && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenRegister}
                    className="hover:text-white transition-colors"
                  >
                    Register Account
                  </button>
                </li>
              )}
              {onOpenResetPassword && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenResetPassword}
                    className="hover:text-white transition-colors text-slate-400"
                  >
                    Reset Password
                  </button>
                </li>
              )}
              <li>
                <span className="text-slate-400">Hotel Pickup Coverage</span>
              </li>
              <li>
                <span className="text-slate-400">Weather & Refund Policy</span>
              </li>
              <li>
                <span className="text-slate-400">Snorkeling Gear Safety</span>
              </li>
              <li>
                <span className="text-slate-400">Terms & Conditions</span>
              </li>
              <li>
                <span className="text-slate-400">Privacy Policy</span>
              </li>
              {onOpenAdmin && (
                <li className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="text-stone-400 hover:text-white flex items-center space-x-1.5 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A6C74]" />
                    <span>Admin Dashboard</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Payment Methods & Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Red Sea Excursions & Maritime Services S.A.E. All rights reserved.
          </div>

          <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
            <span className="text-slate-500">Accepted payment methods:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Visa</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Mastercard</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Apple Pay</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Cash on Pickup</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
