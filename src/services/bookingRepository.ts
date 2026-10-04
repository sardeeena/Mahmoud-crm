import { Booking, BookingStatus } from '../types/booking';
import {
  supabase,
  isSupabaseConfigured,
  formatSupabaseError,
  isSchemaMissing,
  isSchemaMissingError,
  setSchemaMissing,
} from './supabaseClient';
import { DbBooking } from '../types/database';
import { bookingRateLimiter } from '../lib/security';

export interface IBookingRepository {
  createBooking(booking: Booking): Promise<Booking>;
  getBooking(bookingReference: string): Promise<Booking | null>;
  findBooking(bookingReference: string, emailOrPhone: string): Promise<Booking | null>;
  getBookingsByEmail(email: string): Promise<Booking[]>;
  updateBooking(booking: Booking): Promise<Booking>;
  cancelBooking(bookingReference: string, reason: string): Promise<Booking | null>;
  listBookings(filters?: { status?: string; limit?: number }): Promise<Booking[]>;
}

export function generateBookingReference(): string {
  const currentYear = new Date().getFullYear();
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const char1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const char2 = letters.charAt(Math.floor(Math.random() * letters.length));
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `RST-${currentYear}-${char1}${char2}${digits}`;
}

export function validateBookingPayload(booking: Booking): { isValid: boolean; error?: string } {
  if (!booking.bookingReference || !booking.bookingReference.startsWith('RST-')) {
    return { isValid: false, error: 'Invalid booking reference format. Must start with RST-' };
  }
  if (!booking.customer || !booking.customer.email || !booking.customer.email.includes('@')) {
    return { isValid: false, error: 'A valid customer email address is required.' };
  }
  if (!booking.customer.firstName || booking.customer.firstName.trim().length === 0) {
    return { isValid: false, error: 'Customer first name is required.' };
  }
  if (!booking.guests || booking.guests.adults < 1) {
    return { isValid: false, error: 'At least one adult passenger is required.' };
  }
  if (!booking.date || isNaN(new Date(booking.date).getTime())) {
    return { isValid: false, error: 'A valid excursion departure date is required.' };
  }
  return { isValid: true };
}

const SEED_BOOKINGS: Booking[] = [];

class SupabaseBookingRepository implements IBookingRepository {
  private localKey = 'rse_bookings_cache';

