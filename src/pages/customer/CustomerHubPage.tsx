import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Sparkles,
  Star,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award,
  Flame,
  Heart,
  Plus,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Gift,
  ExternalLink,
  ChevronRight,
  Store,
  Tag,
  CheckCircle2,
  X
} from 'lucide-react';
import { restaurantService, RestaurantRow } from '../../services/restaurantService';
import { menuService } from '../../services/menuService';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { SafeImage } from '../../components/common/SafeImage';
import { formatCurrency } from '../../utils/formatters';
import { Product } from '../../types';
import { CafeLogo } from '../../components/common/CafeLogo';
import {
  isRestaurantOpen,
  getRecentlyViewedRestaurants,
  RecentlyViewedRestaurant,
} from '../../utils/customerUtils';

const hubContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const hubCardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export const CustomerHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();
  const {
    addToCart,
    favoriteRestaurantIds,
    toggleFavoriteRestaurant,
    favoriteProductIds,
    toggleFavoriteProduct,
    rewards,
  } = useCustomer();

  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        // 1. Fetch real restaurants from Supabase
        const restList = await restaurantService.getPublicRestaurants();
        if (!isMounted) return;
        setRestaurants(restList);

        // 2. Load recently viewed from local storage
        const recent = getRecentlyViewedRestaurants();
        setRecentlyViewed(recent);

        // 3. Fetch recommended dishes from flagship or active restaurant
        if (restList.length > 0) {
          try {
            // Find flagship restaurant with richest catalog or first restaurant
            const flagship =
              restList.find(
                (r) =>
                  r.id === '22222222-2222-2222-2222-222222222201' ||
                  r.slug === 'artisan-brew'
              ) || restList[0];

            const menuData = await menuService.getPublicMenu(flagship.id);
            if (isMounted && menuData && menuData.products) {
              // Highlight authentic bestselling creations
              const recommended = menuData.products
                .filter((p) => p.isAvailable)
                .slice(0, 6);
              setFeaturedProducts(recommended);
            }
          } catch (menuErr) {
            console.warn('Could not load recommended menu dishes:', menuErr);
          }
        }
      } catch (err: any) {
        console.error('Customer Hub loading error:', err);
        if (isMounted) {
          setErrorMsg('Failed to load restaurant network. Please check your internet connection.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/restaurants?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Derive dynamic category list based on actual cuisines in the database
  const dynamicCategories = React.useMemo(() => {
    const defaultCuisines = [
      { id: 'all', label: 'All Cuisines', icon: '✨' },
      { id: 'biryani', label: 'Dum Biryanis', icon: '🍚' },
      { id: 'tandoor', label: 'Tandoor & Grills', icon: '🔥' },
      { id: 'mughlai', label: 'Royal Mughlai', icon: '🥘' },
      { id: 'chai', label: 'Artisan Chai', icon: '☕' },
      { id: 'chaat', label: 'Street Chaat', icon: '🥟' },
    ];

    if (!restaurants || restaurants.length === 0) return defaultCuisines;

    // Collect unique cuisines
    const extractedSet = new Set<string>();
    restaurants.forEach((r) => {
      if (r.cuisine) {
        r.cuisine.split(',').forEach((c) => {
          const trimmed = c.trim();
          if (trimmed.length > 2 && trimmed.length < 25) {
            extractedSet.add(trimmed);
          }
        });
      }
    });

    if (extractedSet.size > 0) {
      const dynamicList = Array.from(extractedSet).slice(0, 6).map((c) => ({
        id: c.toLowerCase(),
        label: c,
        icon: c.toLowerCase().includes('chai')
          ? '☕'
          : c.toLowerCase().includes('biryani')
          ? '🍚'
          : c.toLowerCase().includes('tandoor')
          ? '🔥'
          : '🍛',
      }));
      return [{ id: 'all', label: 'All Cuisines', icon: '✨' }, ...dynamicList];
    }

    return defaultCuisines;
  }, [restaurants]);

  const filteredRestaurants = restaurants.filter((r) => {
    if (selectedCuisine === 'all') return true;
    return r.cuisine?.toLowerCase().includes(selectedCuisine.toLowerCase());
  });

  const popularRestaurants = [...restaurants].sort(
    (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0)
  );

  const customerName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Guest Diner');

  const customerAvatar =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;

  return (
    <div className="space-y-10 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* 1. TOP CUSTOMER WELCOME BAR & QUICK SHORTCUTS */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-cafe-border shadow-warm">
        <div className="flex items-center gap-3.5">
          {isAuthenticated && customerAvatar ? (
            <img
              src={customerAvatar}
              alt={customerName}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-cafe-accent/40 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cafe-primary to-stone-800 text-white flex items-center justify-center font-black text-lg shadow-warm">
              <CafeLogo size={32} />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-cafe-primary tracking-tight">
                {isAuthenticated ? `Namaste, ${customerName}!` : 'Welcome to CaféOS Dining'}
              </h2>
              {isAuthenticated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200">
                  <Award className="w-3 h-3 text-amber-600" />
                  <span>VIP Diner</span>
                </span>
              )}
            </div>
            <p className="text-xs text-cafe-muted mt-0.5">
              {isAuthenticated
                ? 'Explore verified kitchens, track live chef prep, and redeem your coins.'
                : 'Direct kitchen prices, zero third-party markups, and instant order tracking.'}
            </p>
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <NavLink
            to="/customer/orders"
            className="px-3.5 py-2 rounded-2xl bg-cafe-sand/40 hover:bg-cafe-sand/70 border border-cafe-border/80 text-xs font-bold text-cafe-primary transition-all flex items-center gap-2 shrink-0 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-cafe-accent" />
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/customer/favorites"
            className="px-3.5 py-2 rounded-2xl bg-cafe-sand/40 hover:bg-cafe-sand/70 border border-cafe-border/80 text-xs font-bold text-cafe-primary transition-all flex items-center gap-2 shrink-0 shadow-sm"
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Favorites</span>
            {favoriteRestaurantIds.size > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {favoriteRestaurantIds.size}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/customer/rewards"
            className="px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-900 transition-all flex items-center gap-2 shrink-0 shadow-sm"
          >
            <Gift className="w-4 h-4 text-amber-600" />
            <span>{rewards ? `${rewards.pointsBalance} Coins` : '5% Coins'}</span>
          </NavLink>

          {!isAuthenticated && (
            <NavLink
              to="/customer/login"
              className="px-4 py-2 rounded-2xl bg-cafe-primary hover:bg-cafe-accent text-white text-xs font-black shadow-warm transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          )}
        </div>
      </section>

      {/* 2. HERO SECTION WITH SEARCH */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#302019] via-[#4A2D20] to-[#1E140F] text-white p-6 sm:p-10 lg:p-12 shadow-warm-lg">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-cafe-accent/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cafe-accent/20 border border-cafe-accent/30 text-amber-300 text-xs font-extrabold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 fill-amber-300 animate-pulse" />
            <span>Direct Culinary Partner Network</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Order Direct from Regal Indian Kitchens.
          </h1>

          <p className="text-sm sm:text-base text-cafe-cream/80 max-w-lg leading-relaxed">
            Discover fragrant Awadhi Dum Biryanis, charcoal-smoked tandoor kebabs, and handcrafted kulhad chai with zero aggregator commissions.
          </p>

          {/* Search Bar in Hero */}
          <form onSubmit={handleSearch} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-lg">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurant by name, biryani, tandoor, chai..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white text-cafe-primary placeholder:text-cafe-muted text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cafe-accent shadow-warm"
              />
              <Search className="w-4 h-4 text-cafe-muted absolute left-3.5 top-3.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-cafe-muted hover:text-cafe-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black tracking-wide shadow-warm transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Value Badges */}
          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-cafe-cream/70 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Direct Kitchen Pricing
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Live Chef Status Sync
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-300" />
              5% Coins on Every Order
            </span>
          </div>
        </div>
      </section>

      {/* 3. OFFERS & PROMOTIONS (Real supported promo codes) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-cafe-accent" />
            <h2 className="text-base sm:text-lg font-black tracking-tight text-cafe-primary">
              Exclusive Dining Offers & Discounts
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200/80 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-warm shrink-0">
              ₹50
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                CODE: WELCOME
              </span>
              <h3 className="text-xs font-extrabold text-cafe-primary mt-1">
                Flat ₹50 Off First Order
              </h3>
              <p className="text-[11px] text-cafe-muted mt-0.5">
                Apply at checkout on any order above ₹300
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-200/80 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-warm shrink-0">
              10%
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                CODE: CAFE10
              </span>
              <h3 className="text-xs font-extrabold text-cafe-primary mt-1">
                Instant 10% Royal Discount
              </h3>
              <p className="text-[11px] text-cafe-muted mt-0.5">
                Valid on all dine-in, takeaway, and delivery orders
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/5 border border-purple-200/80 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-warm shrink-0">
              🪙
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                LOYALTY CLUB
              </span>
              <h3 className="text-xs font-extrabold text-cafe-primary mt-1">
                5% Coins Cashback
              </h3>
              <p className="text-[11px] text-cafe-muted mt-0.5">
                Auto-credited upon order completion for bill deductions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CUISINE / CATEGORY TABS (Derived from database) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black tracking-tight text-cafe-primary">
            Explore by Culinary Specialty
          </h2>
          <NavLink
            to="/customer/restaurants"
            className="text-xs font-bold text-cafe-accent hover:underline flex items-center gap-1"
          >
            <span>All Restaurants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {dynamicCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCuisine(c.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all btn-press ${
                selectedCuisine === c.id
                  ? 'bg-cafe-primary text-white shadow-warm'
                  : 'bg-white hover:bg-cafe-sand/40 text-cafe-primary border border-cafe-border'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. RECENTLY VIEWED RESTAURANTS */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cafe-accent" />
              <h2 className="text-base sm:text-lg font-black tracking-tight text-cafe-primary">
                Recently Viewed Restaurants
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentlyViewed.map((item) => (
              <NavLink
                key={item.id}
                to={`/customer/restaurants/${item.id}`}
                className="p-3.5 rounded-3xl bg-white border border-cafe-border hover:border-cafe-accent shadow-warm hover:shadow-warm-md transition-all flex items-center gap-3.5 group"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-cafe-sand/40 shrink-0">
                  <SafeImage
                    src={item.banner_url || item.logo_url || '/placeholder-food.jpg'}
                    fallbackSrc="/placeholder-food.jpg"
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-cafe-primary truncate group-hover:text-cafe-accent transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-cafe-muted truncate mt-0.5">
                    {item.cuisine || item.city}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                      <span>{Number(item.rating) || 4.8}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-cafe-muted truncate">
                      {item.city || 'Kolkata'}
                    </span>
                  </div>
                </div>
              </NavLink>
            ))}
          </div>
        </section>
      )}

      {/* 6. FEATURED RESTAURANTS (Real Supabase Records) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-cafe-primary">
              Featured Partner Kitchens
            </h2>
            <p className="text-xs text-cafe-muted mt-0.5">
              Verified dining kitchens with active digital menus & authentic preparation
            </p>
          </div>
          <NavLink
            to="/customer/restaurants"
            className="text-xs font-bold text-cafe-accent hover:text-cafe-accent-hover flex items-center gap-1"
          >
            <span>View All ({restaurants.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-3xl bg-white border border-cafe-border p-4 space-y-4 animate-pulse shadow-warm-sm"
              >
                <div className="h-44 w-full bg-cafe-sand/40 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-4 w-2/3 bg-cafe-sand/50 rounded-lg" />
                  <div className="h-3 w-1/2 bg-cafe-sand/30 rounded-lg" />
                </div>
                <div className="pt-3 border-t border-cafe-border/50 flex justify-between items-center">
                  <div className="h-4 w-16 bg-cafe-sand/40 rounded-lg" />
                  <div className="h-8 w-24 bg-cafe-sand/60 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <p className="text-xs font-bold text-rose-700">{errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-warm btn-press"
            >
              Retry
            </button>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-cafe-border text-center text-cafe-muted space-y-2">
            <UtensilsCrossed className="w-10 h-10 mx-auto text-cafe-muted/60" />
            <p className="text-xs font-bold text-cafe-primary">No restaurants found in this category</p>
            <button
              onClick={() => setSelectedCuisine('all')}
              className="text-xs font-bold text-cafe-accent hover:underline"
            >
              Reset to all cuisines
            </button>
          </div>
        ) : (
          <motion.div
            variants={hubContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredRestaurants.slice(0, 6).map((rest) => {
              const isFav = favoriteRestaurantIds.has(rest.id);
              const openStatus = isRestaurantOpen(rest.opening_hours, rest.is_active);

              return (
                <motion.div
                  key={rest.id}
                  variants={hubCardVariants}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="bg-white rounded-3xl border border-cafe-border hover:border-cafe-accent/50 overflow-hidden shadow-warm hover:shadow-warm-lg transition-all group flex flex-col justify-between card-interactive"
                >
                  <div>
                    {/* Header Banner / Image */}
                    <div className="relative h-44 w-full bg-cafe-sand/40 overflow-hidden">
                      <SafeImage
                        src={
                          rest.banner_url ||
                          rest.logo_url ||
                          'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80'
                        }
                        fallbackSrc="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
                        alt={rest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavoriteRestaurant(rest.id);
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                          isFav
                            ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400/40'
                            : 'bg-white/80 text-cafe-primary hover:bg-white'
                        }`}
                        title="Bookmark restaurant"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                      </button>

                      {/* Open/Closed Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-sm ${
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

                      {/* Rating & Location Tag */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-display font-bold flex items-center gap-1 shadow-sm">
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>{Number(rest.rating) || 4.8}</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium">
                          {rest.city || 'Kolkata'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black text-cafe-primary group-hover:text-cafe-accent transition-colors line-clamp-1">
                          {rest.name}
                        </h3>
                      </div>

                      <p className="text-xs text-cafe-muted line-clamp-1">
                        {rest.cuisine || 'Royal Indian Specialties'}
                      </p>

                      {rest.tagline && (
                        <p className="text-[11px] text-cafe-muted/90 italic line-clamp-1">
                          "{rest.tagline}"
                        </p>
                      )}

                      <p className="text-[11px] text-cafe-muted/80 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cafe-accent shrink-0" />
                        <span className="truncate">{rest.address || 'Central Dining District'}</span>
                      </p>

                      {/* Supported Ordering Modes */}
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

                  {/* Actions */}
                  <div className="px-5 pb-5 pt-3 border-t border-cafe-border/50 flex items-center justify-between gap-3">
                    <NavLink
                      to={`/customer/restaurants/${rest.id}`}
                      className="text-xs font-bold text-cafe-muted hover:text-cafe-primary transition-colors flex items-center gap-1"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>About Info</span>
                    </NavLink>
                    <NavLink
                      to={`/customer/menu/${rest.id}`}
                      className="px-4 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm transition-all flex items-center gap-1.5 btn-press"
                    >
                      <span>Explore Menu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </NavLink>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* 7. RECOMMENDED DISHES (Real Supabase Products across restaurants) */}
      {featuredProducts.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <h2 className="text-xl font-black tracking-tight text-cafe-primary">
                  Signature House Creations
                </h2>
              </div>
              <p className="text-xs text-cafe-muted mt-0.5">
                Top culinary dishes prepared fresh to order by certified master chefs
              </p>
            </div>
          </div>

          <motion.div
            variants={hubContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {featuredProducts.map((p) => {
              const isFav = favoriteProductIds.has(p.id);
              const targetRest = restaurants[0] || {
                id: '22222222-2222-2222-2222-222222222201',
                name: 'Arsalan – Park Circus',
                slug: 'artisan-brew',
                currency_symbol: '₹',
                tax_percentage: 5.0,
              };

              return (
                <motion.div
                  key={p.id}
                  variants={hubCardVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-4 rounded-3xl bg-white border border-cafe-border hover:border-cafe-accent/40 shadow-warm hover:shadow-warm-md transition-all flex gap-4 items-center justify-between card-interactive"
                >
                  <div className="space-y-1.5 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center p-0.5 ${
                          p.isVeg ? 'border-emerald-600' : 'border-rose-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cafe-muted">
                        {p.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-cafe-primary line-clamp-1">
                      {p.name}
                    </h4>

                    {p.description && (
                      <p className="text-[11px] text-cafe-muted line-clamp-1">
                        {p.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <p className="text-xs font-black text-cafe-accent">
                        {formatCurrency(p.price, '₹')}
                      </p>
                      {p.prepTimeMinutes && (
                        <span className="text-[10px] text-cafe-muted flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{p.prepTimeMinutes}m</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden bg-cafe-sand/50">
                    <SafeImage
                      src={p.image}
                      fallbackSrc="/placeholder-food.jpg"
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Favorite mini button */}
                    <button
                      type="button"
                      onClick={() => toggleFavoriteProduct(p.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/80 backdrop-blur text-cafe-primary hover:bg-white"
                      title="Favorite dish"
                    >
                      <Heart className={`w-3 h-3 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    {/* Quick Add Button */}
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(
                          {
                            id: targetRest.id,
                            name: targetRest.name,
                            slug: (targetRest as any).slug || 'artisan-brew',
                            currencySymbol: (targetRest as any).currency_symbol || '₹',
                            taxPercentage: (targetRest as any).tax_percentage || 5.0,
                          },
                          p,
                          1
                        );
                      }}
                      className="absolute bottom-1.5 inset-x-1.5 py-1 rounded-xl bg-cafe-primary/95 text-white text-[11px] font-black hover:bg-cafe-accent transition-all flex items-center justify-center gap-1 shadow-warm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ADD</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      {/* 8. POPULAR RESTAURANTS SPOTLIGHT */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xl font-black tracking-tight text-cafe-primary">
              Top Rated Culinary Partners
            </h2>
          </div>
          <NavLink
            to="/customer/restaurants?sort=rating"
            className="text-xs font-bold text-cafe-accent hover:underline flex items-center gap-1"
          >
            <span>See Rankings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularRestaurants.slice(0, 3).map((r, idx) => (
            <NavLink
              key={r.id}
              to={`/customer/restaurants/${r.id}`}
              className="p-4 rounded-3xl bg-white border border-cafe-border hover:border-cafe-accent shadow-warm hover:shadow-warm-md transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center font-black text-sm shrink-0">
                #{idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-cafe-primary group-hover:text-cafe-accent transition-colors truncate">
                  {r.name}
                </h4>
                <p className="text-xs text-cafe-muted truncate mt-0.5">
                  {r.cuisine || r.city}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-xs font-black text-amber-700">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{Number(r.rating) || 5.0}</span>
                  </span>
                  <span className="text-[11px] text-cafe-muted truncate">
                    • {r.city || 'Kolkata'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cafe-muted group-hover:translate-x-1 group-hover:text-cafe-accent transition-all shrink-0" />
            </NavLink>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CustomerHubPage;
