import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  DbVessel,
  DbGuide,
  DbWeatherBulletin,
  DbBookingPassenger,
  DbTourAvailability,
} from '../types/database';
import {
  OperationalDeparture,
  OperationalStatus,
  PickupScheduleItem,
  PickupStatus,
  PassengerManifestItem,
  AvailabilitySlot,
  OperationalAssignment,
} from '../types/operations';
import { bookingRepository } from './bookingRepository';
import { getPublishedTours } from './tourService';
import { ALL_TOURS } from '../data/toursData';

// Local storage keys for resilient offline and fallback persistence
const LOCAL_VESSELS_KEY = 'rse_ops_vessels';
const LOCAL_GUIDES_KEY = 'rse_ops_guides';
const LOCAL_WEATHER_KEY = 'rse_ops_weather';
const LOCAL_ASSIGNMENTS_KEY = 'rse_ops_assignments';
const LOCAL_AVAILABILITY_KEY = 'rse_ops_availability';
const LOCAL_PASSENGERS_KEY = 'rse_ops_passengers';
const LOCAL_PICKUPS_EXTRA_KEY = 'rse_ops_pickups_extra';

// Realistic initial vessels for Red Sea maritime fleet
const INITIAL_VESSELS: DbVessel[] = [
  {
    id: 'ves-001',
    name: 'M/Y Red Sea Star VIP',
    vessel_type: 'motor_yacht',
    registration_number: 'HUR-8841-VIP',
    port_marina: 'Hurghada Marina',
    passenger_capacity: 45,
    crew_capacity: 5,
    year_built: 2021,
    safety_inspection_expiry: '2027-04-15',
    amenities: ['Air Conditioning', 'Sundeck with loungers', 'VIP Dining Saloon', 'Snorkel Gear Deck', 'Freshwater Showers'],
    is_active: true,
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'ves-002',
    name: 'Dolphin Express II',
    vessel_type: 'speedboat',
    registration_number: 'HUR-3209-SPD',
    port_marina: 'Hurghada Marina',
    passenger_capacity: 12,
    crew_capacity: 2,
    year_built: 2023,
    safety_inspection_expiry: '2027-08-20',
    amenities: ['Twin 300HP Yamaha Engines', 'Bluetooth Marine Audio', 'Canopy Shade', 'Safety Life Vests', 'GoPro Mounts'],
    is_active: true,
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-02-15T09:00:00Z',
  },
  {
    id: 'ves-003',
    name: 'Blue Horizon Catamaran',
    vessel_type: 'catamaran',
    registration_number: 'ELG-5512-CAT',
    port_marina: 'Abu Tig Marina, El Gouna',
    passenger_capacity: 35,
    crew_capacity: 4,
    year_built: 2020,
    safety_inspection_expiry: '2027-06-01',
    amenities: ['Trampoline Netting', 'Full Bar', 'Sound System', 'Snorkeling Platform', 'Shaded Cockpit'],
    is_active: true,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'ves-004',
    name: 'Submarine Coral Explorer',
    vessel_type: 'semi_submarine',
    registration_number: 'MAK-1104-SUB',
    port_marina: 'Makadi Bay Jetty',
    passenger_capacity: 30,
    crew_capacity: 3,
    year_built: 2022,
    safety_inspection_expiry: '2027-05-10',
    amenities: ['Panoramic Underwater Windows', 'Reef Identification Charts', 'Air-Conditioned Observation Hull'],
    is_active: true,
    created_at: '2026-03-10T11:00:00Z',
    updated_at: '2026-03-10T11:00:00Z',
  },
];