  private getLocalBookings(): Booking[] {
    try {
      const data = localStorage.getItem(this.localKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return [];
  }

  private saveLocalBookings(bookings: Booking[]): void {
    try {
      localStorage.setItem(this.localKey, JSON.stringify(bookings));
    } catch {
      // ignore
    }
  }

  async createBooking(booking: Booking): Promise<Booking> {
    const validation = validateBookingPayload(booking);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid booking details provided.');
    }

    const limit = bookingRateLimiter.check();
    if (limit.isLocked) {
      throw new Error(`Too many reservation requests submitted. Please wait ${limit.remainingSeconds} seconds before trying again.`);
    }

    // 1. Always keep local copy for instant client state
    const currentLocal = this.getLocalBookings();
    const updatedLocal = [booking, ...currentLocal.filter((b) => b.bookingReference !== booking.bookingReference)];
    this.saveLocalBookings(updatedLocal);
    bookingRateLimiter.recordFailedAttempt();

    if (!isSupabaseConfigured()) {
      return booking;
    }

    try {
      // Check if an authenticated user session exists to associate user_id
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || null;

      // Insert customer record first
      const { data: customerRecord, error: custError } = await supabase
        .from('customers')
        .insert({
          user_id: currentUserId,
          first_name: booking.customer.firstName,
          last_name: booking.customer.lastName,
          email: booking.customer.email.toLowerCase(),
          phone: `${booking.customer.countryCode} ${booking.customer.phoneNumber}`,
          whatsapp: booking.customer.whatsappNumber || null,
          country: booking.customer.country,
          hotel: booking.customer.hotelName || booking.pickup.hotelName || null,
        })
        .select('id')
        .single();

      if (custError) {
        console.warn('Customer insert notice:', custError);
      }

      const customerId = customerRecord?.id || null;

      // Find real tour id if booking passed slug
      let realTourId = booking.tourId;
      if (!realTourId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { data: matchedTour } = await supabase
          .from('tours')
          .select('id')
          .eq('slug', booking.tourSlug)
          .maybeSingle();

        if (matchedTour) {
          realTourId = matchedTour.id;
        }
      }

      // Insert main booking record with user_id
      const { data: dbBooking, error: bookError } = await supabase
        .from('bookings')
        .insert({
          booking_reference: booking.bookingReference,
          user_id: currentUserId,
          tour_id: realTourId,
          customer_id: customerId,
          booking_date: booking.date,
          status: booking.status,
          payment_status: booking.paymentStatus,
          payment_method: booking.paymentMethod,
          adult_count: booking.guests.adults,
          child_count: booking.guests.children,
          infant_count: booking.guests.infants,
          pickup_hotel_name: booking.pickup.hotelName || null,
          pickup_room_number: booking.pickup.roomNumber || null,
          subtotal: booking.pricing.subtotalEur,
          extras_total: booking.pricing.extrasSubtotalEur,
          discount: booking.pricing.discountEur,
          total: booking.pricing.totalEur,
          currency: 'EUR',
          special_requests: booking.customer.specialRequests || null,
        })
        .select('id')
        .single();

      if (bookError) {
        console.warn('Booking insertion to Supabase encountered issue:', bookError);
        return booking;
      }

      // Insert extras breakdown if any
      if (dbBooking && booking.extras.length > 0) {
        const extrasRows = booking.extras.map((ex) => ({
          booking_id: dbBooking.id,
          name: ex.name,
          quantity: ex.quantity || 1,
          unit_price: ex.priceEur,
          total_price: ex.amountEur,
          pricing_type: ex.pricingType,
        }));
        await supabase.from('booking_extras').insert(extrasRows);
      }

      return booking;
    } catch (err) {
      console.error('Failed to create booking in Supabase, using local copy:', err);
      return booking;
    }
  }

  async getBooking(bookingReference: string): Promise<Booking | null> {
    const cleanRef = bookingReference.trim().toUpperCase();

    if (!isSupabaseConfigured()) {
      const found = this.getLocalBookings().find((b) => b.bookingReference.toUpperCase() === cleanRef);
      return found || null;
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          tours (*),
          customers (*),
          booking_extras (*)
        `)
        .eq('booking_reference', cleanRef)
        .maybeSingle();

      if (error || !data) {
        const local = this.getLocalBookings().find((b) => b.bookingReference.toUpperCase() === cleanRef);
        return local || null;
      }

      return this.mapDbToBooking(data);
    } catch {
      const local = this.getLocalBookings().find((b) => b.bookingReference.toUpperCase() === cleanRef);
      return local || null;
    }
  }

  async findBooking(bookingReference: string, emailOrPhone: string): Promise<Booking | null> {
    const b = await this.getBooking(bookingReference);
    if (!b) return null;

    const query = emailOrPhone.trim().toLowerCase();
    const emailMatch = b.customer.email.toLowerCase() === query;
    const phoneMatch = b.customer.phoneNumber.replace(/\s+/g, '').includes(query.replace(/\s+/g, ''));

    if (emailMatch || phoneMatch) {
      return b;
    }

    return null;
  }

  async getBookingsByEmail(email: string): Promise<Booking[]> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return [];

    if (!isSupabaseConfigured() || isSchemaMissing()) {
      return this.getLocalBookings().filter((b) => b.customer.email.toLowerCase() === cleanEmail);
    }

    try {
      // Query bookings directly filtering by customer email or user_id
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          tours (*),
          customers!inner (*),
          booking_extras (*)
        `)
        .ilike('customers.email', cleanEmail)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => this.mapDbToBooking(d));
      }

      // Fallback to checking local storage
      const local = this.getLocalBookings().filter((b) => b.customer.email.toLowerCase() === cleanEmail);
      if (local.length > 0) return local;

