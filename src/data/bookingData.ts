import { PickupLocation, BookingExtra } from '../types/booking';

/**
 * Standard Demo Pickup Locations & Area Supplements
 * Kept in centralized structure so they can easily be replaced with live API / DB prices.
 */
export const DEMO_PICKUP_LOCATIONS: PickupLocation[] = [
  {
    id: 'hurghada',
    name: 'Hurghada Hotels',
    area: 'Hurghada (Mamsha, Dahar, Sheraton, Marina)',
    feeEurPerPerson: 0,
    note: 'Free pickup from any hotel inside Hurghada city area.',
    isPopular: true,
  },
  {
    id: 'el-gouna',
    name: 'El Gouna',
    area: 'El Gouna Resorts & Marina',
    feeEurPerPerson: 5,
    note: '+€5 per person transfer supplement (approx. 25-30 km north).',
    isPopular: true,
  },
  {
    id: 'makadi-bay',
    name: 'Makadi Bay',
    area: 'Makadi Bay & Madinat Makadi',
    feeEurPerPerson: 5,
    note: '+€5 per person transfer supplement (approx. 30 km south).',
    isPopular: true,
  },
  {
    id: 'sahl-hasheesh',
    name: 'Sahl Hasheesh',
    area: 'Sahl Hasheesh Bay & Old Town',
    feeEurPerPerson: 5,
    note: '+€5 per person transfer supplement (approx. 18 km south).',
    isPopular: true,
  },
  {
    id: 'safaga',
    name: 'Safaga & Soma Bay',
    area: 'Port Safaga, Soma Bay Peninsula',
    feeEurPerPerson: 10,
    note: '+€10 per person transfer supplement (approx. 50 km south).',
  },
  {
    id: 'marsa-alam',
    name: 'Marsa Alam',
    area: 'Marsa Alam / Port Ghalib (for local tours)',
    feeEurPerPerson: 10,
    note: 'Applicable for Marsa Alam departures or direct long-range private van.',
  },
];

/**
 * Centralized Optional Booking Extras
 * Supports both per_booking and per_person pricing types.
 */
export const GLOBAL_BOOKING_EXTRAS: BookingExtra[] = [
  {
    id: 'underwater-photos',
    name: 'Underwater Photos & Video Package',
    description: 'Professional photographer captures high-resolution underwater pictures and coral reef clips delivered via digital link.',
    priceEur: 20,
    pricingType: 'per_booking',
    category: 'Media',
  },
  {
    id: 'private-guide',
    name: 'Private Dedicated Guide / Dive Master',
    description: 'A personal marine guide exclusively dedicated to your party throughout the cruise and snorkeling stops.',
    priceEur: 50,
    pricingType: 'per_booking',
    category: 'Service',
  },
  {
    id: 'private-transfer',
    name: 'Private Hotel Transfer Van',
    description: 'Direct Mercedes / Toyota HiAce van without stopping at other resorts along the hotel strip.',
    priceEur: 30,
    pricingType: 'per_booking',
    category: 'Transfer',
  },
  {
    id: 'extra-diving',
    name: 'Extra Guided Scuba Diving Session',
    description: 'Additional 20-minute guided dive session with full gear and instructor under PADI standards.',
    priceEur: 25,
    pricingType: 'per_person',
    category: 'Activity',
  },
  {
    id: 'seafood-lunch',
    name: 'Premium Seafood Lunch Upgrade',
    description: 'Fresh grilled Red Sea jumbo prawns, calamari, and local catch added to the buffet.',
    priceEur: 15,
    pricingType: 'per_person',
    category: 'Dining',
  },
  {
    id: 'gopro-rental',
    name: '4K Action Camera (GoPro) Rental',
    description: 'Waterproof camera for the full day with chest/floating handle and 32GB MicroSD card to keep.',
    priceEur: 20,
    pricingType: 'per_booking',
    category: 'Equipment',
  },
];

/**
 * Common Country Codes with Dial Prefixes for International Guests
 */
export const COUNTRY_DIAL_CODES = [
  { code: 'EG', dial: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: 'DE', dial: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: 'GB', dial: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CH', dial: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', dial: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: 'NL', dial: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: 'FR', dial: '+33', country: 'France', flag: '🇫🇷' },
  { code: 'IT', dial: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: 'PL', dial: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', dial: '+420', country: 'Czech Republic', flag: '🇨🇿' },
  { code: 'BE', dial: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: 'SE', dial: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: 'US', dial: '+1', country: 'United States', flag: '🇺🇸' },
  { code: 'CA', dial: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: 'AE', dial: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', dial: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'RU', dial: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: 'UA', dial: '+380', country: 'Ukraine', flag: '🇺🇦' },
];

/**
 * Standard Terms and Cancellation Text for Modal Review
 */
export const BOOKING_LEGAL_TERMS = {
  title: 'Terms of Service & Cancellation Policy',
  lastUpdated: 'September 2026',
  sections: [
    {
      heading: '1. Booking & Voucher Confirmation',
      text: 'Upon completing your reservation, you will receive an official booking confirmation voucher containing your unique reference code, selected departure time, and hotel pickup instructions. In Pay at Pickup mode, no upfront charges are deducted.',
    },
    {
      heading: '2. Free Cancellation & Refund Guarantee',
      text: 'You may cancel or reschedule your booking free of charge up to 24 hours prior to the scheduled hotel pickup time. If cancellation is requested with at least 24 hours notice, no penalties apply. In the rare event of maritime port closure by the Egyptian Coast Guard due to unfavorable weather, a 100% full refund or free rescheduling is guaranteed.',
    },
    {
      heading: '3. Hotel Pickup & Maritime Regulations',
      text: 'Guests must wait in their hotel main reception lobby 10 minutes prior to the pickup window. The operations desk coordinates driver arrival via WhatsApp or phone. Please carry official identification (passport or hotel identity voucher) as mandated by maritime coast guard regulations.',
    },
    {
      heading: '4. Marine Park Conservation',
      text: 'All guests are requested to respect marine sanctuaries: touching or stepping on live coral reefs, taking shells or marine specimens, and discarding plastics are strictly prohibited by Egyptian National Park environmental laws.',
    },
  ],
};
