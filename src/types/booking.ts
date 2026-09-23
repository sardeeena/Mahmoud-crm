import { Tour, CurrencyConfig } from './index';

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
}

export interface PickupLocation {
  id: string;
  name: string;
  area: string;
  feeEurPerPerson: number;
  feeEurFlat?: number;
  note?: string;
  isPopular?: boolean;
}

export interface BookingExtra {
  id: string;
  name: string;
  description: string;
  priceEur: number;
  pricingType: 'per_person' | 'per_booking';
  quantity?: number;
  category?: string;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  country: string;
  whatsappNumber?: string;
  hotelName?: string;
  roomNumber?: string;
  specialRequests?: string;
}

export interface BookingPricing {
  basePricePerAdultEur: number;
  basePricePerChildEur: number;
  adultSubtotalEur: number;
  childSubtotalEur: number;
  infantSubtotalEur: number;
  pickupSubtotalEur: number;
  pickupFeePerPersonEur: number;
  extrasSubtotalEur: number;
  extrasBreakdown: Array<{
    extraId: string;
    name: string;
    amountEur: number;
    pricingType: 'per_person' | 'per_booking';
    quantity: number;
  }>;
  discountEur: number;
  subtotalEur: number;
  totalEur: number;
  // Formatted representations in active currency
  formattedTotal: string;
  formattedSubtotal: string;
}

export type PaymentMethod = 'pay_at_pickup' | 'pay_online';

export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed';

export type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'cancellation_requested' 
  | 'cancelled' 
  | 'completed' 
  | 'no_show';

export interface Booking {
  bookingId: string;
  bookingReference: string; // e.g. RST-2026-AB4821
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  tourImage: string;
  tourDestination: string;
  tourDuration: string;
  date: string;
  guests: GuestCounts;
  pickup: {
    locationId: string;
    locationName: string;
    area: string;
    feeEur: number;
    hotelName?: string;
    roomNumber?: string;
  };
  extras: Array<{
    extraId: string;
    name: string;
    priceEur: number;
    pricingType: 'per_person' | 'per_booking';
    quantity: number;
    amountEur: number;
  }>;
  customer: CustomerInfo;
  pricing: BookingPricing;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  bookingStatus?: BookingStatus;
  timeline?: Array<{
    id: string;
    timestamp: string;
    title: string;
    description?: string;
    type?: string;
  }>;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CancellationRequest {
  bookingReference: string;
  reason: string;
  requestedAt: string;
  status: 'requested' | 'approved' | 'rejected';
}

export interface Availability {
  date: string;
  tourId: string;
  capacity: number;
  booked: number;
  remaining: number;
  isAvailable: boolean;
  isSoldOut: boolean;
  isPastDate: boolean;
  meetsMinimumNotice: boolean;
  minNoticeHours: number;
}
