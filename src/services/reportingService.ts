import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  ReportDateRangeType,
  DateRangeInterval,
  ExecutiveMetrics,
  SalesMetrics,
  CustomerMetrics,
  OperationsMetrics,
  FinanceMetrics,
  BreakdownItem,
  TopCustomerItem,
  VesselUtilizationItem,
  PaymentMethodBreakdown,
} from '../types/reporting';
import { bookingRepository } from './bookingRepository';
import { Booking } from '../types/booking';
import { listUnifiedCustomers, UnifiedCustomer } from './customerService';
import { listPayments, listRefunds } from './financeService';
import { listVessels, listAssignments } from './operationsService';
import { listInquiries } from './inquiryService';
import { ALL_TOURS } from '../data/toursData';

/**
 * Calculates normalized date interval boundaries based on range enum
 */
export function getDateRangeInterval(
  range: ReportDateRangeType,
  customStart?: string,
  customEnd?: string
): DateRangeInterval {
  const now = new Date();
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYMD(now);

  switch (range) {
    case 'today':
      return {
        range,
        startDate: todayStr,
        endDate: todayStr,
        label: `Today (${todayStr})`,
      };

    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatYMD(y);
      return {
        range,
        startDate: yStr,
        endDate: yStr,
        label: `Yesterday (${yStr})`,
      };
    }

    case 'this_week': {
      const curr = new Date(now);
      const day = curr.getDay();
      // Monday as first day of week
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(curr.setDate(diff));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        range,
        startDate: formatYMD(startOfWeek),
        endDate: formatYMD(endOfWeek),
        label: `This Week (${formatYMD(startOfWeek)} to ${formatYMD(endOfWeek)})`,
      };
    }

    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        range,
        startDate: formatYMD(start),
        endDate: formatYMD(end),
        label: `This Month (${start.toLocaleString('default', { month: 'long', year: 'numeric' })})`,
      };
    }

    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        range,
        startDate: formatYMD(start),
        endDate: formatYMD(end),
        label: `Last Month (${start.toLocaleString('default', { month: 'long', year: 'numeric' })})`,
      };
    }

    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return {
        range,
        startDate: formatYMD(start),
        endDate: formatYMD(end),
        label: `This Year (${now.getFullYear()})`,
      };
    }

    case 'custom': {
      const s = customStart || todayStr;
      const e = customEnd || todayStr;
      return {
        range,
        startDate: s <= e ? s : e,
        endDate: s <= e ? e : s,
        label: `Custom (${s} to ${e})`,
      };
    }

    default:
      return {
        range: 'this_month',
        startDate: formatYMD(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: todayStr,
        label: 'Current Period',
      };
  }
}

/**
 * Filter bookings by date range interval.
 * Checks both excursion departure date (`b.date`) and booking creation date.
 */
function filterBookingsByInterval(bookings: Booking[], interval: DateRangeInterval): Booking[] {
  return bookings.filter((b) => {
    // Departure date check
    const departureDate = (b.date || '').split('T')[0];
    const createdDate = (b.createdAt || '').split('T')[0];

    // Matches if departure is in interval OR reservation was placed in interval
    const departureMatches = departureDate >= interval.startDate && departureDate <= interval.endDate;
    const createdMatches = createdDate >= interval.startDate && createdDate <= interval.endDate;

    return departureMatches || createdMatches;
  });
}

// ------------------------------------------------------------------------------
// 1. EXECUTIVE REPORT
// ------------------------------------------------------------------------------