// Realistic guides & captains
const INITIAL_GUIDES: DbGuide[] = [
  {
    id: 'gui-001',
    full_name: 'Captain Tarek Mansour',
    role: 'captain',
    languages: ['Arabic', 'English', 'German'],
    phone: '+20 100 456 7891',
    email: 'captain.tarek@redseavoyages.com',
    license_number: 'EGY-MAR-MASTER-8842',
    rating: 4.95,
    is_active: true,
    created_at: '2026-01-05T08:00:00Z',
  },
  {
    id: 'gui-002',
    full_name: 'Captain Farouk El-Sayed',
    role: 'captain',
    languages: ['Arabic', 'English', 'Russian'],
    phone: '+20 100 123 4567',
    email: 'captain.farouk@redseavoyages.com',
    license_number: 'EGY-MAR-MASTER-7210',
    rating: 5.0,
    is_active: true,
    created_at: '2026-01-05T08:00:00Z',
  },
  {
    id: 'gui-003',
    full_name: 'Youssef Al-Bahr',
    role: 'dive_master',
    languages: ['English', 'German', 'French', 'Arabic'],
    phone: '+20 111 889 9001',
    email: 'youssef.diving@redseavoyages.com',
    license_number: 'PADI-DM-491023',
    rating: 4.9,
    is_active: true,
    created_at: '2026-01-12T09:00:00Z',
  },
  {
    id: 'gui-004',
    full_name: 'Mona Zaki',
    role: 'snorkel_guide',
    languages: ['English', 'Italian', 'Russian', 'Arabic'],
    phone: '+20 102 334 5566',
    email: 'mona.guide@redseavoyages.com',
    license_number: 'EGY-TOUR-GUIDE-3391',
    rating: 4.98,
    is_active: true,
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'gui-005',
    full_name: 'Karim Bedouin Safari',
    role: 'safari_lead',
    languages: ['English', 'Arabic', 'German'],
    phone: '+20 122 778 9911',
    email: 'karim.safari@redseavoyages.com',
    license_number: 'EGY-SAFARI-DESERT-119',
    rating: 4.85,
    is_active: true,
    created_at: '2026-02-01T11:00:00Z',
  },
];

