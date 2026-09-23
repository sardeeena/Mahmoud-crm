import React from 'react';
import { Sparkles, Check, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { BookingExtra } from '../../types/booking';
import { CurrencyConfig } from '../../types';
import { GLOBAL_BOOKING_EXTRAS } from '../../data/bookingData';
import { formatCurrencyAmount } from '../../services/pricingService';

interface StepExtrasProps {
  selectedExtraIds: string[];
  onToggleExtra: (extraId: string) => void;
  currency: CurrencyConfig;
  onNext: () => void;
  onBack: () => void;
}

export const StepExtras: React.FC<StepExtrasProps> = ({
  selectedExtraIds,
  onToggleExtra,
  currency,
  onNext,
  onBack,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white border border-[#E8E3DA] rounded-sm p-5 space-y-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-[#0E1B2A] flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-[#0A6C74]" />
            Enhance Your Excursion (Optional)
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Tailor your day with popular upgrades. All equipment and upgrades are prepared in advance on your vessel.
          </p>
        </div>

        {/* Extras Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {GLOBAL_BOOKING_EXTRAS.map((extra) => {
            const isSelected = selectedExtraIds.includes(extra.id);

            return (
              <div
                key={extra.id}
                onClick={() => onToggleExtra(extra.id)}
                className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0A6C74] bg-[#E8F3F4]/50 ring-1 ring-[#0A6C74]'
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm">
                      {extra.name}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-xs border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#0A6C74] border-[#0A6C74] text-white'
                          : 'border-stone-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-600 mt-1.5 leading-relaxed">
                    {extra.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-stone-400">
                    {extra.pricingType === 'per_person' ? 'Per Guest' : 'Flat Per Booking'}
                  </span>
                  <span className="font-bold text-[#0A6C74]">
                    +{formatCurrencyAmount(extra.priceEur, currency)}
                    {extra.pricingType === 'per_person' && (
                      <span className="text-[10px] text-stone-500 font-normal"> / person</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-stone-500">
          * Extras can also be modified or cancelled up to 24 hours prior to departure without penalty.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold rounded-sm transition-colors flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-7 py-3 bg-[#0A6C74] hover:bg-[#08565C] text-white text-xs sm:text-sm font-semibold rounded-sm transition-colors shadow-xs flex items-center space-x-2"
        >
          <span>Continue to Lead Guest Details</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
