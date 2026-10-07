export type ReportDateRangeType =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

export interface DateRangeInterval {
  range: ReportDateRangeType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string;
}

export type DashboardViewMode =
  | 'executive'
  | 'sales'
  | 'operations'
  | 'customers'
  | 'finance';

// 1. Executive Dashboard Metrics
export interface ExecutiveMetrics {
  revenueEur: number;
  bookingsCount: number;
  passengersCount: number;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  newCustomersCount: number;
  repeatCustomersCount: number;
  conversionRate: number; // percentage (0-100)
  cancellationRate: number; // percentage (0-100)
  outstandingBalancesEur: number;
  averageBookingValueEur: number;
  // Comparison vs prior period of equal length
  priorPeriodComparison?: {
    priorRevenueEur: number;
    revenueGrowthPct: number;
    priorBookingsCount: number;
    bookingsGrowthPct: number;
  };
}

// 2. Sales Dashboard Metrics
export interface BreakdownItem {
  id: string;
  name: string;
  count: number;
  revenueEur: number;
  percentage: number;
}

export interface SalesMetrics {
  totalRevenueEur: number;
  totalBookingsCount: number;
  averageBookingValueEur: number;
  conversionRate: number;
  bookingsByTour: BreakdownItem[];
  bookingsByDestination: BreakdownItem[];
  revenueByTour: BreakdownItem[];
  revenueByDestination: BreakdownItem[];
  bookingsBySource: Array<{
    source: string;
    count: number;
    revenueEur: number;
    percentage: number;
  }>;
}

// 3. Customers Dashboard Metrics
export interface TopCustomerItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  country: string;
  hotel?: string | null;
  totalBookings: number;
  totalSpentEur: number;
  lastBookingDate?: string | null;
  status: 'VIP' | 'Regular' | 'New';
}

export interface CustomerMetrics {
  totalCustomersCount: number;
  newCustomersCount: number;
  repeatCustomersCount: number;
  repeatRatePct: number;
  customerLifetimeValueEur: number;
  countriesDistribution: Array<{
    country: string;
    count: number;
    percentage: number;
    revenueEur: number;
  }>;
  hotelsDistribution: Array<{
    hotel: string;
    count: number;
    percentage: number;
  }>;
  topCustomers: TopCustomerItem[];
}

// 4. Operations Dashboard Metrics
export interface VesselUtilizationItem {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  maxCapacity: number;
  tripsCount: number;
  passengersCarried: number;
  utilizationPct: number;
}

export interface OperationsMetrics {
  departuresCount: number;
  passengerCounts: {
    adults: number;
    children: number;
    infants: number;
    total: number;
  };
  capacityUtilizationPct: number;
  cancellationsCount: number;
  cancellationRatePct: number;
  noShowsCount: number;
  pickupDistribution: Array<{
    locationName: string;
    area: string;
    guestsCount: number;
    percentage: number;
  }>;
  vesselUtilization: VesselUtilizationItem[];
}

// 5. Finance Dashboard Metrics
export interface PaymentMethodBreakdown {
  method: string;
  amountEur: number;
  count: number;
  percentage: number;
}

export interface FinanceMetrics {
  revenueEur: number; // Contracted Gross Total
  paidEur: number; // Actually Collected in Cash / Online
  outstandingEur: number; // Pending / Pier Balances
  refundsEur: number; // Processed Refunds
  discountsEur: number; // Coupon / Promo Deductions
  collectionRatePct: number; // Paid / (Revenue - Discounts)
  paymentMethods: PaymentMethodBreakdown[];
  currencyBreakdown: Array<{
    currency: string;
    amount: number;
    convertedEur: number;
  }>;
}