// Initial weather bulletin
const INITIAL_WEATHER: DbWeatherBulletin[] = [
  {
    id: 'wea-001',
    harbor_location: 'Hurghada Marina & Giftun Marine Park',
    water_temperature_c: 26.5,
    air_temperature_c: 31.0,
    swell_height_m: 0.45,
    wind_speed_knots: 8.5,
    wind_direction: 'NNW (Gentle Marine Breeze)',
    visibility_meters: 35,
    coast_guard_cleared: true,
    advisory_notes: 'Optimal calm conditions for Giftun Island crossings and coral reef snorkeling. Coast Guard harbor master green flag issued.',
    bulletin_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
];

// Helper storage functions
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ------------------------------------------------------------------------------
// 1. TODAY'S DEPARTURES & REAL-TIME OPERATIONS
// ------------------------------------------------------------------------------

export async function getTodayDepartures(dateTarget?: string): Promise<OperationalDeparture[]> {
  const date = dateTarget || new Date().toISOString().split('T')[0];
  const [allBookings, vessels, guides, assignments, weather] = await Promise.all([
    bookingRepository.listBookings(),
    listVessels(),
    listGuides(),
    listAssignments(date),
    getLatestWeatherBulletin(),
  ]);

  // Find bookings for the target date
  const dayBookings = allBookings.filter((b) => {
    const bDate = b.date ? b.date.split('T')[0] : '';
    return bDate === date && b.status !== 'cancelled';
  });

  // Group by tourId
  const departureMap = new Map<string, OperationalDeparture>();

  // Initialize with assignments for the day so even tours with zero bookings show up if scheduled
  assignments.forEach((assign) => {
    const tour = ALL_TOURS.find((t) => t.id === assign.tourId) || {
      id: assign.tourId,
      title: assign.tourTitle || 'Scheduled Tour',
      slug: 'tour-departure',
    };

    const vessel = vessels.find((v) => v.id === assign.vesselId);
    const guide = guides.find((g) => g.id === assign.guideId);

    const depKey = `${assign.tourId}_${assign.departureTime}`;
    departureMap.set(depKey, {
      id: assign.id || depKey,
      tourId: assign.tourId,
      tourTitle: tour.title,
      tourSlug: tour.slug || 'tour',
      date,
      departureTime: assign.departureTime || '08:30',
      bookingsCount: 0,
      passengerCount: 0,
      adultCount: 0,
      childCount: 0,
      infantCount: 0,
      pickupLocations: [],
      vesselId: assign.vesselId,
      vesselName: vessel ? vessel.name : null,
      vesselType: vessel ? vessel.vessel_type : null,
      vesselCapacity: vessel ? vessel.passenger_capacity : null,
      guideId: assign.guideId,
      guideName: guide ? guide.full_name : null,
      guideRole: guide ? guide.role : null,
      operationalStatus: assign.status || 'Scheduled',
      paymentSummary: {
        paidCount: 0,
        pendingCount: 0,
        totalEur: 0,
        outstandingEur: 0,
      },
      weatherCleared: weather ? weather.coast_guard_cleared : true,
      notes: assign.notes || null,
    });
  });

  // Aggregate bookings into departures
  dayBookings.forEach((b) => {
    const departureTime = (b as any).departureTime || '08:30';
    const depKey = `${b.tourId}_${departureTime}`;
    let dep = departureMap.get(depKey);

    if (!dep) {
      const defaultVessel = vessels[0] || null;
      const defaultGuide = guides[0] || null;

      dep = {
        id: `dep-${depKey}-${date}`,
        tourId: b.tourId,
        tourTitle: b.tourTitle,
        tourSlug: b.tourSlug,
        date,
        departureTime,
        bookingsCount: 0,
        passengerCount: 0,
        adultCount: 0,
        childCount: 0,
        infantCount: 0,
        pickupLocations: [],
        vesselId: defaultVessel ? defaultVessel.id : null,
        vesselName: defaultVessel ? defaultVessel.name : null,
        vesselType: defaultVessel ? defaultVessel.vessel_type : null,
        vesselCapacity: defaultVessel ? defaultVessel.passenger_capacity : 40,
        guideId: defaultGuide ? defaultGuide.id : null,
        guideName: defaultGuide ? defaultGuide.full_name : null,
        guideRole: defaultGuide ? defaultGuide.role : null,
        operationalStatus: (b as any).operationalStatus || 'Scheduled',
        paymentSummary: {
          paidCount: 0,
          pendingCount: 0,
          totalEur: 0,
          outstandingEur: 0,
        },
        weatherCleared: weather ? weather.coast_guard_cleared : true,
        notes: null,
      };
      departureMap.set(depKey, dep);
    }

    const adults = b.guests.adults || 1;
    const children = b.guests.children || 0;
    const infants = b.guests.infants || 0;
    const partySize = adults + children + infants;

    dep.bookingsCount += 1;
    dep.passengerCount += partySize;
    dep.adultCount += adults;
    dep.childCount += children;
    dep.infantCount += infants;

    // Add pickup location
    const pickupName = b.pickup.hotelName || b.pickup.locationName || 'Hurghada Marina';
    const existingPickup = dep.pickupLocations.find((p) => p.name === pickupName);
    if (existingPickup) {
      existingPickup.passengerCount += partySize;
    } else {
      dep.pickupLocations.push({
        name: pickupName,
        time: (b as any).pickupTime || '07:45',
        passengerCount: partySize,
        hotelName: b.pickup.hotelName,
      });
    }

    // Payment metrics
    const totalEur = b.pricing?.totalEur || 0;
    dep.paymentSummary.totalEur += totalEur;
    if (b.paymentStatus === 'paid') {
      dep.paymentSummary.paidCount += 1;
    } else {
      dep.paymentSummary.pendingCount += 1;
      dep.paymentSummary.outstandingEur += totalEur;
    }
  });

  return Array.from(departureMap.values()).sort((a, b) =>
    a.departureTime.localeCompare(b.departureTime)
  );
}

export async function updateDepartureStatus(
  departureId: string,
  newStatus: OperationalStatus,
  notes?: string
): Promise<boolean> {
  const assignments = getLocal<OperationalAssignment[]>(LOCAL_ASSIGNMENTS_KEY, []);
  const updated = assignments.map((a) =>
    a.id === departureId ? { ...a, status: newStatus, notes: notes || a.notes, updatedAt: new Date().toISOString() } : a
  );
  setLocal(LOCAL_ASSIGNMENTS_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('operational_assignments')
        .update({ status: newStatus, notes, updated_at: new Date().toISOString() })
        .eq('id', departureId);
    } catch {
      // ignore
    }
  }

  return true;
}

// ------------------------------------------------------------------------------
// 2. AVAILABILITY CALENDAR & CAPACITY SLOTS
// ------------------------------------------------------------------------------

