import React, { useState, useEffect, useMemo } from 'react';
import { Tour, CurrencyConfig } from '../types';
import { GuestCounts, PickupLocation, BookingExtra, CustomerInfo, Booking } from '../types/booking';
import { DEMO_PICKUP_LOCATIONS, GLOBAL_BOOKING_EXTRAS } from '../data/bookingData';
import { calculateBookingPrice } from '../services/pricingService';
import { bookingRepository, generateBookingReference } from '../services/bookingRepository';
import { notificationService } from '../services/notificationService';
import { loadBookingDraft, saveBookingDraft, clearBookingDraft, BookingDraftState } from '../services/draftStorage';
import { BookingSummary } from '../components/booking/BookingSummary';
import { StepDateGuests } from '../components/booking/StepDateGuests';
import { StepPickup } from '../components/booking/StepPickup';
import { StepExtras } from '../components/booking/StepExtras';
import { StepCustomerInfo } from '../components/booking/StepCustomerInfo';
import { StepReview } from '../components/booking/StepReview';
import { StepPayment } from '../components/booking/StepPayment';
import { 
  Calendar, 
  MapPin, 
  Sparkles, 
  User, 
  CheckSquare, 
  Lock, 
  Check, 
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface BookingPageProps {
  tours: Tour[];
  initialTourSlug?: string;
  currency: CurrencyConfig;
  onBookingSuccess: (booking: Booking) => void;
  onNavigate: (page: string, param?: string) => void;
}

const STEPS = [
  { id: 1, label: 'Date & Guests', icon: Calendar },
  { id: 2, label: 'Pickup', icon: MapPin },
  { id: 3, label: 'Extras', icon: Sparkles },
  { id: 4, label: 'Guest Details', icon: User },
  { id: 5, label: 'Review', icon: CheckSquare },
  { id: 6, label: 'Payment', icon: Lock },
];

export const BookingPage: React.FC<BookingPageProps> = ({
  tours,
  initialTourSlug,
  currency,
  onBookingSuccess,
  onNavigate,
}) => {
  // Find current tour or fallback
  const [selectedTourSlug, setSelectedTourSlug] = useState<string>(
    initialTourSlug || (tours.length > 0 ? tours[0].slug : '')
  );

  const currentTour = useMemo(() => {
    return (
      tours.find((t) => t.slug === selectedTourSlug) ||
      tours.find((t) => t.id === selectedTourSlug) ||
      tours[0]
    );
  }, [tours, selectedTourSlug]);

  // Load persisted draft
  const initialDraft = useMemo(() => {
    return loadBookingDraft(currentTour?.slug);
  }, [currentTour?.slug]);

  const [currentStep, setCurrentStep] = useState<number>(initialDraft.currentStep || 1);
  const [date, setDate] = useState<string>(initialDraft.date || '');
  const [guests, setGuests] = useState<GuestCounts>(initialDraft.guests);
  const [pickupLocationId, setPickupLocationId] = useState<string>(initialDraft.pickupLocationId || 'hurghada');
  const [hotelName, setHotelName] = useState<string>(initialDraft.hotelName || '');
  const [roomNumber, setRoomNumber] = useState<string>(initialDraft.roomNumber || '');
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>(initialDraft.selectedExtraIds || []);
  const [customer, setCustomer] = useState<CustomerInfo>(initialDraft.customer);
  const [paymentMethod, setPaymentMethod] = useState<'pay_at_pickup' | 'pay_online'>(initialDraft.paymentMethod || 'pay_at_pickup');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(initialDraft.termsAccepted || false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState<boolean>(false);

  // Synchronize draft to sessionStorage
  useEffect(() => {
    if (!currentTour) return;
    const draft: BookingDraftState = {
      tourSlug: currentTour.slug,
      currentStep,
      date,
      guests,
      pickupLocationId,
      hotelName,
      roomNumber,
      selectedExtraIds,
      customer,
      paymentMethod,
      termsAccepted,
    };
    saveBookingDraft(draft);
  }, [
    currentTour,
    currentStep,
    date,
    guests,
    pickupLocationId,
    hotelName,
    roomNumber,
    selectedExtraIds,
    customer,
    paymentMethod,
    termsAccepted,
  ]);

  // Selected pickup object
  const selectedPickup = useMemo(() => {
    return DEMO_PICKUP_LOCATIONS.find((p) => p.id === pickupLocationId) || DEMO_PICKUP_LOCATIONS[0];
  }, [pickupLocationId]);

  // Selected extras objects
  const selectedExtras = useMemo(() => {
    return GLOBAL_BOOKING_EXTRAS.filter((e) => selectedExtraIds.includes(e.id));
  }, [selectedExtraIds]);

  // Pricing calculation via dedicated engine
  const pricing = useMemo(() => {
    if (!currentTour) {
      return {
        basePricePerAdultEur: 0,
        basePricePerChildEur: 0,
        adultSubtotalEur: 0,
        childSubtotalEur: 0,
        infantSubtotalEur: 0,
        pickupSubtotalEur: 0,
        pickupFeePerPersonEur: 0,
        extrasSubtotalEur: 0,
        extrasBreakdown: [],
        discountEur: 0,
        subtotalEur: 0,
        totalEur: 0,
        formattedTotal: '€0.00',
        formattedSubtotal: '€0.00',
      };
    }

    return calculateBookingPrice({
      tour: currentTour,
      guests,
      pickupLocation: selectedPickup,
      selectedExtras: selectedExtras.map((ex) => ({ extra: ex, quantity: 1 })),
      currency,
    });
  }, [currentTour, guests, selectedPickup, selectedExtras, currency]);

  // Scroll to top upon step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  if (!currentTour) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-20 px-4 text-center">
        <h2 className="font-display text-xl font-bold text-stone-900">No Excursion Found</h2>
        <p className="text-xs text-stone-600 mt-2">Please select an excursion to begin your booking.</p>
        <button
          onClick={() => onNavigate('excursions')}
          className="mt-4 px-6 py-2.5 bg-[#0A6C74] text-white text-xs font-semibold rounded"
        >
          View All Excursions
        </button>
      </div>
    );
  }

  // Toggle extra helper
  const handleToggleExtra = (extraId: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]
    );
  };

  // Submit and Create Booking
  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const bookingReference = generateBookingReference();
      const newBooking: Booking = {
        bookingId: `b-${Date.now()}`,
        bookingReference,
        tourId: currentTour.id,
        tourSlug: currentTour.slug,
        tourTitle: currentTour.title,
        tourImage: currentTour.primaryImage,
        tourDestination: currentTour.destination,
        tourDuration: currentTour.durationLabel,
        date,
        guests,
        pickup: {
          locationId: selectedPickup.id,
          locationName: selectedPickup.name,
          area: selectedPickup.area,
          feeEur: pricing.pickupSubtotalEur,
          hotelName: hotelName || customer.hotelName,
          roomNumber: roomNumber || customer.roomNumber,
        },
        extras: pricing.extrasBreakdown.map((ex) => ({
          extraId: ex.extraId,
          name: ex.name,
          priceEur: ex.amountEur,
          pricingType: ex.pricingType,
          quantity: ex.quantity,
          amountEur: ex.amountEur,
        })),
        customer: {
          ...customer,
          hotelName: hotelName || customer.hotelName,
          roomNumber: roomNumber || customer.roomNumber,
        },
        pricing,
        paymentMethod,
        paymentStatus: 'pending',
        status: 'confirmed',
        bookingStatus: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save into repository
      await bookingRepository.createBooking(newBooking);

      // Trigger notification service
      await notificationService.sendBookingConfirmation(newBooking);

      // Clear draft
      clearBookingDraft();

      // Handover to confirmation
      onBookingSuccess(newBooking);
    } catch (err) {
      console.error('Failed to create booking', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 lg:pb-16">
      
      {/* Top Breadcrumb & Step Progress Bar */}
      <div className="bg-white border-b border-[#E8E3DA] sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          
          {/* Breadcrumb info */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <div className="flex items-center space-x-1.5 truncate">
              <button
                onClick={() => onNavigate('home')}
                className="hover:text-stone-900 transition-colors"
              >
                Home
              </button>
              <span>/</span>
              <button
                onClick={() => onNavigate('excursions')}
                className="hover:text-stone-900 transition-colors"
              >
                Excursions
              </button>
              <span>/</span>
              <button
                onClick={() => onNavigate('tour-detail', currentTour.slug)}
                className="hover:text-stone-900 truncate max-w-[150px] sm:max-w-xs transition-colors"
              >
                {currentTour.title}
              </button>
              <span>/</span>
              <span className="font-semibold text-stone-800">Booking</span>
            </div>

            <span className="text-[11px] font-bold text-[#0A6C74] bg-[#E8F3F4] px-2.5 py-0.5 rounded-full shrink-0">
              Step {currentStep} of 6
            </span>
          </div>

          {/* Desktop Steps Navigation */}
          <div className="hidden md:flex items-center justify-between gap-1 pt-1">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isCompleted = currentStep > s.id;
              const isCurrent = currentStep === s.id;

              return (
                <div key={s.id} className="flex-1 flex items-center">
                  <button
                    type="button"
                    disabled={currentStep < s.id}
                    onClick={() => {
                      if (currentStep > s.id) setCurrentStep(s.id);
                    }}
                    className={`flex items-center space-x-2 text-xs font-semibold py-1.5 px-2 rounded transition-all text-left w-full ${
                      isCurrent
                        ? 'text-[#0A6C74] font-bold border-b-2 border-[#0A6C74]'
                        : isCompleted
                        ? 'text-stone-700 hover:text-stone-900 cursor-pointer'
                        : 'text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                        isCurrent
                          ? 'bg-[#0A6C74] text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.id}
                    </div>
                    <span className="truncate">{s.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Step Progress Indicator */}
          <div className="md:hidden flex items-center space-x-2 pt-1">
            <div className="flex-1 bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0A6C74] h-full transition-all duration-300"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-stone-800 shrink-0">
              {STEPS[currentStep - 1]?.label}
            </span>
          </div>

        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header Title */}
        <div className="mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A6C74]">
            Official Maritime Reservation Portal
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0E1B2A] tracking-tight">
            Reserve Your Excursion
          </h1>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Active Step Flow (7 cols on desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Step 1: Date & Guests */}
            {currentStep === 1 && (
              <StepDateGuests
                tour={currentTour}
                date={date}
                onDateChange={setDate}
                guests={guests}
                onGuestsChange={setGuests}
                currency={currency}
                onNext={() => setCurrentStep(2)}
              />
            )}

            {/* Step 2: Pickup Location */}
            {currentStep === 2 && (
              <StepPickup
                selectedPickupId={pickupLocationId}
                onSelectPickup={(loc) => setPickupLocationId(loc.id)}
                hotelName={hotelName}
                onHotelNameChange={setHotelName}
                currency={currency}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}

            {/* Step 3: Optional Extras */}
            {currentStep === 3 && (
              <StepExtras
                selectedExtraIds={selectedExtraIds}
                onToggleExtra={handleToggleExtra}
                currency={currency}
                onNext={() => setCurrentStep(4)}
                onBack={() => setCurrentStep(2)}
              />
            )}

            {/* Step 4: Lead Customer Contact */}
            {currentStep === 4 && (
              <StepCustomerInfo
                customer={customer}
                onCustomerChange={setCustomer}
                onNext={() => setCurrentStep(5)}
                onBack={() => setCurrentStep(3)}
              />
            )}

            {/* Step 5: Review Booking */}
            {currentStep === 5 && (
              <StepReview
                tour={currentTour}
                date={date}
                guests={guests}
                pickupLocation={selectedPickup}
                hotelName={hotelName}
                selectedExtras={selectedExtras}
                customer={customer}
                pricing={pricing}
                currency={currency}
                onGoToStep={(step) => setCurrentStep(step)}
                onNext={() => setCurrentStep(6)}
                onBack={() => setCurrentStep(4)}
              />
            )}

            {/* Step 6: Payment Method & Terms */}
            {currentStep === 6 && (
              <StepPayment
                pricing={pricing}
                currency={currency}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                termsAccepted={termsAccepted}
                onTermsAcceptedChange={setTermsAccepted}
                isSubmitting={isSubmitting}
                onSubmitBooking={handleConfirmBooking}
                onBack={() => setCurrentStep(5)}
              />
            )}

          </div>

          {/* Right Column: Sticky Booking Summary (5 cols on desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-36 space-y-4">
            <BookingSummary
              tour={currentTour}
              date={date}
              guests={guests}
              pickupLocation={selectedPickup}
              hotelName={hotelName}
              selectedExtras={selectedExtras}
              pricing={pricing}
              currency={currency}
              showGuarantee={true}
              collapsibleMobile={true}
              isMobileExpanded={isMobileSummaryOpen}
              onToggleMobileExpand={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
            />

            {/* Security & Operator Guarantee card */}
            <div className="p-4 bg-white border border-[#E8E3DA] rounded-sm text-xs space-y-2 text-stone-600 hidden lg:block">
              <div className="flex items-center space-x-2 text-stone-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#0A6C74]" />
                <span>Verified Direct Tour Operator</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                You are booking directly with the licensed vessel fleet operator in Hurghada Marina. Zero intermediary commissions.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E3DA] shadow-lg p-3 lg:hidden flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
            className="flex items-center space-x-1 text-stone-500 text-[10px] uppercase font-bold"
          >
            <span>Total Payable</span>
            {isMobileSummaryOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <span className="font-display font-bold text-lg text-[#0A6C74] block leading-tight">
            {pricing.formattedTotal}
          </span>
        </div>

        <div>
          {currentStep === 1 && (
            <button
              type="button"
              disabled={!date}
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 bg-[#0A6C74] text-white text-xs font-semibold rounded disabled:opacity-40"
            >
              Continue (Step 2)
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 bg-[#0A6C74] text-white text-xs font-semibold rounded"
            >
              Next: Extras (3)
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 bg-[#0A6C74] text-white text-xs font-semibold rounded"
            >
              Next: Details (4)
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="button"
              onClick={() => {
                if (customer.firstName && customer.lastName && customer.email && customer.phoneNumber) {
                  setCurrentStep(5);
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="px-5 py-2.5 bg-[#0A6C74] text-white text-xs font-semibold rounded"
            >
              Review (Step 5)
            </button>
          )}

          {currentStep === 5 && (
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className="px-5 py-2.5 bg-[#0A6C74] text-white text-xs font-semibold rounded"
            >
              Payment (Step 6)
            </button>
          )}

          {currentStep === 6 && (
            <button
              type="button"
              disabled={!termsAccepted || isSubmitting}
              onClick={handleConfirmBooking}
              className="px-5 py-2.5 bg-[#0A6C74] text-white text-xs font-bold rounded disabled:opacity-40"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Now'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
