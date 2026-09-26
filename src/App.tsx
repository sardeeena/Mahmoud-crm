import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { WhatsAppFloatingButton } from './components/common/WhatsAppFloatingButton';
import { WishlistDrawer } from './components/common/WishlistDrawer';
import { CompareModal } from './components/common/CompareModal';
import { CompareFloatingBar } from './components/common/CompareFloatingBar';
import { Hero } from './components/home/Hero';
import { PopularTours } from './components/home/PopularTours';
import { ExperienceCategories } from './components/home/ExperienceCategories';
import { DestinationsSection } from './components/home/DestinationsSection';
import { WhyChooseUs } from './components/home/WhyChooseUs';
import { ReviewsSection } from './components/home/ReviewsSection';
import { FinalCTA } from './components/home/FinalCTA';
import { NotFoundPage } from './components/common/NotFoundPage';
import { ExcursionsPage } from './pages/ExcursionsPage';
import { TourDetailPage } from './pages/TourDetailPage';
import { BookingPage } from './pages/BookingPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { MyBookingPage } from './pages/MyBookingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AccountPage } from './pages/AccountPage';
import { ALL_TOURS, CURRENCY_CONFIGS } from './data/toursData';
import { Tour, CurrencyConfig } from './types';
import { Booking } from './types/booking';
import { bookingRepository } from './services/bookingRepository';
import { saveBookingDraft, loadBookingDraft } from './services/draftStorage';
import { getPublishedTours, getTourBySlug } from './services/tourService';
import { seoService } from './services/seoService';
import { TourDetailSkeleton } from './components/tours/TourDetailSkeleton';
import { Compass } from 'lucide-react';

// Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ComparisonProvider } from './contexts/ComparisonContext';

// Admin CMS Components
import { AdminLayout, AdminTab } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminTourList } from './components/admin/AdminTourList';
import { AdminTourEditor } from './components/admin/AdminTourEditor';
import { AdminBookingsList } from './components/admin/AdminBookingsList';
import { AdminDestinationsList } from './components/admin/AdminDestinationsList';
import { AdminCategoriesList } from './components/admin/AdminCategoriesList';
import { AdminPickupList } from './components/admin/AdminPickupList';
import { AdminExtrasList } from './components/admin/AdminExtrasList';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminLoginPage } from './components/admin/AdminLoginPage';