export async function listAvailabilitySlots(
  tourIdFilter?: string,
  startDate?: string,
  endDate?: string
): Promise<AvailabilitySlot[]> {
  let cachedSlots = getLocal<AvailabilitySlot[]>(LOCAL_AVAILABILITY_KEY, []);
  const allBookings = await bookingRepository.listBookings();

  // If cached slots are empty, generate default 14-day window for all tours
  if (cachedSlots.length === 0) {
    const tours = ALL_TOURS;
    const now = new Date();
    const generated: AvailabilitySlot[] = [];

    tours.forEach((tour) => {
      for (let i = 0; i < 14; i++) {
        const d = new Date(now.getTime() + i * 86400000).toISOString().split('T')[0];
        const maxCapacity = tour.maxGuests || 35;
        generated.push({
          id: `avail-${tour.id}-${d}`,
          tourId: tour.id,
          tourTitle: tour.title,
          date: d,
          maxCapacity,
          bookedCount: 0,
          remainingCapacity: maxCapacity,
          status: 'available',
          departureTime: '08:30',
          notes: null,
          isBlackout: false,
        });
      }
    });

    cachedSlots = generated;
    setLocal(LOCAL_AVAILABILITY_KEY, cachedSlots);
  }

  // Correlate booked counts with actual reservations
  const result = cachedSlots.map((slot) => {
    const matchingBookings = allBookings.filter((b) => {
      const bDate = b.date ? b.date.split('T')[0] : '';
      return (
        b.tourId === slot.tourId &&
        bDate === slot.date &&
        b.status !== 'cancelled'
      );
    });

    const bookedGuests = matchingBookings.reduce(
      (sum, b) => sum + (b.guests.adults || 1) + (b.guests.children || 0) + (b.guests.infants || 0),
      0
    );

    const remaining = Math.max(0, slot.maxCapacity - bookedGuests);
    const status = slot.isBlackout
      ? 'unavailable'
      : remaining <= 0
      ? 'sold_out'
      : slot.status;

    return {
      ...slot,
      bookedCount: bookedGuests,
      remainingCapacity: remaining,
      status,
    };
  });

  return result.filter((s) => {
    if (tourIdFilter && s.tourId !== tourIdFilter) return false;
    if (startDate && s.date < startDate) return false;
    if (endDate && s.date > endDate) return false;
    return true;
  });
}

export async function updateAvailabilitySlot(
  slotId: string,
  updates: Partial<AvailabilitySlot>
): Promise<boolean> {
  const slots = getLocal<AvailabilitySlot[]>(LOCAL_AVAILABILITY_KEY, []);
  const updated = slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s));
  setLocal(LOCAL_AVAILABILITY_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      const target = updated.find((s) => s.id === slotId);
      if (target) {
        await supabase.from('tour_availability').upsert({
          tour_id: target.tourId,
          date: target.date,
          status: target.isBlackout ? 'unavailable' : target.status,
          max_capacity: target.maxCapacity,
          booked_count: target.bookedCount,
          notes: target.notes,
        });
      }
    } catch {
      // ignore
    }
  }

  return true;
}

export async function setBlackoutDate(tourId: string, date: string, isBlackout: boolean, notes?: string): Promise<boolean> {
  const slots = await listAvailabilitySlots();
  let target = slots.find((s) => s.tourId === tourId && s.date === date);

  if (target) {
    return updateAvailabilitySlot(target.id, {
      isBlackout,
      status: isBlackout ? 'unavailable' : 'available',
      notes: notes || target.notes,
    });
  } else {
    const newSlot: AvailabilitySlot = {
      id: `avail-${tourId}-${date}`,
      tourId,
      tourTitle: ALL_TOURS.find((t) => t.id === tourId)?.title || 'Tour',
      date,
      maxCapacity: 35,
      bookedCount: 0,
      remainingCapacity: 35,
      status: isBlackout ? 'unavailable' : 'available',
      departureTime: '08:30',
      notes: notes || 'Blackout date applied',
      isBlackout,
    };
    const all = [newSlot, ...slots];
    setLocal(LOCAL_AVAILABILITY_KEY, all);
    return true;
  }
}

// ------------------------------------------------------------------------------
// 3. PASSENGER MANIFEST MANAGEMENT
// ------------------------------------------------------------------------------