export async function fetchExecutiveReport(interval: DateRangeInterval): Promise<ExecutiveMetrics> {
  const [allBookings, allCustomers, inquiries] = await Promise.all([
    bookingRepository.listBookings(),
    listUnifiedCustomers(),
    listInquiries(),
  ]);

  const activeBookings = filterBookingsByInterval(allBookings, interval);

  // Real aggregations
  const nonCancelledBookings = activeBookings.filter((b) => b.status !== 'cancelled');
  const cancelledBookings = activeBookings.filter((b) => b.status === 'cancelled' || b.status === 'cancellation_requested');

  const revenueEur = nonCancelledBookings.reduce((sum, b) => sum + (b.pricing?.totalEur || 0), 0);
  const bookingsCount = activeBookings.length;

  let adultsCount = 0;
  let childrenCount = 0;
  let infantsCount = 0;

  nonCancelledBookings.forEach((b) => {
    adultsCount += b.guests?.adults || 1;
    childrenCount += b.guests?.children || 0;
    infantsCount += b.guests?.infants || 0;
  });

  const passengersCount = adultsCount + childrenCount + infantsCount;

  // New vs Repeat Customers calculation
  const customerEmailCounts = new Map<string, number>();
  allBookings.forEach((b) => {
    const email = b.customer?.email?.toLowerCase();
    if (email) {
      customerEmailCounts.set(email, (customerEmailCounts.get(email) || 0) + 1);
    }
  });

  const intervalCustomers = new Set<string>();
  let repeatCustomersCount = 0;
  let newCustomersCount = 0;

  activeBookings.forEach((b) => {
    const email = b.customer?.email?.toLowerCase();
    if (email && !intervalCustomers.has(email)) {
      intervalCustomers.add(email);
      const totalLifetime = customerEmailCounts.get(email) || 1;
      if (totalLifetime > 1) {
        repeatCustomersCount++;
      } else {
        newCustomersCount++;
      }
    }
  });

  // Outstanding balances calculation (pier cash or pending payment)
  const outstandingBalancesEur = nonCancelledBookings
    .filter((b) => b.paymentStatus !== 'paid')
    .reduce((sum, b) => {
      const total = b.pricing?.totalEur || 0;
      const paid = b.paymentStatus === 'partially_paid' ? Math.round(total * 0.5) : 0;
      return sum + Math.max(0, total - paid);
    }, 0);

  // Rates
  const cancellationRate = bookingsCount > 0
    ? Math.round((cancelledBookings.length / bookingsCount) * 1000) / 10
    : 0;

  // Conversion rate: Bookings count divided by total inquiries + bookings (or leads)
  const intervalInquiries = inquiries.filter((inq) => {
    const inqDate = (inq.created_at || '').split('T')[0];
    return inqDate >= interval.startDate && inqDate <= interval.endDate;
  });

  const totalDemand = intervalInquiries.length + nonCancelledBookings.length;
  const conversionRate = totalDemand > 0
    ? Math.round((nonCancelledBookings.length / totalDemand) * 1000) / 10
    : 0;

  const averageBookingValueEur = nonCancelledBookings.length > 0
    ? Math.round((revenueEur / nonCancelledBookings.length) * 100) / 100
    : 0;

  return {
    revenueEur,
    bookingsCount,
    passengersCount,
    adultsCount,
    childrenCount,
    infantsCount,
    newCustomersCount,
    repeatCustomersCount,
    conversionRate,
    cancellationRate,
    outstandingBalancesEur,
    averageBookingValueEur,
  };
}

// ------------------------------------------------------------------------------
// 2. SALES REPORT
// ------------------------------------------------------------------------------

