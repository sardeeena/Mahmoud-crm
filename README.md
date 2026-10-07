# 🌊 Red Sea Excursions & Voyages Platform

> An enterprise-grade, full-stack tour operator and excursion booking platform specializing in Red Sea marine adventures, island boat trips, coral reef snorkeling, PADI scuba diving, and desert quad safaris.

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Capabilities & Features](#-key-capabilities--features)
3. [Architecture & Tech Stack](#-architecture--tech-stack)
4. [Project Structure](#-project-structure)
5. [Getting Started & Local Development](#-getting-started--local-development)
6. [Environment Variables](#-environment-variables)
7. [Database & Supabase Integration](#-database--supabase-integration)
8. [Admin CMS & Operations Portal](#-admin-cms--operations-portal)
9. [Customer Authentication & Voyager Portal](#-customer-authentication--voyager-portal)
10. [Multi-Currency & Internationalization](#-multi-currency--internationalization)
11. [SEO & Social Metadata](#-seo--social-metadata)
12. [Production Build & Deployment](#-production-build--deployment)

---

## 🌟 Project Overview

**Red Sea Excursions & Voyages** delivers a luxury direct-to-consumer maritime tourism experience alongside a comprehensive operations management engine. It connects international holidaymakers in Egypt (Hurghada, El Gouna, Sahl Hasheesh, Makadi Bay, Safaga, Marsa Alam) with verified local sea captains, desert safari guides, and PADI-certified divemasters.

The platform provides real-time excursion discovery, automated multi-step booking workflows, hotel pickup coordination, PDF voucher generation, wishlist management, interactive customer accounts, and an executive administration dashboard.

---

## 🚀 Key Capabilities & Features

### 🏖️ Guest & Discovery Experience
- **Cinematic Dynamic Hero**: Rotating auto-advancing showcase spanning 5 excursion categories (Island & Snorkeling, Desert Safari, PADI Scuba, Luxury Private Yachts, and Water Sports) with synchronized headlines, localized marine telemetry, and live conditions.
- **Parametric Search & Filtering**: Multi-criteria search engine filtering by destination, activity category, guest count, price tier, duration, and departure date.
- **Skeleton Shimmer Loaders**: Full-layout skeleton loaders for the home grid, excursions page, and detailed tour pages ensuring zero cumulative layout shift (CLS).
- **Tour Detail Pages**:
  - High-resolution interactive media gallery with lightbox support.
  - Granular minute-by-minute itinerary timeline.
  - Comprehensive Inclusions vs. Exclusions breakdown.
  - What to Bring & Important Maritime Regulations checklists.
  - Live verified guest reviews with star breakdown distributions.
  - Dynamic pickup add-on selector and optional upgrades (e.g. underwater GoPro rentals, seafood upgrades).

### 💳 Booking & Reservation Flow
- **Direct 3-Step Checkout Modal**:
  1. Date & party selection (adults, children, infants) with live capacity validation.
  2. Resort lobby pickup specification with optional area surcharges (El Gouna, Makadi Bay, Soma Bay).
  3. Lead passenger contact details, special requests, and payment selection (`Pay at Pickup` cash/card or online options).
- **Instant Booking Confirmation**: Generates a unique booking reference (`RSE-XXXXXX`) with downloadable digital voucher summaries.
- **Draft Autosave**: Automatically preserves uncompleted booking state in browser local storage so guests never lose progress.

### 👤 Customer Voyager Portal
- **Supabase Authentication**: Email/password registration, secure login, password reset flow, and auto-profile syncing via PostgreSQL triggers.
- **My Bookings Dashboard**: History of upcoming, completed, and cancellation-requested tours.
- **Live Digital Vouchers**: Direct print and voucher inspection modal with barcode generation and hotel meeting point info.
- **Wishlist & Saved Tours**: Fast off-canvas drawer to save favorite excursions with real-time counters.

### 🛡️ Executive Admin CMS, Operations, CRM & Finance
- **Role-Based Access Control (RBAC)**: Support for `admin`, `manager`, `staff`, and `customer` roles enforced via PostgreSQL Row-Level Security (RLS).
- **Tours Management**: Complete CRUD interface for excursions (pricing, itineraries, inclusions, exclusions, gallery images, difficulty, and publish states).
- **Bookings Management**: Real-time status modification (`confirmed`, `pending`, `cancellation_requested`, `cancelled`, `completed`), payment tracking, and customer contact inspection.
- **Availability Calendar & Capacity**: Manage daily slot caps, blackout dates, and passenger capacity counters.
- **Customer CRM**: Leads pipeline, customer profiles, inquiries, tasks & follow-ups, activity timeline, and booking history.
- **Operations & Maritime Fleet**: Today's departures, operational assignments, passenger manifests, hotel pickup schedules, vessel fleet management, guide/captain assignments, and live marine weather bulletins.
- **Finance & Accounting**: Payments ledger, invoice generation with PDF printing, controlled refund records with audit trail, outstanding balances, and multi-currency reporting.
- **Communications**: Email & WhatsApp dispatches, reusable template engine with variable interpolation, deduplicated staff internal notifications, and complete communication audit logs.
- **Executive Management Reporting**: Five specialized analytical views (Executive, Sales, Operations, Customers, Finance) querying real Supabase data with configurable date ranges (Today, Yesterday, This Week, This Month, Last Month, This Year, Custom) and CSV/Excel/Print exports.
- **Database & Sync Diagnostics**: Live health status panel showing Supabase connection, schema cache status, and table counts.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript 7.x, Vite 8.x |
| **Styling & Design** | Tailwind CSS v4, Motion (Framer Motion v12), Lucide Icons |
| **Backend & Dev Server** | Node.js, Express 4.x, TSX runtime (`server.ts`) |
| **Database & Auth** | Supabase (PostgreSQL 15+), Supabase Auth, Row-Level Security (RLS) |
| **AI Capabilities** | `@google/genai` (Gemini API server-side integration ready) |
| **Storage & State** | Supabase Storage (`tour-media`), LocalStorage sync, React Context |

---

## 📂 Project Structure

```
├── .env.example                 # Environment variables specification
├── index.html                   # HTML entry point with rich SEO meta
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies and script definitions
├── server.ts                    # Full-stack Express server with Vite middleware integration
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler configuration
│
├── public/                      # Static assets & public media
│   ├── logo.png                 # Primary transparent brand logo
│   ├── logo.webp / logo.jpg     # Alternate format archives
│   └── og-image.jpg             # Social sharing OpenGraph card
│
├── src/
│   ├── App.tsx                  # Root routing, view management, and global layout
│   ├── main.tsx                 # Application client entrypoint
│   ├── index.css                # Global styles, Tailwind imports, and custom shimmer keyframes
│   │
│   ├── components/
│   │   ├── admin/               # Administration CMS components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminLoginPage.tsx
│   │   │   ├── ToursManagement.tsx
│   │   │   ├── BookingsManagement.tsx
│   │   │   ├── CustomersManagement.tsx
│   │   │   ├── AvailabilityManagement.tsx
│   │   │   └── SettingsView.tsx
│   │   ├── common/              # Shared UI elements
│   │   │   ├── Header.tsx       # Navbar with brand logo, currency selector, and auth modals
│   │   │   ├── Footer.tsx       # Multi-column footer with contact and legal links
│   │   │   └── WishlistDrawer.tsx
│   │   ├── home/                # Homepage presentation
│   │   │   ├── Hero.tsx         # Cinematic background slideshow with synchronized narrative
│   │   │   ├── SearchModule.tsx # Parametric filter & search bar
│   │   │   ├── PopularTours.tsx # Curated tour grid with skeleton loading state
│   │   │   ├── DestinationsSection.tsx
│   │   │   ├── CategoriesSection.tsx
│   │   │   ├── ReviewsSection.tsx
│   │   │   ├── WhyChooseUs.tsx
│   │   │   └── FaqSection.tsx
│   │   └── tours/               # Excursions & discovery components
│   │       ├── TourCard.tsx
│   │       ├── TourCardSkeleton.tsx
│   │       ├── TourDetailSkeleton.tsx
│   │       ├── TourFilters.tsx
│   │       ├── TourGrid.tsx
│   │       └── RelatedTours.tsx
│   │
│   ├── contexts/                # React Context Providers
│   │   ├── AuthContext.tsx      # Supabase user sessions, roles, and profile state
│   │   ├── LanguageContext.tsx  # Multi-lingual dictionary (English, German, etc.)
│   │   └── WishlistContext.tsx  # Saved excursions state
│   │
│   ├── data/                    # Fallback data & initial seeding
│   │   └── toursData.ts         # High-fidelity static tours, categories, and reviews
│   │
│   ├── pages/                   # Top-level route views
│   │   ├── ExcursionsPage.tsx   # Discovery & filter page
│   │   ├── TourDetailPage.tsx   # Comprehensive tour experience page
│   │   ├── BookingModal.tsx     # 3-step checkout overlay
│   │   ├── AccountPage.tsx      # Customer voyager profile & bookings
│   │   ├── LoginPage.tsx        # Customer login
│   │   ├── RegisterPage.tsx     # Customer registration
│   │   ├── ResetPasswordPage.tsx# Password reset
│   │   ├── AboutPage.tsx        # Company background
│   │   ├── ContactPage.tsx      # Direct booking assistance & inquiries
│   │   ├── FaqPage.tsx          # Comprehensive FAQ
│   │   └── LegalPage.tsx        # Terms of service and privacy policy
│   │
│   ├── services/                # Backend API & service integrations
│   │   ├── supabaseClient.ts    # Supabase SDK initialization & connection testing
│   │   ├── tourService.ts       # Database tour queries and Supabase CRUD
│   │   ├── bookingService.ts    # Reservation creation, reference generation, and updates
│   │   ├── draftStorage.ts      # Unsaved booking draft persistence
│   │   └── seoService.ts        # Dynamic document head and structured data injection
│   │
│   └── types/                   # TypeScript schemas
│       ├── index.ts             # Domain frontend interfaces
│       ├── database.ts          # Relational Supabase interfaces
│       └── database.types.ts    # Direct Supabase CLI generated type declarations
│
└── supabase/                    # Database migrations & SQL blueprints
    ├── seed.sql                 # Production reference catalog (destinations, categories, tours, vessels, guides)
    └── migrations/
        └── 20260922000000_phase4_schema.sql # Complete 33-table production schema & RLS policies
```

---

## 💻 Getting Started & Local Development

For a complete step-by-step walkthrough, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- (Optional) A free [Supabase](https://supabase.com) account for persistent cloud data

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Provide your Supabase URL and Anon Key in `.env` (or configure them directly via the in-app Admin Settings panel).

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will boot on `http://localhost:3000`.

---

## 🔐 Environment Variables

| Variable | Description | Client Exposed? |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (`https://<project-id>.supabase.co`) | Yes (Client-side) |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key for querying database with RLS | Yes (Client-side) |
| `GEMINI_API_KEY` | Google Gemini API key for AI assistant features | Server-side only |
| `APP_URL` | Canonical deployment URL for metadata and webhooks | Server & Client |

---

## 🗄️ Database & Supabase Integration

The platform features a resilient two-tier data layer:
1. **Live Supabase PostgreSQL**: Queries live published tours, itineraries, inclusions, reviews, inquiries, newsletter subscribers, and bookings with full Row Level Security (RLS).
2. **Deterministic Fallback**: If Supabase credentials are not configured or the database schema is freshly initializing, the client seamlessly falls back to local storage and static catalog reference data.

For comprehensive database documentation, schema diagrams, RLS rules, and execution steps:
- 📖 [Complete Supabase Architecture & Guide (SUPABASE.md)](./SUPABASE.md)
- 🚀 [Website & Supabase Launch Guide (SETUP_GUIDE.md)](./SETUP_GUIDE.md)

---

## 🧭 Admin CMS & Operations Portal

Access the administration portal via the `/admin` URL or by clicking the **Admin Portal** link in the footer.

- **Default Admin Route**: `/admin`
- **Dashboard Capabilities**:
  - Live revenue counters and booking status pie charts.
  - Detailed Tour Editor with multi-image gallery uploaders.
  - Instant toggle between `Draft` and `Published` tour states.
  - Booking status modifications with customer email confirmation triggers.
  - Quick database diagnostics and Supabase health checks.

---

## 💱 Multi-Currency & Internationalization

- **Currencies Supported**:
  - **EUR (€)**: Base reference currency
  - **USD ($)**: 1.08 exchange rate
  - **GBP (£)**: 0.85 exchange rate
  - **EGP (E£)**: 52.50 exchange rate
- **Localization**: All tour titles, durations, pickup notices, and navigation elements utilize the custom `LanguageContext` provider.

---

## 📈 Production Build & Deployment

To produce an optimized production distribution:

```bash
# Verify TypeScript types and code validity
npm run lint

# Build production assets via Vite
npm run build

# Start the full-stack production server
npm run start
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE). Built for high-volume tour operators and maritime vacation agencies.