export async function getPassengerManifest(
  dateFilter?: string,
  tourIdFilter?: string
): Promise<PassengerManifestItem[]> {
  const date = dateFilter || new Date().toISOString().split('T')[0];
  const allBookings = await bookingRepository.listBookings();
  const storedPassengers = getLocal<Record<string, Partial<PassengerManifestItem>>>(
    LOCAL_PASSENGERS_KEY,
    {}
  );

  const targetBookings = allBookings.filter((b) => {
    const bDate = b.date ? b.date.split('T')[0] : '';
    if (bDate !== date) return false;
    if (tourIdFilter && b.tourId !== tourIdFilter) return false;
    if (b.status === 'cancelled') return false;
    return true;
  });

  const manifest: PassengerManifestItem[] = [];

  targetBookings.forEach((b) => {
    const leadPartyId = `pass-lead-${b.bookingReference}`;
    const storedLead = storedPassengers[leadPartyId] || {};

    // 1. Lead Passenger
    manifest.push({
      id: leadPartyId,
      bookingId: b.bookingId || b.bookingReference,
      bookingReference: b.bookingReference,
      tourId: b.tourId,
      tourTitle: b.tourTitle,
      tourDate: b.date || date,
      departureTime: (b as any).departureTime || '08:30',
      fullName: storedLead.fullName || `${b.customer.firstName} ${b.customer.lastName}`,
      nationality: storedLead.nationality || b.customer.country || 'International',
      passportOrId: storedLead.passportOrId || null,
      dateOfBirth: storedLead.dateOfBirth || null,
      gender: storedLead.gender || 'Not specified',
      passengerType: 'adult',
      phone: b.customer.phoneNumber ? `${b.customer.countryCode || ''} ${b.customer.phoneNumber}` : null,
      hotel: b.pickup.hotelName || b.customer.hotelName || null,
      specialRequests: b.customer.specialRequests || null,
      isLeadPassenger: true,
    });

    // 2. Accompanying Passengers in Party
    const totalAccompanying =
      Math.max(0, (b.guests.adults || 1) - 1) +
      (b.guests.children || 0) +
      (b.guests.infants || 0);

    for (let idx = 1; idx <= totalAccompanying; idx++) {
      const passId = `pass-${b.bookingReference}-${idx}`;
      const stored = storedPassengers[passId] || {};
      const isChild = idx > Math.max(0, (b.guests.adults || 1) - 1);

      manifest.push({
        id: passId,
        bookingId: b.bookingId || b.bookingReference,
        bookingReference: b.bookingReference,
        tourId: b.tourId,
        tourTitle: b.tourTitle,
        tourDate: b.date || date,
        departureTime: (b as any).departureTime || '08:30',
        fullName: stored.fullName || `Guest ${idx} (${b.customer.lastName} Party)`,
        nationality: stored.nationality || b.customer.country || 'International',
        passportOrId: stored.passportOrId || null,
        dateOfBirth: stored.dateOfBirth || null,
        gender: stored.gender || 'Not specified',
        passengerType: isChild ? 'child' : 'adult',
        phone: null,
        hotel: b.pickup.hotelName || b.customer.hotelName || null,
        specialRequests: null,
        isLeadPassenger: false,
      });
    }
  });

  return manifest;
}

export async function updateManifestPassenger(
  passengerId: string,
  updates: Partial<PassengerManifestItem>
): Promise<boolean> {
  const stored = getLocal<Record<string, Partial<PassengerManifestItem>>>(LOCAL_PASSENGERS_KEY, {});
  stored[passengerId] = {
    ...(stored[passengerId] || {}),
    ...updates,
  };
  setLocal(LOCAL_PASSENGERS_KEY, stored);

  if (isSupabaseConfigured()) {
    try {
      if (updates.passportOrId || updates.nationality || updates.fullName) {
        await supabase.from('booking_passengers').upsert({
          id: passengerId.startsWith('pass-') ? undefined : passengerId,
          full_name: updates.fullName || 'Guest',
          nationality: updates.nationality,
          passport_or_id_number: updates.passportOrId,
        });
      }
    } catch {
      // ignore
    }
  }

  return true;
}

// ------------------------------------------------------------------------------
// 4. DAILY PICKUP SCHEDULE
// ------------------------------------------------------------------------------

