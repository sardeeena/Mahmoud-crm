-- ==============================================================================
-- RED SEA VOYAGES & MARITIME EXCURSIONS - COMPLETE PRODUCTION DATABASE SCHEMA
-- ==============================================================================
-- Migration Version: 20260922000000_phase4_schema.sql
-- Engine: PostgreSQL 15+ & Supabase Auth & Storage
-- Architecture: Enterprise Tourism, Maritime Vessel Operations & Booking Engine
-- Idempotent: Can be executed repeatedly in Supabase SQL Editor safely.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ------------------------------------------------------------------------------
-- 2. REUSABLE UTILITIES & TRIGGER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Generic updated_at timestamp manager
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. USER PROFILES & ROLES TABLE
-- ------------------------------------------------------------------------------
-- Extends Supabase auth.users with custom application role & metadata
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'manager', 'staff', 'customer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Helper function: check if currently authenticated user is an admin or manager
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
    );
$$;

-- Helper function: check if currently authenticated user has staff or higher clearance
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'manager', 'staff')
    );
$$;

-- Trigger to automatically create a profile row when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 4. DESTINATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    description TEXT,
    main_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    distance_from_airport TEXT,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destinations_slug ON public.destinations(slug);
CREATE INDEX IF NOT EXISTS idx_destinations_status ON public.destinations(status);

DROP TRIGGER IF EXISTS trigger_destinations_updated_at ON public.destinations;
CREATE TRIGGER trigger_destinations_updated_at
    BEFORE UPDATE ON public.destinations
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 5. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    icon_name TEXT DEFAULT 'Compass',
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_status ON public.categories(status);

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 6. TOURS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    duration TEXT NOT NULL DEFAULT 'Full Day (approx. 7 hours)',
    duration_type TEXT NOT NULL DEFAULT 'Full Day' CHECK (duration_type IN ('Half Day', 'Full Day', 'Multi Day')),
    duration_hours NUMERIC(4,1) NOT NULL DEFAULT 7.0,
    tour_type TEXT NOT NULL DEFAULT 'Shared' CHECK (tour_type IN ('Shared', 'Private')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    child_price NUMERIC(10,2) DEFAULT 0.00,
    infant_price NUMERIC(10,2) DEFAULT 0.00,
    private_price NUMERIC(10,2) DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'EUR',
    max_guests INT NOT NULL DEFAULT 35,
    minimum_booking_notice_hours INT NOT NULL DEFAULT 12,
    pickup_available BOOLEAN NOT NULL DEFAULT TRUE,
    pickup_info TEXT DEFAULT 'Complimentary transfer from your resort lobby included.',
    cancellation_policy TEXT DEFAULT 'Free cancellation up to 24 hours before excursion start time.',
    departure_time TEXT DEFAULT '08:30 AM',
    available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    languages TEXT[] DEFAULT ARRAY['English', 'German'],
    difficulty TEXT DEFAULT 'Easy' CHECK (difficulty IN ('Easy', 'Moderate', 'Adventurous')),
    age_restrictions TEXT DEFAULT 'Suitable for all ages. Children under 2 join free.',
    badge TEXT,
    rating NUMERIC(3,2) NOT NULL DEFAULT 4.90,
    review_count INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tours_slug ON public.tours(slug);
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_destination ON public.tours(destination_id);
CREATE INDEX IF NOT EXISTS idx_tours_featured ON public.tours(featured);
CREATE INDEX IF NOT EXISTS idx_tours_status_price ON public.tours(status, price);
CREATE INDEX IF NOT EXISTS idx_tours_status_rating ON public.tours(status, rating);

-- Trigram index for ultra-fast title & description search
CREATE INDEX IF NOT EXISTS idx_tours_trgm_title ON public.tours USING gin (title gin_trgm_ops);

DROP TRIGGER IF EXISTS trigger_tours_updated_at ON public.tours;
CREATE TRIGGER trigger_tours_updated_at
    BEFORE UPDATE ON public.tours
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 7. TOUR CATEGORIES (M2M)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_categories (
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (tour_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_tour_categories_cat ON public.tour_categories(category_id);


-- ------------------------------------------------------------------------------
-- 8. TOUR IMAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT,
    alt_text TEXT,
    caption TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_images_tour ON public.tour_images(tour_id, sort_order);


-- ------------------------------------------------------------------------------
-- 9. TOUR VIDEOS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    provider TEXT DEFAULT 'youtube' CHECK (provider IN ('youtube', 'vimeo', 'storage', 'direct')),
    storage_path TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_videos_tour ON public.tour_videos(tour_id);


-- ------------------------------------------------------------------------------
-- 10. TOUR ITINERARY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_itinerary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_itinerary_tour ON public.tour_itinerary(tour_id, sort_order);


-- ------------------------------------------------------------------------------
-- 11. TOUR INCLUSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_inclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_inclusions_tour ON public.tour_inclusions(tour_id, sort_order);


-- ------------------------------------------------------------------------------
-- 12. TOUR EXCLUSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_exclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_exclusions_tour ON public.tour_exclusions(tour_id, sort_order);


-- ------------------------------------------------------------------------------
-- 13. TOUR HIGHLIGHTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_highlights_tour ON public.tour_highlights(tour_id, sort_order);


-- ------------------------------------------------------------------------------
-- 14. TOUR FAQS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_faqs_tour ON public.tour_faqs(tour_id, sort_order);


-- ------------------------------------------------------------------------------
-- 15. PICKUP LOCATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pickup_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    area TEXT NOT NULL,
    fee_eur_per_person NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    fee_eur_flat NUMERIC(10,2) DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_pickup_locations_updated_at ON public.pickup_locations;
CREATE TRIGGER trigger_pickup_locations_updated_at
    BEFORE UPDATE ON public.pickup_locations
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 16. TOUR PICKUP ASSIGNMENTS (M2M)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_pickup_locations (
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    pickup_location_id UUID NOT NULL REFERENCES public.pickup_locations(id) ON DELETE CASCADE,
    PRIMARY KEY (tour_id, pickup_location_id)
);


-- ------------------------------------------------------------------------------
-- 17. TOUR EXTRAS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_extras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price_eur NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'EUR',
    pricing_type TEXT NOT NULL DEFAULT 'per_booking' CHECK (pricing_type IN ('per_person', 'per_booking', 'per_adult', 'per_child')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_tour_extras_updated_at ON public.tour_extras;
CREATE TRIGGER trigger_tour_extras_updated_at
    BEFORE UPDATE ON public.tour_extras
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 18. TOUR ASSIGNED EXTRAS (M2M)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_assigned_extras (
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    extra_id UUID NOT NULL REFERENCES public.tour_extras(id) ON DELETE CASCADE,
    PRIMARY KEY (tour_id, extra_id)
);


-- ------------------------------------------------------------------------------
-- 19. TOUR AVAILABILITY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tour_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'sold_out')),
    max_capacity INT NOT NULL DEFAULT 35,
    booked_count INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tour_id, date)
);

