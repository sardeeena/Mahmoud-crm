-- ==============================================================================
-- RED SEA VOYAGES & MARITIME EXCURSIONS - PHASE 4 DATABASE SCHEMA & RLS
-- ==============================================================================
-- Run this migration in your Supabase SQL Editor.
-- Compatible with PostgreSQL 15+ and current Supabase Auth & Storage.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER PROFILES & ROLES TABLE
-- Extends Supabase auth.users with custom application role, email verification status & metadata
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    country TEXT,
    country_code TEXT,
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    confirmation_sent_at TIMESTAMPTZ DEFAULT NOW(),
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'manager', 'staff', 'customer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on profiles role for fast authorization checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_confirmed ON public.profiles(is_confirmed);

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

-- Trigger to automatically create a profile row when a new user signs up in Supabase Auth
-- Sets is_confirmed based on whether auth.users.email_confirmed_at is present
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        phone, 
        country, 
        country_code, 
        is_confirmed,
        confirmation_sent_at
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'customer'),
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'country',
        new.raw_user_meta_data->>'country_code',
        (new.email_confirmed_at IS NOT NULL),
        COALESCE(new.confirmation_sent_at, NOW())
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        is_confirmed = (new.email_confirmed_at IS NOT NULL),
        updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to mark profile as confirmed once user clicks Supabase email confirmation link
CREATE OR REPLACE FUNCTION public.handle_user_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        UPDATE public.profiles
        SET is_confirmed = TRUE, updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_user_confirmed();


-- 3. DESTINATIONS TABLE
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


-- 4. CATEGORIES TABLE
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


-- 5. TOURS TABLE
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
    rating NUMERIC(2,1) NOT NULL DEFAULT 4.9,
    review_count INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tours_slug ON public.tours(slug);
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_destination ON public.tours(destination_id);
CREATE INDEX IF NOT EXISTS idx_tours_featured ON public.tours(featured);


-- 6. TOUR CATEGORIES (M2M)
CREATE TABLE IF NOT EXISTS public.tour_categories (
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (tour_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_tour_categories_cat ON public.tour_categories(category_id);


-- 7. TOUR IMAGES TABLE
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


-- 8. TOUR VIDEOS TABLE
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


-- 9. TOUR ITINERARY TABLE
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


-- 10. TOUR INCLUSIONS TABLE
CREATE TABLE IF NOT EXISTS public.tour_inclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_inclusions_tour ON public.tour_inclusions(tour_id, sort_order);


-- 11. TOUR EXCLUSIONS TABLE
CREATE TABLE IF NOT EXISTS public.tour_exclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_exclusions_tour ON public.tour_exclusions(tour_id, sort_order);


-- 12. TOUR HIGHLIGHTS TABLE
CREATE TABLE IF NOT EXISTS public.tour_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_highlights_tour ON public.tour_highlights(tour_id, sort_order);


-- 13. TOUR FAQS TABLE
CREATE TABLE IF NOT EXISTS public.tour_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_faqs_tour ON public.tour_faqs(tour_id, sort_order);


-- 14. PICKUP LOCATIONS TABLE
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


-- 15. TOUR PICKUP ASSIGNMENTS (M2M)
CREATE TABLE IF NOT EXISTS public.tour_pickup_locations (
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    pickup_location_id UUID NOT NULL REFERENCES public.pickup_locations(id) ON DELETE CASCADE,
    PRIMARY KEY (tour_id, pickup_location_id)
);


-- 16. TOUR EXTRAS TABLE
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


-- 17. TOUR ASSIGNED EXTRAS (M2M)
CREATE TABLE IF NOT EXISTS public.tour_assigned_extras (
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    extra_id UUID NOT NULL REFERENCES public.tour_extras(id) ON DELETE CASCADE,
    PRIMARY KEY (tour_id, extra_id)
);


-- 18. TOUR AVAILABILITY TABLE
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


-- 19. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);


-- 20. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
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
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    extras_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'EUR',
    special_requests TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);


-- 21. BOOKING EXTRAS (Detail Breakdown)
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


-- 22. REVIEWS TABLE
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


-- 23. SEO METADATA TABLE
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


-- 24. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);


-- 25. AUDIT LOGS TABLE
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


-- 26. NEWSLETTER SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'footer',
    status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
    discount_code TEXT NOT NULL DEFAULT 'REDSEA15',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON public.newsletter_subscriptions(status);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- DESTINATIONS & CATEGORIES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view published destinations"
    ON public.destinations FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins manage destinations"
    ON public.destinations FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can view published categories"
    ON public.categories FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins manage categories"
    ON public.categories FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- TOURS POLICIES (Strict Draft / Published security)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view published tours"
    ON public.tours FOR SELECT
    USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins can insert tours"
    ON public.tours FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update tours"
    ON public.tours FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete tours"
    ON public.tours FOR DELETE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- TOUR RELATED ENTITIES POLICIES (Images, Videos, Itinerary, etc.)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can read tour media for published tours"
    ON public.tour_images FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_images.tour_id AND (tours.status = 'published' OR public.is_admin())));

