import React, { useState, useEffect } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Heart,
  UtensilsCrossed,
  Sparkles,
  Check,
  X,
  Store,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { restaurantService, RestaurantRow } from '../../services/restaurantService';
import { useCustomer } from '../../context/CustomerContext';
import { SafeImage } from '../../components/common/SafeImage';
import { isRestaurantOpen } from '../../utils/customerUtils';

export const RestaurantDirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCuisine = searchParams.get('cuisine') || 'all';

  const { favoriteRestaurantIds, toggleFavoriteRestaurant } = useCustomer();

  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [selectedCuisine, setSelectedCuisine] = useState<string>(initialCuisine);
  const [onlyOpen, setOnlyOpen] = useState<boolean>(false);
  const [deliveryFilter, setDeliveryFilter] = useState<boolean>(false);
  const [takeawayFilter, setTakeawayFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'newest'>('rating');

  useEffect(() => {
    async function loadRestaurants() {
      try {
        setIsLoading(true);
        setErrorMsg(null);
        const data = await restaurantService.getPublicRestaurants();
        setRestaurants(data);
      } catch (err: any) {
        console.warn('Error loading restaurants', err);
        setErrorMsg('Failed to load restaurant directory. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    }
    loadRestaurants();
  }, []);

  // Sync URL search params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
    const c = searchParams.get('cuisine');
    if (c !== null && c !== selectedCuisine) {
      setSelectedCuisine(c);
    }
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const newParams: Record<string, string> = {};
    if (val.trim()) newParams.q = val.trim();
    if (selectedCuisine && selectedCuisine !== 'all') newParams.cuisine = selectedCuisine;
    setSearchParams(newParams);
  };

  const handleCuisineSelect = (cuisine: string) => {
    setSelectedCuisine(cuisine);
    const newParams: Record<string, string> = {};
    if (searchQuery.trim()) newParams.q = searchQuery.trim();
    if (cuisine !== 'all') newParams.cuisine = cuisine;
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCuisine('all');
    setOnlyOpen(false);
    setDeliveryFilter(false);
    setTakeawayFilter(false);
    setSortBy('rating');
    setSearchParams({});
  };

  // Extract unique cuisines from real data
  const availableCuisines = React.useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => {
      if (r.cuisine) {
        r.cuisine.split(',').forEach((c) => {
          const item = c.trim();
          if (item) set.add(item);
        });
      }
    });
    return Array.from(set).sort();
  }, [restaurants]);

  const filteredRestaurants = restaurants
    .filter((r) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesCuisine = r.cuisine?.toLowerCase().includes(q);
        const matchesCity = r.city?.toLowerCase().includes(q);
        const matchesAddress = r.address?.toLowerCase().includes(q);
        const matchesDescription = r.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesCuisine && !matchesCity && !matchesAddress && !matchesDescription) {
          return false;
        }
      }

      // 2. Cuisine filter
      if (selectedCuisine !== 'all') {
        if (!r.cuisine || !r.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase())) {
          return false;
        }
      }

      // 3. Open Now filter
      if (onlyOpen) {
        const status = isRestaurantOpen(r.opening_hours, r.is_active);
        if (!status.isOpen) return false;
      }

      // 4. Ordering modes
      if (deliveryFilter && !r.delivery_available) return false;
      if (takeawayFilter && !r.takeaway_available) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCuisine !== 'all' ||
    onlyOpen ||
    deliveryFilter ||
    takeawayFilter ||
    sortBy !== 'rating';

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-black uppercase tracking-wider border border-amber-200">
            Real-Time Restaurant Directory
          </span>
          <span className="text-xs text-cafe-muted">
            {restaurants.length} Verified Culinary Partners
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-cafe-primary tracking-tight">
          Explore Restaurants & Dining Partners
        </h1>
        <p className="text-xs sm:text-sm text-cafe-muted max-w-2xl">
          Order direct with transparent pricing, zero third-party markups, and live kitchen status synchronization.
        </p>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-4">
        {/* Top Row: Search Input & Sort */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by restaurant name, cuisine, biryani, tandoor, or city..."
              className="w-full pl-10 pr-10 py-2.5 text-xs rounded-2xl bg-cafe-light/70 border border-cafe-border focus:outline-none focus:bg-white focus:ring-2 focus:ring-cafe-accent text-cafe-primary placeholder:text-cafe-muted font-medium transition-all"
            />
            <Search className="w-4 h-4 text-cafe-muted absolute left-3.5 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3.5 top-3 text-cafe-muted hover:text-cafe-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-cafe-muted">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-cafe-light/80 border border-cafe-border text-cafe-primary focus:outline-none focus:border-cafe-accent cursor-pointer"
            >
              <option value="rating">Top Rated First</option>
              <option value="name">Alphabetical (A - Z)</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Bottom Row: Quick Toggles & Cuisines */}
        <div className="pt-2 border-t border-cafe-border/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Open Now Toggle */}
            <button
              type="button"
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                onlyOpen
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-cafe-light text-cafe-muted hover:text-cafe-primary border border-cafe-border/80'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyOpen ? 'bg-white' : 'bg-emerald-500'}`} />
              <span>Open Now</span>
            </button>

            {/* Delivery Available Toggle */}
            <button
              type="button"
              onClick={() => setDeliveryFilter(!deliveryFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                deliveryFilter
                  ? 'bg-cafe-primary text-white shadow-sm'
                  : 'bg-cafe-light text-cafe-muted hover:text-cafe-primary border border-cafe-border/80'
              }`}
            >
              <span>🛵 Delivery</span>
            </button>

            {/* Takeaway Available Toggle */}
            <button
              type="button"
              onClick={() => setTakeawayFilter(!takeawayFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                takeawayFilter
                  ? 'bg-cafe-primary text-white shadow-sm'
                  : 'bg-cafe-light text-cafe-muted hover:text-cafe-primary border border-cafe-border/80'
              }`}
            >
              <span>🛍️ Takeaway</span>
            </button>

            {/* Cuisine Filter Dropdown */}
            {availableCuisines.length > 0 && (
              <select
                value={selectedCuisine}
                onChange={(e) => handleCuisineSelect(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cafe-light border border-cafe-border text-cafe-primary focus:outline-none cursor-pointer"
              >
                <option value="all">All Cuisines</option>
                {availableCuisines.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Search Feedback Label */}
      <div className="flex items-center justify-between text-xs text-cafe-muted px-1">
        <span>
          Showing <strong className="text-cafe-primary">{filteredRestaurants.length}</strong> of{' '}
          {restaurants.length} partner kitchens
          {searchQuery && ` matching "${searchQuery}"`}
          {selectedCuisine !== 'all' && ` in ${selectedCuisine}`}
        </span>
      </div>

      {/* 4. Restaurant Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-3xl bg-white border border-cafe-border animate-pulse p-4 space-y-4"
            >
              <div className="h-44 bg-cafe-sand/40 rounded-2xl" />
              <div className="h-4 bg-cafe-sand/50 rounded-md w-3/4" />
              <div className="h-3 bg-cafe-sand/40 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="p-12 text-center bg-rose-50 rounded-3xl border border-rose-200 space-y-4">
          <p className="text-xs font-bold text-rose-700">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-warm"
          >
            Retry
          </button>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-cafe-border space-y-3">
          <UtensilsCrossed className="w-12 h-12 text-cafe-muted/50 mx-auto" />
          <h3 className="text-base font-black text-cafe-primary">No dining partners found</h3>
          <p className="text-xs text-cafe-muted max-w-sm mx-auto">
            No restaurants matched your search criteria. Try modifying your search or reset filters to see all available partners.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((rest) => {
            const isFav = favoriteRestaurantIds.has(rest.id);
            const openStatus = isRestaurantOpen(rest.opening_hours, rest.is_active);

            return (
              <motion.div
                key={rest.id}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="bg-white rounded-3xl border border-cafe-border overflow-hidden shadow-warm hover:shadow-warm-lg transition-all group flex flex-col justify-between card-interactive"
              >
                <div>
                  {/* Banner Cover Image */}
                  <div className="relative h-48 w-full bg-cafe-sand/40 overflow-hidden">
                    <SafeImage
                      src={
                        rest.banner_url ||
                        rest.logo_url ||
                        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80'
                      }
                      fallbackSrc="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
                      alt={rest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    {/* Bookmark Favorite Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavoriteRestaurant(rest.id);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                        isFav
                          ? 'bg-rose-500 text-white shadow-warm'
                          : 'bg-white/80 text-cafe-primary hover:bg-white'
                      }`}
                      title="Bookmark restaurant"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                    </button>

                    {/* Open / Closed Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                          openStatus.isOpen
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-800 text-stone-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            openStatus.isOpen ? 'bg-white animate-pulse' : 'bg-rose-400'
                          }`}
                        />
                        <span>{openStatus.label}</span>
                      </span>
                    </div>

                    {/* Rating & City Badge */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md font-black flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{Number(rest.rating) || 5.0}</span>
                      </span>

                      {rest.city && (
                        <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md font-semibold text-[11px] truncate max-w-[160px]">
                          {rest.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <h3 className="text-base font-black text-cafe-primary group-hover:text-cafe-accent transition-colors line-clamp-1">
                      {rest.name}
                    </h3>

                    <p className="text-xs text-cafe-muted font-medium line-clamp-1">
                      {rest.cuisine || 'Authentic Regional Specialties'}
                    </p>

                    {rest.description && (
                      <p className="text-[11px] text-cafe-muted/90 line-clamp-2 leading-relaxed">
                        {rest.description}
                      </p>
                    )}

                    <p className="text-[11px] text-cafe-muted/80 flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-cafe-accent shrink-0" />
                      <span>{rest.address || 'Central Hospitality District'}</span>
                    </p>

                    {rest.opening_hours && (
                      <p className="text-[11px] text-cafe-muted/80 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{rest.opening_hours}</span>
                      </p>
                    )}

                    {/* Ordering Modes */}
                    <div className="pt-2 flex flex-wrap items-center gap-1.5">
                      {rest.delivery_available && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          🛵 Delivery
                        </span>
                      )}
                      {rest.takeaway_available && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          🛍️ Takeaway
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                        📱 Dine-in QR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Links & CTAs */}
                <div className="px-5 pb-5 pt-3 border-t border-cafe-border/50 flex items-center justify-between gap-3">
                  <NavLink
                    to={`/customer/restaurants/${rest.id}`}
                    className="text-xs font-bold text-cafe-muted hover:text-cafe-primary transition-colors flex items-center gap-1"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>View Info</span>
                  </NavLink>
                  <NavLink
                    to={`/customer/menu/${rest.id}`}
                    className="px-4 py-2 rounded-xl bg-cafe-primary hover:bg-cafe-accent text-white text-xs font-bold shadow-warm transition-all flex items-center gap-1.5 active:scale-95 btn-press"
                  >
                    <span>View Menu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </NavLink>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RestaurantDirectoryPage;
