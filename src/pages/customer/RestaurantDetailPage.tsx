import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Heart,
  ChevronLeft,
  Sparkles,
  Utensils,
  Share2,
  QrCode,
  ShoppingBag,
  Bike,
  Plus,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { restaurantService, RestaurantRow } from '../../services/restaurantService';
import { menuService } from '../../services/menuService';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { SafeImage } from '../../components/common/SafeImage';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { isRestaurantOpen, addRecentlyViewedRestaurant } from '../../utils/customerUtils';
import { customerService, CustomerReview } from '../../services/customerService';

export const RestaurantDetailPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    favoriteRestaurantIds,
    toggleFavoriteRestaurant,
    addToCart,
    cartRestaurant,
    setTableNumber,
    tableNumber,
    setDiningMode,
    diningMode,
  } = useCustomer();

  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);

  // Check URL table query parameter (from QR code scan)
  const qrTableParam = searchParams.get('table');

  useEffect(() => {
    if (qrTableParam) {
      setTableNumber(qrTableParam);
      setDiningMode('dine-in');
      try {
        localStorage.setItem('cafeos_active_table', qrTableParam);
      } catch {
        // ignore
      }
    }
  }, [qrTableParam, setTableNumber, setDiningMode]);

  useEffect(() => {
    async function loadData() {
      if (!restaurantId) return;
      try {
        setIsLoading(true);
        // Can be UUID or slug
        let restData = await restaurantService.getRestaurantById(restaurantId);
        if (!restData) {
          restData = await restaurantService.getRestaurantBySlug(restaurantId);
        }
        if (restData) {
          setRestaurant(restData);
          addRecentlyViewedRestaurant(restData);

          try {
            const [menuData, reviewsData] = await Promise.all([
              menuService.getPublicMenu(restData.id),
              customerService.getRestaurantReviews(restData.id),
            ]);
            if (menuData && menuData.products) {
              setProducts(menuData.products);
              const uniqueCats = Array.from(
                new Set(menuData.products.map((p) => p.category).filter(Boolean))
              );
              setCategories(uniqueCats);
            }
            if (reviewsData) {
              setReviews(reviewsData);
            }
          } catch (menuErr) {
            console.warn('Could not load menu products or reviews', menuErr);
          }
        }
      } catch (err) {
        console.warn('Error loading restaurant detail', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [restaurantId]);

  const openStatus = useMemo(() => {
    if (!restaurant) return { isOpen: false, label: 'Closed' };
    return isRestaurantOpen(restaurant.opening_hours, restaurant.is_active);
  }, [restaurant]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesVeg = !vegOnly || p.isVeg;
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesVeg && matchesSearch;
    });
  }, [products, selectedCategory, vegOnly, searchQuery]);

  const handleQuickAdd = (p: Product, e: React.MouseEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    addToCart(
      {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        currencySymbol: restaurant.currency_symbol || '₹',
        taxPercentage: restaurant.tax_percentage ?? 5.0,
        delivery_available: restaurant.delivery_available,
        takeaway_available: restaurant.takeaway_available,
        address: restaurant.address,
        city: restaurant.city,
        contact_phone: restaurant.contact_phone,
      },
      p,
      1
    );
    setAddedItemIds((prev) => new Set(prev).add(p.id));
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
    }, 1500);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-80 rounded-3xl bg-white border border-cafe-border animate-pulse" />
        <div className="h-32 rounded-3xl bg-white border border-cafe-border animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="h-44 rounded-3xl bg-white border border-cafe-border animate-pulse" />
          <div className="h-44 rounded-3xl bg-white border border-cafe-border animate-pulse" />
          <div className="h-44 rounded-3xl bg-white border border-cafe-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center bg-white rounded-3xl border border-cafe-border space-y-4 my-10 shadow-warm">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-cafe-primary">Restaurant Not Found</h2>
        <p className="text-xs text-cafe-muted">
          The requested restaurant could not be located or may be temporarily disabled.
        </p>
        <NavLink
          to="/customer/restaurants"
          className="inline-block px-5 py-2.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
        >
          Back to Restaurant Directory
        </NavLink>
      </div>
    );
  }

  const isFav = favoriteRestaurantIds.has(restaurant.id);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/customer/restaurants')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cafe-muted hover:text-cafe-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>All Restaurants</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share QR Button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 rounded-xl border border-cafe-border bg-white hover:bg-cafe-light text-cafe-primary text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5 text-cafe-accent" />
            <span>QR & Share</span>
          </button>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={() => toggleFavoriteRestaurant(restaurant.id)}
            className={`p-2 rounded-xl border transition-all ${
              isFav
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-cafe-border text-cafe-muted hover:text-cafe-primary'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* QR Code Verified Dine-In Banner */}
      {qrTableParam && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300 dark:border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-cafe-primary dark:text-amber-100 flex items-center gap-1.5">
                <span>Dine-In QR Verified</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  Table {qrTableParam}
                </span>
              </p>
              <p className="text-[11px] text-cafe-muted">
                Your orders will be dispatched directly to Table {qrTableParam} at {restaurant.name}.
              </p>
            </div>
          </div>

          {!user && (
            <NavLink
              to={`/customer/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
              className="px-4 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black shrink-0 text-center shadow-warm"
            >
              Sign In to Save Rewards
            </NavLink>
          )}
        </div>
      )}

      {/* Hero Showcase Card */}
      <div className="bg-white rounded-3xl border border-cafe-border overflow-hidden shadow-warm">
        {/* Banner */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full bg-cafe-sand/50">
          <SafeImage
            src={
              restaurant.banner_url ||
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
            }
            fallbackSrc="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />

          {/* Floating Logo */}
          {restaurant.logo_url && (
            <div className="absolute top-6 left-6 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-2xl border-2 border-white/80 overflow-hidden">
              <SafeImage
                src={restaurant.logo_url}
                fallbackSrc="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80"
                alt={restaurant.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          )}

          {/* Bottom Banner Content */}
          <div className="absolute bottom-6 inset-x-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center gap-1 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>{Number(restaurant.rating) || 4.9}</span>
              </span>

              {/* Live Open / Closed indicator */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm ${
                  openStatus.isOpen ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    openStatus.isOpen ? 'bg-white animate-pulse' : 'bg-white/80'
                  }`}
                />
                <span>{openStatus.label}</span>
              </span>

              {restaurant.cuisine && (
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                  {restaurant.cuisine}
                </span>
              )}

              {restaurant.city && (
                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-xs font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{restaurant.city}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{restaurant.name}</h1>
            {restaurant.tagline && (
              <p className="text-xs sm:text-sm text-white/85 max-w-2xl font-medium">
                {restaurant.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Operating Details & Contact Row */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-cafe-border bg-cafe-light/30">
          {/* Operating Hours */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
                Operating Hours
              </p>
              <p className="text-xs font-extrabold text-cafe-primary">
                {restaurant.opening_hours || '10:00 AM – 11:30 PM'}
              </p>
              <p className="text-[11px] text-cafe-muted mt-0.5">
                {openStatus.isOpen ? 'Serving orders right now' : 'Kitchen currently closed'}
              </p>
            </div>
          </div>

          {/* Location & Directions */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
                Address & Area
              </p>
              <p className="text-xs font-extrabold text-cafe-primary">
                {restaurant.address || 'Park Street Area'}
              </p>
              {restaurant.city && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${restaurant.name} ${restaurant.address || ''} ${restaurant.city}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-cafe-accent hover:underline mt-0.5"
                >
                  <span>Get Directions</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Contact Helpline */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
                Contact & Support
              </p>
              {restaurant.contact_phone ? (
                <a
                  href={`tel:${restaurant.contact_phone}`}
                  className="text-xs font-extrabold text-cafe-primary hover:text-cafe-accent block"
                >
                  {restaurant.contact_phone}
                </a>
              ) : (
                <p className="text-xs font-extrabold text-cafe-primary">+91 98451 34911</p>
              )}
              {restaurant.contact_email && (
                <a
                  href={`mailto:${restaurant.contact_email}`}
                  className="text-[11px] text-cafe-muted hover:text-cafe-accent block mt-0.5 truncate"
                >
                  {restaurant.contact_email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Available Ordering Modes */}
        <div className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-cafe-muted mr-1">Available Modes:</span>
            <span className="px-3 py-1.5 rounded-xl bg-cafe-light border border-cafe-border text-cafe-primary text-xs font-bold flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-cafe-accent" />
              <span>Dine-In QR</span>
            </span>
            {restaurant.takeaway_available && (
              <span className="px-3 py-1.5 rounded-xl bg-cafe-light border border-cafe-border text-cafe-primary text-xs font-bold flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                <span>Curbside Takeaway</span>
              </span>
            )}
            {restaurant.delivery_available && (
              <span className="px-3 py-1.5 rounded-xl bg-cafe-light border border-cafe-border text-cafe-primary text-xs font-bold flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-emerald-600" />
                <span>Doorstep Delivery</span>
              </span>
            )}
          </div>

          <NavLink
            to={`/customer/menu/${restaurant.id}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black shadow-warm transition-all flex items-center justify-center gap-2"
          >
            <span>Open Dedicated Menu</span>
            <Utensils className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* Menu Catalog Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-cafe-primary">Live Menu & Ordering</h2>
            <p className="text-xs text-cafe-muted mt-0.5">
              Browse dishes prepared fresh to order at {restaurant.name}.
            </p>
          </div>

          {/* Search & Veg toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-cafe-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes or ingredients..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-cafe-border text-xs focus:outline-none focus:border-cafe-accent shadow-sm"
              />
            </div>

            {/* Veg Only Toggle */}
            <button
              type="button"
              onClick={() => setVegOnly((v) => !v)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 btn-press ${
                vegOnly
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-cafe-border text-cafe-muted hover:text-cafe-primary'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </span>
              <span>Pure Veg Only</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all btn-press ${
                selectedCategory === 'all'
                  ? 'bg-cafe-primary text-white shadow-sm'
                  : 'bg-white border border-cafe-border text-cafe-muted hover:text-cafe-primary'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all btn-press ${
                  selectedCategory === cat
                    ? 'bg-cafe-primary text-white shadow-sm'
                    : 'bg-white border border-cafe-border text-cafe-muted hover:text-cafe-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-cafe-border space-y-3">
            <Utensils className="w-10 h-10 text-cafe-muted/50 mx-auto" />
            <h3 className="text-sm font-bold text-cafe-primary">No dishes match your filter</h3>
            <p className="text-xs text-cafe-muted">
              Try searching for something else or clearing the pure veg toggle.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setVegOnly(false);
              }}
              className="px-4 py-2 rounded-xl bg-cafe-light text-cafe-primary text-xs font-bold hover:bg-cafe-sand"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const isAdded = addedItemIds.has(p.id);

              return (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="p-4 rounded-3xl bg-white border border-cafe-border hover:border-cafe-accent/40 shadow-sm hover:shadow-warm transition-all flex flex-col justify-between gap-3 group card-interactive"
                >
                  <div className="flex gap-3">
                    {/* Item Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-cafe-sand/40 overflow-hidden shrink-0">
                      <SafeImage
                        src={p.image}
                        fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3 h-3 rounded-sm border flex items-center justify-center p-0.5 shrink-0 ${
                            p.isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>
                        <span className="text-[10px] font-bold text-cafe-muted uppercase truncate">
                          {p.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-cafe-primary line-clamp-1">{p.name}</h4>
                      {p.description && (
                        <p className="text-[11px] text-cafe-muted line-clamp-2">{p.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Price & Add to Cart Action */}
                  <div className="pt-2 border-t border-cafe-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-cafe-accent">
                        {formatCurrency(p.price, restaurant.currency_symbol || '₹')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(p, e)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-sm btn-press ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-cafe-accent hover:bg-cafe-accent-hover text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verified Diner Reviews Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cafe-border">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-cafe-primary tracking-tight">
                Verified Diner Reviews & Ratings
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                100% Verified
              </span>
            </div>
            <p className="text-xs text-cafe-muted mt-0.5">
              Authentic feedback posted exclusively by diners with completed orders.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 shrink-0">
            <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-cafe-primary">
                  {reviews.length > 0
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                    : (restaurant.rating || 4.8).toFixed(1)}
                </span>
                <span className="text-xs text-cafe-muted font-bold">/ 5.0</span>
              </div>
              <p className="text-[10px] text-cafe-muted font-semibold">
                {reviews.length > 0 ? `${reviews.length} Verified Reviews` : 'Top Rated Dining Partner'}
              </p>
            </div>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-cafe-muted">
              No diner reviews published yet. Be the first to place an order and review your dining experience!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-cafe-light/30 border border-cafe-border space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cafe-accent text-white font-bold text-xs flex items-center justify-center">
                        {rev.customer?.fullName ? rev.customer.fullName.charAt(0).toUpperCase() : 'D'}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-cafe-primary">
                          {rev.customer?.fullName || 'Verified Diner'}
                        </h4>
                        <span className="text-[10px] text-cafe-muted">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            dateStyle: 'medium',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.product?.name && (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-cafe-sand/50 text-[10px] font-bold text-cafe-accent">
                      Dish: {rev.product.name}
                    </span>
                  )}

                  {rev.reviewText && (
                    <p className="text-xs text-cafe-primary leading-relaxed">
                      "{rev.reviewText}"
                    </p>
                  )}
                </div>

                {rev.ownerReply && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-800">
                      <span>Restaurant Response</span>
                      {rev.ownerReplyAt && (
                        <span>
                          {new Date(rev.ownerReplyAt).toLocaleDateString('en-IN', {
                            dateStyle: 'short',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed italic">
                      "{rev.ownerReply}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share / QR Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-cafe-primary">Share Restaurant QR</h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full bg-cafe-light text-cafe-muted hover:text-cafe-primary flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-cafe-light/50 rounded-2xl text-center space-y-3 border border-cafe-border">
              <div className="w-40 h-40 mx-auto bg-white p-3 rounded-2xl border border-cafe-border flex items-center justify-center shadow-inner">
                {/* Dynamically generated QR preview */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    window.location.href
                  )}`}
                  alt="Restaurant QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-black text-cafe-primary">{restaurant.name}</p>
                <p className="text-[11px] text-cafe-muted">
                  Scan to explore live menu and order from any table.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-warm"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Copy Direct Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-full py-2 rounded-xl bg-cafe-light text-cafe-muted hover:text-cafe-primary text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetailPage;
