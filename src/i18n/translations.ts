import { LanguageCode } from '../types/i18n';

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Header Top Bar
    'top.licensed': 'Licensed Egyptian Tour Operator #2491/ETB',
    'top.cancellation': 'Free cancellation up to 24 hours before pickup',
    'top.pierDesk': 'Support',
    'top.language': 'Language',
    'top.currency': 'Currency',

    // Main Navigation
    'nav.allExcursions': 'Excursions',
    'nav.destinations': 'Destinations',
    'nav.experiences': 'Experiences',
    'nav.whyChooseUs': 'About Us',
    'nav.guestReviews': 'Reviews',
    'nav.findMyBooking': 'My Booking',
    'nav.explore': 'View Tours',
    'nav.bookExcursion': 'Book Now',
    'nav.brandSubtitle': 'Hurghada & Red Sea Tours',

    // Mobile Menu
    'mobile.popularTours': 'Popular Tours & Island Trips',
    'mobile.destinationsDetailed': 'Destinations (Hurghada, El Gouna, Marsa Alam)',
    'mobile.categories': 'Tour Categories',
    'mobile.safety': 'Safety & Guarantees',
    'mobile.reviews': 'Customer Reviews',
    'mobile.findBookingSubtitle': 'My Booking (View & Cancel)',
    'mobile.contactWhatsApp': 'Contact us on WhatsApp',
    'mobile.selectLanguage': 'Select Language',

    // Hero Section
    'hero.badge': 'Direct Tour Operator in Hurghada & El Gouna',
    'hero.guestsHosted': 'Over 45,000+ Guests',
    'hero.title1': 'Explore the Red Sea',
    'hero.title2': 'with Local Captains',
    'hero.subtitle':
      'Snorkeling boat trips, island visits, and desert quad safaris departing daily from Hurghada, El Gouna, and Makadi Bay. Direct local operator with hotel pickup and clear prices.',
    'hero.guarantee1': '100% Weather Refund Guarantee',
    'hero.guarantee2': 'Free 24h Prior Cancellation',
    'hero.guarantee3': 'Hotel Pickup Included',
    'hero.guarantee4': 'Licensed Local Guides',

    // Search Module
    'search.destination': 'Destination',
    'search.allDestinations': 'All Destinations',
    'search.activity': 'Experience',
    'search.allActivities': 'All Activities',
    'search.date': 'Choose your date',
    'search.guests': 'Guests',
    'search.submit': 'Find Tours',
    'search.adults': 'Adults',
    'search.children': 'Children',
    'search.ageAdult': 'Age 12+',
    'search.ageChild': 'Ages 4-11',

    // Popular Tours Section
    'popular.title': 'Popular Tours in the Red Sea',
    'popular.subtitle':
      'All tours include hotel pickup, snorkeling equipment, and required marine park fees.',
    'popular.viewAll': 'View All Tours',
    'popular.quickBook': 'Book Now',
    'popular.viewDetails': 'View Tour',
    'popular.from': 'From',
    'popular.perPerson': 'per person',
    'popular.instantConfirmation': 'Instant Confirmation',
    'popular.verified': 'Official Operator',

    // Why Choose Us
    'why.title': 'Why Book Directly With Us',
    'why.subtitle':
      'We run our own boats and vehicles with certified skippers and friendly local guides. You pay local operator prices without agency markups.',

    // Final CTA
    'cta.title': 'Ready to explore the Red Sea?',
    'cta.subtitle':
      'Book online now with free cancellation. You can choose to pay when we pick you up at your hotel.',
    'cta.browse': 'View All Tours',
    'cta.chat': 'Chat on WhatsApp',
    'cta.lookup': 'Find My Booking',

    // WhatsApp Floating Widget
    'whatsapp.concierge': 'Tour Support Desk',
    'whatsapp.online': 'Online Now · Direct WhatsApp',
    'whatsapp.replies': 'Quick reply',
    'whatsapp.greeting': 'Hello! 🌊 Have questions about tour availability, pickups, or private boat trips?',
    'whatsapp.instruction': 'Choose a topic below or send us a message directly on WhatsApp.',
    'whatsapp.quickInquiries': 'Quick Inquiries',
    'whatsapp.customQuestion': 'Your Question',
    'whatsapp.placeholder': 'e.g. Can we book 6 guests for Orange Bay this Thursday?',
    'whatsapp.openButton': 'Open in WhatsApp',
    'whatsapp.needHelp': 'Need help? Chat with us on WhatsApp',
    'whatsapp.presetAvailability': '🚤 Tour availability: Any spots tomorrow?',
    'whatsapp.presetPickup': '🚐 Hotel pickup: What is the pickup time for my hotel?',
    'whatsapp.presetPrivate': '🛥️ Private boat: Price quote for family or group',
    'whatsapp.presetBooking': '🎟️ Existing booking: Need help with my reservation',

    // Footer
    'footer.companyDesc': 'Licensed boat tour operator based in Hurghada Marina. Certified by the Egyptian Ministry of Tourism and Chamber of Diving & Watersports (CDWS).',
    'footer.destinations': 'Destinations',
    'footer.experiences': 'Experiences',
    'footer.customerCare': 'Customer Support',
    'footer.hurghadaDesk': 'Hurghada Office',
    'footer.allRights': 'All rights reserved.',
  },

  de: {
    // Header Top Bar
    'top.licensed': 'Lizenzierter ägyptischer Reiseveranstalter #2491/ETB',
    'top.cancellation': 'Kostenlose Stornierung bis 24h vor Abholung',
    'top.pierDesk': 'Support',
    'top.language': 'Sprache',
    'top.currency': 'Währung',

    // Main Navigation
    'nav.allExcursions': 'Ausflüge',
    'nav.destinations': 'Reiseziele',
    'nav.experiences': 'Erlebnisse',
    'nav.whyChooseUs': 'Über uns',
    'nav.guestReviews': 'Bewertungen',
    'nav.findMyBooking': 'Meine Buchung',
    'nav.explore': 'Touren ansehen',
    'nav.bookExcursion': 'Jetzt buchen',
    'nav.brandSubtitle': 'Hurghada & Rotes Meer Ausflüge',

    // Mobile Menu
    'mobile.popularTours': 'Beliebte Touren & Inselfahrten',
    'mobile.destinationsDetailed': 'Reiseziele (Hurghada, El Gouna, Marsa Alam)',
    'mobile.categories': 'Erlebniskategorien',
    'mobile.safety': 'Sicherheits- & Garantiestandards',
    'mobile.reviews': 'Kundenbewertungen',
    'mobile.findBookingSubtitle': 'Meine Buchung (Einsehen & Stornieren)',
    'mobile.contactWhatsApp': 'Kontaktieren Sie uns auf WhatsApp',
    'mobile.selectLanguage': 'Sprache auswählen',

    // Hero Section
    'hero.badge': 'Direkter Bootsveranstalter in Hurghada & El Gouna',
    'hero.guestsHosted': 'Über 45.000+ betreute Gäste',
    'hero.title1': 'Erkunden Sie das Rote Meer',
    'hero.title2': 'mit erfahrenen Kapitänen',
    'hero.subtitle':
      'Schnorchelausflüge, Inseltouren und Quad-Safaris mit täglicher Abfahrt von Hurghada, El Gouna und Makadi Bay. Direkter lokaler Anbieter mit Hotelabholung und fairen Preisen.',
    'hero.guarantee1': '100% Wetter-Geld-zurück-Garantie',
    'hero.guarantee2': 'Kostenlose Stornierung bis 24h',
    'hero.guarantee3': 'Hotelabholung inklusive',
    'hero.guarantee4': 'Lizenzierte lokale Guides',

    // Search Module
    'search.destination': 'Reiseziel',
    'search.allDestinations': 'Alle Reiseziele',
    'search.activity': 'Erlebnis',
    'search.allActivities': 'Alle Aktivitäten',
    'search.date': 'Datum wählen',
    'search.guests': 'Gäste',
    'search.submit': 'Ausflüge suchen',
    'search.adults': 'Erwachsene',
    'search.children': 'Kinder',
    'search.ageAdult': 'Ab 12 Jahren',
    'search.ageChild': '4-11 Jahre',

    // Popular Tours Section
    'popular.title': 'Beliebte Rote-Meer-Ausflüge',
    'popular.subtitle':
      'Alle Touren enthalten Hotelabholung, Schnorchelausrüstung und Nationalparkgebühren.',
    'popular.viewAll': 'Alle Ausflüge anzeigen',
    'popular.quickBook': 'Jetzt buchen',
    'popular.viewDetails': 'Tour ansehen',
    'popular.from': 'Ab',
    'popular.perPerson': 'pro Person',
    'popular.instantConfirmation': 'Sofortige Bestätigung',
    'popular.verified': 'Offizieller Veranstalter',

    // Why Choose Us
    'why.title': 'Warum direkt bei uns buchen?',
    'why.subtitle':
      'Wir besitzen unsere eigenen Boote und Fahrzeuge und beschäftigen erfahrene Kapitäne und Guides. Sie zahlen faire Preise ohne Vermittlergebühren.',

    // Final CTA
    'cta.title': 'Bereit für das Rote Meer?',
    'cta.subtitle':
      'Buchen Sie online mit kostenloser Stornierung. Sie können auch erst bequem bei der Abholung am Hotel bezahlen.',
    'cta.browse': 'Alle Ausflüge anzeigen',
    'cta.chat': 'Auf WhatsApp chatten',
    'cta.lookup': 'Meine Buchung finden',

    // WhatsApp Floating Widget
    'whatsapp.concierge': 'Tour-Kundenservice',
    'whatsapp.online': 'Jetzt online · Direkt WhatsApp',
    'whatsapp.replies': 'Schnelle Antwort',
    'whatsapp.greeting': 'Hallo! 🌊 Haben Sie Fragen zu Ausflügen, Abholzeiten oder privaten Bootstouren?',
    'whatsapp.instruction': 'Wählen Sie ein Thema oder schreiben Sie uns direkt per WhatsApp.',
    'whatsapp.quickInquiries': 'Schnellanfragen',
    'whatsapp.customQuestion': 'Ihre Frage',
    'whatsapp.placeholder': 'z.B. Haben Sie diesen Donnerstag freie Plätze für Orange Bay?',
    'whatsapp.openButton': 'In WhatsApp öffnen',
    'whatsapp.needHelp': 'Brauchen Sie Hilfe? Chatten Sie mit uns auf WhatsApp',
    'whatsapp.presetAvailability': '🚤 Verfügbarkeit: Gibt es morgen freie Plätze?',
    'whatsapp.presetPickup': '🚐 Hotelabholung: Wann ist die Abholzeit für mein Hotel?',
    'whatsapp.presetPrivate': '🛥️ Privates Boot: Preisangebot für Gruppe/Familie',
    'whatsapp.presetBooking': '🎟️ Bestehende Buchung: Frage zu meiner Reservierung',

    // Footer
    'footer.companyDesc': 'Offizieller Boots- und Ausflugsveranstalter in der Hurghada Marina. Zertifiziert vom ägyptischen Tourismusministerium und der CDWS.',
    'footer.destinations': 'Reiseziele',
    'footer.experiences': 'Erlebnisse',
    'footer.customerCare': 'Kundenservice',
    'footer.hurghadaDesk': 'Büro Hurghada',
    'footer.allRights': 'Alle Rechte vorbehalten.',
  },

  ru: {
    // Header Top Bar
    'top.licensed': 'Лицензированный туроператор Египта #2491/ETB',
    'top.cancellation': 'Бесплатная отмена за 24 ч до трансфера',
    'top.pierDesk': 'Поддержка',
    'top.language': 'Язык',
    'top.currency': 'Валюта',

    // Main Navigation
    'nav.allExcursions': 'Экскурсии',
    'nav.destinations': 'Направления',
    'nav.experiences': 'Впечатления',
    'nav.whyChooseUs': 'О нас',
    'nav.guestReviews': 'Отзывы',
    'nav.findMyBooking': 'Мое бронирование',
    'nav.explore': 'Смотреть туры',
    'nav.bookExcursion': 'Забронировать',
    'nav.brandSubtitle': 'Экскурсии в Хургаде и на Красном море',

    // Mobile Menu
    'mobile.popularTours': 'Популярные экскурсии и острова',
    'mobile.destinationsDetailed': 'Направления (Хургада, Эль-Гуна, Марса-Алам)',
    'mobile.categories': 'Категории экскурсий',
    'mobile.safety': 'Стандарты безопасности и гарантии',
    'mobile.reviews': 'Отзывы гостей',
    'mobile.findBookingSubtitle': 'Мое бронирование (просмотр и отмена)',
    'mobile.contactWhatsApp': 'Написать нам в WhatsApp',
    'mobile.selectLanguage': 'Выберите язык',

    // Hero Section
    'hero.badge': 'Прямой оператор в Хургаде и Эль-Гуне',
    'hero.guestsHosted': 'Более 45 000+ гостей',
    'hero.title1': 'Откройте Красное море',
    'hero.title2': 'с местными капитанами',
    'hero.subtitle':
      'Морские прогулки, сноркелинг на рифах и сафари на квадроциклах ежедневно из Хургады, Эль-Гуны и Макади-Бей. Прямой организатор, трансфер из отеля и честные цены без посредников.',
    'hero.guarantee1': '100% возврат при плохой погоде',
    'hero.guarantee2': 'Бесплатная отмена за 24 часа',
    'hero.guarantee3': 'Трансфер из отеля включен',
    'hero.guarantee4': 'Лицензированные гиды',

    // Search Module
    'search.destination': 'Направление',
    'search.allDestinations': 'Все направления',
    'search.activity': 'Впечатление',
    'search.allActivities': 'Все активности',
    'search.date': 'Выберите дату',
    'search.guests': 'Гости',
    'search.submit': 'Найти экскурсии',
    'search.adults': 'Взрослые',
    'search.children': 'Дети',
    'search.ageAdult': 'От 12 лет',
    'search.ageChild': '4-11 лет',

    // Popular Tours Section
    'popular.title': 'Популярные экскурсии на Красном море',
    'popular.subtitle':
      'Все экскурсии включают трансфер от отеля, снаряжение для сноркелинга и сборы заповедников.',
    'popular.viewAll': 'Смотреть все экскурсии',
    'popular.quickBook': 'Забронировать',
    'popular.viewDetails': 'Смотреть тур',
    'popular.from': 'От',
    'popular.perPerson': 'за человека',
    'popular.instantConfirmation': 'Мгновенное подтверждение',
    'popular.verified': 'Официальный оператор',

    // Why Choose Us
    'why.title': 'Почему выгодно бронировать напрямую',
    'why.subtitle':
      'У нас собственные комфортабельные катера, надежные квадроциклы и опытные капитаны. Вы получаете честную цену без переплат агентствам.',

    // Final CTA
    'cta.title': 'Готовы отправиться на экскурсию?',
    'cta.subtitle':
      'Бронируйте онлайн с бесплатной отменой. Вы можете оплатить тур наличными при посадке в трансфер у отеля.',
    'cta.browse': 'Смотреть все экскурсии',
    'cta.chat': 'Чат в WhatsApp',
    'cta.lookup': 'Мое бронирование',

    // WhatsApp Floating Widget
    'whatsapp.concierge': 'Служба поддержки туров',
    'whatsapp.online': 'В сети · Прямой WhatsApp',
    'whatsapp.replies': 'Быстрый ответ',
    'whatsapp.greeting': 'Здравствуйте! 🌊 Есть вопросы по наличию мест, трансферу или аренде катера?',
    'whatsapp.instruction': 'Выберите тему ниже или напишите нам прямо в WhatsApp.',
    'whatsapp.quickInquiries': 'Быстрые вопросы',
    'whatsapp.customQuestion': 'Ваш вопрос',
    'whatsapp.placeholder': 'Например: есть ли места на Оранж Бэй в этот четверг?',
    'whatsapp.openButton': 'Открыть в WhatsApp',
    'whatsapp.needHelp': 'Нужна помощь? Напишите нам в WhatsApp',
    'whatsapp.presetAvailability': '🚤 Наличие мест: есть ли места на завтра?',
    'whatsapp.presetPickup': '🚐 Трансфер: во сколько выезд из моего отеля?',
    'whatsapp.presetPrivate': '🛥️ Аренда катера: расчет для семьи или компании',
    'whatsapp.presetBooking': '🎟️ Моя бронь: помощь по текущему заказу',

    // Footer
    'footer.companyDesc': 'Официальный организатор морских экскурсий в марине Хургады. Лицензирован Министерством туризма Египта и Палатой дайвинга (CDWS).',
    'footer.destinations': 'Направления',
    'footer.experiences': 'Впечатления',
    'footer.customerCare': 'Служба поддержки',
    'footer.hurghadaDesk': 'Офис в Хургаде',
    'footer.allRights': 'Все права защищены.',
  },
};
