import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tour, CurrencyConfig } from '../types';
import { GuestCounts, BookingExtra, CustomerInfo, Booking } from '../types/booking';
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
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

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
  const { showToast } = useToast();

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
      return calculateBookingPrice({
        tour: tours[0],
        guests,
        pickupLocation: selectedPickup,
        selectedExtras: [],
        currency,
      });
    }
    return calculateBookingPrice({
      tour: currentTour,
      guests,
      pickupLocation: selectedPickup,
      selectedExtras: selectedExtras.map((e) => ({ extra: e, quantity: 1 })),
      currency,
    });
  }, [currentTour, tours, guests, selectedPickup, selectedExtras, currency]);

  const handleToggleExtra = (extraId: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]
    );
  };

  const handleConfirmBooking = async () => {
    if (!currentTour) return;
    setIsSubmitting(true);

    try {
      const ref = generateBookingReference();

      const newBooking: Booking = {
        bookingId: `b-${Date.now()}`,
        bookingReference: ref,
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
          feeEur: selectedPickup.feeEurPerPerson,
          hotelName,
          roomNumber,
        },
        extras: selectedExtras.map((e) => ({
          extraId: e.id,
          name: e.name,
          priceEur: e.priceEur,
          pricingType: e.pricingType,
          quantity: 1,
          amountEur: e.priceEur,
        })),
        customer,
        pricing,
        paymentMethod,
        paymentStatus: paymentMethod === 'pay_online' ? 'paid' : 'pending',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await bookingRepository.createBooking(newBooking);
      clearBookingDraft();
      notificationService.sendBookingConfirmation(newBooking);
      showToast('Booking successfully confirmed!', 'success');
      onBookingSuccess(newBooking);
    } catch (err) {
      console.error('Failed to save booking:', err);
      showToast('An error occurred while confirming your reservation. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      {/* Top Stepper Navigation */}
      <div className="bg-white border-b border-[#E8E3DA] sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          
          {/* Desktop Stepper */}
          <div className="hidden md:flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const isCurrent = currentStep === s.id;
              const isCompleted = currentStep > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompleted) setCurrentStep(s.id);
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
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 transition-colors ${
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
              {STEPS[currentStep - 1]?.label} ({currentStep}/6)
            </span>
          </div>

        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header Title */}
        <div className="mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A6C74]">
            Direct Vessel Reservation
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0E1B2A] tracking-tight">
            Reserve Your Excursion
          </h1>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Active Step Flow (7 cols on desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-6"
              >
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
              </motion.div>
            </AnimatePresence>
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
            />

            {/* Direct Operator Security Box */}
            <div className="p-4 bg-white rounded-lg border border-[#E8E3DA] text-xs space-y-2">
              <div className="flex items-center text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                <span>Operator Direct Guarantee</span>
              </div>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Reservations are transmitted directly to the marine fleet operations center in Hurghada. Free cancellation up to 24 hours prior.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
