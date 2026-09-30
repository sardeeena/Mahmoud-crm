# 🚀 Complete Website & Supabase Setup Guide

> Step-by-step tutorial to run, configure, and publish **Red Sea Excursions & Voyages** with a live **Supabase** backend.

---

## 📋 Table of Contents
1. [Prerequisites](#-prerequisites)
2. [Step 1: Install Dependencies](#-step-1-install-dependencies)
3. [Step 2: Configure Environment Variables](#-step-2-configure-environment-variables)
4. [Step 3: Run the Local Development Server](#-step-3-run-the-local-development-server)
5. [Step 4: Set Up the Supabase Database](#-step-4-set-up-the-supabase-database)
6. [Step 5: Create and Promote an Admin Account](#-step-5-create-and-promote-an-admin-account)
7. [Step 6: Test Website & Database Integration](#-step-6-test-website--database-integration)
8. [Step 7: Production Build & Deployment](#-step-7-production-build--deployment)
9. [Pre-Launch Checklist](#-pre-launch-checklist)

---

## 🛠️ Prerequisites

Before you start, ensure you have:
- **Node.js** (v18.0.0 or higher) or **Bun** installed on your computer.
- A free account on [Supabase](https://supabase.com).
- A modern web browser.

---

## 📦 Step 1: Install Dependencies

From the project root directory, install all required packages:

```bash
npm install
```

---

## 🔑 Step 2: Configure Environment Variables

Create a file named `.env` in the root of the project:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials:

```env
# Supabase Project API Credentials
# Found in: Supabase Dashboard > Project Settings > API
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

*(Note: If you do not have Supabase credentials yet, the application will automatically run in local browser storage mode until you configure them.)*

---

## 💻 Step 3: Run the Local Development Server

Start the Vite development server:

```bash
npm run dev
```

Open your browser to:
```
http://localhost:3000
```

You should see the Red Sea Excursions homepage with the dynamic hero banner, popular excursions, categories, and destinations.

---

## 🗄️ Step 4: Set Up the Supabase Database

To connect the real relational database:

### 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and click **New Project**.
2. Name the project (e.g. `Red Sea Excursions`), choose a database password, and pick the cloud region closest to your users.
3. Once the database is ready, go to **Project Settings > API** and copy:
   - **Project URL**
   - **Project API Keys > `anon` `public`**

### 2. Run the Schema Migration (33 Tables, Triggers & RLS)
1. In your Supabase Dashboard, click **SQL Editor** on the left menu.
2. Click **New query**.
3. Open the file `/supabase/migrations/20260922000000_phase4_schema.sql` from this codebase.
4. Copy the entire contents, paste it into the Supabase SQL Editor, and click **Run**.
5. You should see: `Success. No rows returned.`

### 3. Seed Production Catalog Data
1. In the Supabase **SQL Editor**, click **New query**.
2. Open `/supabase/seed.sql` from this codebase.
3. Copy the entire contents, paste it into the editor, and click **Run**.
4. This populates genuine coastal destinations (Hurghada, El Gouna, Makadi Bay, Safaga, Sahl Hasheesh), categories, pickup locations, optional extras, fleet vessels, guides, and initial published excursions with detailed itineraries. Zero fake bookings are inserted.

---

## 👑 Step 5: Create and Promote an Admin Account

To access the administrative dashboard at `/admin`:

1. Open your website in the browser (`http://localhost:3000` or your deployed URL).
2. Click **Sign In** in the top navigation, or go to `/register`.
3. Create an account with your personal or company email (e.g. `diamond.entertainment70@gmail.com`).
4. Now, go to the **Supabase Dashboard > SQL Editor** and execute:
   ```sql
   SELECT public.set_admin_role_by_email('diamond.entertainment70@gmail.com');
   ```
5. Supabase will return:
   ```
   Success: Account diamond.entertainment70@gmail.com (User ID: ...) is now an active administrator.
   ```
6. Return to your website and click **Admin CMS** in the footer or visit `/admin`. You will have full administrative access.

---

## 🧪 Step 6: Test Website & Database Integration

1. **Verify Connection**:
   - Go to `/admin` > **Settings**.
   - Click **Test Connection**. A green badge should confirm `Connected (Live Supabase integration active)`.
2. **Test Excursion Browsing**:
   - Go to `/excursions`. Filter by destination, category, and date.
   - Click any excursion card to view the minute-by-minute itinerary, inclusions, and photo gallery.
3. **Test Booking Flow**:
   - Click **Book Excursion**.
   - Select departure date, guest count, hotel pickup location, and optional extras.
   - Fill in traveler details and select **Pay at Hotel Pickup**.
   - Submit the booking to receive your unique booking reference (`RST-YYYY-XXXX`).
   - Check `/admin` > **Bookings** to verify your new reservation appears in real time.
4. **Test Concierge Help Inquiry**:
   - Click **Require Help** in the header or footer.
   - Fill in your name, contact details, and message.
   - Submit and verify it appears under `/admin` > **Help Inquiries**.
5. **Test Newsletter Subscription**:
   - Scroll to the footer newsletter box.
   - Enter your email and click subscribe.
   - Receive the `REDSEA15` voucher code and verify your email is recorded under `/admin` > **Newsletter**.

---

## 🚢 Step 7: Production Build & Deployment

To build the project for production:

```bash
npm run build
```

This compiles optimized client bundles into the `dist/` folder.

To test the production build locally:

```bash
npm run preview
```

### Deploying to Production Platforms
- **Vercel / Netlify / Cloudflare Pages**:
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variables: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Node.js / Express Server**:
  - Run `npm start` (which runs `node server.ts` or `tsx server.ts`).
  - Dev server listens on port `3000`.

---

## ✅ Pre-Launch Checklist

- [x] All mock and demo data removed from database seed files.
- [x] All 33 tables enabled with PostgreSQL Row Level Security (RLS).
- [x] Production catalog seeded with genuine Red Sea tours and destinations.
- [x] Supabase Auth configured with Redirect URLs.
- [x] Administrator account promoted via `public.set_admin_role_by_email()`.
- [x] Storage buckets `tour-media`, `avatars`, and `vouchers` provisioned.
- [x] Input sanitization, password strength validation, and rate limiters active.
- [x] SEO meta tags, OpenGraph images, and canonical URL structure synced.
- [x] Mobile responsiveness and PWA icons verified across devices.
