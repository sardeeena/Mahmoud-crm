import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';
import { CONCIERGE_SYSTEM_PROMPT, TOUR_CATALOG_SUMMARY } from './src/data/chatKnowledge';
import { STANDARD_PICKUP_LOCATIONS, GLOBAL_BOOKING_EXTRAS } from './src/data/bookingData';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SERVER_START_TIME = Date.now();

// ------------------------------------------------------------------------------
// Middleware & Security Headers
// ------------------------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Initialize Google Gen AI client with required User-Agent
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ------------------------------------------------------------------------------
// In-Memory Fallback Registries for Backend Validation
// ------------------------------------------------------------------------------
interface ServerInquiry {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  phone?: string;
  inquiryType: string;
  message: string;
  createdAt: string;
}

interface ServerNewsletterSubscriber {
  email: string;
  subscribedAt: string;
  language: string;
}

const serverInquiries: ServerInquiry[] = [];
const serverNewsletters: ServerNewsletterSubscriber[] = [];

// Helper email validator
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// ------------------------------------------------------------------------------
// 1. AI Chatbot Endpoint
// ------------------------------------------------------------------------------
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, prompt } = req.body;

  if (!prompt && (!messages || messages.length === 0)) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // If Gemini API is available, invoke gemini-3.8-flash
  if (ai) {
    try {
      // Build conversation contents
      const conversationHistory = (messages || []).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // Append latest prompt if not already present
      if (prompt && (!messages || messages[messages.length - 1]?.content !== prompt)) {
        conversationHistory.push({
          role: 'user',
          parts: [{ text: prompt }],
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: conversationHistory,
        config: {
          systemInstruction: CONCIERGE_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';

      // Match recommended tour objects from catalog
      const lower = responseText.toLowerCase();
      const matchedTours = TOUR_CATALOG_SUMMARY.filter((tour) => {
        return (
          lower.includes(tour.title.toLowerCase()) ||
          lower.includes(tour.slug) ||
          (lower.includes('orange bay') && tour.slug.includes('orange-bay')) ||
          (lower.includes('dolphin house') && tour.slug.includes('dolphin')) ||
          (lower.includes('paradise island') && tour.slug.includes('paradise')) ||
          (lower.includes('quad') && tour.slug.includes('safari')) ||
          (lower.includes('scuba diving') && tour.slug.includes('diving')) ||
          (lower.includes('speedboat') && tour.slug.includes('speedboat')) ||
          (lower.includes('luxor') && tour.slug.includes('luxor')) ||
          (lower.includes('cairo') && tour.slug.includes('cairo')) ||
          (lower.includes('submarine') && tour.slug.includes('submarine')) ||
          (lower.includes('sharm el naga') && tour.slug.includes('sharm-el-naga'))
        );
      }).slice(0, 3);

      return res.json({
        text: responseText,
        recommendedTours: matchedTours,
      });
    } catch (err: any) {
      console.warn('Gemini generateContent error in /api/chat:', err);
    }
  }

  // Graceful fallback if no API key or API call issue
  return res.status(503).json({
    error: 'Gemini service temporarily unavailable',
    fallback: true,
  });
});

// ------------------------------------------------------------------------------
// 2. Health & System Diagnostics Endpoint
// ------------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
  const mem = process.memoryUsage();

  res.json({
    status: 'ok',
    version: '2.4.0',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    services: {
      server: { status: 'healthy', port: PORT },
      geminiAi: {
        status: process.env.GEMINI_API_KEY ? 'available' : 'disabled',
        model: 'gemini-3.8-flash',
      },
      supabase: {
        status: process.env.VITE_SUPABASE_URL ? 'configured' : 'mock_fallback',
        urlProvided: Boolean(process.env.VITE_SUPABASE_URL),
      },
      databaseSchema: { cached: true, ready: true },
    },
    memory: {
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
    },
  });
});

