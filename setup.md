# Red Sea Voyages & Maritime Excursions — Supabase Setup Guide

This guide walks you through connecting your Supabase project, executing the database schema and storage provisioning, and configuring your administrator account.

---

## Architecture Overview

The application utilizes Supabase for:
1. **PostgreSQL Relational Database**: 33 normalized tables storing excursions, itineraries, categories, destinations, hotel pickup locations, extras, customer reservations, inquiries, reviews, and newsletter subscribers.
2. **Supabase Authentication**: Secure user registration, password reset, session management, and Role-Based Access Control (RBAC) via `public.profiles`.
3. **Supabase Storage**:
   - `tour-media` (Public, up to 50MB): Excursion photo galleries, videos, and promotional banners.
   - `avatars` (Public, up to 5MB): Traveler profile avatars.
   - `vouchers` (Private, up to 10MB): PDF booking vouchers and manifests.
4. **Row-Level Security (RLS)**: Enforces public read access on published excursions while restricting mutations strictly to administrators.

---

## Step 1: Obtain Supabase Project Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and open your project (or create a new one).
2. In the left navigation, click on **Project Settings** (gear icon) > **API**.
3. Locate the following two values:
   - **Project URL** (e.g., `https://abcdefghijklm.supabase.co`)
   - **Project API Keys** > `anon` `public` key (e.g., `eyJhbGciOi...`)

---

## Step 2: Configure Environment Credentials

You can configure your Supabase credentials in either of two ways:

### Option A: Via the Admin Settings UI (Instant, No Restart Required)
1. Open the application in your browser and navigate to `/admin/settings`.
2. Paste your **Supabase Project URL** and **Anon Public Key** into the connection fields.
3. Click **Save & Test Connection**. The app will immediately ping your PostgreSQL database.

### Option B: Via `.env` File
Create or update the `.env` file in your project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

## Step 3: Execute the Master SQL Script

The master SQL script provisions **100% of everything** required by the application in a single execution:
- Database extensions (`uuid-ossp`, `pgcrypto`)
- All 33 relational tables with foreign keys and check constraints
- Security Definer functions: `is_admin()`, `protect_profile_role()`, `handle_new_user()`, `set_admin_role_by_email()`
- Automated triggers on `auth.users` to synchronize profiles
- Storage buckets: `tour-media`, `avatars`, `vouchers`
- Storage policies on `storage.objects` for image and video uploads
- Row-Level Security policies on all tables (preventing recursion)
- Production catalog seed data (destinations, categories, pickup locations, optional extras, fleet vessels, licensed captains, and published tours with itineraries)