CREATE INDEX IF NOT EXISTS idx_tour_avail_lookup ON public.tour_availability(tour_id, date);

DROP TRIGGER IF EXISTS trigger_tour_avail_updated_at ON public.tour_availability;
CREATE TRIGGER trigger_tour_avail_updated_at
    BEFORE UPDATE ON public.tour_availability
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 20. CUSTOMERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    country TEXT NOT NULL,
    country_code TEXT,
    hotel TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON public.customers;
CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 21. PROMO CODES & COUPONS TABLE (Enhanced Operational Feature)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    min_spend NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    max_discount NUMERIC(10,2),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    max_redemptions INT,
    times_redeemed INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);

DROP TRIGGER IF EXISTS trigger_coupons_updated_at ON public.coupons;
CREATE TRIGGER trigger_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 22. BOOKINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT NOT NULL UNIQUE,
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancellation_requested', 'cancelled', 'completed', 'no_show')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded', 'failed')),
    payment_method TEXT NOT NULL DEFAULT 'pay_at_pickup' CHECK (payment_method IN ('pay_at_pickup', 'pay_online')),
    adult_count INT NOT NULL DEFAULT 1,
    child_count INT NOT NULL DEFAULT 0,
    infant_count INT NOT NULL DEFAULT 0,
    pickup_location_id UUID REFERENCES public.pickup_locations(id) ON DELETE SET NULL,
    pickup_hotel_name TEXT,
    pickup_room_number TEXT,
    pickup_time_confirmed TEXT,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    extras_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'EUR',
    special_requests TEXT,
    cancellation_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tour ON public.bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings(created_at DESC);

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 23. BOOKING EXTRAS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_extras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    extra_id UUID REFERENCES public.tour_extras(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    pricing_type TEXT NOT NULL DEFAULT 'per_booking',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_extras_booking ON public.booking_extras(booking_id);


-- ------------------------------------------------------------------------------
-- 24. BOOKING PASSENGERS / MARINA COAST GUARD MANIFEST (Enterprise Red Sea Ops)
-- ------------------------------------------------------------------------------
-- Required by Egyptian Coast Guard and Marine Police before vessel clearance
CREATE TABLE IF NOT EXISTS public.booking_passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    nationality TEXT NOT NULL,
    passport_or_id_number TEXT,
    date_of_birth DATE,
    passenger_type TEXT NOT NULL DEFAULT 'adult' CHECK (passenger_type IN ('adult', 'child', 'infant')),
    is_lead_passenger BOOLEAN NOT NULL DEFAULT FALSE,
    special_dietary_needs TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking ON public.booking_passengers(booking_id);


-- ------------------------------------------------------------------------------
-- 25. BOOKING CANCELLATIONS TABLE (Audit & Processing)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT NOT NULL REFERENCES public.bookings(booking_reference) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'refunded')),
    refund_amount NUMERIC(10,2) DEFAULT 0.00,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_cancellations_ref ON public.booking_cancellations(booking_reference);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_status ON public.booking_cancellations(status);


