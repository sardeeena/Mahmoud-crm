// ==============================================================================
// SUPABASE DATABASE TYPE DEFINITIONS
// Strongly typed interfaces matching the PostgreSQL schema
// ==============================================================================

export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './database.types';

export type UserRole = 'admin' | 'manager' | 'staff' | 'customer';

export type TourStatus = 'draft' | 'published' | 'archived';
export type TourType = 'Shared' | 'Private';
export type DurationCategory = 'Half Day' | 'Full Day' | 'Multi Day';

export interface DbProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DbDestination {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  main_image: string | null;
  gallery: string[];
  distance_from_airport: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  status: 'draft' | 'published' | 'archived';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  status: 'draft' | 'published' | 'archived';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbTour {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  destination_id: string | null;
  duration: string;
  duration_type: DurationCategory;
  duration_hours: number;
  tour_type: TourType;
  status: TourStatus;
  featured: boolean;
  price: number;
  child_price: number;
  infant_price: number;
  private_price: number;
  currency: string;
  max_guests: number;
  minimum_booking_notice_hours: number;
  pickup_available: boolean;
  pickup_info: string | null;
  cancellation_policy: string | null;
  departure_time: string | null;
  available_days: string[];
  languages: string[];
  difficulty: 'Easy' | 'Moderate' | 'Adventurous' | null;
  age_restrictions: string | null;
  badge: string | null;
  rating: number;
  review_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbTourImage {
  id: string;
  tour_id: string;
  image_url: string;
  storage_path: string | null;
  alt_text: string | null;
  caption: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbTourVideo {
  id: string;
  tour_id: string;
  video_url: string;
  title: string | null;
  description: string | null;
  provider: 'youtube' | 'vimeo' | 'storage' | 'direct';
  storage_path: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbTourItinerary {
  id: string;
  tour_id: string;
  time: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface DbTourInclusion {
  id: string;
  tour_id: string;
  item: string;
  sort_order: number;
  created_at: string;
}

export interface DbTourExclusion {
  id: string;
  tour_id: string;
  item: string;
  sort_order: number;
  created_at: string;
}

export interface DbTourHighlight {
  id: string;
  tour_id: string;
  item: string;
  sort_order: number;
  created_at: string;
}

export interface DbTourFaq {
  id: string;
  tour_id: string;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
}

export interface DbPickupLocation {
  id: string;
  code: string;
  name: string;
  area: string;
  fee_eur_per_person: number;
  fee_eur_flat: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbTourExtra {
  id: string;
  name: string;
  description: string | null;
  price_eur: number;
  currency: string;
  pricing_type: 'per_person' | 'per_booking' | 'per_adult' | 'per_child';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbTourAvailability {
  id: string;
  tour_id: string;
  date: string; // YYYY-MM-DD
  status: 'available' | 'unavailable' | 'sold_out';
  max_capacity: number;
  booked_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  country: string;
  country_code: string | null;
  hotel: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBooking {
  id: string;
  booking_reference: string;
  tour_id: string;
  customer_id: string | null;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'cancellation_requested' | 'cancelled' | 'completed' | 'no_show';
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed';
  payment_method: 'pay_at_pickup' | 'pay_online';
  adult_count: number;
  child_count: number;
  infant_count: number;
  pickup_location_id: string | null;
  pickup_hotel_name: string | null;
  pickup_room_number: string | null;
  subtotal: number;
  extras_total: number;
  discount: number;
  total: number;
  currency: string;
  special_requests: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBookingExtra {
  id: string;
  booking_id: string;
  extra_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  pricing_type: string;
  created_at: string;
}

export interface DbReview {
  id: string;
  tour_id: string | null;
  author_name: string;
  country: string | null;
  country_code: string | null;
  rating: number;
  comment: string;
  date: string;
  traveler_type: string | null;
  verified_booking: boolean;
  is_published: boolean;
  created_at: string;
}

export interface DbSeoMetadata {
  id: string;
  entity_type: 'tour' | 'destination' | 'category' | 'page';
  entity_id: string | null;
  page_slug: string | null;
  seo_title: string | null;
  meta_description: string | null;
  seo_keywords: string[];
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  social_image: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSiteSetting {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface DbAuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

// Complete aggregate tour structure for frontend rendering
export interface TourWithRelations extends DbTour {
  destination?: DbDestination | null;
  categories?: DbCategory[];
  images: DbTourImage[];
  videos: DbTourVideo[];
  itinerary: DbTourItinerary[];
  inclusions: DbTourInclusion[];
  exclusions: DbTourExclusion[];
  highlights: DbTourHighlight[];
  faqs: DbTourFaq[];
  pickup_locations?: DbPickupLocation[];
  extras?: DbTourExtra[];
  seo?: DbSeoMetadata | null;
}