export async function getDailyPickupSchedule(dateTarget?: string): Promise<PickupScheduleItem[]> {
  const date = dateTarget || new Date().toISOString().split('T')[0];
  const allBookings = await bookingRepository.listBookings();
  const storedExtras = getLocal<Record<string, { status?: PickupStatus; driverVehicle?: string }>>(
    LOCAL_PICKUPS_EXTRA_KEY,
    {}
  );

  const dayBookings = allBookings.filter((b) => {
    const bDate = b.date ? b.date.split('T')[0] : '';
    return bDate === date && b.status !== 'cancelled';
  });

  return dayBookings.map((b) => {
    const extra = storedExtras[b.bookingReference] || {};
    const partySize = (b.guests.adults || 1) + (b.guests.children || 0) + (b.guests.infants || 0);

    return {
      id: b.bookingId || b.bookingReference,
      bookingId: b.bookingId || b.bookingReference,
      bookingReference: b.bookingReference,
      customerName: `${b.customer.firstName} ${b.customer.lastName}`,
      customerPhone: b.customer.phoneNumber
        ? `${b.customer.countryCode || ''} ${b.customer.phoneNumber}`
        : null,
      hotelName: b.pickup.hotelName || b.customer.hotelName || 'Direct Arrival (Marina Jetty)',
      roomNumber: b.pickup.roomNumber || b.customer.roomNumber || null,
      pickupArea: b.pickup.area || 'Hurghada Central',
      pickupTime: (b as any).pickupTime || '07:45',
      passengerCount: partySize,
      tourTitle: b.tourTitle,
      tourDate: b.date || date,
      departureTime: (b as any).departureTime || '08:30',
      driverVehicle: extra.driverVehicle || 'Van #12 (Captain Mahmoud)',
      status: extra.status || 'Waiting',
      specialRequests: b.customer.specialRequests || null,
    };
  }).sort((a, b) => a.pickupTime.localeCompare(b.pickupTime));
}

export async function updatePickupScheduleStatus(
  bookingRef: string,
  newStatus: PickupStatus,
  driverVehicle?: string
): Promise<boolean> {
  const stored = getLocal<Record<string, { status?: PickupStatus; driverVehicle?: string }>>(
    LOCAL_PICKUPS_EXTRA_KEY,
    {}
  );
  stored[bookingRef] = {
    ...(stored[bookingRef] || {}),
    status: newStatus,
    driverVehicle: driverVehicle || stored[bookingRef]?.driverVehicle,
  };
  setLocal(LOCAL_PICKUPS_EXTRA_KEY, stored);
  return true;
}

// ------------------------------------------------------------------------------
// 5. VESSELS FLEET MANAGEMENT
// ------------------------------------------------------------------------------

export async function listVessels(): Promise<DbVessel[]> {
  let vessels = getLocal<DbVessel[]>(LOCAL_VESSELS_KEY, INITIAL_VESSELS);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('vessels').select('*').order('name');
      if (!error && data && data.length > 0) {
        vessels = data as DbVessel[];
        setLocal(LOCAL_VESSELS_KEY, vessels);
      }
    } catch {
      // ignore
    }
  }

  return vessels;
}

export async function saveVessel(vessel: Partial<DbVessel>): Promise<DbVessel> {
  const all = getLocal<DbVessel[]>(LOCAL_VESSELS_KEY, INITIAL_VESSELS);
  let saved: DbVessel;

  if (vessel.id) {
    saved = { ...all.find((v) => v.id === vessel.id)!, ...vessel, updated_at: new Date().toISOString() };
    const updated = all.map((v) => (v.id === vessel.id ? saved : v));
    setLocal(LOCAL_VESSELS_KEY, updated);
  } else {
    saved = {
      id: `ves-${Date.now().toString(36)}`,
      name: vessel.name || 'New Vessel',
      vessel_type: vessel.vessel_type || 'motor_yacht',
      registration_number: vessel.registration_number || null,
      port_marina: vessel.port_marina || 'Hurghada Marina',
      passenger_capacity: vessel.passenger_capacity || 35,
      crew_capacity: vessel.crew_capacity || 4,
      year_built: vessel.year_built || new Date().getFullYear(),
      safety_inspection_expiry: vessel.safety_inspection_expiry || '2027-12-31',
      amenities: vessel.amenities || ['Life Vests', 'First Aid Kit'],
      is_active: vessel.is_active !== undefined ? vessel.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocal(LOCAL_VESSELS_KEY, [saved, ...all]);
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('vessels').upsert(saved);
    } catch {
      // ignore
    }
  }

  return saved;
}

export async function deleteVessel(id: string): Promise<boolean> {
  const all = getLocal<DbVessel[]>(LOCAL_VESSELS_KEY, INITIAL_VESSELS);
  setLocal(LOCAL_VESSELS_KEY, all.filter((v) => v.id !== id));

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('vessels').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  return true;
}

// ------------------------------------------------------------------------------
// 6. GUIDES & CAPTAINS MANAGEMENT
// ------------------------------------------------------------------------------