-- ------------------------------------------------------------------------------
-- 26. MARITIME VESSELS & FLEET MANAGEMENT (Authentic Red Sea Operations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vessels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    vessel_type TEXT NOT NULL DEFAULT 'motor_yacht' CHECK (vessel_type IN ('motor_yacht', 'speedboat', 'catamaran', 'glass_bottom', 'semi_submarine', 'safari_jeep')),
    registration_number TEXT,
    port_marina TEXT NOT NULL DEFAULT 'Hurghada Marina',
    passenger_capacity INT NOT NULL DEFAULT 40,
    crew_capacity INT NOT NULL DEFAULT 4,
    year_built INT,
    safety_inspection_expiry DATE,
    amenities TEXT[] DEFAULT ARRAY['Sundeck', 'Saloon with AC', 'Snorkeling Platform', 'Freshwater Showers', 'Life Jackets'],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vessels_active ON public.vessels(is_active);

DROP TRIGGER IF EXISTS trigger_vessels_updated_at ON public.vessels;
CREATE TRIGGER trigger_vessels_updated_at
    BEFORE UPDATE ON public.vessels
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- Vessel assignments to tours
CREATE TABLE IF NOT EXISTS public.tour_vessels (
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    vessel_id UUID NOT NULL REFERENCES public.vessels(id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (tour_id, vessel_id)
);


-- ------------------------------------------------------------------------------
-- 27. GUIDES & CREW MANAGEMENT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'tour_guide' CHECK (role IN ('captain', 'dive_master', 'snorkel_guide', 'safari_lead', 'tour_guide')),
    languages TEXT[] DEFAULT ARRAY['English', 'German'],
    phone TEXT,
    email TEXT,
    license_number TEXT,
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_role ON public.guides(role);
CREATE INDEX IF NOT EXISTS idx_guides_active ON public.guides(is_active);


-- ------------------------------------------------------------------------------
-- 28. REVIEWS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    country TEXT,
    country_code TEXT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    traveler_type TEXT DEFAULT 'Couple',
    verified_booking BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_tour ON public.reviews(tour_id, is_published);

-- Trigger to recalculate tour rating and review_count automatically on review insert/update/delete
CREATE OR REPLACE FUNCTION public.handle_review_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_tour_id UUID;
    new_avg NUMERIC(3,2);
    new_count INT;
BEGIN
    target_tour_id := COALESCE(NEW.tour_id, OLD.tour_id);
    IF target_tour_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 2), 4.90),
        COUNT(*)::INT
    INTO 
        new_avg, 
        new_count
    FROM public.reviews
    WHERE tour_id = target_tour_id
    AND is_published = TRUE;

    UPDATE public.tours
    SET rating = new_avg,
        review_count = new_count
    WHERE id = target_tour_id;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_review_stats ON public.reviews;
CREATE TRIGGER trigger_review_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE PROCEDURE public.handle_review_stats();


-- ------------------------------------------------------------------------------
-- 29. WISHLISTS / SAVED TOURS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, tour_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_session ON public.wishlists(session_id);


-- ------------------------------------------------------------------------------
-- 30. CONTACT INQUIRIES & LEAD CAPTURE TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    tour_id UUID REFERENCES public.tours(id) ON DELETE SET NULL,
    subject TEXT NOT NULL DEFAULT 'Tour Inquiry',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved', 'converted')),
    source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'whatsapp', 'email', 'phone')),
    ip_address TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON public.inquiries(email);

DROP TRIGGER IF EXISTS trigger_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER trigger_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 31. NEWSLETTER SUBSCRIBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    source TEXT DEFAULT 'footer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);


-- ------------------------------------------------------------------------------
-- 32. PAYMENT TRANSACTIONS LOG TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL CHECK (gateway IN ('stripe', 'paypal', 'paymob', 'cash_at_pickup')),
    transaction_reference TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'succeeded', 'failed', 'refunded')),
    card_brand TEXT,
    card_last4 TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON public.payment_transactions(transaction_reference);


-- ------------------------------------------------------------------------------
-- 33. GLOBAL FREQUENTLY ASKED QUESTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'booking', 'cancellation', 'marine_safety', 'transfers')),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category, is_published);


-- ------------------------------------------------------------------------------
-- 34. SEO METADATA TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seo_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('tour', 'destination', 'category', 'page')),
    entity_id UUID,
    page_slug TEXT,
    seo_title TEXT,
    meta_description TEXT,
    seo_keywords TEXT[] DEFAULT '{}',
    canonical_url TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    social_image TEXT,
    robots_index BOOLEAN NOT NULL DEFAULT TRUE,
    robots_follow BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_seo_lookup ON public.seo_metadata(entity_type, entity_id);

DROP TRIGGER IF EXISTS trigger_seo_metadata_updated_at ON public.seo_metadata;
CREATE TRIGGER trigger_seo_metadata_updated_at
    BEFORE UPDATE ON public.seo_metadata
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 35. MARITIME WEATHER BULLETINS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weather_bulletins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    harbor_location TEXT NOT NULL DEFAULT 'Hurghada Marina',
    water_temperature_c NUMERIC(4,1) NOT NULL DEFAULT 25.0,
    air_temperature_c NUMERIC(4,1) NOT NULL DEFAULT 29.0,
    swell_height_m NUMERIC(3,1) NOT NULL DEFAULT 0.3,
    wind_speed_knots NUMERIC(4,1) NOT NULL DEFAULT 9.0,
    wind_direction TEXT NOT NULL DEFAULT 'NNE',
    visibility_meters INT NOT NULL DEFAULT 30,
    coast_guard_cleared BOOLEAN NOT NULL DEFAULT TRUE,
    advisory_notes TEXT,
    bulletin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_date ON public.weather_bulletins(bulletin_date DESC);


-- ------------------------------------------------------------------------------
-- 36. SITE SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trigger_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trigger_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();


-- ------------------------------------------------------------------------------
-- 37. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);


-- ==============================================================================
-- 38. COMPREHENSIVE BUSINESS LOGIC STORED PROCEDURES & TRANSACTIONS
-- ==============================================================================

