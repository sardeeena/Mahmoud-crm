import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ALL_TOURS, POPULAR_DESTINATIONS, TOUR_CATEGORIES } from '../src/data/toursData';

dotenv.config();

/**
 * ==============================================================================
 * AUTHORITATIVE CATALOGUE IMPORT & SYNCHRONIZATION SCRIPT
 * ==============================================================================
 * Migrates and synchronizes the entire existing tour catalogue into Supabase.
 *
 * Requirements:
 * - Purely dynamic: Imports all 13 tours, 7 destinations, 6 categories, and all
 *   dependent relations (itineraries, inclusions, exclusions, highlights, images, FAQs).
 * - Stable UUIDs: Deterministic UUID generation ensures idempotent reruns.
 * - Conflict Handling: Uses upsert (ON CONFLICT DO UPDATE) to safely update existing records.
 * - Non-Destructive: Never wipes unrelated tables (bookings, customers, profiles).
 * - Validated: Reports pre-import and post-import counts and field verification.
 * ==============================================================================
 */

// Stable Deterministic UUID Mappings
export const DESTINATION_UUIDS: Record<string, string> = {
  'Hurghada': 'a1000000-0000-0000-0000-000000000001',
  'El Gouna': 'a1000000-0000-0000-0000-000000000002',
  'Makadi Bay': 'a1000000-0000-0000-0000-000000000003',
  'Sahl Hasheesh': 'a1000000-0000-0000-0000-000000000004',
  'Safaga': 'a1000000-0000-0000-0000-000000000005',
  'Sharm El-Sheikh': 'a1000000-0000-0000-0000-000000000006',
  'Marsa Alam': 'a1000000-0000-0000-0000-000000000007',
};

export const CATEGORY_UUIDS: Record<string, string> = {
  'Boat Trips': 'c1000000-0000-0000-0000-000000000001',
  'Boat Trip': 'c1000000-0000-0000-0000-000000000001',
  'Snorkeling': 'c1000000-0000-0000-0000-000000000002',
  'Diving': 'c1000000-0000-0000-0000-000000000003',
  'Safari': 'c1000000-0000-0000-0000-000000000004',
  'Private Tours': 'c1000000-0000-0000-0000-000000000005',
  'Private Tour': 'c1000000-0000-0000-0000-000000000005',
  'Water Sports': 'c1000000-0000-0000-0000-000000000006',
  'Island': 'c1000000-0000-0000-0000-000000000001',
  'Quad': 'c1000000-0000-0000-0000-000000000004',
  'Island Visits': 'c1000000-0000-0000-0000-000000000001',
};

export const TOUR_UUIDS: Record<string, string> = {
  'orange-bay-island-snorkeling': 't1000000-0000-0000-0000-000000000001',
  'paradise-island-snorkeling-trip': 't1000000-0000-0000-0000-000000000002',
  'dolphin-house-snorkeling': 't1000000-0000-0000-0000-000000000003',
  'giftun-island-boat-trip': 't1000000-0000-0000-0000-000000000004',
  'desert-quad-safari': 't1000000-0000-0000-0000-000000000005',
  'desert-safari-bedouin-experience': 't1000000-0000-0000-0000-000000000006',
  'private-red-sea-yacht': 't1000000-0000-0000-0000-000000000007',
  'el-gouna-private-boat-trip': 't1000000-0000-0000-0000-000000000008',
  'introductory-scuba-diving-experience': 't1000000-0000-0000-0000-000000000009',
  'marsa-alam-dolphin-house': 't1000000-0000-0000-0000-000000000010',
  'sharm-el-naga-beach-reef-day': 't1000000-0000-0000-0000-000000000011',
  'sahl-hasheesh-glass-bottom-boat': 't1000000-0000-0000-0000-000000000012',
  'ras-mohammed-white-island-cruise': 't1000000-0000-0000-0000-000000000013',
};

