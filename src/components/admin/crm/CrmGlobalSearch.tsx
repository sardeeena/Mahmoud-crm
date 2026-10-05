import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  Target,
  CalendarCheck,
  X,
  ChevronRight,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { globalCrmSearch } from '../../../services/crmService';
import { CrmCustomerSummary, CrmLead } from '../../../types/crm';
import { Booking } from '../../../types/booking';

interface CrmGlobalSearchProps {
  onSelectCustomer?: (customer: CrmCustomerSummary) => void;
  onSelectLead?: (lead: CrmLead) => void;
  onSelectBooking?: (booking: Booking) => void;
}

export const CrmGlobalSearch: React.FC<CrmGlobalSearchProps> = ({
  onSelectCustomer,
  onSelectLead,
  onSelectBooking,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    customers: CrmCustomerSummary[];
    leads: CrmLead[];
    bookings: Booking[];
  }>({ customers: [], leads: [], bookings: [] });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults({ customers: [], leads: [], bookings: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await globalCrmSearch(q);
        setResults(res);
        setIsOpen(true);
      } catch (err) {
        console.error('Error during global search:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const hasAnyResults =
    results.customers.length > 0 || results.leads.length > 0 || results.bookings.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Global CRM search: name, email, phone, WhatsApp, or booking ref..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          className="w-full bg-stone-900 border border-stone-700/80 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-[#0A6C74] focus:ring-1 focus:ring-[#0A6C74]"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-2.5 text-stone-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto divide-y divide-stone-800 text-xs">
          {loading ? (
            <div className="p-4 text-center text-stone-400 text-xs">
              Searching CRM database...
            </div>
          ) : !hasAnyResults ? (
            <div className="p-4 text-center text-stone-500 text-xs">
              No matching customers, leads, or bookings found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              {/* Customers Match */}
              {results.customers.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1">
                    <Users className="w-3 h-3 text-[#2dd4bf]" />
                    <span>Customers ({results.customers.length})</span>
                  </div>
                  {results.customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCustomer?.(c);
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-stone-800 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-white group-hover:text-[#2dd4bf] transition-colors">
                          {c.fullName}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center space-x-2 mt-0.5">
                          <span>{c.email}</span>
                          {c.phone && <span>• {c.phone}</span>}
                          <span>• {c.country || 'International'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              )}

              {/* Leads Match */}
              {results.leads.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1">
                    <Target className="w-3 h-3 text-sky-400" />
                    <span>Pipeline Leads ({results.leads.length})</span>
                  </div>
                  {results.leads.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        onSelectLead?.(l);
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-stone-800 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-white group-hover:text-sky-300 transition-colors">
                          {l.name}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center space-x-2 mt-0.5">
                          <span>{l.email}</span>
                          <span className="capitalize text-sky-400">[{l.stage.replace('_', ' ')}]</span>
                          <span>• {l.interestedTourTitle || 'Excursions'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              )}

              {/* Bookings Match */}
              {results.bookings.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1">
                    <CalendarCheck className="w-3 h-3 text-emerald-400" />
                    <span>Bookings ({results.bookings.length})</span>
                  </div>
                  {results.bookings.map((b) => (
                    <button
                      key={b.bookingReference}
                      type="button"
                      onClick={() => {
                        onSelectBooking?.(b);
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-stone-800 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center space-x-2">
                          <span className="font-mono text-[#2dd4bf]">{b.bookingReference}</span>
                          <span className="text-stone-300">• {b.tourTitle}</span>
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center space-x-2 mt-0.5">
                          <span>
                            {b.customer.firstName} {b.customer.lastName}
                          </span>
                          <span>• Date: {b.date}</span>
                          <span className="text-emerald-400 font-mono">€{b.pricing.totalEur.toFixed(2)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