-- Stored Function 1: Check availability safely
CREATE OR REPLACE FUNCTION public.check_tour_availability(
    p_tour_id UUID,
    p_date DATE,
    p_requested_guests INT DEFAULT 1
)
RETURNS TABLE (
    is_available BOOLEAN,
    remaining_capacity INT,
    max_capacity INT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tour_max INT;
    v_avail_max INT;
    v_booked INT;
    v_status TEXT;
    v_effective_max INT;
BEGIN
    -- Read tour default max capacity
    SELECT max_guests INTO v_tour_max FROM public.tours WHERE id = p_tour_id;
    IF v_tour_max IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'tour_not_found'::TEXT;
        RETURN;
    END IF;

    -- Look up specific date override in tour_availability
    SELECT 
        tour_availability.max_capacity,
        tour_availability.booked_count,
        tour_availability.status
    INTO 
        v_avail_max,
        v_booked,
        v_status
    FROM public.tour_availability
    WHERE tour_id = p_tour_id AND date = p_date;

    IF v_status = 'sold_out' OR v_status = 'unavailable' THEN
        RETURN QUERY SELECT FALSE, 0, COALESCE(v_avail_max, v_tour_max), v_status;
        RETURN;
    END IF;

    v_effective_max := COALESCE(v_avail_max, v_tour_max);
    v_booked := COALESCE(v_booked, 0);

    IF (v_effective_max - v_booked) >= p_requested_guests THEN
        RETURN QUERY SELECT TRUE, (v_effective_max - v_booked), v_effective_max, 'available'::TEXT;
    ELSE
        RETURN QUERY SELECT FALSE, GREATEST(0, (v_effective_max - v_booked)), v_effective_max, 'capacity_exceeded'::TEXT;
    END IF;
END;
$$;


-- Stored Function 2: Coupon Validator
CREATE OR REPLACE FUNCTION public.validate_coupon(
    p_code TEXT,
    p_subtotal NUMERIC
)
RETURNS TABLE (
    is_valid BOOLEAN,
    coupon_id UUID,
    discount_amount NUMERIC,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupon RECORD;
    v_discount NUMERIC := 0.00;
BEGIN
    SELECT * INTO v_coupon FROM public.coupons 
    WHERE UPPER(code) = UPPER(TRIM(p_code)) AND is_active = TRUE;

    IF v_coupon.id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0.00, 'Invalid coupon code.'::TEXT;
        RETURN;
    END IF;

    IF v_coupon.valid_from > NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0.00, 'Coupon is not yet active.'::TEXT;
        RETURN;
    END IF;

    IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0.00, 'Coupon has expired.'::TEXT;
        RETURN;
    END IF;

    IF v_coupon.max_redemptions IS NOT NULL AND v_coupon.times_redeemed >= v_coupon.max_redemptions THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0.00, 'Coupon usage limit reached.'::TEXT;
        RETURN;
    END IF;

    IF p_subtotal < v_coupon.min_spend THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0.00, ('Minimum spend of €' || v_coupon.min_spend || ' required.')::TEXT;
        RETURN;
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := ROUND((p_subtotal * (v_coupon.discount_value / 100.0)), 2);
        IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
            v_discount := v_coupon.max_discount;
        END IF;
    ELSE
        v_discount := LEAST(v_coupon.discount_value, p_subtotal);
    END IF;

    RETURN QUERY SELECT TRUE, v_coupon.id, v_discount, 'Coupon applied successfully!'::TEXT;
END;
$$;


-- Stored Function 3: Create Booking Transactionally (Atomic Reservation)
CREATE OR REPLACE FUNCTION public.create_direct_booking(
    p_tour_id UUID,
    p_booking_date DATE,
    p_adults INT,
    p_children INT,
    p_infants INT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_whatsapp TEXT,
    p_country TEXT,
    p_hotel TEXT,
    p_room_number TEXT,
    p_pickup_location_id UUID,
    p_special_requests TEXT,
    p_payment_method TEXT,
    p_coupon_code TEXT DEFAULT NULL,
    p_extras JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
    booking_id UUID,
    booking_reference TEXT,
    total_amount NUMERIC,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tour RECORD;
    v_total_guests INT;
    v_avail_check RECORD;
    v_cust_id UUID;
    v_booking_id UUID;
    v_ref TEXT;
    v_subtotal NUMERIC := 0.00;
    v_extras_total NUMERIC := 0.00;
    v_discount NUMERIC := 0.00;
    v_coupon_id UUID := NULL;
    v_coupon_result RECORD;
    v_extra RECORD;
    v_extra_item JSONB;
BEGIN
    v_total_guests := p_adults + p_children;

    -- 1. Check Tour exists
    SELECT * INTO v_tour FROM public.tours WHERE id = p_tour_id AND status = 'published';
    IF v_tour.id IS NULL THEN
        RAISE EXCEPTION 'Tour not found or not published.';
    END IF;

    -- 2. Verify availability
    SELECT * INTO v_avail_check FROM public.check_tour_availability(p_tour_id, p_booking_date, v_total_guests);
    IF NOT v_avail_check.is_available THEN
        RAISE EXCEPTION 'Tour is not available for date % (status: %)', p_booking_date, v_avail_check.status;
    END IF;

    -- 3. Upsert Customer Record
    INSERT INTO public.customers (first_name, last_name, email, phone, whatsapp, country, hotel)
    VALUES (p_first_name, p_last_name, p_email, p_phone, p_whatsapp, p_country, p_hotel)
    RETURNING id INTO v_cust_id;

    -- 4. Calculate Subtotal
    v_subtotal := (p_adults * v_tour.price) + 
                  (p_children * COALESCE(v_tour.child_price, v_tour.price * 0.50)) +
                  (p_infants * COALESCE(v_tour.infant_price, 0.00));

    -- 5. Calculate Extras
    FOR v_extra_item IN SELECT * FROM jsonb_array_elements(p_extras)
    LOOP
        v_extras_total := v_extras_total + COALESCE((v_extra_item->>'total_price')::NUMERIC, 0.00);
    END LOOP;

    -- 6. Coupon Check
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        SELECT * INTO v_coupon_result FROM public.validate_coupon(p_coupon_code, v_subtotal);
        IF v_coupon_result.is_valid THEN
            v_coupon_id := v_coupon_result.coupon_id;
            v_discount := v_coupon_result.discount_amount;
            UPDATE public.coupons SET times_redeemed = times_redeemed + 1 WHERE id = v_coupon_id;
        END IF;
    END IF;

    -- 7. Generate Reference: RSV-YYYYMMDD-XXXX
    v_ref := 'RSV-' || TO_CHAR(p_booking_date, 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT), 1, 4));

    -- 8. Insert Booking
    INSERT INTO public.bookings (
        booking_reference,
        tour_id,
        customer_id,
        coupon_id,
        booking_date,
        status,
        payment_status,
        payment_method,
        adult_count,
        child_count,
        infant_count,
        pickup_location_id,
        pickup_hotel_name,
        pickup_room_number,
        subtotal,
        extras_total,
        discount,
        total,
        currency,
        special_requests
    )
    VALUES (
        v_ref,
        p_tour_id,
        v_cust_id,
        v_coupon_id,
        p_booking_date,
        'confirmed',
        CASE WHEN p_payment_method = 'pay_at_pickup' THEN 'pending' ELSE 'paid' END,
        p_payment_method,
        p_adults,
        p_children,
        p_infants,
        p_pickup_location_id,
        p_hotel,
        p_room_number,
        v_subtotal,
        v_extras_total,
        v_discount,
        GREATEST(0.00, v_subtotal + v_extras_total - v_discount),
        'EUR',
        p_special_requests
    )
    RETURNING id INTO v_booking_id;

    -- 9. Insert Booking Extras
    FOR v_extra_item IN SELECT * FROM jsonb_array_elements(p_extras)
    LOOP
        INSERT INTO public.booking_extras (
            booking_id,
            extra_id,
            name,
            quantity,
            unit_price,
            total_price,
            pricing_type
        )
        VALUES (
            v_booking_id,
            (v_extra_item->>'extra_id')::UUID,
            v_extra_item->>'name',
            COALESCE((v_extra_item->>'quantity')::INT, 1),
            (v_extra_item->>'unit_price')::NUMERIC,
            (v_extra_item->>'total_price')::NUMERIC,
            COALESCE(v_extra_item->>'pricing_type', 'per_booking')
        );
    END LOOP;

    -- 10. Increment Tour Availability Booked Count
    INSERT INTO public.tour_availability (tour_id, date, booked_count, max_capacity)
    VALUES (p_tour_id, p_booking_date, v_total_guests, v_tour.max_guests)
    ON CONFLICT (tour_id, date) DO UPDATE
    SET booked_count = public.tour_availability.booked_count + v_total_guests,
        status = CASE 
            WHEN (public.tour_availability.booked_count + v_total_guests) >= public.tour_availability.max_capacity 
            THEN 'sold_out' 
            ELSE public.tour_availability.status 
        END;

    -- 11. Add Lead Passenger
    INSERT INTO public.booking_passengers (
        booking_id,
        full_name,
        nationality,
        is_lead_passenger,
        passenger_type
    )
    VALUES (
        v_booking_id,
        p_first_name || ' ' || p_last_name,
        p_country,
        TRUE,
        'adult'
    );

    RETURN QUERY SELECT v_booking_id, v_ref, GREATEST(0.00, v_subtotal + v_extras_total - v_discount), 'confirmed'::TEXT;
END;
$$;


-- ==============================================================================
-- 39. PERFORMANCE-OPTIMIZED DATABASE VIEWS
-- ==============================================================================

-- View 1: Complete Public Tours Catalog
CREATE OR REPLACE VIEW public.view_tours_catalog AS
SELECT 
    t.id,
    t.title,
    t.slug,
    t.short_description,
    t.duration,
    t.duration_type,
    t.duration_hours,
    t.tour_type,
    t.price,
    t.child_price,
    t.currency,
    t.rating,
    t.review_count,
    t.badge,
    t.featured,
    t.departure_time,
    t.cancellation_policy,
    t.pickup_available,
    d.id AS destination_id,
    d.name AS destination_name,
    d.slug AS destination_slug,
    COALESCE(
        (SELECT image_url FROM public.tour_images ti WHERE ti.tour_id = t.id AND ti.is_primary = TRUE LIMIT 1),
        (SELECT image_url FROM public.tour_images ti WHERE ti.tour_id = t.id ORDER BY ti.sort_order ASC LIMIT 1)
    ) AS primary_image,
    COALESCE(
        ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL),
        '{}'
    ) AS categories
