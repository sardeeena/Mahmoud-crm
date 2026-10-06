import { DbVessel, DbGuide, DbWeatherBulletin, DbBookingPassenger } from './database';

export type OperationalStatus =
  | 'Scheduled'
  | 'Preparing'
  | 'Ready'
  | 'Departed'
  | 'Completed'
  | 'Cancelled';

export type PickupStatus = 'Waiting' | 'Picked Up' | 'No Show' | 'Cancelled';

export interface OperationalDeparture {
  id: string;
  tourId: string;
  tourTitle: string;
  tourSlug: string;
  date: string; // YYYY-MM-DD
  departureTime: string; // e.g. "08:30"
  bookingsCount: number;
  passengerCount: number;
  adultCount: number;
  childCount: number;
  infantCount: number;
  pickupLocations: Array<{
    name: string;
    time: string;
    passengerCount: number;
    hotelName?: string;
  }>;
  vesselId: string | null;
  vesselName: string | null;
  vesselType: string | null;
  vesselCapacity: number | null;
  guideId: string | null;
  guideName: string | null;
  guideRole: string | null;
  operationalStatus: OperationalStatus;
  paymentSummary: {
    paidCount: number;
    pendingCount: number;
    totalEur: number;
    outstandingEur: number;
  };
  weatherCleared: boolean;
  notes: string | null;
}

export interface PickupScheduleItem {
  id: string;
  bookingId: string;
  bookingReference: string;
  customerName: string;
  customerPhone: string | null;
  hotelName: string;
  roomNumber: string | null;
  pickupArea: string;
  pickupTime: string;
  passengerCount: number;
  tourTitle: string;
  tourDate: string;
  departureTime: string;
  driverVehicle: string | null;
  status: PickupStatus;
  specialRequests: string | null;
}

export interface PassengerManifestItem {
  id: string;
  bookingId: string;
  bookingReference: string;
  tourId: string;
  tourTitle: string;
  tourDate: string;
  departureTime: string;
  fullName: string;
  nationality: string | null;
  passportOrId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  passengerType: 'adult' | 'child' | 'infant';
  phone: string | null;
  hotel: string | null;
  specialRequests: string | null;
  isLeadPassenger: boolean;
}

export interface AvailabilitySlot {
  id: string;
  tourId: string;
  tourTitle: string;
  date: string; // YYYY-MM-DD
  maxCapacity: number;
  bookedCount: number;
  remainingCapacity: number;
  status: 'available' | 'unavailable' | 'sold_out';
  departureTime: string;
  notes: string | null;
  isBlackout: boolean;
}

export interface OperationalAssignment {
  id: string;
  tourId: string;
  tourTitle?: string;
  date: string;
  departureTime: string;
  vesselId: string | null;
  vesselName?: string | null;
  guideId: string | null;
  guideName?: string | null;
  status: OperationalStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalDocument {
  id: string;
  type: 'passenger_manifest' | 'coast_guard_packet' | 'pickup_run_sheet' | 'captain_briefing';
  title: string;
  date: string;
  tourTitle?: string;
  vesselName?: string;
  passengerCount?: number;
}
