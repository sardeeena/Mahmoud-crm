import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Ship,
  Users,
  Clock,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { listAvailabilitySlots, getTodayDepartures } from '../../../services/operationsService';
import { AvailabilitySlot, OperationalDeparture } from '../../../types/operations';
import { ALL_TOURS } from '../../../data/toursData';

interface OperationsCalendarProps {
  onSelectDepartureDate?: (date: string) => void;
}

export const OperationsCalendar: React.FC<OperationsCalendarProps> = ({
  onSelectDepartureDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listAvailabilitySlots();
      setSlots(data);
    } catch (err) {
      console.warn('Failed to load slots for calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate days in month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

  // Padding from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevDate = new Date(year, month - 1, day);
    daysArray.push({
      dateStr: prevDate.toISOString().split('T')[0],
      dayNum: day,
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = dateObj.toISOString().split('T')[0];
    daysArray.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#2dd4bf] font-bold block mb-0.5">
            Operational Schedule
          </span>
          <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-[#2dd4bf]" />
            <span>Monthly Operations Calendar</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Visual matrix of scheduled departures, booked passenger capacities, and harbor clearances.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 bg-stone-900 border border-stone-800 text-stone-300 hover:text-white rounded text-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold font-mono text-white px-3 py-1 bg-stone-950 border border-stone-800 rounded">
            {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>

          <button
            type="button"
            onClick={nextMonth}
            className="p-2 bg-stone-900 border border-stone-800 text-stone-300 hover:text-white rounded text-xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-stone-900 border border-stone-800 text-stone-300 hover:text-white rounded text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden shadow-xs">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-stone-900 border-b border-stone-800 text-center text-[11px] font-semibold text-stone-400 py-2.5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-stone-800/80">
          {daysArray.map((dayItem, idx) => {
            const daySlots = slots.filter((s) => s.date === dayItem.dateStr);
            const totalBooked = daySlots.reduce((sum, s) => sum + s.bookedCount, 0);
            const isToday = dayItem.dateStr === todayStr;

            return (
              <div
                key={idx}
                onClick={() => onSelectDepartureDate && onSelectDepartureDate(dayItem.dateStr)}
                className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                  dayItem.isCurrentMonth
                    ? 'bg-stone-950 hover:bg-stone-900/60'
                    : 'bg-stone-950/40 text-stone-600'
                } ${isToday ? 'ring-1 ring-inset ring-[#2dd4bf]' : ''}`}
              >
                {/* Cell Header */}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-mono font-bold ${
                      isToday
                        ? 'px-1.5 py-0.2 rounded bg-[#0A6C74] text-white text-[11px]'
                        : dayItem.isCurrentMonth
                        ? 'text-white'
                        : 'text-stone-600'
                    }`}
                  >
                    {dayItem.dayNum}
                  </span>

                  {totalBooked > 0 && dayItem.isCurrentMonth && (
                    <span className="text-[10px] font-mono font-bold text-[#2dd4bf]">
                      {totalBooked} pax
                    </span>
                  )}
                </div>

                {/* Day Slots preview */}
                <div className="space-y-1 mt-1">
                  {daySlots.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${
                        s.status === 'unavailable'
                          ? 'bg-red-500/20 text-red-300'
                          : s.status === 'sold_out'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-stone-900 text-stone-300 border border-stone-800'
                      }`}
                    >
                      {s.tourTitle.split(':')[0].substring(0, 16)}
                      {s.bookedCount > 0 && ` (${s.bookedCount})`}
                    </div>
                  ))}
                  {daySlots.length > 2 && (
                    <span className="text-[9px] text-stone-500 block">
                      +{daySlots.length - 2} more tours
                    </span>
                  )}
                </div>

                <div className="text-[9px] text-stone-500 font-mono text-right mt-1">
                  {dayItem.isCurrentMonth && (
                    <span className="hover:text-stone-300">&rarr; View Run</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