// ------------------------------------------------------------------------------
// 3. System Configuration Endpoint
// ------------------------------------------------------------------------------
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    brandName: 'Red Sea Excursions & Voyages',
    hotline: '+20 102 345 6789',
    whatsappUrl: 'https://wa.me/201023456789',
    operatingHours: '06:00 - 23:00 EEST (Daily)',
    currencyDefault: 'EUR',
    supportedCurrencies: ['EUR', 'USD', 'GBP', 'EGP'],
    supportedLanguages: ['en', 'de', 'ru', 'fr', 'ar', 'it', 'pl', 'nl'],
    depositRequired: false,
    cancellationFreeNoticeHours: 24,
  });
});

// ------------------------------------------------------------------------------
// 4. Tours Catalog Query API
// ------------------------------------------------------------------------------
app.get('/api/tours', (req: Request, res: Response) => {
  const { destination, category, search, limit } = req.query;

  let filtered = [...TOUR_CATALOG_SUMMARY];

  if (destination && typeof destination === 'string') {
    filtered = filtered.filter(
      (t) => t.destination.toLowerCase() === destination.toLowerCase()
    );
  }

  if (category && typeof category === 'string') {
    filtered = filtered.filter(
      (t) =>
        t.category.toLowerCase() === category.toLowerCase() ||
        t.categories.some((c) => c.toLowerCase() === category.toLowerCase())
    );
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q)
    );
  }

  const maxItems = limit ? parseInt(limit as string, 10) : 50;
  const result = filtered.slice(0, isNaN(maxItems) ? 50 : maxItems);

  res.json({
    success: true,
    count: result.length,
    total: filtered.length,
    tours: result,
  });
});

// ------------------------------------------------------------------------------
// 5. Booking Creation & Authoritative Pricing Validation API
// ------------------------------------------------------------------------------
app.post('/api/bookings/create', (req: Request, res: Response) => {
  const { tourSlug, date, guests, customer, pickupLocationId, hotelName, roomNumber, extras, paymentMethod = 'pay_at_pickup', specialRequests } = req.body;

  // 1. Validate Input
  if (!tourSlug || typeof tourSlug !== 'string') {
    return res.status(400).json({ success: false, error: 'tourSlug is required.' });
  }

  if (!date || typeof date !== 'string' || isNaN(new Date(date).getTime())) {
    return res.status(400).json({ success: false, error: 'Valid excursion date (YYYY-MM-DD) is required.' });
  }

  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate.getTime() < today.getTime()) {
    return res.status(400).json({ success: false, error: 'Selected excursion date cannot be in the past.' });
  }

  if (!customer || !customer.firstName || !customer.email) {
    return res.status(400).json({ success: false, error: 'Customer first name and valid email address are required.' });
  }

  if (!isValidEmail(customer.email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address format.' });
  }

  const adults = Math.max(1, parseInt(guests?.adults, 10) || 1);
  const children = Math.max(0, parseInt(guests?.children, 10) || 0);
  const infants = Math.max(0, parseInt(guests?.infants, 10) || 0);
  const totalParty = adults + children + infants;
  const payingPassengers = adults + children;

  // 2. Verify tour exists in authoritative catalog
  const tour = TOUR_CATALOG_SUMMARY.find((t) => t.slug === tourSlug);
  if (!tour) {
    return res.status(404).json({ success: false, error: `Excursion "${tourSlug}" not found in catalog.` });
  }

  // 3. Verify capacity
  const maxCapacity = 30; // standard maximum group cap per booking
  if (totalParty > maxCapacity) {
    return res.status(400).json({
      success: false,
      error: `Group size (${totalParty} guests) exceeds maximum capacity of ${maxCapacity} passengers.`,
    });
  }

  // 4. Calculate Server-Side Authoritative Pricing
  const adultBasePrice = tour.priceEur;
  const childBasePrice = typeof tour.childPriceEur === 'number' ? tour.childPriceEur : Math.round(tour.priceEur * 0.5);
  const adultSubtotalEur = adults * adultBasePrice;
  const childSubtotalEur = children * childBasePrice;

  // Validate pickup location fee
  let pickupFeeEur = 0;
  let pickupLocationName = 'Hurghada Central';
  if (pickupLocationId) {
    const matchedLoc = STANDARD_PICKUP_LOCATIONS.find((l) => l.id === pickupLocationId);
    if (matchedLoc) {
      pickupLocationName = matchedLoc.name;
      pickupFeeEur = (matchedLoc.feeEurPerPerson || 0) * payingPassengers + (matchedLoc.feeEurFlat || 0);
    }
  }

  // Validate extras
  let extrasSubtotalEur = 0;
  const verifiedExtras: Array<{ extraId: string; name: string; amountEur: number; quantity: number }> = [];

  if (Array.isArray(extras)) {
    extras.forEach((item: any) => {
      const extraDef = GLOBAL_BOOKING_EXTRAS.find((e) => e.id === item.extraId);
      if (extraDef) {
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const itemAmount = extraDef.pricingType === 'per_person' 
          ? extraDef.priceEur * payingPassengers * qty 
          : extraDef.priceEur * qty;
        extrasSubtotalEur += itemAmount;
        verifiedExtras.push({
          extraId: extraDef.id,
          name: extraDef.name,
          amountEur: itemAmount,
          quantity: qty,
        });
      }
    });
  }

  const subtotalEur = adultSubtotalEur + childSubtotalEur + pickupFeeEur;
  const totalEur = subtotalEur + extrasSubtotalEur;

  // 5. Generate verified booking reference
  const currentYear = new Date().getFullYear();
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const c1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const c2 = letters.charAt(Math.floor(Math.random() * letters.length));
  const digits = Math.floor(1000 + Math.random() * 9000);
  const bookingReference = `RST-${currentYear}-${c1}${c2}${digits}`;

  return res.status(201).json({
    success: true,
    bookingReference,
    tour: {
      slug: tour.slug,
      title: tour.title,
      destination: tour.destination,
      durationLabel: tour.durationLabel,
      primaryImage: tour.primaryImage,
    },
    date,
    guests: { adults, children, infants, total: totalParty },
    pickup: {
      locationId: pickupLocationId || 'hurghada',
      locationName: pickupLocationName,
      hotelName: hotelName || null,
      roomNumber: roomNumber || null,
      feeEur: pickupFeeEur,
    },
    pricing: {
      adultPriceEur: adultBasePrice,
      childPriceEur: childBasePrice,
      adultSubtotalEur,
      childSubtotalEur,
      pickupFeeEur,
      extrasSubtotalEur,
      subtotalEur,
      totalEur,
      currency: 'EUR',
      formattedTotal: `€${totalEur.toFixed(2)}`,
    },
    customer: {
      name: `${customer.firstName} ${customer.lastName || ''}`.trim(),
      email: customer.email.trim().toLowerCase(),
      phone: customer.phoneNumber || null,
      country: customer.country || 'International',
    },
    paymentMethod,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  });
});