export async function listGuides(): Promise<DbGuide[]> {
  let guides = getLocal<DbGuide[]>(LOCAL_GUIDES_KEY, INITIAL_GUIDES);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('guides').select('*').order('full_name');
      if (!error && data && data.length > 0) {
        guides = data as DbGuide[];
        setLocal(LOCAL_GUIDES_KEY, guides);
      }
    } catch {
      // ignore
    }
  }

  return guides;
}

export async function saveGuide(guide: Partial<DbGuide>): Promise<DbGuide> {
  const all = getLocal<DbGuide[]>(LOCAL_GUIDES_KEY, INITIAL_GUIDES);
  let saved: DbGuide;

  if (guide.id) {
    saved = { ...all.find((g) => g.id === guide.id)!, ...guide };
    const updated = all.map((g) => (g.id === guide.id ? saved : g));
    setLocal(LOCAL_GUIDES_KEY, updated);
  } else {
    saved = {
      id: `gui-${Date.now().toString(36)}`,
      full_name: guide.full_name || 'Staff Member',
      role: guide.role || 'captain',
      languages: guide.languages || ['English', 'Arabic'],
      phone: guide.phone || null,
      email: guide.email || null,
      license_number: guide.license_number || null,
      rating: guide.rating || 5.0,
      is_active: guide.is_active !== undefined ? guide.is_active : true,
      created_at: new Date().toISOString(),
    };
    setLocal(LOCAL_GUIDES_KEY, [saved, ...all]);
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('guides').upsert(saved);
    } catch {
      // ignore
    }
  }

  return saved;
}

export async function deleteGuide(id: string): Promise<boolean> {
  const all = getLocal<DbGuide[]>(LOCAL_GUIDES_KEY, INITIAL_GUIDES);
  setLocal(LOCAL_GUIDES_KEY, all.filter((g) => g.id !== id));

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('guides').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  return true;
}

// ------------------------------------------------------------------------------
// 7. OPERATIONAL ASSIGNMENTS (TOUR + DATE + VESSEL + GUIDE)
// ------------------------------------------------------------------------------

export async function listAssignments(dateTarget?: string): Promise<OperationalAssignment[]> {
  let assignments = getLocal<OperationalAssignment[]>(LOCAL_ASSIGNMENTS_KEY, []);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('operational_assignments').select('*');
      if (!error && data && data.length > 0) {
        assignments = data.map((d) => ({
          id: d.id,
          tourId: d.tour_id,
          date: d.date,
          departureTime: d.departure_time,
          vesselId: d.vessel_id,
          guideId: d.guide_id,
          status: d.status as OperationalStatus,
          notes: d.notes,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        setLocal(LOCAL_ASSIGNMENTS_KEY, assignments);
      }
    } catch {
      // ignore
    }
  }

  if (dateTarget) {
    return assignments.filter((a) => a.date === dateTarget);
  }
  return assignments;
}

export async function saveAssignment(assignment: Partial<OperationalAssignment>): Promise<{
  success: boolean;
  error?: string;
  assignment?: OperationalAssignment;
}> {
  if (!assignment.tourId || !assignment.date) {
    return { success: false, error: 'Tour and date are required for assignment.' };
  }

  const all = getLocal<OperationalAssignment[]>(LOCAL_ASSIGNMENTS_KEY, []);
  const departureTime = assignment.departureTime || '08:30';

  // Capacity / Conflict Check: Check if vessel is already assigned to a DIFFERENT tour on the same date and time
  if (assignment.vesselId) {
    const vesselConflict = all.find(
      (a) =>
        a.vesselId === assignment.vesselId &&
        a.date === assignment.date &&
        a.departureTime === departureTime &&
        a.tourId !== assignment.tourId &&
        a.status !== 'Cancelled'
    );
    if (vesselConflict) {
      return {
        success: false,
        error: `Vessel conflict: This vessel is already assigned to another departure on ${assignment.date} at ${departureTime}.`,
      };
    }

    // Capacity Check: Ensure vessel can accommodate currently booked passengers
    const vessels = await listVessels();
    const targetVessel = vessels.find((v) => v.id === assignment.vesselId);
    if (targetVessel) {
      const allBookings = await bookingRepository.listBookings();
      const bookedPax = allBookings
        .filter(
          (b) =>
            b.tourId === assignment.tourId &&
            b.date?.split('T')[0] === assignment.date &&
            b.status !== 'cancelled'
        )
        .reduce(
          (sum, b) =>
            sum + (b.guests.adults || 1) + (b.guests.children || 0) + (b.guests.infants || 0),
          0
        );
      if (bookedPax > targetVessel.passenger_capacity) {
        return {
          success: false,
          error: `Capacity conflict: ${bookedPax} passengers are booked for this departure, but "${targetVessel.name}" only has capacity for ${targetVessel.passenger_capacity} passengers. Please assign a larger vessel.`,
        };
      }
    }
  }

  // Guide Conflict Check
  if (assignment.guideId) {
    const guideConflict = all.find(
      (a) =>
        a.guideId === assignment.guideId &&
        a.date === assignment.date &&
        a.departureTime === departureTime &&
        a.tourId !== assignment.tourId &&
        a.status !== 'Cancelled'
    );
    if (guideConflict) {
      return {
        success: false,
        error: `Guide conflict: This captain/guide is already assigned to another tour on ${assignment.date} at ${departureTime}.`,
      };
    }
  }

  const existingIdx = all.findIndex(
    (a) =>
      a.tourId === assignment.tourId &&
      a.date === assignment.date &&
      a.departureTime === departureTime
  );

  let saved: OperationalAssignment;

  if (existingIdx >= 0) {
    saved = {
      ...all[existingIdx],
      ...assignment,
      updatedAt: new Date().toISOString(),
    } as OperationalAssignment;
    all[existingIdx] = saved;
  } else {
    saved = {
      id: assignment.id || `assign-${Date.now().toString(36)}`,
      tourId: assignment.tourId,
      date: assignment.date,
      departureTime,
      vesselId: assignment.vesselId || null,
      guideId: assignment.guideId || null,
      status: assignment.status || 'Scheduled',
      notes: assignment.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.push(saved);
  }

  setLocal(LOCAL_ASSIGNMENTS_KEY, all);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('operational_assignments').upsert({
        id: saved.id,
        tour_id: saved.tourId,
        date: saved.date,
        departure_time: saved.departureTime,
        vessel_id: saved.vesselId,
        guide_id: saved.guideId,
        status: saved.status,
        notes: saved.notes,
      });
    } catch {
      // ignore
    }
  }

  return { success: true, assignment: saved };
}

