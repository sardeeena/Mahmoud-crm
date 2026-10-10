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
import { findOrCreateAuthoritativeCustomer } from './platformConsistency';
import { recordActivity } from './crmService';
import { publishAutomationEvent } from './communicationService';

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

    // 0. Enforce capacity and blackout dates before accepting reservation
    const totalPartySize = (booking.guests.adults || 1) + (booking.guests.children || 0) + (booking.guests.infants || 0);
    const bookingDateStr = booking.date ? booking.date.split('T')[0] : '';
    
    try {
      const rawOps = localStorage.getItem('rse_ops_availability');
      if (rawOps) {
        const slots = JSON.parse(rawOps);
        const slot = slots.find((s: any) => s.tourId === booking.tourId && s.date === bookingDateStr);
        if (slot) {
          if (slot.isBlackout || slot.status === 'unavailable') {
            throw new Error(`This excursion date (${bookingDateStr}) is closed or set as an operational blackout date.`);
          }
          if (slot.status === 'sold_out') {
            throw new Error(`This departure date (${bookingDateStr}) is completely sold out.`);
          }
          const currentBookedCount = this.getLocalBookings()
            .filter((b) => b.tourId === booking.tourId && b.date?.split('T')[0] === bookingDateStr && b.status !== 'cancelled')
            .reduce((sum, b) => sum + (b.guests.adults || 1) + (b.guests.children || 0) + (b.guests.infants || 0), 0);
          if (slot.maxCapacity && (currentBookedCount + totalPartySize) > slot.maxCapacity) {
            const remainingSeats = Math.max(0, slot.maxCapacity - currentBookedCount);
            throw new Error(`Only ${remainingSeats} seat(s) remaining for departure on ${bookingDateStr}. Requested: ${totalPartySize} guests.`);
          }
        }
      }
    } catch (opsErr: any) {
      if (opsErr.message && (opsErr.message.includes('closed') || opsErr.message.includes('sold out') || opsErr.message.includes('remaining'))) {
        throw opsErr;
      }
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
      // 1. Verify tour exists in database and retrieve authoritative pricing & capacity
      let realTourId = booking.tourId;
      let dbTourRecord: any = null;

      if (realTourId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { data: t } = await supabase.from('tours').select('*').eq('id', realTourId).maybeSingle();
        dbTourRecord = t;
      }

      if (!dbTourRecord && booking.tourSlug) {
        const { data: t } = await supabase.from('tours').select('*').eq('slug', booking.tourSlug).maybeSingle();
        if (t) {
          dbTourRecord = t;
          realTourId = t.id;
        }
      }

      // 2. Validate availability and capacity against database tour limits and tour_availability
      const totalPartySize = (booking.guests.adults || 1) + (booking.guests.children || 0) + (booking.guests.infants || 0);
      if (dbTourRecord) {
        if (dbTourRecord.max_guests && totalPartySize > dbTourRecord.max_guests) {
          throw new Error(`Group size of ${totalPartySize} exceeds maximum tour capacity of ${dbTourRecord.max_guests} guests.`);
        }
      }

      // Check date-specific tour_availability table
      const bookingDateStr = booking.date ? booking.date.split('T')[0] : '';
      if (bookingDateStr) {
        try {
          const { data: dateAvail } = await supabase
            .from('tour_availability')
            .select('*')
            .eq('tour_id', realTourId)
            .eq('date', bookingDateStr)
            .maybeSingle();

          if (dateAvail) {
            if (dateAvail.status === 'unavailable') {
              throw new Error(`This excursion date (${bookingDateStr}) is closed or set as an operational blackout date.`);
            }
            if (dateAvail.status === 'sold_out') {
              throw new Error(`This departure date (${bookingDateStr}) is completely sold out.`);
            }
            if (dateAvail.max_capacity && (dateAvail.booked_count + totalPartySize) > dateAvail.max_capacity) {
              const remainingSeats = Math.max(0, dateAvail.max_capacity - dateAvail.booked_count);
              throw new Error(`Only ${remainingSeats} seat(s) remaining for departure on ${bookingDateStr}. Requested: ${totalPartySize} guests.`);
            }
          }
        } catch (availCheckErr: any) {
          if (availCheckErr.message && availCheckErr.message.includes('remaining') || availCheckErr.message.includes('sold out') || availCheckErr.message.includes('closed')) {
            throw availCheckErr;
          }
        }
      }

      // 3. Authoritative Pricing Calculation Server-Side
      const adultBasePrice = dbTourRecord ? Number(dbTourRecord.price) : booking.pricing.basePricePerAdultEur;
      const childBasePrice = dbTourRecord 
        ? (dbTourRecord.child_price !== null && dbTourRecord.child_price !== undefined ? Number(dbTourRecord.child_price) : Math.round(adultBasePrice * 0.5))
        : booking.pricing.basePricePerChildEur;

      const adults = Math.max(1, booking.guests.adults);
      const children = Math.max(0, booking.guests.children);
      const adultSubtotal = adults * adultBasePrice;
      const childSubtotal = children * childBasePrice;
      const pickupSubtotal = booking.pricing.pickupSubtotalEur || 0;
      const extrasSubtotal = booking.pricing.extrasSubtotalEur || 0;
      const discount = booking.pricing.discountEur || 0;
      const authoritativeTotal = Math.max(0, adultSubtotal + childSubtotal + pickupSubtotal + extrasSubtotal - discount);

      // Check if an authenticated user session exists to associate user_id
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || null;

      // 4. Intelligent customer deduplication & association using authoritative engine
      const authoritativeCustomer = await findOrCreateAuthoritativeCustomer({
        email: booking.customer.email,
        firstName: booking.customer.firstName,
        lastName: booking.customer.lastName,
        phone: `${booking.customer.countryCode || ''} ${booking.customer.phoneNumber || ''}`.trim(),
        whatsapp: booking.customer.whatsappNumber,
        country: booking.customer.country,
        hotel: booking.customer.hotelName || booking.pickup.hotelName,
        userId: currentUserId,
        bookingAmountEur: authoritativeTotal,
        bookingDate: booking.date,
      });

      const customerId = authoritativeCustomer.id;
      booking.customerId = customerId;

      // 5. Insert main booking record with authoritative total & rollback protection
      let createdBookingId: string | null = null;
      let capacityWasReserved = false;

      try {
        const { data: dbBooking, error: bookError } = await supabase
          .from('bookings')
          .insert({
            booking_reference: booking.bookingReference,
            user_id: currentUserId,
            tour_id: realTourId,
            customer_id: customerId,
            booking_date: booking.date,
            status: booking.status || 'confirmed',
            payment_status: booking.paymentStatus || 'pending',
            payment_method: booking.paymentMethod || 'pay_at_pickup',
            adult_count: adults,
            child_count: children,
            infant_count: booking.guests.infants || 0,
            pickup_hotel_name: booking.pickup.hotelName || null,
            pickup_room_number: booking.pickup.roomNumber || null,
            subtotal: adultSubtotal + childSubtotal + pickupSubtotal,
            extras_total: extrasSubtotal,
            discount,
            total: authoritativeTotal,
            currency: 'EUR',
            special_requests: booking.customer.specialRequests || null,
          })
          .select('id, booking_reference')
          .single();

        if (bookError) {
          throw new Error(formatSupabaseError(bookError));
        }

        createdBookingId = dbBooking.id;

        // 6. Insert passenger manifest records into booking_passengers table
        const passengerRows: any[] = [];
        // Lead passenger
        passengerRows.push({
          booking_id: createdBookingId,
          full_name: `${booking.customer.firstName} ${booking.customer.lastName}`.trim(),
          nationality: booking.customer.country || 'International',
          passenger_type: 'adult',
          is_lead_passenger: true,
        });

        // Additional adult passengers
        for (let i = 2; i <= adults; i++) {
          passengerRows.push({
            booking_id: createdBookingId,
            full_name: `Adult Guest ${i} (${booking.customer.lastName})`,
            nationality: booking.customer.country || 'International',
            passenger_type: 'adult',
            is_lead_passenger: false,
          });
        }

        // Child passengers
        for (let i = 1; i <= children; i++) {
          passengerRows.push({
            booking_id: createdBookingId,
            full_name: `Child Guest ${i} (${booking.customer.lastName})`,
            nationality: booking.customer.country || 'International',
            passenger_type: 'child',
            is_lead_passenger: false,
          });
        }

        // Infant passengers
        for (let i = 1; i <= (booking.guests.infants || 0); i++) {
          passengerRows.push({
            booking_id: createdBookingId,
            full_name: `Infant Guest ${i} (${booking.customer.lastName})`,
            nationality: booking.customer.country || 'International',
            passenger_type: 'infant',
            is_lead_passenger: false,
          });
        }

        if (passengerRows.length > 0) {
          await supabase.from('booking_passengers').insert(passengerRows);
        }

        // 7. Update tour_availability capacity in database
        if (bookingDateStr) {
          const { data: currentAvail } = await supabase
            .from('tour_availability')
            .select('*')
            .eq('tour_id', realTourId)
            .eq('date', bookingDateStr)
            .maybeSingle();

          if (currentAvail) {
            const newCount = (currentAvail.booked_count || 0) + totalPartySize;
            const isFull = currentAvail.max_capacity && newCount >= currentAvail.max_capacity;
            await supabase
              .from('tour_availability')
              .update({
                booked_count: newCount,
                status: isFull ? 'sold_out' : currentAvail.status,
                updated_at: new Date().toISOString(),
              })
              .eq('id', currentAvail.id);
            capacityWasReserved = true;
          }
        }

        // 8. Insert extras breakdown if any
        if (booking.extras && booking.extras.length > 0) {
          const extrasRows = booking.extras.map((ex) => ({
            booking_id: createdBookingId,
            name: ex.name,
            quantity: ex.quantity || 1,
            unit_price: ex.priceEur,
            total_price: ex.amountEur,
            pricing_type: ex.pricingType,
          }));
          await supabase.from('booking_extras').insert(extrasRows);
        }
      } catch (partialFailErr: any) {
        // ERROR RECOVERY ROLLBACK: Clean up partial database state to prevent orphans
        console.error('Partial booking failure - rolling back database transaction:', partialFailErr);
        if (createdBookingId) {
          try {
            await supabase.from('booking_passengers').delete().eq('booking_id', createdBookingId);
            await supabase.from('booking_extras').delete().eq('booking_id', createdBookingId);
            await supabase.from('bookings').delete().eq('id', createdBookingId);
            if (capacityWasReserved && bookingDateStr) {
              const { data: rollbackAvail } = await supabase
                .from('tour_availability')
                .select('*')
                .eq('tour_id', realTourId)
                .eq('date', bookingDateStr)
                .maybeSingle();
              if (rollbackAvail) {
                await supabase
                  .from('tour_availability')
                  .update({
                    booked_count: Math.max(0, (rollbackAvail.booked_count || 0) - totalPartySize),
                    status: 'available',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', rollbackAvail.id);
              }
            }
          } catch (cleanupErr) {
            console.warn('Rollback cleanup notice:', cleanupErr);
          }
        }
        throw partialFailErr;
      }

      // Update booking object with database verified values
      booking.bookingId = createdBookingId || undefined;
      booking.pricing.totalEur = authoritativeTotal;
      booking.pricing.formattedTotal = `€${authoritativeTotal.toFixed(2)}`;

      // 9. BOOKING → CRM TIMELINE INTEGRATION
      try {
        await recordActivity({
          customerId,
          bookingId: createdBookingId || booking.bookingReference,
          eventType: 'booking_created',
          title: `Booking Confirmed: ${booking.bookingReference}`,
          description: `${booking.tourTitle} (${adults} Adults, ${children} Children, €${authoritativeTotal.toFixed(2)}).`,
          actor: 'Traveler Online',
          metadata: {
            bookingReference: booking.bookingReference,
            totalPartySize,
            totalEur: authoritativeTotal,
            bookingDate: booking.date,
          },
        });
      } catch (actErr) {
        console.warn('CRM activity record notice:', actErr);
      }

      // 10. INTERNAL STAFF NOTIFICATION
      try {
        const notifsRaw = localStorage.getItem('rse_staff_notifications') || '[]';
        const notifs = JSON.parse(notifsRaw);
        notifs.unshift({
          id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          category: 'new_booking',
          dedupKey: `new_booking_${booking.bookingReference}`,
          title: `New Booking: ${booking.bookingReference}`,
          message: `${booking.customer.firstName} ${booking.customer.lastName} booked ${booking.tourTitle} for ${booking.date} (€${authoritativeTotal.toFixed(2)}).`,
          severity: 'success',
          entityType: 'booking',
          entityId: booking.bookingReference,
          linkTab: 'bookings',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('rse_staff_notifications', JSON.stringify(notifs.slice(0, 100)));
      } catch {}

      // 11. AUTOMATION & COMMUNICATIONS EVENT
      try {
        await publishAutomationEvent(
          'booking.created',
          {
            bookingReference: booking.bookingReference,
            bookingId: createdBookingId || booking.bookingReference,
            customerId,
            customerName: `${booking.customer.firstName} ${booking.customer.lastName}`.trim(),
            customerEmail: booking.customer.email,
            customerPhone: `${booking.customer.countryCode || ''} ${booking.customer.phoneNumber || ''}`.trim(),
            tourTitle: booking.tourTitle,
            tourDate: booking.date,
            pickupTime: (booking as any).pickupTime || '08:30',
            totalEur: authoritativeTotal,
            balanceDue: booking.paymentStatus === 'paid' ? 0 : authoritativeTotal,
          },
          'booking',
          createdBookingId || booking.bookingReference
        );
      } catch (autoErr) {
        console.warn('Automation dispatch notice:', autoErr);
      }

      return booking;
    } catch (err: any) {
      console.error('Failed to create booking in Supabase:', err);
      throw new Error(err.message || 'Unable to register excursion booking in database. Please verify your details.');
    }
  }

  async getBooking(bookingReference: string): Promise<Booking | null> {
    const cleanRef = bookingReference.trim().toUpperCase();

    // When Supabase is configured, Supabase is the sole authoritative source of truth.
    // Never fall back to mock data if a reference does not exist in the database.
    if (isSupabaseConfigured()) {
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
          return null;
        }

        return this.mapDbToBooking(data);
      } catch (err) {
        console.error('Supabase getBooking error:', err);
        return null;
      }
    }

    // Isolated fallback ONLY when Supabase credentials are completely unconfigured (dev sandbox)
    const found = this.getLocalBookings().find((b) => b.bookingReference.toUpperCase() === cleanRef);
    return found || null;
  }

  async findBooking(bookingReference: string, emailOrPhone: string): Promise<Booking | null> {
    const b = await this.getBooking(bookingReference);
    if (!b) return null;

    if (!emailOrPhone.trim()) {
      return b;
    }

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

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            tours (*),
            customers (*),
            booking_extras (*)
          `)
          .order('created_at', { ascending: false });

        if (error || !data) {
          return [];
        }

        const filtered = data.filter((d: any) => {
          const custEmail = (d.customers?.email || '').toLowerCase();
          return custEmail === cleanEmail;
        });

        return filtered.map((d: any) => this.mapDbToBooking(d));
      } catch (err) {
        console.error('Supabase getBookingsByEmail error:', err);
        return [];
      }
    }

    // Dev sandbox fallback only
    return this.getLocalBookings().filter((b) => b.customer.email.toLowerCase() === cleanEmail);
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

    // CRM Activity Timeline
    try {
      await recordActivity({
        customerId: booking.customerId,
        bookingId: booking.bookingId || booking.bookingReference,
        eventType: 'booking_updated',
        title: `Booking Updated: ${booking.bookingReference}`,
        description: `Status: ${booking.status}. Payment status: ${booking.paymentStatus}. Hotel: ${booking.pickup.hotelName || 'Direct Arrival'}.`,
        actor: 'Staff Dispatch',
        metadata: {
          bookingReference: booking.bookingReference,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
        },
      });
    } catch {}

    // Automation Event
    try {
      await publishAutomationEvent(
        'booking.updated',
        {
          bookingReference: booking.bookingReference,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          date: booking.date,
          tourTitle: booking.tourTitle,
        },
        'booking',
        booking.bookingId || booking.bookingReference
      );
    } catch {}

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

        // Revert capacity in tour_availability
        if (existing.tourId && existing.date) {
          const dStr = existing.date.split('T')[0];
          const partySize = (existing.guests?.adults || 1) + (existing.guests?.children || 0) + (existing.guests?.infants || 0);
          const { data: curAvail } = await supabase
            .from('tour_availability')
            .select('*')
            .eq('tour_id', existing.tourId)
            .eq('date', dStr)
            .maybeSingle();

          if (curAvail) {
            const newCount = Math.max(0, (curAvail.booked_count || 0) - partySize);
            await supabase
              .from('tour_availability')
              .update({
                booked_count: newCount,
                status: 'available',
                updated_at: new Date().toISOString(),
              })
              .eq('id', curAvail.id);
          }
        }
      } catch (err) {
        console.warn('Cancel booking in Supabase notice:', err);
      }
    }

    // CRM Activity Timeline
    try {
      await recordActivity({
        customerId: existing.customerId,
        bookingId: existing.bookingId || existing.bookingReference,
        eventType: 'cancellation',
        title: `Cancellation: ${bookingReference}`,
        description: reason || 'Customer requested reservation cancellation.',
        actor: 'Customer Support',
        metadata: {
          bookingReference,
          reason,
          tourTitle: existing.tourTitle,
        },
      });
    } catch {}

    // Internal Staff Notification
    try {
      const notifsRaw = localStorage.getItem('rse_staff_notifications') || '[]';
      const notifs = JSON.parse(notifsRaw);
      notifs.unshift({
        id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        category: 'new_booking',
        dedupKey: `cancel_${bookingReference}`,
        title: `Cancellation: ${bookingReference}`,
        message: `Booking ${bookingReference} (${existing.tourTitle}) requested cancellation: ${reason}`,
        severity: 'warning',
        entityType: 'booking',
        entityId: bookingReference,
        linkTab: 'bookings',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('rse_staff_notifications', JSON.stringify(notifs.slice(0, 100)));
    } catch {}

    // Automation Event
    try {
      await publishAutomationEvent(
        'booking.cancelled',
        {
          bookingReference,
          reason,
          tourTitle: existing.tourTitle,
          tourDate: existing.date,
          customerName: `${existing.customer.firstName} ${existing.customer.lastName}`,
          customerEmail: existing.customer.email,
        },
        'booking',
        existing.bookingId || bookingReference
      );
    } catch {}

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
        return [];
      }

      return data.map((d: any) => this.mapDbToBooking(d));
    } catch (err) {
      if (isSchemaMissingError(err)) {
        setSchemaMissing(true);
      }
      return [];
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