### How to Run:
1. In your [Supabase Dashboard](https://supabase.com/dashboard), navigate to **SQL Editor** in the left menu.
2. Click **New Query**.
3. Open the file **`/supabase/schema.sql`** in this project repository (or click **"Copy Master Schema & Seed SQL"** inside `/admin/settings`).
4. Paste the entire content into the SQL Editor and click **Run**.
5. You should see a success message: `Success. No rows returned` or rows affected.

---

## Step 4: Administrator Account Setup & Promotion

To access the CMS Admin Dashboard (`/admin`), your account must have the `admin` role assigned in `public.profiles`.

### 1. Register Your Account
1. Open the application in your browser.
2. Click **Sign In** in the top navigation or go to `/register`.
3. Sign up with your administrator email:
   ```
   diamond.entertainment70@gmail.com
   ```
4. Set a secure password and submit.

### 2. Promote Account to Administrator in Supabase
Once your account has registered, promote it using the built-in helper function.
1. Open **Supabase Dashboard > SQL Editor**.
2. Run the following command:
   ```sql
   SELECT public.set_admin_role_by_email('diamond.entertainment70@gmail.com');
   ```
3. The SQL Editor will return:
   ```
   Success: Account diamond.entertainment70@gmail.com is now an active administrator.
   ```

---

## Step 5: Log into the CMS Admin Dashboard

1. Navigate to `/admin` or `/admin/login`.
2. Sign in with `diamond.entertainment70@gmail.com` and your password.
3. You will immediately enter the **Admin CMS Dashboard** with access to all 17 management modules:
   - **Dashboard** (`/admin`): Real-time metrics, inbound concierge help requests, recent bookings, and quick actions.
   - **Tours & Excursions** (`/admin/tours`): Catalog table, search, filters, pricing tiers, and featured toggles.
   - **Add / Edit Tour** (`/admin/tours/new` or `/admin/tours/:id/edit`): Multi-tab excursion builder (pricing, itineraries, inclusions, highlights, FAQs, media).
   - **Bookings** (`/admin/bookings`): Passenger manifests, payment tracking, pickup instructions, and reservation status.
   - **Help Requests** (`/admin/inquiries`): Concierge traveler inquiries with direct WhatsApp click-to-chat links.
   - **Customers** (`/admin/customers`): Unified traveler directory aggregating Supabase user profiles and reservation records.
   - **Newsletter** (`/admin/newsletter`): Marketing subscriber registry with real-time signup synchronization and CSV export.
   - **Destinations** (`/admin/destinations`): Coastal resort hubs (Hurghada, El Gouna, Makadi Bay, Sahl Hasheesh, Safaga).
   - **Categories** (`/admin/categories`): Activity categories with icon selection and display order.
   - **Availability Calendar** (`/admin/availability`): 4-week passenger quota manifest, blackout dates, and capacity quotas.
   - **Tour Extras** (`/admin/extras`): Optional add-on upgrades (GoPro rental, seafood lunch, private guide).
   - **Pickup Locations** (`/admin/pickup`): Hotel transfer zones and resort surcharges (+€5, +€10).
   - **Reviews Moderation** (`/admin/reviews`): Verified traveler feedback moderation with publish/hide toggles and star filters.
   - **Media Library** (`/admin/media`): Supabase Storage `tour-media` browser with drag-and-drop file uploader and 1-click CDN link copy.
   - **SEO & Meta** (`/admin/seo`): Search engine metadata, OpenGraph tags, and live Google & social share card previews.
   - **Settings** (`/admin/settings`): Live Supabase connection tester, credentials configurator, and SQL migration copies.

---

## Step 6: Testing & Verification Checklist

| Action | Where to Test | Expected Result |
|---|---|---|
| **Newsletter Signup** | Public Footer | Submits email, returns `REDSEA15` voucher code, stores in Supabase `newsletter_subscriptions`, and appears live in `/admin/newsletter`. |
| **Tour Booking** | Any Tour > Click "Book Now" | Multi-step booking flow completes, generates unique reference `RST-2026-XXXX`, stores in `bookings`, and appears in `/admin/bookings`. |
| **Concierge Inquiry** | Header "Concierge Help" or Footer | Submits inquiry, stores in Supabase `inquiries`, and appears in `/admin/inquiries` with a direct WhatsApp contact link. |
| **Media Upload** | `/admin/media` or `/admin/tours/:id/edit` | File uploads to `tour-media` bucket and returns public Supabase CDN URL. |
| **Availability Calendar** | `/admin/availability` | Toggling day status (Open / Blocked / Sold Out) syncs to `tour_availability`. |
| **Review Moderation** | `/admin/reviews` | Approving or hiding guest reviews updates `reviews.is_published`. |

---

## Troubleshooting & FAQs

### Q: Why do I see "Supabase Connection: Currently utilizing local storage fallback"?
- This banner appears when valid Supabase credentials (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) have not been provided yet.
- Navigate to `/admin/settings` to input your credentials, or add them to `.env`.
- In fallback mode, the application functions seamlessly using client-side cache so you can test all features prior to database connection.

### Q: Why do I get "Access Denied: Customer Role" when signing into `/admin/login`?
- Newly registered accounts default to the `customer` role for security.
- To grant administrator access, execute the promotion SQL snippet in your Supabase SQL Editor:
  ```sql
  SELECT public.set_admin_role_by_email('your-email@example.com');
  ```

### Q: Can I run `/supabase/schema.sql` multiple times?
- Yes. Every statement is written with `CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO UPDATE / DO NOTHING`, and `DROP POLICY IF EXISTS`. It is completely idempotent and safe to run multiple times without data loss.
