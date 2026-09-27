import { Tour } from '../types';
import { Availability } from '../types/booking';
import { APP_CONFIG } from '../config/appConfig';

/**
 * Calculates earliest selectable booking date considering minimum notice hours
 */
export function getEarliestSelectableDate(minNoticeHours: number = APP_CONFIG.DEFAULT_MIN_BOOKING_NOTICE_HOURS): string {
  const now = new Date();
  const cutoffTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);
  
  // Format as YYYY-MM-DD
  const year = cutoffTime.getFullYear();
  const month = String(cutoffTime.getMonth() + 1).padStart(2, '0');
  const day = String(cutoffTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a given date string is in the past
 */
export function isDateInPast(dateStr: string): boolean {
  if (!dateStr) return true;
  const todayStr = new Date().toISOString().split('T')[0];
  return dateStr < todayStr;
}

/**
 * Checks if a selected date respects the minimum notice requirement
 */
export function meetsNoticeRequirement(dateStr: string, minNoticeHours: number): boolean {
  if (!dateStr) return false;
  const earliest = getEarliestSelectableDate(minNoticeHours);
  return dateStr >= earliest;
}

/**
 * Fleet Availability Engine
 * Calculates available vessel capacity and booking schedule based on tour ID, max guests, and date.
 */
export function getTourAvailability(
  tour: Tour,
  selectedDate: string
): Availability {
  const minNoticeHours = APP_CONFIG.DEFAULT_MIN_BOOKING_NOTICE_HOURS;
  const isPast = isDateInPast(selectedDate);
  const meetsNotice = meetsNoticeRequirement(selectedDate, minNoticeHours);

  // If invalid date or past date, return not available
  if (isPast || !meetsNotice || !selectedDate) {
    return {
      date: selectedDate || '',
      tourId: tour.id,
      capacity: tour.maxGuests || 24,
      booked: tour.maxGuests || 24,
      remaining: 0,
      isAvailable: false,
      isSoldOut: true,
      isPastDate: isPast,
      meetsMinimumNotice: meetsNotice,
      minNoticeHours,
    };
  }

  // Calculate deterministic capacity for this tour & date schedule
  const seedString = `${tour.id}-${selectedDate}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const capacity = tour.maxGuests || 20;
  // Vary booked slots between 30% and 85% of capacity
  const bookedPercent = 0.35 + (positiveHash % 50) / 100;
  const booked = Math.min(capacity, Math.round(capacity * bookedPercent));
  const remaining = Math.max(0, capacity - booked);

  return {
    date: selectedDate,
    tourId: tour.id,
    capacity,
    booked,
    remaining,
    isAvailable: remaining > 0,
    isSoldOut: remaining === 0,
    isPastDate: false,
    meetsMinimumNotice: true,
    minNoticeHours,
  };
}