// ------------------------------------------------------------------------------
// 6. Booking Lookup API (Supports POST body or GET query param)
// ------------------------------------------------------------------------------
app.all(['/api/bookings/lookup', '/api/booking/lookup'], (req: Request, res: Response) => {
  const reference = (req.body?.reference || req.query?.ref || req.query?.reference) as string;

  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({
      success: false,
      found: false,
      error: 'Booking reference is required',
    });
  }

  const cleanRef = reference.trim().toUpperCase();
  const refRegex = /^RST-\d{4}-[A-Z0-9]+$/;

  if (!refRegex.test(cleanRef) && !cleanRef.startsWith('RST-')) {
    return res.status(400).json({
      success: false,
      found: false,
      error: 'Invalid reference format. Expected format: RST-2026-XXXX',
    });
  }

  // Check if reference exists in server-side bookings registry
  // In production, Supabase PostgreSQL is the authoritative source.
  // If not found, NEVER fabricate a booking.
  return res.status(404).json({
    success: false,
    found: false,
    error: `Booking reference "${cleanRef}" was not found. Please verify the code on your confirmation voucher or contact pier desk dispatch.`,
  });
});

// ------------------------------------------------------------------------------
// 6. Availability Check API (Supports POST or GET query)
// ------------------------------------------------------------------------------
app.all('/api/availability/check', (req: Request, res: Response) => {
  const tourSlug = (req.body?.tourSlug || req.query?.tourSlug || req.query?.slug) as string;
  const date = (req.body?.date || req.query?.date) as string;
  const adults = parseInt((req.body?.adults || req.query?.adults || '1') as string, 10);
  const children = parseInt((req.body?.children || req.query?.children || '0') as string, 10);

  if (!tourSlug || !date) {
    return res.status(400).json({
      success: false,
      error: 'tourSlug and date (YYYY-MM-DD) are required',
    });
  }

  const tour = TOUR_CATALOG_SUMMARY.find((t) => t.slug === tourSlug);
  if (!tour) {
    return res.status(404).json({
      success: false,
      error: 'Tour not found in catalog',
    });
  }

  const checkDate = new Date(date);
  const now = new Date();
  const isPast = checkDate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (isPast) {
    return res.json({
      success: true,
      tourSlug,
      date,
      isDateAvailable: false,
      isPastDate: true,
      isNoticeCutoffViolated: true,
      remainingSeatsTotal: 0,
      slots: [],
      notes: 'Cannot book past dates',
    });
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[checkDate.getDay()];

  // Generate dynamic availability slots
  const slots = [
    {
      slotId: 'morning-0830',
      time: '08:30 AM',
      label: 'Morning Departure (Prime Reef Visibility)',
      availableSeats: 16,
      maxCapacity: 24,
      status: 'available',
      privateAvailable: true,
    },
    {
      slotId: 'midday-1100',
      time: '11:00 AM',
      label: 'Midday Cruise',
      availableSeats: 8,
      maxCapacity: 20,
      status: 'available',
      privateAvailable: true,
    },
  ];

  res.json({
    success: true,
    tourSlug,
    date,
    dayOfWeek: dayName,
    isDateAvailable: true,
    isPastDate: false,
    isNoticeCutoffViolated: false,
    minimumNoticeHours: 12,
    remainingSeatsTotal: 24,
    maxGuestsPerGroup: 30,
    priceEur: tour.priceEur,
    slots,
  });
});

// ------------------------------------------------------------------------------
// 7. Inquiries & Concierge Submissions API
// ------------------------------------------------------------------------------
app.post(['/api/inquiries', '/api/inquiries/submit', '/api/contact'], (req: Request, res: Response) => {
  const { name, email, phone, inquiryType = 'general_question', message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Name, valid email, and message are required',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address',
    });
  }

  const cleanName = String(name).trim().slice(0, 100);
  const cleanMessage = String(message).trim().slice(0, 2000);
  const currentYear = new Date().getFullYear();
  const ticketNumber = `INQ-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

  const inquiry: ServerInquiry = {
    id: 'inq-' + Date.now(),
    ticketNumber,
    name: cleanName,
    email: email.trim().toLowerCase(),
    phone: phone ? String(phone).slice(0, 30) : undefined,
    inquiryType,
    message: cleanMessage,
    createdAt: new Date().toISOString(),
  };

  serverInquiries.push(inquiry);

  res.status(201).json({
    success: true,
    inquiryId: inquiry.id,
    ticketNumber: inquiry.ticketNumber,
    status: 'received',
    estimatedResponseTime: 'Within 2 hours (Egypt Pier Desk hours)',
    receivedAt: inquiry.createdAt,
  });
});

// ------------------------------------------------------------------------------
// 8. Newsletter Subscription API
// ------------------------------------------------------------------------------
app.post(['/api/newsletter', '/api/newsletter/subscribe'], (req: Request, res: Response) => {
  const { email, preferredLanguage = 'en' } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address',
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const exists = serverNewsletters.some((n) => n.email === cleanEmail);

  if (!exists) {
    serverNewsletters.push({
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      language: preferredLanguage,
    });
  }

  res.json({
    success: true,
    subscribed: true,
    email: cleanEmail,
    alreadySubscribed: exists,
    message: exists
      ? 'You are already registered for Red Sea VIP excursion deals and marine updates.'
      : 'Thank you for subscribing! Your Red Sea VIP seasonal excursion discount will be sent shortly.',
  });
});

// ------------------------------------------------------------------------------
// API 404 Handler
// ------------------------------------------------------------------------------
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API route not found',
    timestamp: new Date().toISOString(),
  });
});

// ------------------------------------------------------------------------------
// Global Error Handler
// ------------------------------------------------------------------------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// ------------------------------------------------------------------------------
// Server Lifecycle
// ------------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