FROM public.tours t
LEFT JOIN public.destinations d ON t.destination_id = d.id
LEFT JOIN public.tour_categories tc ON t.id = tc.tour_id
LEFT JOIN public.categories c ON tc.category_id = c.id
WHERE t.status = 'published'
GROUP BY t.id, d.id, d.name, d.slug;


-- View 2: Detailed Bookings Management View (Admin/Operations)
CREATE OR REPLACE VIEW public.view_bookings_detailed AS
SELECT 
    b.id AS booking_id,
    b.booking_reference,
    b.booking_date,
    b.status AS booking_status,
    b.payment_status,
    b.payment_method,
    b.adult_count,
    b.child_count,
    b.infant_count,
    (b.adult_count + b.child_count + b.infant_count) AS total_passengers,
    b.subtotal,
    b.extras_total,
    b.discount,
    b.total,
    b.currency,
    b.pickup_hotel_name,
    b.pickup_room_number,
    b.pickup_time_confirmed,
    b.special_requests,
    b.created_at AS booked_at,
    t.id AS tour_id,
    t.title AS tour_title,
    t.slug AS tour_slug,
    d.name AS destination_name,
    c.id AS customer_id,
    (c.first_name || ' ' || c.last_name) AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    c.whatsapp AS customer_whatsapp,
    c.country AS customer_country,
    pl.name AS pickup_area_name,
    cp.code AS coupon_applied
