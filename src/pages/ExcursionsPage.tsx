import React, { useState, useMemo, useEffect } from 'react';
import { Tour, CurrencyConfig } from '../types';
import { ALL_TOURS } from '../data/toursData';
import { TourSearch } from '../components/tours/TourSearch';
import { TourFilters, FilterState, INITIAL_FILTERS } from '../components/tours/TourFilters';
import { TourSort, SortOption } from '../components/tours/TourSort';
import { TourGrid } from '../components/tours/TourGrid';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useSeo } from '../hooks/useSeo';
import { seoService } from '../services/seoService';

interface ExcursionsPageProps {
  currency: CurrencyConfig;
  tours?: Tour[];
  initialDestination?: string;
  initialCategory?: string;
  onNavigateHome: () => void;
  onViewTour: (tour: Tour) => void;
  onBookTour: (tour: Tour) => void;
}

export const ExcursionsPage: React.FC<ExcursionsPageProps> = ({
  currency,
  tours = ALL_TOURS,
  initialDestination,
  initialCategory,
  onNavigateHome,
  onViewTour,
  onBookTour,
}) => {
  // Search bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationSelect, setDestinationSelect] = useState(initialDestination || 'All');
  const [activitySelect, setActivitySelect] = useState(initialCategory || 'All');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');

  // Sidebar filters
  const [sidebarFilters, setSidebarFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [sortOption, setSortOption] = useState<SortOption>('recommended');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync initial props
  useEffect(() => {
    if (initialDestination) {
      setDestinationSelect(initialDestination);
    }
    if (initialCategory) {
      setActivitySelect(initialCategory);
    }
  }, [initialDestination, initialCategory]);

  // Handle category tab change
  const handleCategoryTabSelect = (tab: string) => {
    setActiveCategoryTab(tab);
    if (tab === 'All') {
      setActivitySelect('All');
    } else {
      setActivitySelect(tab);
    }
  };

  // Filter & sort logic
  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      // 1. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = 
          tour.title.toLowerCase().includes(q) ||
          tour.destination.toLowerCase().includes(q) ||
          tour.category.toLowerCase().includes(q) ||
          tour.shortDescription.toLowerCase().includes(q) ||
          tour.highlights.some((h) => h.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // 2. Destination select
      if (destinationSelect !== 'All') {
        const destMatch = 
          tour.destination.toLowerCase() === destinationSelect.toLowerCase() ||
          tour.destination.toLowerCase().includes(destinationSelect.toLowerCase());
        if (!destMatch) return false;
      }

      // 3. Activity / Category Select
      if (activitySelect !== 'All') {
        const actMatch = 
          tour.category.toLowerCase().includes(activitySelect.toLowerCase()) ||
          tour.categories?.some((c) => c.toLowerCase().includes(activitySelect.toLowerCase()));
        if (!actMatch) return false;
      }

      // 4. Sidebar: Destinations
      if (sidebarFilters.destinations.length > 0) {
        if (!sidebarFilters.destinations.includes(tour.destination)) {
          return false;
        }
      }

      // 5. Sidebar: Activities
      if (sidebarFilters.activities.length > 0) {
        const hasMatchingActivity = sidebarFilters.activities.some(
          (act) => tour.category.includes(act) || tour.categories?.includes(act)
        );
        if (!hasMatchingActivity) return false;
      }

      // 6. Sidebar: Duration
      if (sidebarFilters.durations.length > 0) {
        if (!sidebarFilters.durations.includes(tour.durationCategory)) {
          return false;
        }
      }

      // 7. Sidebar: Tour Type
      if (sidebarFilters.tourTypes.length > 0) {
        if (!sidebarFilters.tourTypes.includes(tour.tourType)) {
          return false;
        }
      }

      // 8. Sidebar: Price
      if (tour.priceEur > sidebarFilters.maxPrice) {
        return false;
      }

      // 9. Sidebar: Rating
      if (sidebarFilters.minRating > 0 && tour.rating < sidebarFilters.minRating) {
        return false;
      }

      // 10. Sidebar: Pickup
      if (sidebarFilters.pickupOnly && !tour.pickupAvailable) {
        return false;
      }

      // 11. Sidebar: Languages
      if (sidebarFilters.languages.length > 0) {
        const hasLang = sidebarFilters.languages.some((l) => tour.languages.includes(l));
        if (!hasLang) return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortOption) {
        case 'price_asc':
          return a.priceEur - b.priceEur;
        case 'price_desc':
          return b.priceEur - a.priceEur;
        case 'rating_desc':
          return b.rating - a.rating || b.reviewCount - a.reviewCount;
        case 'duration_asc':
          return a.durationHours - b.durationHours;
        case 'recommended':
        default:
          return b.reviewCount - a.reviewCount;
      }
    });
  }, [
    searchQuery,
    destinationSelect,
    activitySelect,
    sidebarFilters,
    sortOption,
  ]);

  const handleClearAll = () => {
    setSearchQuery('');
    setDestinationSelect('All');
    setActivitySelect('All');
    setActiveCategoryTab('All');
    setSidebarFilters(INITIAL_FILTERS);
  };

  // Dynamic SEO meta tags, OpenGraph, and Schema.org JSON-LD based on current filters
  const activeLabel = activitySelect !== 'All' ? activitySelect : destinationSelect !== 'All' ? destinationSelect : 'All';
  const seoData = useMemo(() => {
    return seoService.generateCategorySeo(activeLabel, filteredTours.length, filteredTours);
  }, [activeLabel, filteredTours]);
  useSeo(seoData);

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', onClick: onNavigateHome },
          { label: 'Excursions' },
        ]}
      />

      {/* Page Title & Supporting Text */}
      <div className="py-4 border-b border-stone-200 mb-6">
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0E1B2A] tracking-tight">
          Explore Our Excursions
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
          From coral reefs and island beaches to desert adventures, choose the experience that fits your holiday.
        </p>
      </div>

      {/* Top Search & Filter Area */}
      <div className="mb-6">
        <TourSearch
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          destination={destinationSelect}
          onDestinationChange={setDestinationSelect}
          activity={activitySelect}
          onActivityChange={setActivitySelect}
          date={date}
          onDateChange={setDate}
          guests={guests}
          onGuestsChange={setGuests}
          activeCategoryTab={activeCategoryTab}
          onSelectCategoryTab={handleCategoryTabSelect}
        />
      </div>

      {/* Desktop Layout: Left Sidebar + Right Results */}
      <div className="flex items-start gap-8">
        
        {/* Left Filter Sidebar */}
        <TourFilters
          filters={sidebarFilters}
          onChange={setSidebarFilters}
          onClear={handleClearAll}
          currency={currency}
          isOpenMobile={mobileFiltersOpen}
          onCloseMobile={() => setMobileFiltersOpen(false)}
          totalFilteredCount={filteredTours.length}
        />

        {/* Right Results Column */}
        <div className="flex-1 min-w-0">
          
          {/* Sorting Header */}
          <TourSort
            totalCount={filteredTours.length}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          />

          {/* Tour Grid */}
          <TourGrid
            tours={filteredTours}
            currency={currency}
            onViewTour={onViewTour}
            onBookNow={onBookTour}
            onClearFilters={handleClearAll}
          />

        </div>

      </div>

    </div>
  );
};