      // If inner join returned empty, try regular listBookings
      const all = await this.listBookings();
      return all.filter((b) => b.customer.email.toLowerCase() === cleanEmail);
    } catch {
      return this.getLocalBookings().filter((b) => b.customer.email.toLowerCase() === cleanEmail);
    }
  }

  async updateBooking(booking: Booking): Promise<Booking> {
    const local = this.getLocalBookings().map((item) => (item.bookingReference === booking.bookingReference ? booking : item));
    this.saveLocalBookings(local);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('bookings')
          .update({
            status: booking.status,
            payment_status: booking.paymentStatus,
            pickup_hotel_name: booking.pickup.hotelName,
            pickup_room_number: booking.pickup.roomNumber,
            special_requests: booking.customer.specialRequests,
            updated_at: new Date().toISOString(),
          })
          .eq('booking_reference', booking.bookingReference);
      } catch (err) {
        console.warn('Update booking Supabase error:', err);
      }
    }

    return booking;
  }

  async cancelBooking(bookingReference: string, reason: string): Promise<Booking | null> {
    const existing = await this.getBooking(bookingReference);
    if (!existing) return null;

    const updated: Booking = {
      ...existing,
      status: 'cancellation_requested',
      timeline: [
        ...(existing.timeline || []),
        {
          id: `ev-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: 'Cancellation Requested',
          description: reason,
          type: 'cancellation',
        },
      ],
      cancellationReason: reason,
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('bookings')
          .update({
            status: 'cancellation_requested',
            cancellation_reason: reason,
            updated_at: new Date().toISOString(),
          })
          .eq('booking_reference', bookingReference);
      } catch (err) {
        console.warn('Cancel booking in Supabase notice:', err);
      }
    }

    return this.updateBooking(updated);
  }

  async listBookings(filters?: { status?: string; limit?: number }): Promise<Booking[]> {
    if (!isSupabaseConfigured() || isSchemaMissing()) {
      let all = this.getLocalBookings();
      if (filters?.status && filters.status !== 'all') {
        all = all.filter((b) => b.status === filters.status);
      }
      return all;
    }

    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          tours (*),
          customers (*),
          booking_extras (*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error || !data) {
        if (error && isSchemaMissingError(error)) {
          setSchemaMissing(true);
        }
        return this.getLocalBookings();
      }

      return data.map((d: any) => this.mapDbToBooking(d));
    } catch (err) {
      if (isSchemaMissingError(err)) {
        setSchemaMissing(true);
      }
      return this.getLocalBookings();
    }
  }

  private mapDbToBooking(data: any): Booking {
    const tour = data.tours || {};
    const customer = data.customers || {};
    const extras = data.booking_extras || [];

    return {
      bookingId: data.id,
      bookingReference: data.booking_reference,
      tourId: data.tour_id,
      tourSlug: tour.slug || 'orange-bay-island-snorkeling',
      tourTitle: tour.title || 'Red Sea Excursion',
      tourImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      tourDestination: 'Hurghada',
      tourDuration: tour.duration || 'Full Day (approx. 7 hours)',
      date: data.booking_date,
      guests: {
        adults: data.adult_count || 1,
        children: data.child_count || 0,
        infants: data.infant_count || 0,
      },
      pickup: {
        locationId: data.pickup_location_id || 'hurghada',
        locationName: 'Hurghada Hotels',
        area: 'Hurghada Coastal Area',
        feeEur: 0,
        hotelName: data.pickup_hotel_name || customer.hotel || 'Hotel Lobby',
        roomNumber: data.pickup_room_number || '',
      },
      extras: extras.map((ex: any) => ({
        extraId: ex.id,
        name: ex.name,
        priceEur: Number(ex.unit_price),
        pricingType: ex.pricing_type as any,
        quantity: ex.quantity,
        amountEur: Number(ex.total_price),
      })),
      pricing: {
        basePricePerAdultEur: Number(tour.price) || 35,
        basePricePerChildEur: Number(tour.child_price) || 18,
        adultSubtotalEur: (data.adult_count || 1) * (Number(tour.price) || 35),
        childSubtotalEur: (data.child_count || 0) * (Number(tour.child_price) || 18),
        infantSubtotalEur: 0,
        pickupSubtotalEur: 0,
        pickupFeePerPersonEur: 0,
        extrasSubtotalEur: Number(data.extras_total) || 0,
        extrasBreakdown: extras.map((ex: any) => ({
          extraId: ex.id,
          name: ex.name,
          amountEur: Number(ex.total_price),
          pricingType: ex.pricing_type,
          quantity: ex.quantity,
        })),
        discountEur: Number(data.discount) || 0,
        subtotalEur: Number(data.subtotal) || 0,
        totalEur: Number(data.total) || 0,
        formattedTotal: `€${Number(data.total).toFixed(2)}`,
        formattedSubtotal: `€${Number(data.subtotal).toFixed(2)}`,
      },
      customer: {
        firstName: customer.first_name || 'Guest',
        lastName: customer.last_name || '',
        email: customer.email || '',
        countryCode: '+49',
        phoneNumber: customer.phone || '',
        country: customer.country || 'International',
        whatsappNumber: customer.whatsapp || customer.phone || '',
        hotelName: data.pickup_hotel_name || customer.hotel,
        roomNumber: data.pickup_room_number,
        specialRequests: data.special_requests || '',
      },
      paymentMethod: data.payment_method || 'pay_at_pickup',
      paymentStatus: data.payment_status || 'pending',
      status: data.status || 'confirmed',
      bookingStatus: data.status || 'confirmed',
      cancellationReason: data.cancellation_reason,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
      timeline: [
        {
          id: 'ev-1',
          timestamp: data.created_at || new Date().toISOString(),
          title: 'Booking Confirmed',
          description: 'Reservation registered in Supabase database.',
          type: 'created',
        },
      ],
    };
  }
}

export const bookingRepository = new SupabaseBookingRepository();