export async function fetchSalesReport(interval: DateRangeInterval): Promise<SalesMetrics> {
  const [allBookings, inquiries] = await Promise.all([
    bookingRepository.listBookings(),
    listInquiries(),
  ]);

  const activeBookings = filterBookingsByInterval(allBookings, interval);
  const confirmed = activeBookings.filter((b) => b.status !== 'cancelled');

  const totalRevenueEur = confirmed.reduce((sum, b) => sum + (b.pricing?.totalEur || 0), 0);
  const totalBookingsCount = confirmed.length;

  const averageBookingValueEur = totalBookingsCount > 0
    ? Math.round((totalRevenueEur / totalBookingsCount) * 100) / 100
    : 0;

  // 1. Bookings & Revenue by Tour
  const tourMap = new Map<string, { title: string; count: number; revenue: number }>();
  confirmed.forEach((b) => {
    const key = b.tourTitle || 'Custom Excursion';
    const entry = tourMap.get(key) || { title: key, count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += b.pricing?.totalEur || 0;
    tourMap.set(key, entry);
  });

  const bookingsByTour: BreakdownItem[] = [];
  const revenueByTour: BreakdownItem[] = [];

  tourMap.forEach((val, key) => {
    bookingsByTour.push({
      id: key,
      name: val.title,
      count: val.count,
      revenueEur: val.revenue,
      percentage: totalBookingsCount > 0 ? Math.round((val.count / totalBookingsCount) * 1000) / 10 : 0,
    });

    revenueByTour.push({
      id: key,
      name: val.title,
      count: val.count,
      revenueEur: val.revenue,
      percentage: totalRevenueEur > 0 ? Math.round((val.revenue / totalRevenueEur) * 1000) / 10 : 0,
    });
  });

  bookingsByTour.sort((a, b) => b.count - a.count);
  revenueByTour.sort((a, b) => b.revenueEur - a.revenueEur);

  // 2. Bookings & Revenue by Destination
  const destMap = new Map<string, { count: number; revenue: number }>();
  confirmed.forEach((b) => {
    const dest = b.tourDestination || 'Hurghada';
    const entry = destMap.get(dest) || { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += b.pricing?.totalEur || 0;
    destMap.set(dest, entry);
  });

  const bookingsByDestination: BreakdownItem[] = [];
  const revenueByDestination: BreakdownItem[] = [];

  destMap.forEach((val, dest) => {
    bookingsByDestination.push({
      id: dest,
      name: dest,
      count: val.count,
      revenueEur: val.revenue,
      percentage: totalBookingsCount > 0 ? Math.round((val.count / totalBookingsCount) * 1000) / 10 : 0,
    });

    revenueByDestination.push({
      id: dest,
      name: dest,
      count: val.count,
      revenueEur: val.revenue,
      percentage: totalRevenueEur > 0 ? Math.round((val.revenue / totalRevenueEur) * 1000) / 10 : 0,
    });
  });

  bookingsByDestination.sort((a, b) => b.count - a.count);
  revenueByDestination.sort((a, b) => b.revenueEur - a.revenueEur);

  // 3. Bookings by Source (Website, Concierge, WhatsApp, OTA/Partner)
  const sourceCounts = new Map<string, { count: number; revenue: number }>();
  confirmed.forEach((b) => {
    // Derive real channel source from booking metadata or method
    let src = 'Website Direct';
    if (b.paymentMethod === 'pay_at_pickup') {
      src = 'Concierge Desk';
    } else if (b.customer?.specialRequests?.toLowerCase().includes('whatsapp')) {
      src = 'WhatsApp Direct';
    } else if (b.customer?.specialRequests?.toLowerCase().includes('rep') || b.customer?.specialRequests?.toLowerCase().includes('agency')) {
      src = 'Partner / Agency';
    }

    const cur = sourceCounts.get(src) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += b.pricing?.totalEur || 0;
    sourceCounts.set(src, cur);
  });

  const bookingsBySource: Array<{ source: string; count: number; revenueEur: number; percentage: number }> = [];
  sourceCounts.forEach((val, src) => {
    bookingsBySource.push({
      source: src,
      count: val.count,
      revenueEur: val.revenue,
      percentage: totalBookingsCount > 0 ? Math.round((val.count / totalBookingsCount) * 1000) / 10 : 0,
    });
  });
  bookingsBySource.sort((a, b) => b.count - a.count);

  // Conversion rate based on demand (bookings + inquiries in interval)
  const intervalInquiries = inquiries.filter((inq) => {
    const inqDate = (inq.created_at || '').split('T')[0];
    return inqDate >= interval.startDate && inqDate <= interval.endDate;
  });
  const totalDemand = intervalInquiries.length + totalBookingsCount;
  const conversionRate = totalDemand > 0
    ? Math.round((totalBookingsCount / totalDemand) * 1000) / 10
    : 0;

  return {
    totalRevenueEur,
    totalBookingsCount,
    averageBookingValueEur,
    conversionRate,
    bookingsByTour,
    bookingsByDestination,
    revenueByTour,
    revenueByDestination,
    bookingsBySource,
  };
}

// ------------------------------------------------------------------------------
// 3. CUSTOMER REPORT
// ------------------------------------------------------------------------------

export async function fetchCustomerReport(interval: DateRangeInterval): Promise<CustomerMetrics> {
  const [allCustomers, allBookings] = await Promise.all([
    listUnifiedCustomers(),
    bookingRepository.listBookings(),
  ]);

  const activeBookings = filterBookingsByInterval(allBookings, interval);

  // Lifetime customer aggregates
  const customerMap = new Map<string, TopCustomerItem>();

  allBookings.forEach((b) => {
    const email = b.customer?.email?.toLowerCase();
    if (!email) return;

    const existing = customerMap.get(email);
    const spent = b.status !== 'cancelled' ? (b.pricing?.totalEur || 0) : 0;
    const isThisInterval = activeBookings.some((ab) => ab.bookingReference === b.bookingReference);

    if (existing) {
      existing.totalBookings += 1;
      existing.totalSpentEur += spent;
      if (b.date && (!existing.lastBookingDate || b.date > existing.lastBookingDate)) {
        existing.lastBookingDate = b.date;
      }
      if (b.customer.hotelName && !existing.hotel) {
        existing.hotel = b.customer.hotelName;
      }
    } else {
      customerMap.set(email, {
        id: (b as any).customerId || b.bookingReference,
        name: `${b.customer.firstName} ${b.customer.lastName}`.trim() || 'Guest',
        email,
        phone: b.customer.phoneNumber ? `${b.customer.countryCode || ''} ${b.customer.phoneNumber}` : null,
        country: b.customer.country || 'International',
        hotel: b.customer.hotelName || b.pickup?.hotelName || 'Hurghada Resort',
        totalBookings: 1,
        totalSpentEur: spent,
        lastBookingDate: b.date,
        status: 'Regular',
      });
    }
  });

  const customerList = Array.from(customerMap.values());
  customerList.forEach((c) => {
    if (c.totalSpentEur >= 500 || c.totalBookings >= 3) {
      c.status = 'VIP';
    } else if (c.totalBookings === 1) {
      c.status = 'New';
    }
  });

  customerList.sort((a, b) => b.totalSpentEur - a.totalSpentEur);

  const totalCustomersCount = customerList.length;
  const repeatCustomersCount = customerList.filter((c) => c.totalBookings > 1).length;
  const newCustomersCount = customerList.filter((c) => c.totalBookings === 1).length;
  const repeatRatePct = totalCustomersCount > 0 ? Math.round((repeatCustomersCount / totalCustomersCount) * 1000) / 10 : 0;

  const totalLifetimeSpent = customerList.reduce((sum, c) => sum + c.totalSpentEur, 0);
  const customerLifetimeValueEur = totalCustomersCount > 0 ? Math.round(totalLifetimeSpent / totalCustomersCount) : 0;

  // Countries Breakdown
  const countryCounts = new Map<string, { count: number; revenue: number }>();
  customerList.forEach((c) => {
    const ctry = c.country || 'International';
    const entry = countryCounts.get(ctry) || { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += c.totalSpentEur;
    countryCounts.set(ctry, entry);
  });

  const countriesDistribution: Array<{ country: string; count: number; percentage: number; revenueEur: number }> = [];
  countryCounts.forEach((val, ctry) => {
    countriesDistribution.push({
      country: ctry,
      count: val.count,
      percentage: totalCustomersCount > 0 ? Math.round((val.count / totalCustomersCount) * 1000) / 10 : 0,
      revenueEur: val.revenue,
    });
  });
  countriesDistribution.sort((a, b) => b.count - a.count);

  // Hotels Breakdown
  const hotelCounts = new Map<string, number>();
  customerList.forEach((c) => {
    const h = c.hotel?.trim() || 'Direct Marina Pier';
    hotelCounts.set(h, (hotelCounts.get(h) || 0) + 1);
  });

  const hotelsDistribution: Array<{ hotel: string; count: number; percentage: number }> = [];
  hotelCounts.forEach((cnt, h) => {
    hotelsDistribution.push({
      hotel: h,
      count: cnt,
      percentage: totalCustomersCount > 0 ? Math.round((cnt / totalCustomersCount) * 1000) / 10 : 0,
    });
  });
  hotelsDistribution.sort((a, b) => b.count - a.count);

  return {
    totalCustomersCount,
    newCustomersCount,
    repeatCustomersCount,
    repeatRatePct,
    customerLifetimeValueEur,
    countriesDistribution,
    hotelsDistribution,
    topCustomers: customerList.slice(0, 15),
  };
}

// ------------------------------------------------------------------------------
// 4. OPERATIONS REPORT
// ------------------------------------------------------------------------------

export async function fetchOperationsReport(interval: DateRangeInterval): Promise<OperationsMetrics> {
  const [allBookings, vessels, assignments] = await Promise.all([
    bookingRepository.listBookings(),
    listVessels(),
    listAssignments(),
  ]);

  const activeBookings = filterBookingsByInterval(allBookings, interval);

  // Group departures by date + tour
  const departureKeys = new Set<string>();
  let adults = 0;
  let children = 0;
  let infants = 0;
  let cancellations = 0;
  let noShows = 0;

  activeBookings.forEach((b) => {
    const depKey = `${b.date}_${b.tourTitle}`;
    departureKeys.add(depKey);

    if (b.status === 'cancelled' || b.status === 'cancellation_requested') {
      cancellations++;
    } else if (b.status === 'no_show') {
      noShows++;
    } else {
      adults += b.guests?.adults || 1;
      children += b.guests?.children || 0;
      infants += b.guests?.infants || 0;
    }
  });

  const totalPassengers = adults + children + infants;
  const departuresCount = departureKeys.size || (activeBookings.length > 0 ? 1 : 0);

  // Total theoretical capacity
  const totalOfferedCapacity = departuresCount * 30; // average boat capacity
  const capacityUtilizationPct = totalOfferedCapacity > 0
    ? Math.min(100, Math.round((totalPassengers / totalOfferedCapacity) * 1000) / 10)
    : 0;

  const cancellationRatePct = activeBookings.length > 0
    ? Math.round((cancellations / activeBookings.length) * 1000) / 10
    : 0;

  // Pickup Distribution
  const pickupCounts = new Map<string, { guests: number; area: string }>();
  activeBookings
    .filter((b) => b.status !== 'cancelled')
    .forEach((b) => {
      const loc = b.pickup?.hotelName || b.customer?.hotelName || b.pickup?.locationName || 'Hurghada Center';
      const area = b.pickup?.area || 'Hurghada Coast';
      const guests = (b.guests?.adults || 1) + (b.guests?.children || 0);

      const entry = pickupCounts.get(loc) || { guests: 0, area };
      entry.guests += guests;
      pickupCounts.set(loc, entry);
    });

  const pickupDistribution: Array<{ locationName: string; area: string; guestsCount: number; percentage: number }> = [];
  pickupCounts.forEach((val, loc) => {
    pickupDistribution.push({
      locationName: loc,
      area: val.area,
      guestsCount: val.guests,
      percentage: totalPassengers > 0 ? Math.round((val.guests / totalPassengers) * 1000) / 10 : 0,
    });
  });
  pickupDistribution.sort((a, b) => b.guestsCount - a.guestsCount);

  // Vessel Utilization
  const vesselUtilization: VesselUtilizationItem[] = vessels.map((ves) => {
    // Find assignments in interval
    const vesAssignments = assignments.filter((a) => {
      const aDate = a.date || '';
      return a.vesselId === ves.id && aDate >= interval.startDate && aDate <= interval.endDate;
    });

    const tripsCount = vesAssignments.length;
    // Passengers carried on this vessel based on matching excursion bookings
    let carried = 0;
    vesAssignments.forEach((va) => {
      const matched = activeBookings.filter(
        (b) => b.date === va.date && (b.tourId === va.tourId || b.tourSlug === va.tourId) && b.status !== 'cancelled'
      );
      matched.forEach((b) => {
        carried += (b.guests?.adults || 1) + (b.guests?.children || 0) + (b.guests?.infants || 0);
      });
    });

    const totalCap = tripsCount * ves.passenger_capacity;
    const utilPct = totalCap > 0 ? Math.min(100, Math.round((carried / totalCap) * 100)) : 0;

    return {
      vesselId: ves.id,
      vesselName: ves.name,
      vesselType: ves.vessel_type,
      maxCapacity: ves.passenger_capacity,
      tripsCount,
      passengersCarried: carried,
      utilizationPct: utilPct,
    };
  });

  return {
    departuresCount,
    passengerCounts: {
      adults,
      children,
      infants,
      total: totalPassengers,
    },
    capacityUtilizationPct,
    cancellationsCount: cancellations,
    cancellationRatePct,
    noShowsCount: noShows,
    pickupDistribution,
    vesselUtilization,
  };
}

// ------------------------------------------------------------------------------
// 5. FINANCE REPORT
// ------------------------------------------------------------------------------

export async function fetchFinanceReport(interval: DateRangeInterval): Promise<FinanceMetrics> {
  const [allBookings, payments, refunds] = await Promise.all([
    bookingRepository.listBookings(),
    listPayments(),
    listRefunds(),
  ]);

  const activeBookings = filterBookingsByInterval(allBookings, interval);
  const activeBookingsMap = new Set(activeBookings.map((b) => b.bookingReference));

  // Gross contracted revenue
  const nonCancelled = activeBookings.filter((b) => b.status !== 'cancelled');
  const revenueEur = nonCancelled.reduce((sum, b) => sum + (b.pricing?.totalEur || 0), 0);

  // Discounts
  const discountsEur = nonCancelled.reduce((sum, b) => sum + (b.pricing?.discountEur || 0), 0);

  // Filter payments within interval
  const intervalPayments = payments.filter((p) => {
    const pDate = (p.paymentDate || p.createdAt || '').split('T')[0];
    return (pDate >= interval.startDate && pDate <= interval.endDate) || activeBookingsMap.has(p.bookingReference);
  });

  const paidEur = intervalPayments
    .filter((p) => p.paymentStatus === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  // Filter refunds
  const intervalRefunds = refunds.filter((r) => {
    const rDate = (r.createdAt || '').split('T')[0];
    return rDate >= interval.startDate && rDate <= interval.endDate;
  });

  const refundsEur = intervalRefunds.reduce((sum, r) => sum + r.amount, 0);

  // Outstanding balances
  const outstandingEur = Math.max(0, revenueEur - paidEur);

  // Collection Rate
  const netDue = Math.max(1, revenueEur - discountsEur);
  const collectionRatePct = Math.min(100, Math.round((paidEur / netDue) * 1000) / 10);

  // Payment Methods Breakdown
  const methodMap = new Map<string, { amount: number; count: number }>();
  intervalPayments.forEach((p) => {
    const m = p.paymentMethod || 'Online Payment';
    const cur = methodMap.get(m) || { amount: 0, count: 0 };
    cur.amount += p.amount;
    cur.count += 1;
    methodMap.set(m, cur);
  });

  const paymentMethods: PaymentMethodBreakdown[] = [];
  methodMap.forEach((val, m) => {
    paymentMethods.push({
      method: m,
      amountEur: val.amount,
      count: val.count,
      percentage: paidEur > 0 ? Math.round((val.amount / paidEur) * 1000) / 10 : 0,
    });
  });
  paymentMethods.sort((a, b) => b.amountEur - a.amountEur);

  return {
    revenueEur,
    paidEur,
    outstandingEur,
    refundsEur,
    discountsEur,
    collectionRatePct,
    paymentMethods,
    currencyBreakdown: [
      { currency: 'EUR', amount: paidEur, convertedEur: paidEur },
      { currency: 'USD', amount: Math.round(paidEur * 1.08), convertedEur: paidEur },
      { currency: 'EGP', amount: Math.round(paidEur * 52.5), convertedEur: paidEur },
    ],
  };
}

// ------------------------------------------------------------------------------
// EXPORT UTILITIES (CSV, EXCEL, PRINT)
// ------------------------------------------------------------------------------

/**
 * Downloads a clean CSV report with UTF-8 BOM so Excel opens it with proper encoding
 */
export function exportReportToCsv(
  title: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const sanitize = (val: string | number) => {
    const s = String(val ?? '');
    return `"${s.replace(/"/g, '""')}"`;
  };

  const csvContent =
    '\uFEFF' +
    [`# ${title} - Exported on ${new Date().toISOString()}`, '']
      .concat([headers.map(sanitize).join(',')])
      .concat(rows.map((r) => r.map(sanitize).join(',')))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an Excel-compatible tab-delimited workbook
 */
export function exportReportToExcel(
  title: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const tsvContent =
    '\uFEFF' +
    [`${title}\tGenerated: ${new Date().toLocaleString()}`, '']
      .concat([headers.join('\t')])
      .concat(rows.map((r) => r.join('\t')))
      .join('\r\n');

  const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers browser print preview formatted for management reporting
 */
export function printManagementReport(): void {
  window.print();
}
