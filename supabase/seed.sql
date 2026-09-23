-- ==============================================================================
-- RED SEA VOYAGES & MARITIME EXCURSIONS - PHASE 4 SEED DATA
-- ==============================================================================
-- NOTE: ALL DATA MARKED AS DEVELOPMENT DEMO SEED DATA.
-- Administrators can edit, unpublish, or delete all records from the Admin CMS.

-- 1. DESTINATIONS
INSERT INTO public.destinations (id, name, slug, tagline, description, main_image, gallery, distance_from_airport, status, sort_order)
VALUES 
(
    'a1000000-0000-0000-0000-000000000001',
    'Hurghada',
    'hurghada',
    'The premier maritime gateway with legendary sandy islands & house reefs',
    'Hurghada is Egypt’s leading coastal destination along the western shore of the Red Sea, famed for crystal shallows, world-class boat cruises, vibrant marinas, and direct access to protected national park islands.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    ARRAY['https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1200&q=80'],
    '15 minutes from HRG Airport',
    'published',
    1
),
(
    'a1000000-0000-0000-0000-000000000002',
    'El Gouna',
    'el-gouna',
    'The upscale lagoon resort town of luxury yachts & golf clubs',
    'Built across islands and turquoise lagoons, El Gouna delivers an exclusive European atmosphere with modern yacht marinas, kite-surfing lagoons, and protected coral gardens.',
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    ARRAY['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'],
    '30 minutes from HRG Airport',
    'published',
    2
),
(
    'a1000000-0000-0000-0000-000000000003',
    'Makadi Bay',
    'makadi-bay',
    'Serene bays, gentle sandy beaches & pristine offshore reefs',
    'Nestled south of Hurghada, Makadi Bay is famous for family-friendly luxury resorts and tranquil waters teeming with sea turtles and parrotfish.',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
    '35 minutes from HRG Airport',
    'published',
    3
),
(
    'a1000000-0000-0000-0000-000000000004',
    'Sahl Hasheesh',
    'sahl-hasheesh',
    'Grand seaside promenades and sun-drenched private bay shores',
    'An exclusive enclave known for its 12-kilometer palm-lined promenade, sunken pharaonic city snorkeling reef, and serene turquoise waters.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    ARRAY[],
    '25 minutes from HRG Airport',
    'published',
    4
),
(
    'a1000000-0000-0000-0000-000000000005',
    'Safaga & Soma Bay',
    'safaga',
    'Dramatic drop-offs, pristine barrier reefs & therapeutic beaches',
    'Safaga and the adjacent Soma Bay peninsula offer world-renowned diving at Panorama Reef, windsurfing, and uncrowded island excursions.',
    'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1200&q=80',
    ARRAY[],
    '50 minutes from HRG Airport',
    'published',
    5
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;


-- 2. CATEGORIES
INSERT INTO public.categories (id, name, slug, description, image, icon_name, status, sort_order)
VALUES
(
    'c1000000-0000-0000-0000-000000000001',
    'Boat Trips & Island Cruises',
    'boat-trips',
    'Full-day yacht sailings to Orange Bay, Paradise Island, and secluded sandbars.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'Ship',
    'published',
    1
),
(
    'c1000000-0000-0000-0000-000000000002',
    'Snorkeling Adventures',
    'snorkeling',
    'Guided explorations over world-famous barrier reefs and sea turtle sanctuaries.',
    'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1200&q=80',
    'Waves',
    'published',
    2
),
(
    'c1000000-0000-0000-0000-000000000003',
    'Diving Expeditions',
    'scuba-diving',
    'Introductory discovery dives and certified boat excursions to coral pinnacles.',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    'Anchor',
    'published',
    3
),
(
    'c1000000-0000-0000-0000-000000000004',
    'Desert Safari & Quad',
    'desert-safari',
    'ATV quad biking through Red Sea mountain canyons with Bedouin sunset dinner.',
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    'Compass',
    'published',
    4
),
(
    'c1000000-0000-0000-0000-000000000005',
    'Private Yacht Charters',
    'private-charters',
    'Tailored luxury vessel charters with private captain, crew, and custom route.',
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    'Sparkles',
    'published',
    5
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;


-- 3. PICKUP LOCATIONS
INSERT INTO public.pickup_locations (id, code, name, area, fee_eur_per_person, fee_eur_flat, description, is_active, sort_order)
VALUES
(
    'p1000000-0000-0000-0000-000000000001',
    'hurghada',
    'Hurghada Hotels (Central)',
    'Hurghada (Mamsha, Dahar, Sheraton, Marina)',
    0.00,
    0.00,
    'Complimentary return transfer included from all standard Hurghada hotel lobbies.',
    TRUE,
    1
),
(
    'p1000000-0000-0000-0000-000000000002',
    'el-gouna',
    'El Gouna Resorts',
    'El Gouna Peninsula & Lagoons',
    5.00,
    0.00,
    'Transfers from northern El Gouna resorts to Hurghada Marina.',
    TRUE,
    2
),
(
    'p1000000-0000-0000-0000-000000000003',
    'makadi-bay',
    'Makadi Bay Resorts',
    'Makadi Bay Coast',
    5.00,
    0.00,
    'Air-conditioned shuttle from Makadi Bay resorts.',
    TRUE,
    3
),
(
    'p1000000-0000-0000-0000-000000000004',
    'sahl-hasheesh',
    'Sahl Hasheesh Resorts',
    'Sahl Hasheesh Old Town & Promenade',
    5.00,
    0.00,
    'Transfers from Sahl Hasheesh gate hotels.',
    TRUE,
    4
),
(
    'p1000000-0000-0000-0000-000000000005',
    'safaga',
    'Safaga & Soma Bay',
    'Soma Bay Peninsula & Safaga Port',
    10.00,
    0.00,
    'Dedicated long-range transport service.',
    TRUE,
    5
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;


-- 4. TOUR EXTRAS
INSERT INTO public.tour_extras (id, name, description, price_eur, currency, pricing_type, is_active, sort_order)
VALUES
(
    'e1000000-0000-0000-0000-000000000001',
    'GoPro Underwater Camera Rental (16GB SD Included)',
    'Full day waterproof 4K camera rental. Keep the 16GB micro-SD card loaded with your coral reef clips.',
    25.00,
    'EUR',
    'per_booking',
    TRUE,
    1
),
(
    'e1000000-0000-0000-0000-000000000002',
    'Private VIP Van Transfer Upgrade',
    'Upgrade your group transfer to a private luxury Mercedes/HiAce van direct from hotel to vessel without intermediate hotel stops.',
    30.00,
    'EUR',
    'per_booking',
    TRUE,
    2
),
(
    'e1000000-0000-0000-0000-000000000003',
    'Fresh Grilled Jumbo Shrimp & Calamari Lunch Upgrade',
    'Add a sizzling platter of freshly grilled Mediterranean jumbo prawns, calamari, and seafood soup to your onboard lunch.',
    15.00,
    'EUR',
    'per_person',
    TRUE,
    3
),
(
    'e1000000-0000-0000-0000-000000000004',
    'Introductory Scuba Dive (20 Minutes Guided)',
    'Experience real underwater breathing with a certified PADI instructor. No license or prior experience required.',
    20.00,
    'EUR',
    'per_person',
    TRUE,
    4
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;


-- 5. TOURS (Seed tours)
INSERT INTO public.tours (
    id, title, slug, short_description, description, destination_id,
    duration, duration_type, duration_hours, tour_type, status, featured,
    price, child_price, infant_price, private_price, currency,
    max_guests, minimum_booking_notice_hours, pickup_available, pickup_info,
    cancellation_policy, departure_time, badge, rating, review_count, sort_order
)
VALUES
(
    't1000000-0000-0000-0000-000000000001',
    'Orange Bay Island & Snorkeling Cruise',
    'orange-bay-island-snorkeling',
    'Cruise to Giftun Island’s famous Orange Bay beach with its crystal turquoise lagoon, two guided coral reef stops, and open buffet lunch onboard.',
    'Spend a relaxing day sailing across the sheltered waters of the Red Sea to Giftun Island. Disembark at Orange Bay where wooden swings, shallow white sandbars, and shaded beanbag cabanas await. Enjoy two hours of island leisure before re-boarding for a freshly prepared buffet lunch and two distinct open-sea snorkeling sessions over living coral heads.',
    'a1000000-0000-0000-0000-000000000001',
    'Full Day (approx. 7 hours)', 'Full Day', 7.0, 'Shared', 'published', TRUE,
    35.00, 18.00, 0.00, 260.00, 'EUR',
    35, 12, TRUE, 'Complimentary hotel transfer across Hurghada included.',
    'Free cancellation up to 24 hours prior to excursion departure.', '08:30 AM', 'Popular', 4.8, 126, 1
),
(
    't1000000-0000-0000-0000-000000000002',
    'Dolphin House Yacht Cruise with Snorkeling',
    'dolphin-house-hurghada-snorkeling',
    'Sail to the renowned Sha’ab El Erg offshore lagoon to observe pods of wild spinner dolphins in their natural habitat.',
    'Sha’ab El Erg is a massive horseshoe reef that shelters pods of free-ranging spinner and bottlenose dolphins. While encountering wild sea mammals cannot be 100% guaranteed, our captains have an over 90% sighting success rate. After dolphin watching, snorkel over pristine coral drop-offs and enjoy water sports (banana boat & sofa ride) plus an open buffet lunch onboard.',
    'a1000000-0000-0000-0000-000000000001',
    'Full Day (approx. 7.5 hours)', 'Full Day', 7.5, 'Shared', 'published', TRUE,
    32.00, 16.00, 0.00, 240.00, 'EUR',
    35, 12, TRUE, 'Hotel lobby pickup and return transfer across Hurghada included.',
    'Free cancellation up to 24 hours prior to excursion departure.', '08:00 AM', 'Top Pick', 4.9, 142, 2
),
(
    't1000000-0000-0000-0000-000000000003',
    'Paradise Island Royal Cruise with Seafood Lunch',
    'paradise-island-royal-cruise',
    'A deluxe island escape to Paradise Beach featuring shaded canopy loungers, folklore show, fresh seafood lunch, and guided reef snorkeling.',
    'Paradise Island offers an upgraded Caribbean-style resort atmosphere on Giftun Island. Enjoy reserved beach seating under traditional thatched umbrellas, live oriental entertainment, and a specialized seafood and meat barbecue buffet. Two offshore snorkeling stops showcase vibrant clownfish and blue-spotted stingrays.',
    'a1000000-0000-0000-0000-000000000001',
    'Full Day (approx. 7 hours)', 'Full Day', 7.0, 'Shared', 'published', TRUE,
    42.00, 22.00, 0.00, 310.00, 'EUR',
    35, 12, TRUE, 'Hotel lobby pickup across Hurghada, El Gouna, and Makadi Bay.',
    'Free cancellation up to 24 hours prior to excursion departure.', '08:30 AM', 'Deluxe', 4.7, 98, 3
),
(
    't1000000-0000-0000-0000-000000000004',
    'Sunset Desert Safari & Quad Bike Adventure',
    'sunset-desert-safari-quad-bike',
    'Drive quad bikes through the rugged Eastern Desert mountains, visit a traditional Bedouin settlement, ride camels, and enjoy a barbecue dinner under stars.',
    'Leave the sea behind for an exhilarating desert expedition. After a thorough safety briefing, take command of an automatic quad bike across sand dunes and rocky canyons toward an authentic Bedouin village. Experience Bedouin tea, bread baking, an optional camel ride, and an oriental show with tanoura dance while the sun sets over the peaks.',
    'a1000000-0000-0000-0000-000000000001',
    'Half Day (approx. 5 hours)', 'Half Day', 5.0, 'Shared', 'published', FALSE,
    28.00, 15.00, 0.00, 180.00, 'EUR',
    30, 8, TRUE, 'Pickup from all hotel lobbies in Hurghada.',
    'Free cancellation up to 24 hours prior.', '01:30 PM', 'Adventure', 4.9, 87, 4
),
(
    't1000000-0000-0000-0000-000000000005',
    'Introductory Scuba Diving 2-Dive Yacht Trip',
    'introductory-scuba-diving-day-trip',
    'Designed specifically for beginners. Enjoy two 20-minute 1-on-1 guided dives with a licensed PADI instructor in warm shallow coral gardens.',
    'Discover the magic of breathing underwater without prior certification. A certified PADI dive instructor guides you step-by-step through basic safety before taking you hand-in-hand to a maximum depth of 7 meters. Witness giant moray eels, lionfish, and endless schools of anthias in total safety.',
    'a1000000-0000-0000-0000-000000000001',
    'Full Day (approx. 7.5 hours)', 'Full Day', 7.5, 'Shared', 'published', TRUE,
    45.00, 30.00, 0.00, 350.00, 'EUR',
    20, 12, TRUE, 'Lobby pickup and return transfer included.',
    'Free cancellation up to 24 hours prior.', '08:15 AM', 'Certified', 4.9, 114, 5
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, price = EXCLUDED.price;


-- 6. TOUR IMAGES
INSERT INTO public.tour_images (tour_id, image_url, alt_text, caption, is_primary, sort_order)
VALUES
('t1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'Orange Bay beach wooden swings and crystal lagoon', 'Orange Bay Lagoon', TRUE, 1),
('t1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1200&q=80', 'Snorkeling over colorful Red Sea corals', 'Coral Garden Stop', FALSE, 2),
('t1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80', 'Passenger yacht sailing on Red Sea', 'Cruising to Giftun Island', FALSE, 3),

('t1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1200&q=80', 'Dolphin pod swimming near Hurghada', 'Wild Dolphin Encounter', TRUE, 1),
('t1000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'Red sea reef barrier', 'Reef Snorkeling', FALSE, 2),

('t1000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', 'Paradise Island sandy beach', 'Paradise Island Beach', TRUE, 1),
('t1000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80', 'Quad bike in Egyptian desert mountains', 'Desert Quad Safari', TRUE, 1),
('t1000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80', 'Scuba diver exploring coral pillar', 'Intro Dive', TRUE, 1);


-- 7. TOUR HIGHLIGHTS
INSERT INTO public.tour_highlights (tour_id, item, sort_order)
VALUES
('t1000000-0000-0000-0000-000000000001', '2 hours on Orange Bay beach with shaded loungers and shallow turquoise water', 1),
('t1000000-0000-0000-0000-000000000001', 'Two 45-minute guided snorkeling stops at vibrant offshore reefs', 2),
('t1000000-0000-0000-0000-000000000001', 'Fresh open buffet lunch served onboard with soft drinks & bottled water', 3),
('t1000000-0000-0000-0000-000000000001', 'Complimentary snorkeling equipment and flotation jackets provided', 4),
('t1000000-0000-0000-0000-000000000001', 'Hotel lobby pickup and return across Hurghada included', 5);


-- 8. TOUR ITINERARY
INSERT INTO public.tour_itinerary (tour_id, time, title, description, sort_order)
VALUES
('t1000000-0000-0000-0000-000000000001', '08:00', 'Hotel pickup', 'Air-conditioned transfer from your resort lobby to Hurghada Marina.', 1),
('t1000000-0000-0000-0000-000000000001', '09:00', 'Departure from marina', 'Safety briefing and scenic sail across the Red Sea toward Giftun Island.', 2),
('t1000000-0000-0000-0000-000000000001', '10:00', 'First snorkeling stop', 'Guided reef snorkeling session observing parrotfish, rays, and clownfish.', 3),
('t1000000-0000-0000-0000-000000000001', '12:30', 'Lunch onboard', 'Warm buffet lunch with fish, chicken, rice, salads, and seasonal fruits.', 4),
('t1000000-0000-0000-0000-000000000001', '14:00', 'Island beach time', 'Disembark at Orange Bay for relaxation, photography, and swimming in shallow lagoons.', 5),
('t1000000-0000-0000-0000-000000000001', '16:30', 'Return to marina', 'Leisurely cruise back as afternoon sun reflects on coastal mountains.', 6),
('t1000000-0000-0000-0000-000000000001', '17:00', 'Hotel drop-off', 'Return transfer back to your hotel lobby.', 7);


-- 9. TOUR INCLUSIONS & EXCLUSIONS
INSERT INTO public.tour_inclusions (tour_id, item, sort_order)
VALUES
('t1000000-0000-0000-0000-000000000001', 'Hotel pickup and return transfer in air-conditioned vehicle', 1),
('t1000000-0000-0000-0000-000000000001', 'Full-day boat cruise on passenger yacht with sun decks', 2),
('t1000000-0000-0000-0000-000000000001', 'Snorkeling equipment (mask, snorkel, fins)', 3),
('t1000000-0000-0000-0000-000000000001', 'Orange Bay island national park admission ticket', 4),
('t1000000-0000-0000-0000-000000000001', 'Buffet lunch prepared fresh onboard', 5),
('t1000000-0000-0000-0000-000000000001', 'Unlimited soft drinks, mineral water, tea & coffee', 6);

INSERT INTO public.tour_exclusions (tour_id, item, sort_order)
VALUES
('t1000000-0000-0000-0000-000000000001', 'Personal expenses & souvenir shopping on island', 1),
('t1000000-0000-0000-0000-000000000001', 'Underwater photography package (available as optional extra)', 2),
('t1000000-0000-0000-0000-000000000001', 'Gratuities for yacht crew & dive masters', 3);


-- 10. TOUR FAQS
INSERT INTO public.tour_faqs (tour_id, question, answer, sort_order)
VALUES
('t1000000-0000-0000-0000-000000000001', 'Is snorkeling equipment provided or should I bring my own?', 'High-quality sanitized masks, snorkels, and fins in all adult and children sizes are provided onboard free of charge. You are also welcome to bring your personal gear.', 1),
('t1000000-0000-0000-0000-000000000001', 'Can non-swimmers participate safely?', 'Absolutely. Our boats carry US Coast Guard approved life jackets in all sizes. Our certified snorkeling guides accompany guests in the water with rescue rings and support floats.', 2),
('t1000000-0000-0000-0000-000000000001', 'What should we pack for the trip?', 'Please bring your hotel towel, swimwear, sunglasses, sun cream, camera or waterproof phone pouch, and a photo ID or passport copy.', 3);


-- 11. TOUR SEO METADATA
INSERT INTO public.seo_metadata (entity_type, entity_id, seo_title, meta_description, seo_keywords, canonical_url, og_title, og_description)
VALUES
(
    'tour',
    't1000000-0000-0000-0000-000000000001',
    'Orange Bay Island & Snorkeling Cruise | Hurghada Boat Trip',
    'Book direct Orange Bay island boat trip from Hurghada. 2 hours on Giftun Island beach, 2 guided snorkeling stops, fresh onboard lunch. Free cancellation.',
    ARRAY['orange bay hurghada', 'giftun island tour', 'red sea snorkeling boat trip', 'hurghada boat excursion'],
    'https://redseavoyages.com/excursions/orange-bay-island-snorkeling',
    'Orange Bay Island & Snorkeling Cruise',
    'Discover the Caribbean of Egypt with our premier direct boat cruise to Orange Bay.'
)
ON CONFLICT (entity_type, entity_id) DO UPDATE SET seo_title = EXCLUDED.seo_title;


-- 12. DEMO SEED BOOKING (For testing My Booking and Admin CMS)
INSERT INTO public.customers (id, first_name, last_name, email, phone, country, hotel)
VALUES (
    'c2000000-0000-0000-0000-000000000001',
    'Markus',
    'Weber',
    'markus.weber@outlook.de',
    '+49 170 1234567',
    'Germany',
    'Steigenberger ALDAU Beach Resort'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bookings (
    id, booking_reference, tour_id, customer_id, booking_date, status, payment_status,
    payment_method, adult_count, child_count, infant_count,
    pickup_location_id, pickup_hotel_name, pickup_room_number,
    subtotal, extras_total, discount, total, currency, special_requests
)
VALUES (
    'b2000000-0000-0000-0000-000000000001',
    'RST-2026-AB4821',
    't1000000-0000-0000-0000-000000000001',
    'c2000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '2 days',
    'confirmed',
    'pending',
    'pay_at_pickup',
    2, 1, 0,
    'p1000000-0000-0000-0000-000000000001',
    'Steigenberger ALDAU Beach Resort',
    '412',
    88.00,
    25.00,
    0.00,
    113.00,
    'EUR',
    'Please seat us on the upper sun deck. Vegetarian meal for 1 adult.'
)
ON CONFLICT (id) DO NOTHING;