function MainApp() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyConfig>(CURRENCY_CONFIGS.EUR);

  // Live published tours loaded dynamically from Supabase
  const [liveTours, setLiveTours] = useState<Tour[]>(ALL_TOURS);
  const [loadingTours, setLoadingTours] = useState<boolean>(true);

  // Drawer / Modal states
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // Client-side router path & search query
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    return new URLSearchParams(window.location.search);
  });

  // Active confirmed booking object for immediate view
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Search & Filter state passed from homepage search
  const [initialSearchFilter, setInitialSearchFilter] = useState<{
    destination: string;
    category: string;
  }>({
    destination: 'All',
    category: 'All',
  });

  // Load tours from Supabase on mount
  const refreshPublishedTours = useCallback(async () => {
    setLoadingTours(true);
    try {
      const data = await getPublishedTours();
      if (data && data.length > 0) {
        setLiveTours(data);
      }
    } catch (err) {
      console.warn('Failed to load published tours from Supabase:', err);
    } finally {
      setLoadingTours(false);
    }
  }, []);

  useEffect(() => {
    refreshPublishedTours();
  }, [refreshPublishedTours]);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Central Navigation function
  const navigate = (path: string, param?: string) => {
    let fullPath = path;

    if (path === 'home') {
      fullPath = '/';
    } else if (path === 'excursions') {
      fullPath = '/excursions';
    } else if (path === 'tour-detail' && param) {
      fullPath = `/excursions/${param}`;
    } else if (path === 'booking') {
      fullPath = param ? `/booking?tour=${param}` : '/booking';
    } else if (path === 'confirmation' && param) {
      fullPath = `/booking/confirmation/${param}`;
    } else if (path === 'my-booking') {
      fullPath = param ? `/my-booking/${param}` : '/my-booking';
    } else if (path === 'admin') {
      fullPath = param ? `/admin/${param}` : '/admin';
    } else if (path === 'admin_login') {
      fullPath = '/admin/login';
    } else if (path === 'login') {
      fullPath = param ? `/login${param.startsWith('?') ? param : `?redirect=${param}`}` : '/login';
    } else if (path === 'register') {
      fullPath = param ? `/register${param.startsWith('?') ? param : `?redirect=${param}`}` : '/register';
    } else if (path === 'reset-password' || path === 'forgot-password') {
      fullPath = '/reset-password';
    } else if (path === 'account' || path === 'profile') {
      fullPath = '/account';
    }

    if (window.location.pathname + window.location.search !== fullPath) {
      window.history.pushState({}, '', fullPath);
    }

    const [pathname, searchStr] = fullPath.split('?');
    setCurrentPath(pathname || '/');
    setSearchParams(new URLSearchParams(searchStr || ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resolve booking reference if on confirmation page
  const confirmationReference = useMemo(() => {
    if (currentPath.startsWith('/booking/confirmation/')) {
      return currentPath.replace('/booking/confirmation/', '').replace(/\/$/, '');
    }
    return null;
  }, [currentPath]);

  // Resolve reference if on my-booking page
  const myBookingReference = useMemo(() => {
    if (currentPath.startsWith('/my-booking/')) {
      return currentPath.replace('/my-booking/', '').replace(/\/$/, '');
    }
    return searchParams.get('ref') || undefined;
  }, [currentPath, searchParams]);

  // Resolve tour slug if on tour-details page
  const tourDetailSlug = useMemo(() => {
    if (currentPath.startsWith('/excursions/')) {
      return currentPath.replace('/excursions/', '').replace(/\/$/, '');
    }
    return null;
  }, [currentPath]);

  // Resolve tour slug if on booking page
  const bookingTourSlug = useMemo(() => {
    if (currentPath.startsWith('/booking/')) {
      const slug = currentPath.replace('/booking/', '').replace(/\/$/, '');
      if (slug && slug !== 'confirmation') return slug;
    }
    return searchParams.get('tour') || undefined;
  }, [currentPath, searchParams]);

  // Asynchronously retrieve confirmed booking if loading direct confirmation URL
  useEffect(() => {
    if (confirmationReference && (!confirmedBooking || confirmedBooking.bookingReference !== confirmationReference)) {
      bookingRepository.getBooking(confirmationReference).then((found) => {
        if (found) {
          setConfirmedBooking(found);
        }
      });
    }
  }, [confirmationReference, confirmedBooking]);

  // Dynamic Tour for TourDetailPage (fetched from Supabase or fallback)
  const [currentTourDetail, setCurrentTourDetail] = useState<Tour | null>(null);

  useEffect(() => {
    if (!tourDetailSlug) {
      setCurrentTourDetail(null);
      return;
    }

    // Check in-memory list first
    const quickFind = liveTours.find((t) => t.slug === tourDetailSlug);
    if (quickFind) {
      setCurrentTourDetail(quickFind);
    }

    // Always fetch latest relational details from Supabase (or allow preview if admin)
    getTourBySlug(tourDetailSlug, isAdmin).then((fullTour) => {
      if (fullTour) {
        setCurrentTourDetail(fullTour);
      }
    });
  }, [tourDetailSlug, liveTours, isAdmin]);

  // Synchronize document title, OpenGraph tags, and Schema.org for non-catalog pages
  useEffect(() => {
    if (currentPath.startsWith('/admin')) {
      seoService.apply({
        title: 'Staff & Admin CMS | Red Sea Voyages',
        description: 'Administrative portal for tour management, booking verification, and fleet operations.',
      });
    } else if (currentPath.startsWith('/booking/confirmation')) {
      seoService.apply({
        title: confirmationReference
          ? `Booking Confirmed (${confirmationReference}) | Red Sea Excursions`
          : 'Booking Confirmation | Red Sea Excursions',
        description: 'Your Red Sea excursion booking voucher and confirmed hotel pickup transfer itinerary.',
      });
    } else if (currentPath.startsWith('/booking')) {
      seoService.apply({
        title: 'Book Your Excursion | Red Sea Excursions',
        description: 'Direct vessel reservation with free cancellation, hotel pickup, and pay on pickup options.',
      });
    } else if (currentPath.startsWith('/my-booking')) {
      seoService.apply({
        title: 'Find & Manage My Booking | Red Sea Excursions',
        description: 'View your excursion booking details, print your official voucher, or request a free date change.',
      });
    } else if (currentPath === '/login') {
      seoService.apply({
        title: 'Sign In | Red Sea Excursions & Voyages',
        description: 'Sign in to access your excursion bookings, voucher downloads, and saved journeys.',
      });
    } else if (currentPath === '/register') {
      seoService.apply({
        title: 'Create Account | Red Sea Excursions & Voyages',
        description: 'Create a voyager account for 1-click booking, digital vouchers, and priority pier departure updates.',
      });
    } else if (currentPath === '/reset-password' || currentPath === '/forgot-password') {
      seoService.apply({
        title: 'Reset Password | Red Sea Excursions',
        description: 'Recover or update your Red Sea Excursions account credentials.',
      });
    } else if (currentPath === '/account' || currentPath === '/profile') {
      seoService.apply({
        title: 'My Profile & Reservations | Red Sea Excursions',
        description: 'Manage your contact details, active excursions, and voucher tickets.',
      });
    } else if (currentPath === '/') {
      seoService.apply(seoService.generateDefaultSeo());
    }
  }, [currentPath, confirmationReference]);

  // Handlers from Homepage
  const handleHeroSearch = (filters: { destination: string; category: string; date: string; guests: number }) => {
    setInitialSearchFilter({
      destination: filters.destination === 'All Destinations' ? 'All' : filters.destination,
      category: filters.category === 'All Activities' ? 'All' : filters.category,
    });
    navigate('/excursions');
  };

  const handleSelectHomeCategory = (categoryName: string) => {
    setInitialSearchFilter({
      destination: 'All',
      category: categoryName,
    });
    navigate('/excursions');
  };

  const handleSelectHomeDestination = (destName: string) => {
    setInitialSearchFilter({
      destination: destName,
      category: 'All',
    });
    navigate('/excursions');
  };

  const handleViewTour = (tour: Tour) => {
    navigate(`/excursions/${tour.slug}`);
  };

  const handleStartBooking = (tour: Tour) => {
    navigate(`/booking?tour=${tour.slug}`);
  };

  const handleBookFromPanel = (bookingState: {
    tour: Tour;
    date: string;
    adults: number;
    children: number;
    pickupLocation: string;
    selectedExtras: string[];
    totalEur: number;
  }) => {
    const existing = loadBookingDraft(bookingState.tour.slug);
    saveBookingDraft({
      ...existing,
      tourSlug: bookingState.tour.slug,
      date: bookingState.date,
      guests: {
        adults: bookingState.adults,
        children: bookingState.children,
        infants: 0,
      },
      selectedExtraIds: bookingState.selectedExtras,
      currentStep: 2,
    });

    navigate(`/booking?tour=${bookingState.tour.slug}`);
  };

  const handleBookingSuccess = (newBooking: Booking) => {
    setConfirmedBooking(newBooking);
    navigate(`/booking/confirmation/${newBooking.bookingReference}`);
  };

  const handleNavigateSection = (sectionId: string) => {
    if (currentPath !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ==============================================================================
  // ADMIN CMS ROUTE PARSER
  // ==============================================================================
  const isAdminRoute = currentPath.startsWith('/admin');

  const adminSubRoute = useMemo(() => {
    if (!isAdminRoute) return null;
    const clean = currentPath.replace(/^\/admin/, '').replace(/^\//, '');
    const parts = clean.split('/');
    const main = parts[0] || 'dashboard';
    const sub = parts[1];
    const action = parts[2];
    return { main, sub, action, full: clean };
  }, [isAdminRoute, currentPath]);

  // Admin Tab Navigation
  const handleAdminSelectTab = (tab: AdminTab, param?: string) => {
    if (tab === 'dashboard') {
      navigate('/admin');
    } else if (tab === 'tour_new') {
      navigate('/admin/tours/new');
    } else if (tab === 'tour_edit' && param) {
      navigate(`/admin/tours/${param}/edit`);
    } else {
      navigate(`/admin/${tab}`);
    }
  };

  // If loading user auth state on initial visit to /admin
  if (isAdminRoute && authLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 text-stone-300">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Verifying administrator session...</p>
        </div>
      </div>
    );
  }

  // 1. Admin Login View: /admin/login
  if (currentPath === '/admin/login') {
    const redirectParam = searchParams.get('redirect') || '/admin';
    return (
      <AdminLoginPage
        redirectUrl={redirectParam}
        onSuccess={(target) => navigate(target || '/admin')}
        onBackToSite={() => navigate('/')}
      />
    );
  }

  // 2. Admin Protected Area: /admin/*
  if (isAdminRoute) {
    if (!isAdmin) {
      return (
        <AdminLoginPage
          redirectUrl={currentPath}
          onSuccess={(target) => navigate(target || '/admin')}
          onBackToSite={() => navigate('/')}
        />
      );
    }

    let activeAdminTab: AdminTab = 'dashboard';
    let editTourId: string | undefined = undefined;

    if (adminSubRoute?.main === 'tours') {
      if (adminSubRoute.sub === 'new') {
        activeAdminTab = 'tour_new';
      } else if (adminSubRoute.sub && adminSubRoute.action === 'edit') {
        activeAdminTab = 'tour_edit';
        editTourId = adminSubRoute.sub;
      } else {
        activeAdminTab = 'tours';
      }
    } else if (
      adminSubRoute?.main &&
      ['bookings', 'customers', 'destinations', 'categories', 'availability', 'extras', 'pickup', 'reviews', 'media', 'seo', 'settings'].includes(
        adminSubRoute.main
      )
    ) {
      activeAdminTab = adminSubRoute.main as AdminTab;
    }

    return (
      <AdminLayout
        activeTab={activeAdminTab}
        onSelectTab={handleAdminSelectTab}
        onNavigateSite={() => navigate('/')}
      >
        {activeAdminTab === 'dashboard' && (
          <AdminDashboard
            onNavigateTab={handleAdminSelectTab}
            onPreviewTour={(slug) => navigate(`/excursions/${slug}`)}
          />
        )}

        {activeAdminTab === 'tours' && (
          <AdminTourList
            onNavigateTab={handleAdminSelectTab}
            onPreviewTour={(slug) => navigate(`/excursions/${slug}`)}
          />
        )}

        {activeAdminTab === 'tour_new' && (
          <AdminTourEditor
            onNavigateTab={handleAdminSelectTab}
            onPreviewTour={(slug) => navigate(`/excursions/${slug}`)}
          />
        )}

        {activeAdminTab === 'tour_edit' && (
          <AdminTourEditor
            tourId={editTourId}
            onNavigateTab={handleAdminSelectTab}
            onPreviewTour={(slug) => navigate(`/excursions/${slug}`)}
          />
        )}

        {activeAdminTab === 'bookings' && <AdminBookingsList />}

        {activeAdminTab === 'customers' && <AdminBookingsList />}

        {activeAdminTab === 'destinations' && <AdminDestinationsList />}

        {activeAdminTab === 'categories' && <AdminCategoriesList />}

        {activeAdminTab === 'pickup' && <AdminPickupList />}

        {activeAdminTab === 'extras' && <AdminExtrasList />}

        {activeAdminTab === 'availability' && <AdminTourList onNavigateTab={handleAdminSelectTab} onPreviewTour={(slug) => navigate(`/excursions/${slug}`)} />}

        {activeAdminTab === 'media' && <AdminTourEditor onNavigateTab={handleAdminSelectTab} onPreviewTour={(slug) => navigate(`/excursions/${slug}`)} />}

        {activeAdminTab === 'seo' && <AdminTourEditor onNavigateTab={handleAdminSelectTab} onPreviewTour={(slug) => navigate(`/excursions/${slug}`)} />}

        {activeAdminTab === 'settings' && <AdminSettings />}
      </AdminLayout>
    );
  }

  // ==============================================================================
  // PUBLIC WEBSITE VIEWS
  // ==============================================================================
  const renderCurrentView = () => {
    // Auth: Login Page
    if (currentPath === '/login') {
      const redirectParam = searchParams.get('redirect') || undefined;
      return (
        <LoginPage
          redirectUrl={redirectParam}
          onNavigate={(page, param) => navigate(page, param)}
        />
      );
    }

    // Auth: Register Page
    if (currentPath === '/register') {
      const redirectParam = searchParams.get('redirect') || undefined;
      return (
        <RegisterPage
          redirectUrl={redirectParam}
          onNavigate={(page, param) => navigate(page, param)}
        />
      );
    }

    // Auth: Reset Password Page
    if (currentPath === '/reset-password' || currentPath === '/forgot-password') {
      return (
        <ResetPasswordPage
          onNavigate={(page, param) => navigate(page, param)}
        />
      );
    }

    // Account & Profile Portal
    if (currentPath === '/account' || currentPath === '/profile') {
      return (
        <AccountPage
          currency={currentCurrency}
          onNavigate={(page, param) => navigate(page, param)}
          onOpenWishlist={() => setIsWishlistOpen(true)}
        />
      );
    }

    // 1. Confirmation Screen: /booking/confirmation/:bookingReference
    if (confirmationReference) {
      if (confirmedBooking) {
        return (
          <BookingConfirmationPage
            booking={confirmedBooking}
            currency={currentCurrency}
            onNavigate={(page, param) => navigate(page, param)}
          />
        );
      }

      return (
        <div className="min-h-screen bg-[#FAF8F5] py-20 px-4 text-center">
          <div className="w-8 h-8 border-2 border-[#0A6C74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <h2 className="font-display text-lg font-bold text-stone-900">Loading Voucher Details...</h2>
          <p className="text-xs text-stone-500 mt-1">Retrieving reference: {confirmationReference}</p>
        </div>
      );
    }

    // 2. Booking Multi-Step Experience: /booking or /booking?tour=:slug
    if (currentPath.startsWith('/booking')) {
      return (
        <BookingPage
          tours={liveTours}
          initialTourSlug={bookingTourSlug}
          currency={currentCurrency}
          onBookingSuccess={handleBookingSuccess}
          onNavigate={(page, param) => navigate(page, param)}
        />
      );
    }

    // 3. Customer Portal: /my-booking or /my-booking/:bookingReference
    if (currentPath.startsWith('/my-booking')) {
      return (
        <MyBookingPage
          initialReference={myBookingReference}
          currency={currentCurrency}
          onNavigate={(page, param) => navigate(page, param)}
        />
      );
    }

    // 4. Tour Detail Page: /excursions/:slug
    if (tourDetailSlug) {
      if (currentTourDetail) {
        return (
          <TourDetailPage
            tour={currentTourDetail}
            allTours={liveTours}
            currency={currentCurrency}
            onNavigateHome={() => navigate('/')}
            onNavigateExcursions={() => navigate('/excursions')}
            onViewTour={handleViewTour}
            onBookTour={handleBookFromPanel}
            onDirectBookNow={handleStartBooking}
          />
        );
      }

      if (!loadingTours) {
        return (
          <div className="min-h-[60vh] max-w-xl mx-auto px-4 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-stone-100 text-[#0A6C74] flex items-center justify-center mx-auto mb-4 border border-stone-200">
              <Compass className="w-7 h-7" />
            </div>
            <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">Excursion Not Found</h2>
            <p className="text-xs sm:text-sm text-stone-600 mb-6">
              The excursion "{tourDetailSlug}" could not be located in our fleet schedule. It may have been updated or concluded for the season.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/excursions')}
                className="px-5 py-2.5 bg-[#0A6C74] hover:bg-[#08565C] text-white text-xs font-semibold rounded-full transition-colors cursor-pointer"
              >
                Browse All Excursions
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-full transition-colors cursor-pointer"
              >
                Return Home
              </button>
            </div>
          </div>
        );
      }

      return <TourDetailSkeleton />;
    }

    // 5. Excursions Discovery Page: /excursions
    if (currentPath === '/excursions') {
      return (
        <ExcursionsPage
          currency={currentCurrency}
          tours={liveTours}
          isLoading={loadingTours}
          initialDestination={initialSearchFilter.destination}
          initialCategory={initialSearchFilter.category}
          onNavigateHome={() => navigate('/')}
          onViewTour={handleViewTour}
          onBookTour={handleStartBooking}
        />
      );
    }

    // 6. Homepage: /
    if (currentPath === '/') {
      return (
        <main className="flex-1">
          {/* Hero Section */}
          <Hero
            onSearch={handleHeroSearch}
            resultCount={liveTours.length}
          />

          {/* Popular Tours Section with Skeleton Loading */}
          <PopularTours
            tours={liveTours.slice(0, 8)}
            currency={currentCurrency}
            isLoading={loadingTours}
            onSelectTour={handleViewTour}
            onQuickBook={handleStartBooking}
            onViewAllExcursions={() => navigate('/excursions')}
          />

          {/* Experience Categories */}
          <ExperienceCategories
            onSelectCategory={handleSelectHomeCategory}
          />

          {/* Why Choose Us */}
          <WhyChooseUs />

          {/* Destinations */}
          <DestinationsSection
            onSelectDestination={handleSelectHomeDestination}
          />

          {/* Reviews */}
          <ReviewsSection />

          {/* Final CTA */}
          <FinalCTA
            onExploreTours={() => navigate('/excursions')}
            onOpenMyBooking={() => navigate('/my-booking')}
          />
        </main>
      );
    }

    // 7. Unknown / Unmatched Route -> 404 Not Found Page
    return (
      <NotFoundPage
        popularTours={liveTours}
        currency={currentCurrency}
        onNavigateHome={() => navigate('/')}
        onNavigateExcursions={() => navigate('/excursions')}
        onSelectTour={handleViewTour}
        onOpenMyBooking={() => navigate('/my-booking')}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#111A24]">
      {/* Global Header */}
      <Header
        currentCurrency={currentCurrency}
        onCurrencyChange={setCurrentCurrency}
        onOpenMyBooking={() => navigate('/my-booking')}
        onNavigateHome={() => navigate('/')}
        onNavigateExcursions={() => navigate('/excursions')}
        onNavigateBooking={() => navigate('/booking')}
        onNavigateLogin={() => navigate('/login')}
        onNavigateRegister={() => navigate('/register')}
        onNavigateAccount={() => navigate('/account')}
        onNavigateAdmin={() => navigate('/admin')}
        onNavigateSection={handleNavigateSection}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
      />

      {/* Main View Flow with Smooth Page Entrance */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPath}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-1 flex flex-col"
        >
          {renderCurrentView()}
        </motion.div>
      </AnimatePresence>

      {/* Global Commercial Footer */}
      <Footer
        onSelectDestination={(dest) => {
          setInitialSearchFilter({ destination: dest, category: 'All' });
          navigate('/excursions');
        }}
        onSelectCategory={(cat) => {
          setInitialSearchFilter({ destination: 'All', category: cat });
          navigate('/excursions');
        }}
        onOpenMyBooking={() => navigate('/my-booking')}
        onOpenLogin={() => navigate('/login')}
        onOpenRegister={() => navigate('/register')}
        onOpenResetPassword={() => navigate('/reset-password')}
        onOpenAdmin={() => navigate('/admin')}
      />

      {/* Floating WhatsApp Quick Inquiries Widget */}
      <WhatsAppFloatingButton currentPath={currentPath} />

      {/* Slide-over Saved Excursions (Wishlist) Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        allTours={liveTours}
        currency={currentCurrency}
        onSelectTour={handleViewTour}
        onBookTour={handleStartBooking}
      />

      {/* Side-by-Side Excursions Comparison Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        allTours={liveTours}
        currency={currentCurrency}
        onSelectTour={handleViewTour}
        onBookTour={handleStartBooking}
      />

      {/* Floating Comparison Sticky Trigger Bar */}
      {!isAdminRoute && (
        <CompareFloatingBar
          allTours={liveTours}
          onOpenCompareModal={() => setIsCompareOpen(true)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <WishlistProvider>
          <ComparisonProvider>
            <AuthProvider>
              <MainApp />
            </AuthProvider>
          </ComparisonProvider>
        </WishlistProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