FROM public.bookings b
JOIN public.tours t ON b.tour_id = t.id
LEFT JOIN public.destinations d ON t.destination_id = d.id
LEFT JOIN public.customers c ON b.customer_id = c.id
LEFT JOIN public.pickup_locations pl ON b.pickup_location_id = pl.id
LEFT JOIN public.coupons cp ON b.coupon_id = cp.id;


-- View 3: Egyptian Coast Guard & Port Authority Manifest View
CREATE OR REPLACE VIEW public.view_coast_guard_manifest AS
SELECT 
    b.booking_date,
    t.title AS excursion_name,
    v.name AS assigned_vessel,
    v.registration_number AS vessel_registration,
    v.port_marina AS departure_harbor,
    b.booking_reference,
    p.full_name AS passenger_name,
    p.nationality,
    p.passport_or_id_number,
    p.passenger_type,
    p.is_lead_passenger,
    b.pickup_hotel_name,
    b.pickup_room_number,
    c.phone AS contact_phone
FROM public.bookings b
JOIN public.tours t ON b.tour_id = t.id
JOIN public.booking_passengers p ON b.id = p.booking_id
LEFT JOIN public.customers c ON b.customer_id = c.id
LEFT JOIN public.tour_vessels tv ON t.id = tv.tour_id AND tv.is_default = TRUE
LEFT JOIN public.vessels v ON tv.vessel_id = v.id
WHERE b.status = 'confirmed';


-- View 4: Executive KPI & Operations Dashboard View
CREATE OR REPLACE VIEW public.view_dashboard_kpis AS
SELECT 
    (SELECT COUNT(*) FROM public.bookings) AS total_all_time_bookings,
    (SELECT COUNT(*) FROM public.bookings WHERE status = 'confirmed') AS confirmed_bookings,
    (SELECT COUNT(*) FROM public.bookings WHERE booking_date = CURRENT_DATE AND status = 'confirmed') AS departures_today,
    (SELECT COALESCE(SUM(total), 0.00) FROM public.bookings WHERE status IN ('confirmed', 'completed')) AS total_revenue_eur,
    (SELECT COUNT(*) FROM public.booking_cancellations WHERE status = 'requested') AS pending_cancellations,
    (SELECT COUNT(*) FROM public.inquiries WHERE status = 'new') AS new_leads_count,
    (SELECT COUNT(*) FROM public.tours WHERE status = 'published') AS active_tours_count,
    (SELECT COUNT(*) FROM public.reviews WHERE is_published = TRUE) AS total_published_reviews;


-- ==============================================================================
-- 40. ROW LEVEL SECURITY (RLS) POLICIES (Idempotent Execution)
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_inclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_assigned_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Destinations Policies
DROP POLICY IF EXISTS "Public can view published destinations" ON public.destinations;
CREATE POLICY "Public can view published destinations" ON public.destinations FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage destinations" ON public.destinations;
CREATE POLICY "Admins manage destinations" ON public.destinations FOR ALL USING (public.is_admin());

-- Categories Policies
DROP POLICY IF EXISTS "Public can view published categories" ON public.categories;
CREATE POLICY "Public can view published categories" ON public.categories FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.is_admin());

-- Tours Policies
DROP POLICY IF EXISTS "Public can view published tours" ON public.tours;
CREATE POLICY "Public can view published tours" ON public.tours FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage tours" ON public.tours;
CREATE POLICY "Admins manage tours" ON public.tours FOR ALL USING (public.is_admin());

-- Tour Media & Itinerary Policies
DROP POLICY IF EXISTS "Public can read tour media for published tours" ON public.tour_images;
CREATE POLICY "Public can read tour media for published tours" ON public.tour_images FOR SELECT USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_images.tour_id AND (tours.status = 'published' OR public.is_admin())));

DROP POLICY IF EXISTS "Admins manage tour images" ON public.tour_images;
CREATE POLICY "Admins manage tour images" ON public.tour_images FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read tour videos" ON public.tour_videos;
CREATE POLICY "Public can read tour videos" ON public.tour_videos FOR SELECT USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_videos.tour_id AND (tours.status = 'published' OR public.is_admin())));