// ------------------------------------------------------------------------------
// 8. WEATHER BULLETINS
// ------------------------------------------------------------------------------

export async function listWeatherBulletins(): Promise<DbWeatherBulletin[]> {
  let weather = getLocal<DbWeatherBulletin[]>(LOCAL_WEATHER_KEY, INITIAL_WEATHER);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('weather_bulletins')
        .select('*')
        .order('bulletin_date', { ascending: false });
      if (!error && data && data.length > 0) {
        weather = data as DbWeatherBulletin[];
        setLocal(LOCAL_WEATHER_KEY, weather);
      }
    } catch {
      // ignore
    }
  }

  return weather;
}

export async function getLatestWeatherBulletin(): Promise<DbWeatherBulletin | null> {
  const list = await listWeatherBulletins();
  return list.length > 0 ? list[0] : null;
}

export async function createWeatherBulletin(
  bulletin: Partial<DbWeatherBulletin>
): Promise<DbWeatherBulletin> {
  const all = getLocal<DbWeatherBulletin[]>(LOCAL_WEATHER_KEY, INITIAL_WEATHER);

  const newBulletin: DbWeatherBulletin = {
    id: `wea-${Date.now().toString(36)}`,
    harbor_location: bulletin.harbor_location || 'Hurghada Marina',
    water_temperature_c: bulletin.water_temperature_c || 26.0,
    air_temperature_c: bulletin.air_temperature_c || 30.0,
    swell_height_m: bulletin.swell_height_m || 0.4,
    wind_speed_knots: bulletin.wind_speed_knots || 8.0,
    wind_direction: bulletin.wind_direction || 'NNW',
    visibility_meters: bulletin.visibility_meters || 30,
    coast_guard_cleared: bulletin.coast_guard_cleared !== undefined ? bulletin.coast_guard_cleared : true,
    advisory_notes: bulletin.advisory_notes || 'Coast Guard cleared all maritime departures.',
    bulletin_date: bulletin.bulletin_date || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  };

  const updated = [newBulletin, ...all];
  setLocal(LOCAL_WEATHER_KEY, updated);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('weather_bulletins').insert(newBulletin);
    } catch {
      // ignore
    }
  }

  return newBulletin;
}
