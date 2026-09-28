# ⚡ Supabase Architecture & Database Blueprint

> Comprehensive documentation for the Supabase (PostgreSQL 15+) relational database, Row-Level Security (RLS) policies, database triggers, storage buckets, and integration patterns powering **Red Sea Excursions & Voyages**.

---

## 📑 Table of Contents

1. [Database Overview](#-database-overview)
2. [Connection & Environment Configuration](#-connection--environment-configuration)
3. [Schema Architecture & Entity Relationship](#-schema-architecture--entity-relationship)
4. [Detailed Table Specifications](#-detailed-table-specifications)
5. [Row-Level Security (RLS) Matrix](#-row-level-security-rls-matrix)
6. [Triggers, Functions & Automation](#-triggers-functions--automation)
7. [Supabase Storage Buckets](#-supabase-storage-buckets)
8. [Database Migration & Seeding Guide](#-database-migration--seeding-guide)
9. [Frontend Client Integration Patterns](#-frontend-client-integration-patterns)
10. [Troubleshooting & Diagnostics](#-troubleshooting--diagnostics)

---

## 🌐 Database Overview

The backend uses **Supabase** with a fully normalized PostgreSQL 15 database designed for high read throughput, complex relational joins (tours with itineraries, galleries, inclusions, exclusions, and FAQs), and secure transactional bookings.

- **Total Tables**: 27 relational tables
- **Multi-Role RBAC**: `admin`, `manager`, `staff`, and `customer`
- **Security**: 100% of tables have Row-Level Security (`RLS`) enabled
- **Fallback Protection**: Client-side resilience layer that gracefully falls back to structured static data if the database is unreachable or unseeded.

---

## 🔑 Connection & Environment Configuration

### Required Credentials
Obtain your project API keys from your Supabase Dashboard: **Project Settings > API**.

```env
# .env or Vite Environment
VITE_SUPABASE_URL="https://<your-project-id>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-public-anon-key>"
```

### In-App Configuration Override
For rapid previewing, testing, and staging environments, the application includes an **in-browser credential manager** in `src/services/supabaseClient.ts`:
- Credentials can be directly entered or updated in the Admin Settings view (`/admin`).
- Saved keys are stored in `localStorage` under `rse_supabase_url` and `rse_supabase_anon_key` without requiring a container restart.

---

## 🏗️ Schema Architecture & Entity Relationship

```
 auth.users
     │
     ▼ (1:1 via trigger)
  profiles ◄─────────────┐
     │                   │
     │                   │
     ▼                   │
 customers               │
     │                   │
     ▼                   │
  bookings ──────────────┘ (user_id)
     │
     ├──► booking_extras
     │
     ▼
   tours ◄──────────────► categories (via tour_categories)
     │
     ├──► destinations (destination_id)
     ├──► tour_images
     ├──► tour_videos
     ├──► tour_itinerary
     ├──► tour_inclusions
     ├──► tour_exclusions
     ├──► tour_highlights
     ├──► tour_faqs
     ├──► tour_availability
     ├──► tour_assigned_extras ◄──► tour_extras
     ├──► tour_pickup_locations ◄──► pickup_locations
     └──► reviews
```

---

## 📋 Detailed Table Specifications

### 1. `profiles`
Extends `auth.users` with user roles, contact metadata, and verification states.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `UUID` | PRIMARY KEY, REFERENCES `auth.users(id)` ON DELETE CASCADE | Matches auth user ID |
| `email` | `TEXT` | NOT NULL | User email address |
| `full_name` | `TEXT` | NULL | Full name of the user |
| `avatar_url` | `TEXT` | NULL | Profile image link |
| `phone` | `TEXT` | NULL | Contact mobile number |
| `country` | `TEXT` | NULL | Country of residence |
| `country_code` | `TEXT` | NULL | ISO 2-letter country code |
| `is_confirmed` | `BOOLEAN` | DEFAULT `FALSE` | Email confirmation state |
| `role` | `TEXT` | DEFAULT `'customer'`, CHECK (`'admin'`,`'manager'`,`'staff'`,`'customer'`) | RBAC role |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT `NOW()` | Last modification |

### 2. `destinations`
Geographic hubs along the Egyptian Red Sea coast.

| Column | Type | Details |
|---|---|---|
| `id` | `UUID` | PRIMARY KEY DEFAULT `gen_random_uuid()` |
| `name` | `TEXT` | Destination title (e.g., 'Hurghada', 'El Gouna', 'Marsa Alam') |
| `slug` | `TEXT` | UNIQUE URL slug |
| `tagline` | `TEXT` | Short promotional header |
| `description` | `TEXT` | Long description |
| `main_image` | `TEXT` | Cover image URL |
| `gallery` | `TEXT[]` | Additional imagery array |
| `distance_from_airport` | `TEXT` | Travel transit estimate |
| `status` | `TEXT` | `'draft'` \| `'published'` \| `'archived'` |

### 3. `tours`
Core excursion entity storing pricing, operational parameters, and content.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `UUID` | PRIMARY KEY DEFAULT `gen_random_uuid()` | Unique tour identifier |
| `title` | `TEXT` | NOT NULL | Excursion name |
| `slug` | `TEXT` | NOT NULL, UNIQUE | SEO-friendly slug |
| `short_description`| `TEXT` | NULL | Listing preview summary |
| `description` | `TEXT` | NULL | Complete overview |
| `destination_id` | `UUID` | REFERENCES `destinations(id)` ON DELETE SET NULL | Geographic hub |
| `duration` | `TEXT` | DEFAULT `'Full Day (approx. 7 hours)'` | Formatted duration label |
| `duration_type` | `TEXT` | CHECK (`'Half Day'`, `'Full Day'`, `'Multi Day'`) | Categorical duration |
| `duration_hours`| `NUMERIC(4,1)`| DEFAULT `7.0` | Numeric duration in hours |
| `tour_type` | `TEXT` | CHECK (`'Shared'`, `'Private'`) | Shared group vs. private charter |
| `status` | `TEXT` | DEFAULT `'draft'`, CHECK (`'draft'`,`'published'`,`'archived'`) | Publication status |
| `featured` | `BOOLEAN` | DEFAULT `FALSE` | Featured on homepage hero/grid |
| `price` | `NUMERIC(10,2)`| NOT NULL, DEFAULT `0.00` | Adult price in EUR |
| `child_price` | `NUMERIC(10,2)`| DEFAULT `0.00` | Child price (ages 2–11) in EUR |
| `infant_price` | `NUMERIC(10,2)`| DEFAULT `0.00` | Infant price in EUR |
| `private_price`| `NUMERIC(10,2)`| DEFAULT `0.00` | Flat rate if booked as private |
| `currency` | `TEXT` | DEFAULT `'EUR'` | Base currency |
| `max_guests` | `INT` | DEFAULT `35` | Maximum capacity per group |
| `pickup_available`| `BOOLEAN` | DEFAULT `TRUE` | Hotel transfer service included |
| `departure_time`| `TEXT` | DEFAULT `'08:30 AM'` | Standard hotel lobby pickup time |
| `rating` | `NUMERIC(2,1)`| DEFAULT `4.9` | Aggregate average rating |
| `review_count` | `INT` | DEFAULT `0` | Total verified reviews count |

### 4. Relational Sub-Tables for Tours
- **`tour_categories`**: Many-to-many link between `tours` and `categories`.
- **`tour_images`**: High-resolution gallery with `sort_order` and `is_primary` flags.
- **`tour_videos`**: Video links (YouTube, Vimeo, Supabase Storage).
- **`tour_itinerary`**: Sequential step-by-step itinerary with `time`, `title`, and `description`.
- **`tour_inclusions` & `tour_exclusions`**: Bulleted checklist items.
- **`tour_highlights`**: Key experience selling points.
- **`tour_faqs`**: Common Q&As.
- **`tour_availability`**: Date-specific availability, sold-out overrides, and booked capacities.
- **`tour_assigned_extras`**: Links to `tour_extras` (e.g. GoPro rentals, seafood upgrades).
- **`tour_pickup_locations`**: Links to `pickup_locations` with custom transfer surcharges.

### 5. `bookings` & `booking_extras`
Guest reservations and itemized receipt breakdown.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `UUID` | PRIMARY KEY DEFAULT `gen_random_uuid()` | Booking ID |
| `booking_reference` | `TEXT` | NOT NULL, UNIQUE | Public reference code (`RSE-XXXXXX`) |
| `user_id` | `UUID` | REFERENCES `auth.users(id)` ON DELETE SET NULL | Registered user account (if logged in) |
| `tour_id` | `UUID` | REFERENCES `tours(id)` ON DELETE RESTRICT | Excursion booked |
| `customer_id` | `UUID` | REFERENCES `customers(id)` ON DELETE SET NULL | Guest CRM profile |
| `booking_date` | `DATE` | NOT NULL | Scheduled excursion date |
| `status` | `TEXT` | CHECK (`'pending'`, `'confirmed'`, `'cancellation_requested'`, `'cancelled'`, `'completed'`, `'no_show'`) | Booking workflow status |
| `payment_status` | `TEXT` | CHECK (`'pending'`, `'paid'`, `'partially_paid'`, `'refunded'`, `'failed'`) | Payment state |
| `payment_method` | `TEXT` | CHECK (`'pay_at_pickup'`, `'pay_online'`) | Payment gateway / method |
| `adult_count` | `INT` | NOT NULL DEFAULT `1` | Number of adults |
| `child_count` | `INT` | NOT NULL DEFAULT `0` | Number of children |
| `pickup_hotel_name` | `TEXT` | NULL | Hotel lobby pickup location |
| `pickup_room_number`| `TEXT` | NULL | Room number for morning check-in |
| `subtotal` | `NUMERIC(10,2)`| NOT NULL | Base ticket calculation |
| `extras_total` | `NUMERIC(10,2)`| NOT NULL DEFAULT `0.00` | Add-on sum |
| `total` | `NUMERIC(10,2)`| NOT NULL | Total booking amount in EUR |
| `currency` | `TEXT` | DEFAULT `'EUR'` | Booking currency |

---

## 🔒 Row-Level Security (RLS) Matrix

Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` enabled.

| Table | Anonymous / Public | Authenticated Customers | Admin / Staff |
|---|---|---|---|
| `profiles` | ❌ No access | Read/Update own profile (`id = auth.uid()`) | Read all (`is_admin()`) |
| `destinations` | Read published (`status = 'published'`) | Read published | Full CRUD |
| `categories` | Read published (`status = 'published'`) | Read published | Full CRUD |
| `tours` | Read published (`status = 'published'`) | Read published | Full CRUD |
| `tour_images` | Read images of published tours | Read images of published tours | Full CRUD |
| `tour_itinerary`| Read itinerary of published tours | Read itinerary of published tours | Full CRUD |
| `tour_inclusions`| Read items of published tours | Read items of published tours | Full CRUD |
| `bookings` | Insert with reference check | Read own bookings (`user_id = auth.uid()`) | Full CRUD |
| `booking_extras`| Insert during checkout | Read own booking extras | Full CRUD |
| `reviews` | Read published reviews | Insert review for verified booking | Full CRUD / Moderation |
| `customers` | Insert during booking | Read/Update own profile | Full CRUD |

---

## ⚙️ Triggers, Functions & Automation

### 1. `public.is_admin()`
Fast SQL helper function executed with `SECURITY DEFINER` and `LANGUAGE plpgsql` to verify administrator status without recursive policy lookups:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
    current_role text;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    SELECT role INTO current_role
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN current_role IN ('admin', 'manager', 'staff');
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
```

### 2. Auto-Profile Generation on Signup (`handle_new_user()`)
Listens to `AFTER INSERT ON auth.users`:
- Extracts user email and metadata (`full_name`, `phone`, `country`).
- Creates a synchronized record in `public.profiles`.
- Checks initial email confirmation status.

### 3. Email Confirmation Syncer (`handle_user_confirmed()`)
Listens to `AFTER UPDATE ON auth.users`:
- Automatically updates `profiles.is_confirmed = TRUE` the instant the user clicks their Supabase verification link.

---

## 🪣 Supabase Storage Buckets

Configure the following storage buckets in the Supabase Dashboard: **Storage > Buckets**:

| Bucket Name | Public? | Allowed MIME Types | Max Size | Description |
|---|---|---|---|---|
| `tour-media` | Yes | `image/jpeg`, `image/png`, `image/webp`, `video/mp4` | 25 MB | Tour gallery images, cover photos, and promotional videos |
| `avatars` | Yes | `image/jpeg`, `image/png`, `image/webp` | 5 MB | Customer and staff profile avatars |
| `vouchers` | No (RLS) | `application/pdf` | 10 MB | Generated PDF travel vouchers & receipts |

### Storage Bucket Policies
```sql
-- Allow public read access to tour media
CREATE POLICY "Public Tour Media Read"
ON storage.objects FOR SELECT
USING (bucket_id = 'tour-media');

-- Allow admins full write access to tour media
CREATE POLICY "Admin Tour Media Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tour-media' AND public.is_admin());
```

---

## 🚀 Database Migration & Seeding Guide

### Step 1: Run the Schema Migration
1. Open your **Supabase Dashboard** > **SQL Editor**.
2. Copy and paste the entire contents of:
   ```
   /supabase/migrations/20260922000000_phase4_schema.sql
   ```
3. Click **Run** to provision all 27 tables, indexes, triggers, and RLS policies.

### Step 2: Seed Initial Tour Data
1. In the **SQL Editor**, open:
   ```
   /supabase/seed.sql
   ```
2. Click **Run**.
3. This populates realistic excursions (Orange Bay, Giftun Snorkeling, Desert ATV Safari, Scuba Diving, Private Yacht Charters), categories, destinations, and sample verified customer reviews.

### Step 3: Grant First Admin Account
To grant full administrative privileges to an account, use the safe helper function or upsert query:

```sql
-- Method A (Recommended): Call helper function
SELECT public.set_admin_role_by_email('your-admin-email@example.com');

-- Method B: Direct upsert (guarantees profile exists even if user signed up before migration)
INSERT INTO public.profiles (id, email, full_name, role, is_confirmed)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    'admin', 
    true
FROM auth.users
WHERE LOWER(email) = LOWER('your-admin-email@example.com')
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_confirmed = true, updated_at = NOW();

-- Also update user metadata in auth.users so JWT mirrors the role
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'::jsonb
)
WHERE LOWER(email) = LOWER('your-admin-email@example.com');
```

---

## 🔌 Frontend Client Integration Patterns

### Initializing the Client (`src/services/supabaseClient.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);
```

### Loading Live Tours with Relational Joins (`src/services/tourService.ts`)
The `getPublishedTours()` function performs an optimized join:
```typescript
const { data, error } = await supabase
  .from('tours')
  .select(`
    *,
    destinations (name),
    tour_categories (
      categories (name)
    ),
    tour_images (*),
    tour_itinerary (*),
    tour_inclusions (*),
    tour_exclusions (*),
    tour_highlights (*),
    tour_faqs (*)
  `)
  .eq('status', 'published')
  .order('sort_order', { ascending: true });
```

---

## 🔍 Troubleshooting & Diagnostics

| Symptom | Probable Cause | Resolution |
|---|---|---|
| `PGRST205: Could not find the table` | Database schema not yet run in Supabase SQL editor | Run `supabase/migrations/20260922000000_phase4_schema.sql` in SQL Editor |
| `new row violates row-level security policy` | User lacks admin role or is creating booking without correct permissions | Ensure user has `role = 'admin'` in `public.profiles` or user ID is correctly attached to request |
| `JWT expired / Invalid API Key` | Stale or mistyped `VITE_SUPABASE_ANON_KEY` | Re-copy key from Supabase Dashboard > Project Settings > API |
| Skeleton loader keeps displaying indefinitely | Database query hanging or network blocked | The frontend timeout triggers automatic static fallback after 4 seconds |