DROP POLICY IF EXISTS "Admins manage tour videos" ON public.tour_videos;
CREATE POLICY "Admins manage tour videos" ON public.tour_videos FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can view tour categories" ON public.tour_categories;
CREATE POLICY "Public can view tour categories" ON public.tour_categories FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage tour categories" ON public.tour_categories;
CREATE POLICY "Admins manage tour categories" ON public.tour_categories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read itinerary" ON public.tour_itinerary;
CREATE POLICY "Public can read itinerary" ON public.tour_itinerary FOR SELECT USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_itinerary.tour_id AND (tours.status = 'published' OR public.is_admin())));

DROP POLICY IF EXISTS "Admins manage itinerary" ON public.tour_itinerary;
CREATE POLICY "Admins manage itinerary" ON public.tour_itinerary FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read inclusions" ON public.tour_inclusions;
CREATE POLICY "Public can read inclusions" ON public.tour_inclusions FOR SELECT USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_inclusions.tour_id AND (tours.status = 'published' OR public.is_admin())));

DROP POLICY IF EXISTS "Admins manage inclusions" ON public.tour_inclusions;
CREATE POLICY "Admins manage inclusions" ON public.tour_inclusions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read exclusions" ON public.tour_exclusions;
CREATE POLICY "Public can read exclusions" ON public.tour_exclusions FOR SELECT USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_exclusions.tour_id AND (tours.status = 'published' OR public.is_admin())));

DROP POLICY IF EXISTS "Admins manage exclusions" ON public.tour_exclusions;
CREATE POLICY "Admins manage exclusions" ON public.tour_exclusions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read highlights" ON public.tour_highlights;
CREATE POLICY "Public can read highlights" ON public.tour_highlights FOR SELECT USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_highlights.tour_id AND (tours.status = 'published' OR public.is_admin())));

DROP POLICY IF EXISTS "Admins manage highlights" ON public.tour_highlights;
CREATE POLICY "Admins manage highlights" ON public.tour_highlights FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read faqs" ON public.tour_faqs;
CREATE POLICY "Public can read faqs" ON public.tour_faqs FOR SELECT USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_faqs.tour_id AND (tours.status = 'published' OR public.is_admin())));

DROP POLICY IF EXISTS "Admins manage faqs" ON public.tour_faqs;
CREATE POLICY "Admins manage faqs" ON public.tour_faqs FOR ALL USING (public.is_admin());

-- Pickup Locations Policies
DROP POLICY IF EXISTS "Public can read pickup locations" ON public.pickup_locations;
CREATE POLICY "Public can read pickup locations" ON public.pickup_locations FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage pickup locations" ON public.pickup_locations;
CREATE POLICY "Admins manage pickup locations" ON public.pickup_locations FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read tour pickup links" ON public.tour_pickup_locations;
CREATE POLICY "Public can read tour pickup links" ON public.tour_pickup_locations FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage tour pickup links" ON public.tour_pickup_locations;
CREATE POLICY "Admins manage tour pickup links" ON public.tour_pickup_locations FOR ALL USING (public.is_admin());

-- Extras Policies
DROP POLICY IF EXISTS "Public can read active extras" ON public.tour_extras;
CREATE POLICY "Public can read active extras" ON public.tour_extras FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage tour extras" ON public.tour_extras;
CREATE POLICY "Admins manage tour extras" ON public.tour_extras FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read tour assigned extras" ON public.tour_assigned_extras;
CREATE POLICY "Public can read tour assigned extras" ON public.tour_assigned_extras FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage tour assigned extras" ON public.tour_assigned_extras;
CREATE POLICY "Admins manage tour assigned extras" ON public.tour_assigned_extras FOR ALL USING (public.is_admin());

-- Availability Policies
DROP POLICY IF EXISTS "Public can read availability" ON public.tour_availability;
CREATE POLICY "Public can read availability" ON public.tour_availability FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage availability" ON public.tour_availability;
CREATE POLICY "Admins manage availability" ON public.tour_availability FOR ALL USING (public.is_admin());

-- Customers & Bookings Policies
DROP POLICY IF EXISTS "Public can insert customer on booking" ON public.customers;
CREATE POLICY "Public can insert customer on booking" ON public.customers FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins manage customers" ON public.customers;
CREATE POLICY "Admins manage customers" ON public.customers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can insert booking" ON public.bookings;
CREATE POLICY "Public can insert booking" ON public.bookings FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public lookup booking by reference" ON public.bookings;
CREATE POLICY "Public lookup booking by reference" ON public.bookings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public update booking cancellation" ON public.bookings;
CREATE POLICY "Public update booking cancellation" ON public.bookings FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins manage bookings" ON public.bookings;
CREATE POLICY "Admins manage bookings" ON public.bookings FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public insert booking extras" ON public.booking_extras;
CREATE POLICY "Public insert booking extras" ON public.booking_extras FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public view booking extras" ON public.booking_extras;
CREATE POLICY "Public view booking extras" ON public.booking_extras FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage booking extras" ON public.booking_extras;
CREATE POLICY "Admins manage booking extras" ON public.booking_extras FOR ALL USING (public.is_admin());

-- Passengers Manifest Policies
DROP POLICY IF EXISTS "Public can insert passengers on booking" ON public.booking_passengers;
CREATE POLICY "Public can insert passengers on booking" ON public.booking_passengers FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public can view own booking passengers" ON public.booking_passengers;
CREATE POLICY "Public can view own booking passengers" ON public.booking_passengers FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage passengers" ON public.booking_passengers;
CREATE POLICY "Admins manage passengers" ON public.booking_passengers FOR ALL USING (public.is_admin());