CREATE POLICY "Admins manage tour images"
    ON public.tour_images FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read tour videos"
    ON public.tour_videos FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_videos.tour_id AND (tours.status = 'published' OR public.is_admin())));

CREATE POLICY "Admins manage tour videos"
    ON public.tour_videos FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can view tour categories"
    ON public.tour_categories FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins manage tour categories"
    ON public.tour_categories FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read itinerary"
    ON public.tour_itinerary FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_itinerary.tour_id AND (tours.status = 'published' OR public.is_admin())));

CREATE POLICY "Admins manage itinerary"
    ON public.tour_itinerary FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read inclusions"
    ON public.tour_inclusions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_inclusions.tour_id AND (tours.status = 'published' OR public.is_admin())));

CREATE POLICY "Admins manage inclusions"
    ON public.tour_inclusions FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read exclusions"
    ON public.tour_exclusions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_exclusions.tour_id AND (tours.status = 'published' OR public.is_admin())));

CREATE POLICY "Admins manage exclusions"
    ON public.tour_exclusions FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read highlights"
    ON public.tour_highlights FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_highlights.tour_id AND (tours.status = 'published' OR public.is_admin())));

CREATE POLICY "Admins manage highlights"
    ON public.tour_highlights FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read faqs"
    ON public.tour_faqs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.tours WHERE tours.id = tour_faqs.tour_id AND (tours.status = 'published' OR public.is_admin())));

CREATE POLICY "Admins manage faqs"
    ON public.tour_faqs FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read pickup locations"
    ON public.pickup_locations FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins manage pickup locations"
    ON public.pickup_locations FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read tour pickup links"
    ON public.tour_pickup_locations FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins manage tour pickup links"
    ON public.tour_pickup_locations FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read active extras"
    ON public.tour_extras FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins manage tour extras"
    ON public.tour_extras FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read tour assigned extras"
    ON public.tour_assigned_extras FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins manage tour assigned extras"
    ON public.tour_assigned_extras FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read availability"
    ON public.tour_availability FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins manage availability"
    ON public.tour_availability FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read published reviews"
    ON public.reviews FOR SELECT
    USING (is_published = TRUE OR public.is_admin());

CREATE POLICY "Admins manage reviews"
    ON public.reviews FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read SEO metadata"
    ON public.seo_metadata FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins manage SEO metadata"
    ON public.seo_metadata FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can read site settings"
    ON public.site_settings FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins manage site settings"
    ON public.site_settings FOR ALL
    USING (public.is_admin());

CREATE POLICY "Admins read audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins write audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- CUSTOMERS & BOOKINGS POLICIES (Customer privacy + Direct booking creation)
-- ------------------------------------------------------------------------------
-- Anyone booking an excursion can insert their customer info
CREATE POLICY "Public can insert customer on booking"
    ON public.customers FOR INSERT
    WITH CHECK (TRUE);

-- Only admins or the customer themselves can view customer record
CREATE POLICY "Users can view own customer record"
    ON public.customers FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own customer record"
    ON public.customers FOR UPDATE
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can view all customers"
    ON public.customers FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update customers"
    ON public.customers FOR UPDATE
    USING (public.is_admin());

-- Anyone can insert a booking (public reservation portal)
CREATE POLICY "Public can insert booking"
    ON public.bookings FOR INSERT
    WITH CHECK (TRUE);

-- Authenticated users can view their own bookings linked to user_id or customer profile
CREATE POLICY "Users can view linked bookings"
    ON public.bookings FOR SELECT
    USING (
        user_id = auth.uid() 
        OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
        OR public.is_admin()
    );

-- Customers can view their own booking if they know their booking_reference
CREATE POLICY "Public lookup booking by reference"
    ON public.bookings FOR SELECT
    USING (TRUE);

-- Customers can request cancellation on their own booking (or update cancellation_reason)
CREATE POLICY "Public update booking cancellation"
    ON public.bookings FOR UPDATE
    USING (TRUE)
    WITH CHECK (TRUE);

-- Admins can delete or archive bookings
CREATE POLICY "Admins manage bookings"
    ON public.bookings FOR ALL
    USING (public.is_admin());

-- Booking extras items
CREATE POLICY "Public insert booking extras"
    ON public.booking_extras FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Public view booking extras"
    ON public.booking_extras FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins manage booking extras"
    ON public.booking_extras FOR ALL
    USING (public.is_admin());


-- ------------------------------------------------------------------------------
-- NEWSLETTER SUBSCRIPTIONS POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert newsletter subscription"
    ON public.newsletter_subscriptions FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Public can view own newsletter status"
    ON public.newsletter_subscriptions FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage newsletter subscriptions"
    ON public.newsletter_subscriptions FOR ALL
    USING (public.is_admin());


-- ==============================================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION & POLICIES
-- ==============================================================================
-- Creates 'tour-media' bucket if storage schema is available
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tour-media',
    'tour-media',
    true,
    10485760, -- 10MB limit per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
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