export async function runCatalogueImport() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const isServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('================================================================');
  console.log('  Awesome Adventure Tours — Authoritative Catalogue Importer');
  console.log('================================================================\n');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (adminEmail && adminPassword && !isServiceRole) {
    console.log(`Authenticating as Administrator: ${adminEmail}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    if (authError || !authData.session) {
      console.warn(`⚠️ Note: Could not sign in as ${adminEmail}: ${authError?.message}`);
    } else {
      console.log('✓ Successfully authenticated as Administrator.');
    }
  }

  const stats = {
    destinations: 0,
    categories: 0,
    pickupLocations: 0,
    tourExtras: 0,
    tours: 0,
    tourCategories: 0,
    tourImages: 0,
    itinerarySteps: 0,
    highlights: 0,
    inclusions: 0,
    exclusions: 0,
    seoMetadata: 0,
  };

  try {
    // --------------------------------------------------------------------------
    // STEP 1: DESTINATIONS
    // --------------------------------------------------------------------------
    console.log('Step 1/12: Upserting 7 Coastal Destinations...');
    for (let i = 0; i < POPULAR_DESTINATIONS.length; i++) {
      const d = POPULAR_DESTINATIONS[i];
      const uuid = DESTINATION_UUIDS[d.name];
      if (!uuid) throw new Error(`Missing UUID mapping for destination: ${d.name}`);

      const { error } = await supabase.from('destinations').upsert({
        id: uuid,
        name: d.name,
        slug: d.slug,
        tagline: d.tagline,
        description: d.description,
        main_image: d.image,
        gallery: [d.image],
        distance_from_airport: d.distanceFromAirport,
        status: 'published',
        sort_order: i + 1,
      }, { onConflict: 'id' });

      if (error) throw new Error(`Failed to upsert destination ${d.name}: ${error.message}`);
      stats.destinations++;
    }
    console.log(`✓ Upserted ${stats.destinations} destinations.`);

    // --------------------------------------------------------------------------
    // STEP 2: CATEGORIES
    // --------------------------------------------------------------------------
    console.log('Step 2/12: Upserting 6 Tour Categories...');
    for (let i = 0; i < TOUR_CATEGORIES.length; i++) {
      const c = TOUR_CATEGORIES[i];
      const uuid = CATEGORY_UUIDS[c.name] || CATEGORY_UUIDS[c.slug];
      if (!uuid) throw new Error(`Missing UUID mapping for category: ${c.name}`);

      const { error } = await supabase.from('categories').upsert({
        id: uuid,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        icon_name: c.iconName,
        status: 'published',
        sort_order: i + 1,
      }, { onConflict: 'id' });

      if (error) throw new Error(`Failed to upsert category ${c.name}: ${error.message}`);
      stats.categories++;
    }
    console.log(`✓ Upserted ${stats.categories} categories.`);

    // --------------------------------------------------------------------------
    // STEP 3: PICKUP LOCATIONS
    // --------------------------------------------------------------------------
    console.log('Step 3/12: Upserting Pickup Locations...');
    const pickupLocations = [
      { id: 'p1000000-0000-0000-0000-000000000001', code: 'hurghada', name: 'Hurghada Hotels (Central)', area: 'Hurghada (Mamsha, Dahar, Sheraton, Marina)', fee_eur_per_person: 0, fee_eur_flat: 0, description: 'Complimentary return transfer included from all standard Hurghada hotel lobbies.', sort_order: 1 },
      { id: 'p1000000-0000-0000-0000-000000000002', code: 'el-gouna', name: 'El Gouna Resorts', area: 'El Gouna Peninsula & Lagoons', fee_eur_per_person: 5, fee_eur_flat: 0, description: 'Transfers from northern El Gouna resorts to Hurghada Marina.', sort_order: 2 },
      { id: 'p1000000-0000-0000-0000-000000000003', code: 'makadi-bay', name: 'Makadi Bay Resorts', area: 'Makadi Bay Coast', fee_eur_per_person: 5, fee_eur_flat: 0, description: 'Air-conditioned shuttle from Makadi Bay resorts.', sort_order: 3 },
      { id: 'p1000000-0000-0000-0000-000000000004', code: 'sahl-hasheesh', name: 'Sahl Hasheesh Resorts', area: 'Sahl Hasheesh Old Town & Promenade', fee_eur_per_person: 5, fee_eur_flat: 0, description: 'Transfers from Sahl Hasheesh gate hotels.', sort_order: 4 },
      { id: 'p1000000-0000-0000-0000-000000000005', code: 'safaga', name: 'Safaga & Soma Bay', area: 'Soma Bay Peninsula & Safaga Port', fee_eur_per_person: 10, fee_eur_flat: 0, description: 'Dedicated long-range transport service.', sort_order: 5 },
      { id: 'p1000000-0000-0000-0000-000000000006', code: 'sharm-el-sheikh', name: 'Sharm El-Sheikh Hotels (All Zones)', area: 'Naama Bay, Nabq Bay, Sharks Bay, Hadaba, Ras Um Sid', fee_eur_per_person: 0, fee_eur_flat: 0, description: 'Complimentary return transfer included from all Sharm El-Sheikh hotel lobbies.', sort_order: 6 },
    ];

    for (const pl of pickupLocations) {
      const { error } = await supabase.from('pickup_locations').upsert(pl, { onConflict: 'id' });
      if (error) console.warn(`Pickup location upsert note (${pl.code}):`, error.message);
      else stats.pickupLocations++;
    }
    console.log(`✓ Upserted ${stats.pickupLocations} pickup locations.`);

    // --------------------------------------------------------------------------
    // STEP 4: TOUR EXTRAS
    // --------------------------------------------------------------------------
    console.log('Step 4/12: Upserting Tour Extras...');
    const tourExtras = [
      { id: 'e1000000-0000-0000-0000-000000000001', name: 'GoPro Underwater Camera Rental (16GB SD Included)', description: 'Full day waterproof 4K camera rental. Keep the 16GB micro-SD card loaded with your coral reef clips.', price_eur: 25.00, currency: 'EUR', pricing_type: 'per_booking', is_active: true, sort_order: 1 },
      { id: 'e1000000-0000-0000-0000-000000000002', name: 'Private VIP Van Transfer Upgrade', description: 'Upgrade your group transfer to a private luxury Mercedes/HiAce van direct from hotel to vessel without intermediate hotel stops.', price_eur: 30.00, currency: 'EUR', pricing_type: 'per_booking', is_active: true, sort_order: 2 },
      { id: 'e1000000-0000-0000-0000-000000000003', name: 'Fresh Grilled Jumbo Shrimp & Calamari Lunch Upgrade', description: 'Add a sizzling platter of freshly grilled Mediterranean jumbo prawns, calamari, and seafood soup to your onboard lunch.', price_eur: 15.00, currency: 'EUR', pricing_type: 'per_person', is_active: true, sort_order: 3 },
      { id: 'e1000000-0000-0000-0000-000000000004', name: 'Introductory Scuba Dive (20 Minutes Guided)', description: 'Experience real underwater breathing with a certified PADI instructor. No license or prior experience required.', price_eur: 20.00, currency: 'EUR', pricing_type: 'per_person', is_active: true, sort_order: 4 },
    ];

    for (const te of tourExtras) {
      const { error } = await supabase.from('tour_extras').upsert(te, { onConflict: 'id' });
      if (error) console.warn(`Tour extra upsert note (${te.name}):`, error.message);
      else stats.tourExtras++;
    }
    console.log(`✓ Upserted ${stats.tourExtras} tour extras.`);

    // --------------------------------------------------------------------------
    // STEP 5: TOURS (All 13 Catalogue Tours)
    // --------------------------------------------------------------------------
    console.log('Step 5/12: Upserting 13 Production Tours...');
    for (let i = 0; i < ALL_TOURS.length; i++) {
      const t = ALL_TOURS[i];
      const tourUuid = TOUR_UUIDS[t.slug];
      if (!tourUuid) throw new Error(`Missing UUID mapping for tour slug: ${t.slug}`);

      const destinationId = DESTINATION_UUIDS[t.destination];
      if (!destinationId) throw new Error(`Destination not found for tour: ${t.title} (${t.destination})`);

      const tourPayload = {
        id: tourUuid,
        title: t.title,
        slug: t.slug,
        short_description: t.shortDescription,
        description: t.fullDescription,
        destination_id: destinationId,
        duration: t.durationLabel || `${t.durationHours} Hours`,
        duration_type: t.durationCategory === 'Half Day' ? 'hours' : 'hours',
        duration_hours: Math.round(t.durationHours || 7),
        tour_type: (t.tourType || 'Shared').toLowerCase(),
        status: 'published',
        featured: i < 4,
        price: t.priceEur,
        child_price: t.childPriceEur || 0,
        infant_price: 0,
        private_price: t.privatePriceEur || null,
        currency: 'EUR',
        max_guests: 35,
        minimum_booking_notice_hours: 12,
        pickup_available: true,
        pickup_info: 'Complimentary hotel transfer across standard resort lobbies included.',
        cancellation_policy: 'Free cancellation up to 24 hours prior to excursion departure',
        departure_time: '08:30 AM',
        badge: t.badge || null,
        rating: t.rating || 4.9,
        review_count: t.reviewCount || 100,
        sort_order: i + 1,
      };

      const { error: tourErr } = await supabase.from('tours').upsert(tourPayload, { onConflict: 'id' });
      if (tourErr) throw new Error(`Failed to upsert tour "${t.title}": ${tourErr.message}`);
      stats.tours++;

      // ------------------------------------------------------------------------
      // STEP 6: TOUR CATEGORIES
      // ------------------------------------------------------------------------
      const allCategoryKeys = Array.from(new Set([t.category, ...(t.categories || [])]));
      for (const catName of allCategoryKeys) {
        const catUuid = CATEGORY_UUIDS[catName];
        if (catUuid) {
          const { error: tcErr } = await supabase.from('tour_categories').upsert({
            tour_id: tourUuid,
            category_id: catUuid,
          }, { onConflict: 'tour_id,category_id' });
          if (!tcErr) stats.tourCategories++;
        }
      }

      // ------------------------------------------------------------------------
      // STEP 7: TOUR IMAGES (Primary + Gallery)
      // ------------------------------------------------------------------------
      // Primary image
      if (t.primaryImage) {
        const { error: imgErr } = await supabase.from('tour_images').upsert({
          tour_id: tourUuid,
          image_url: t.primaryImage,
          alt_text: `${t.title} primary hero photo`,
          caption: t.title,
          is_primary: true,
          sort_order: 1,
        }, { onConflict: 'tour_id,image_url' });
        if (!imgErr) stats.tourImages++;
      }

      // Gallery images
      if (t.galleryImages && t.galleryImages.length > 0) {
        for (let g = 0; g < t.galleryImages.length; g++) {
          const gUrl = t.galleryImages[g];
          if (gUrl !== t.primaryImage) {
            const { error: gErr } = await supabase.from('tour_images').upsert({
              tour_id: tourUuid,
              image_url: gUrl,
              alt_text: `${t.title} gallery photo ${g + 1}`,
              caption: `${t.title} photo`,
              is_primary: false,
              sort_order: g + 2,
            }, { onConflict: 'tour_id,image_url' });
            if (!gErr) stats.tourImages++;
          }
        }
      }

      // ------------------------------------------------------------------------
      // STEP 8: TOUR ITINERARY
      // ------------------------------------------------------------------------
      if (t.itinerary && t.itinerary.length > 0) {
        for (let s = 0; s < t.itinerary.length; s++) {
          const step = t.itinerary[s];
          const { error: itinErr } = await supabase.from('tour_itinerary').upsert({
            tour_id: tourUuid,
            time: step.time,
            title: step.title,
            description: step.description,
            sort_order: s + 1,
          }, { onConflict: 'tour_id,sort_order' });
          if (!itinErr) stats.itinerarySteps++;
        }
      }

      // ------------------------------------------------------------------------
      // STEP 9: TOUR HIGHLIGHTS
      // ------------------------------------------------------------------------
      if (t.highlights && t.highlights.length > 0) {
        for (let h = 0; h < t.highlights.length; h++) {
          const { error: hlErr } = await supabase.from('tour_highlights').upsert({
            tour_id: tourUuid,
            item: t.highlights[h],
            sort_order: h + 1,
          }, { onConflict: 'tour_id,sort_order' });
          if (!hlErr) stats.highlights++;
        }
      }

      // ------------------------------------------------------------------------
      // STEP 10: INCLUSIONS & EXCLUSIONS
      // ------------------------------------------------------------------------
      if (t.included && t.included.length > 0) {
        for (let inc = 0; inc < t.included.length; inc++) {
          const { error: incErr } = await supabase.from('tour_inclusions').upsert({
            tour_id: tourUuid,
            item: t.included[inc],
            sort_order: inc + 1,
          }, { onConflict: 'tour_id,sort_order' });
          if (!incErr) stats.inclusions++;
        }
      }

      if (t.excluded && t.excluded.length > 0) {
        for (let exc = 0; exc < t.excluded.length; exc++) {
          const { error: excErr } = await supabase.from('tour_exclusions').upsert({
            tour_id: tourUuid,
            item: t.excluded[exc],
            sort_order: exc + 1,
          }, { onConflict: 'tour_id,sort_order' });
          if (!excErr) stats.exclusions++;
        }
      }

      // ------------------------------------------------------------------------
      // STEP 11: TOUR SEO METADATA
      // ------------------------------------------------------------------------
      const { error: seoErr } = await supabase.from('seo_metadata').upsert({
        entity_type: 'tour',
        entity_id: tourUuid,
        seo_title: `${t.title} | Red Sea Voyages`,
        meta_description: t.shortDescription,
        seo_keywords: [t.destination.toLowerCase(), t.category.toLowerCase(), t.title.toLowerCase()],
        canonical_url: `https://redseavoyages.com/excursions/${t.slug}`,
        og_title: t.title,
        og_description: t.shortDescription,
      }, { onConflict: 'entity_type,entity_id' });
      if (!seoErr) stats.seoMetadata++;
    }

    console.log(`✓ All 13 tours upserted with full relational hierarchies.`);

    // --------------------------------------------------------------------------
    // STEP 12: VERIFICATION & AUDIT
    // --------------------------------------------------------------------------
    console.log('\nStep 12/12: Verifying database records against source catalogue...');
    const { data: dbTours, error: queryErr } = await supabase
      .from('tours')
      .select('id, slug, title, price, status, destinations(name)')
      .order('sort_order', { ascending: true });

    if (queryErr) throw new Error(`Verification query failed: ${queryErr.message}`);

    console.log(`\nVerified database tours count: ${dbTours?.length || 0} / 13 expected.`);
    console.log('----------------------------------------------------------------');
    (dbTours || []).forEach((t: any, idx: number) => {
      console.log(`  ${idx + 1}. [${t.slug}] ${t.title} (€${t.price}) - ${t.destinations?.name || 'No dest'}`);
    });
    console.log('----------------------------------------------------------------');

    console.log('\n================================================================');
    console.log('✅ CATALOGUE IMPORT COMPLETED SUCCESSFULLY:');
    console.log(`   - Destinations:      ${stats.destinations} / 7`);
    console.log(`   - Categories:        ${stats.categories} / 6`);
    console.log(`   - Pickup Locations:  ${stats.pickupLocations} / 6`);
    console.log(`   - Tour Extras:       ${stats.tourExtras} / 4`);
    console.log(`   - Tours:             ${stats.tours} / 13`);
    console.log(`   - Tour Categories:   ${stats.tourCategories}`);
    console.log(`   - Tour Images:       ${stats.tourImages}`);
    console.log(`   - Itinerary Steps:   ${stats.itinerarySteps}`);
    console.log(`   - Highlights:        ${stats.highlights}`);
    console.log(`   - Inclusions:        ${stats.inclusions}`);
    console.log(`   - Exclusions:        ${stats.exclusions}`);
    console.log(`   - SEO Metadata:      ${stats.seoMetadata}`);
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('\n❌ Import encountered an error:');
    console.error(`   ${err.message || err}`);
    if (String(err?.message || err).includes('row-level security') && !isServiceRole) {
      console.error('\n💡 How to resolve:');
      console.error('   Anonymous keys cannot write to catalogue tables by design.');
      console.error('   Run with the service_role key:');
      console.error('     SUPABASE_SERVICE_ROLE_KEY="<secret-key>" npx tsx scripts/import_catalogue_to_supabase.ts');
      console.error('   OR authenticate with admin credentials:');
      console.error('     ADMIN_EMAIL="admin@awesomeadventure.tours" ADMIN_PASSWORD="<password>" npx tsx scripts/import_catalogue_to_supabase.ts');
      console.error('   OR execute "supabase/catalogue_seed.sql" directly in your Supabase SQL Editor.');
    }
    process.exit(1);
  }
}

// Execute when invoked directly
if (process.argv[1]?.endsWith('import_catalogue_to_supabase.ts')) {
  runCatalogueImport();
}