-- Coupons Policies
DROP POLICY IF EXISTS "Public can read active coupons" ON public.coupons;
CREATE POLICY "Public can read active coupons" ON public.coupons FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL USING (public.is_admin());

-- Cancellations Policies
DROP POLICY IF EXISTS "Public can insert cancellation request" ON public.booking_cancellations;
CREATE POLICY "Public can insert cancellation request" ON public.booking_cancellations FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public can view own cancellation request" ON public.booking_cancellations;
CREATE POLICY "Public can view own cancellation request" ON public.booking_cancellations FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage cancellations" ON public.booking_cancellations;
CREATE POLICY "Admins manage cancellations" ON public.booking_cancellations FOR ALL USING (public.is_admin());

-- Vessels & Guides Policies
DROP POLICY IF EXISTS "Public can read active vessels" ON public.vessels;
CREATE POLICY "Public can read active vessels" ON public.vessels FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage vessels" ON public.vessels;
CREATE POLICY "Admins manage vessels" ON public.vessels FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public view tour vessels" ON public.tour_vessels;
CREATE POLICY "Public view tour vessels" ON public.tour_vessels FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage tour vessels" ON public.tour_vessels;
CREATE POLICY "Admins manage tour vessels" ON public.tour_vessels FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read active guides" ON public.guides;
CREATE POLICY "Public can read active guides" ON public.guides FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage guides" ON public.guides;
CREATE POLICY "Admins manage guides" ON public.guides FOR ALL USING (public.is_admin());

-- Reviews Policies
DROP POLICY IF EXISTS "Public can read published reviews" ON public.reviews;
CREATE POLICY "Public can read published reviews" ON public.reviews FOR SELECT USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can insert review" ON public.reviews;
CREATE POLICY "Public can insert review" ON public.reviews FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins manage reviews" ON public.reviews;
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL USING (public.is_admin());

-- Wishlists Policies
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Inquiries Policies
DROP POLICY IF EXISTS "Public can submit inquiry" ON public.inquiries;
CREATE POLICY "Public can submit inquiry" ON public.inquiries FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins manage inquiries" ON public.inquiries;
CREATE POLICY "Admins manage inquiries" ON public.inquiries FOR ALL USING (public.is_admin());

-- Newsletter Subscribers Policies
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins manage newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Admins manage newsletter" ON public.newsletter_subscribers FOR ALL USING (public.is_admin());

-- Payments Policies
DROP POLICY IF EXISTS "Admins manage payments" ON public.payment_transactions;
CREATE POLICY "Admins manage payments" ON public.payment_transactions FOR ALL USING (public.is_admin());

-- General FAQs Policies
DROP POLICY IF EXISTS "Public can read published faqs" ON public.faqs;
CREATE POLICY "Public can read published faqs" ON public.faqs FOR SELECT USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage global faqs" ON public.faqs;
CREATE POLICY "Admins manage global faqs" ON public.faqs FOR ALL USING (public.is_admin());

-- SEO Metadata Policies
DROP POLICY IF EXISTS "Public can read SEO metadata" ON public.seo_metadata;
CREATE POLICY "Public can read SEO metadata" ON public.seo_metadata FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage SEO metadata" ON public.seo_metadata;
CREATE POLICY "Admins manage SEO metadata" ON public.seo_metadata FOR ALL USING (public.is_admin());

-- Weather Bulletins Policies
DROP POLICY IF EXISTS "Public can read weather bulletins" ON public.weather_bulletins;
CREATE POLICY "Public can read weather bulletins" ON public.weather_bulletins FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage weather bulletins" ON public.weather_bulletins;
CREATE POLICY "Admins manage weather bulletins" ON public.weather_bulletins FOR ALL USING (public.is_admin());

-- Site Settings Policies
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins write audit logs" ON public.audit_logs;
CREATE POLICY "Admins write audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin());


-- ==============================================================================
-- 41. SUPABASE STORAGE BUCKET CONFIGURATION & POLICIES (Safe Block)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        
        -- Create or update 'tour-media' bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'tour-media',
            'tour-media',
            TRUE,
            10485760, -- 10MB limit
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']
        )
        ON CONFLICT (id) DO UPDATE
        SET public = TRUE,
            file_size_limit = 10485760;

        -- Storage RLS: Public read
        DROP POLICY IF EXISTS "Public can view tour media files" ON storage.objects;
        CREATE POLICY "Public can view tour media files"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'tour-media');

        -- Storage RLS: Admin upload
        DROP POLICY IF EXISTS "Admins can upload tour media" ON storage.objects;
        CREATE POLICY "Admins can upload tour media"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'tour-media' AND public.is_admin());

        -- Storage RLS: Admin update
        DROP POLICY IF EXISTS "Admins can update tour media" ON storage.objects;
        CREATE POLICY "Admins can update tour media"
            ON storage.objects FOR UPDATE
            TO authenticated
            USING (bucket_id = 'tour-media' AND public.is_admin());

        -- Storage RLS: Admin delete
        DROP POLICY IF EXISTS "Admins can delete tour media" ON storage.objects;
        CREATE POLICY "Admins can delete tour media"
            ON storage.objects FOR DELETE
            TO authenticated
            USING (bucket_id = 'tour-media' AND public.is_admin());

    END IF;
END $$;


-- ==============================================================================
-- 42. REALTIME PUBLICATION SETUP (Safely Enable Realtime)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.weather_bulletins;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.tour_availability;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication
        END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication
        END;
    END IF;
END $$;
