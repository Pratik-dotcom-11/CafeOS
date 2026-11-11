import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  Plus,
  Minus,
  Heart,
  Clock,
  Sparkles,
  ShoppingBag,
  Info,
  X,
  Check,
  Flame,
  ChefHat,
  ChevronLeft,
  AlertTriangle,
  QrCode,
  MapPin,
  Utensils,
  Bike
} from 'lucide-react';
import { useCustomer, CustomerCartRestaurant } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { Product, Category, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { menuService } from '../../services/menuService';
import { restaurantService, RestaurantRow } from '../../services/restaurantService';
import { SafeImage } from '../../components/common/SafeImage';
import { isRestaurantOpen } from '../../utils/customerUtils';

export const CustomerMenuPage: React.FC = () => {
  const { restaurantSlug, restaurantId } = useParams<{ restaurantSlug?: string; restaurantId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    cart,
    cartRestaurant,
    cartTotal,
    totalItemsCount,
    addToCart,
    confirmReplaceCart,
    favoriteProductIds,
    toggleFavoriteProduct,
    tableNumber: contextTable,
    setTableNumber,
    setDiningMode
  } = useCustomer();

  const urlTableParam = searchParams.get('table');

  // Restaurant details state
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  // Customization modal state
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { name: string; price: number }>>({});
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // Cart conflict modal state
  const [conflictModalData, setConflictModalData] = useState<{
    conflictWith: string;
    pendingProduct: Product;
    pendingVariantId?: string;
    pendingAddonIds?: string[];
    pendingOptions?: { groupTitle: string; optionName: string; price: number }[];
    pendingInstructions?: string;
    pendingQuantity: number;
  } | null>(null);

  // Active table sync
  useEffect(() => {
    if (urlTableParam) {
      setTableNumber(urlTableParam);
      setDiningMode('dine-in');
      try {
        localStorage.setItem('cafeos_active_table', urlTableParam);
      } catch {}
    }
  }, [urlTableParam, setTableNumber, setDiningMode]);

  // Fetch live menu from Supabase
  useEffect(() => {
    const target = restaurantId || restaurantSlug;
    if (!target) return;

    const lookupKey = target;
    if (!lookupKey) return;

    let isMounted = true;
    async function loadMenu() {
      setIsLoadingMenu(true);
      try {
        // 1. Try public menu endpoint
        const publicData = await menuService.getPublicMenu(lookupKey);
        if (isMounted && publicData && publicData.restaurant) {
          setRestaurant(publicData.restaurant);

          if (publicData.categories && publicData.categories.length > 0) {
            setCategoriesList([
              { id: 'cat-all', name: 'All Dishes', slug: 'all', icon: '🍽️', itemCount: publicData.products.length },
              ...publicData.categories.map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                icon: c.icon || '🍛',
                itemCount: publicData.products.filter((p) => p.category === c.slug).length,
              })),
            ]);
          }

          if (publicData.products && publicData.products.length > 0) {
            setProductsList(publicData.products);
          }
        } else {
          // Fallback to direct restaurant lookup
          let rest = await restaurantService.getRestaurantById(lookupKey);
          if (!rest) rest = await restaurantService.getRestaurantBySlug(lookupKey);
          if (isMounted && rest) {
            setRestaurant(rest);
          }
        }
      } catch (err) {
        console.warn('Error loading public menu:', err);
      } finally {
        if (isMounted) setIsLoadingMenu(false);
      }
    }

    loadMenu();
    return () => {
      isMounted = false;
    };
  }, [restaurantSlug, restaurantId]);

  const openStatus = useMemo(() => {
    if (!restaurant) return { isOpen: false, label: 'Closed' };
    return isRestaurantOpen(restaurant.opening_hours, restaurant.is_active);
  }, [restaurant]);

  // Products filtering
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDiet =
        dietFilter === 'all' ||
        (dietFilter === 'veg' && p.isVeg) ||
        (dietFilter === 'non-veg' && !p.isVeg);
      return matchesCat && matchesSearch && matchesDiet;
    });
  }, [productsList, selectedCategory, searchQuery, dietFilter]);

  const handleOpenCustomize = (product: Product) => {
    if (!product.isAvailable) return;

    setActiveProduct(product);
    setModalQuantity(1);
    setSpecialInstructions('');

    // Pre-select default portion variant if available
    if (product.variants && product.variants.length > 0) {
      const def = product.variants.find((v) => v.isDefault) || product.variants[0];
      setSelectedVariant(def);
    } else {
      setSelectedVariant(null);
    }

    // Pre-select required options
    const initialOptions: Record<string, { name: string; price: number }> = {};
    if (product.customizationGroups) {
      product.customizationGroups.forEach((group) => {
        if (group.required && group.options.length > 0) {
          initialOptions[group.id] = {
            name: group.options[0].name,
            price: group.options[0].price,
          };
        }
      });
    }
    setSelectedOptions(initialOptions);
  };

  const calculateModalUnitPrice = () => {
    if (!activeProduct) return 0;
    const base = activeProduct.price;
    const variantAdj = selectedVariant ? selectedVariant.priceAdjustment : 0;
    const optionsTotal = Object.values(selectedOptions).reduce((acc, opt) => acc + opt.price, 0);
    return base + variantAdj + optionsTotal;
  };

  const handleDirectAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!restaurant || !product.isAvailable) return;

    // If product has required variants or options, open modal
    if (
      (product.variants && product.variants.length > 0) ||
      (product.customizationGroups && product.customizationGroups.some((g) => g.required))
    ) {
      handleOpenCustomize(product);
      return;
    }

    const cartRest: CustomerCartRestaurant = {
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
    };

    const res = addToCart(cartRest, product, 1);
    if (!res.success && res.conflictWith) {
      setConflictModalData({
        conflictWith: res.conflictWith,
        pendingProduct: product,
        pendingQuantity: 1,
      });
    }
  };

  const handleAddCustomizedToCart = () => {
    if (!activeProduct || !restaurant) return;

    const formattedOptions: { groupTitle: string; optionName: string; price: number }[] = [];

    if (selectedVariant) {
      formattedOptions.push({
        groupTitle: 'Portion Size',
        optionName: selectedVariant.name,
        price: selectedVariant.priceAdjustment,
      });
    }

    const selectedAddonIds: string[] = [];
    Object.entries(selectedOptions).forEach(([groupId, opt]) => {
      const group = activeProduct.customizationGroups?.find((g) => g.id === groupId);
      const optDef = group?.options.find((o) => o.name === opt.name);
      if (optDef && optDef.id) {
        selectedAddonIds.push(optDef.id);
      }
      formattedOptions.push({
        groupTitle: group ? group.title : 'Option',
        optionName: opt.name,
        price: opt.price,
      });
    });

    const cartRest: CustomerCartRestaurant = {
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
    };

    const res = addToCart(
      cartRest,
      activeProduct,
      modalQuantity,
      formattedOptions,
      specialInstructions,
      selectedVariant?.id,
      selectedAddonIds
    );

    if (!res.success && res.conflictWith) {
      setConflictModalData({
        conflictWith: res.conflictWith,
        pendingProduct: activeProduct,
        pendingVariantId: selectedVariant?.id,
        pendingAddonIds: selectedAddonIds,
        pendingOptions: formattedOptions,
        pendingInstructions: specialInstructions,
        pendingQuantity: modalQuantity,
      });
    } else {
      setActiveProduct(null);
    }
  };

  const handleConfirmReplaceCart = () => {
    if (!conflictModalData || !restaurant) return;

    const cartRest: CustomerCartRestaurant = {
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
    };

    confirmReplaceCart(
      cartRest,
      conflictModalData.pendingProduct,
      conflictModalData.pendingQuantity,
      conflictModalData.pendingOptions || [],
      conflictModalData.pendingInstructions,
      conflictModalData.pendingVariantId,
      conflictModalData.pendingAddonIds
    );

    setConflictModalData(null);
    setActiveProduct(null);
  };

  if (isLoadingMenu) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-44 sm:h-56 rounded-3xl bg-white border border-cafe-border animate-pulse" />
        <div className="h-12 rounded-2xl bg-white border border-cafe-border animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-64 rounded-3xl bg-white border border-cafe-border animate-pulse" />
          <div className="h-64 rounded-3xl bg-white border border-cafe-border animate-pulse" />
          <div className="h-64 rounded-3xl bg-white border border-cafe-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-cafe-border space-y-4 shadow-warm">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <ChefHat className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-cafe-primary">Restaurant Menu Not Found</h2>
        <p className="text-xs text-cafe-muted">
          The requested menu could not be loaded or the restaurant may be temporarily inactive.
        </p>
        <NavLink
          to="/customer/restaurants"
          className="inline-block px-5 py-2.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
        >
          Explore All Restaurants
        </NavLink>
      </div>
    );
  }

  const activeTable = urlTableParam || contextTable || 'Table 04';
  const isThisRestaurantInCart = cartRestaurant?.id === restaurant.id && totalItemsCount > 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <NavLink
          to={`/customer/restaurants/${restaurant.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cafe-muted hover:text-cafe-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Restaurant Overview</span>
        </NavLink>

        <div className="flex items-center gap-2">
          {/* Active Dining Table Badge */}
          <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Ordering: {activeTable}</span>
          </div>
        </div>
      </div>

      {/* Restaurant Header Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-warm border border-cafe-border bg-white">
        <div className="h-44 sm:h-52 w-full relative bg-cafe-sand/50">
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

          {/* Status Badge */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-cafe-primary flex items-center gap-1.5 shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{openStatus.label}</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 -mt-10 relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <SafeImage
              src={restaurant.logo_url || undefined}
              fallbackSrc="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80"
              alt={restaurant.name}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-warm shrink-0 bg-white"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-cafe-primary tracking-tight">
                  {restaurant.name}
                </h1>
                {restaurant.cuisine && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800">
                    {restaurant.cuisine}
                  </span>
                )}
              </div>
              <p className="text-xs text-cafe-muted mt-0.5 line-clamp-1">
                {restaurant.tagline || 'Direct Kitchen Partner on CafeOS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-cafe-muted bg-cafe-light px-4 py-2.5 rounded-2xl border border-cafe-border w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5 text-cafe-accent">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold text-cafe-primary">{Number(restaurant.rating) || 4.9}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cafe-accent" />
              <span>{restaurant.opening_hours || '11:00 AM – 11:00 PM'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Dietary Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cafe-muted" />
          <input
            type="text"
            placeholder="Search Dum Biryanis, Butter Chicken, Kebabs, Naan, Chai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-cafe-border text-xs text-cafe-primary placeholder:text-cafe-muted focus:outline-none focus:ring-2 focus:ring-cafe-accent/30 shadow-sm"
          />
        </div>

        {/* Veg / Non-Veg Quick Dietary Toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-cafe-border shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => setDietFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dietFilter === 'all'
                ? 'bg-cafe-primary text-white shadow-sm'
                : 'text-cafe-muted hover:text-cafe-primary'
            }`}
          >
            All Dishes
          </button>
          <button
            type="button"
            onClick={() => setDietFilter('veg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dietFilter === 'veg'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="w-3.5 h-3.5 border border-emerald-600 rounded-sm flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </span>
            <span>Pure Veg</span>
          </button>
          <button
            type="button"
            onClick={() => setDietFilter('non-veg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              dietFilter === 'non-veg'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <span className="w-3.5 h-3.5 border border-rose-700 rounded-sm flex items-center justify-center">
              <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-rose-700" />
            </span>
            <span>Non-Veg</span>
          </button>
        </div>
      </div>

      {/* Horizontal Category Navigation Bar */}
      {categoriesList.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                selectedCategory === cat.slug
                  ? 'bg-cafe-accent text-white border-cafe-accent shadow-warm scale-[1.02]'
                  : 'bg-white border-cafe-border text-cafe-primary hover:border-cafe-accent/40'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span>{cat.name}</span>
              {cat.itemCount !== undefined && cat.itemCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedCategory === cat.slug
                      ? 'bg-white/20 text-white'
                      : 'bg-cafe-sand text-cafe-muted'
                  }`}
                >
                  {cat.itemCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-cafe-primary flex items-center gap-2">
            <span>
              {selectedCategory === 'all'
                ? 'Signature Menu Collection'
                : categoriesList.find((c) => c.slug === selectedCategory)?.name || 'Menu'}
            </span>
            <span className="text-xs font-medium text-cafe-muted">
              ({filteredProducts.length} items)
            </span>
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-cafe-border space-y-3">
            <ChefHat className="w-12 h-12 text-cafe-muted/60 mx-auto" />
            <h3 className="text-sm font-bold text-cafe-primary">No dishes found</h3>
            <p className="text-xs text-cafe-muted">
              Try switching categories or clearing search filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((prod) => {
              const isFav = favoriteProductIds.has(prod.id);
              const isOrderable = prod.isAvailable;

              return (
                <motion.div
                  key={prod.id}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`bg-white rounded-3xl border border-cafe-border overflow-hidden shadow-warm hover:shadow-warm-md transition-all flex flex-col justify-between group card-interactive ${
                    !isOrderable ? 'opacity-70 bg-stone-50' : ''
                  }`}
                >
                  <div>
                    {/* Food Photo Container */}
                    <div className="relative h-44 w-full overflow-hidden bg-cafe-sand/40">
                      <SafeImage
                        src={prod.image}
                        alt={prod.name}
                        category={prod.category}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isOrderable ? 'group-hover:scale-105' : 'grayscale'
                        }`}
                      />

                      {/* Veg / Non-Veg Indicator */}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur p-1.5 rounded-lg shadow-sm">
                        {prod.isVeg ? (
                          <div
                            className="w-4 h-4 border border-emerald-600 rounded-sm flex items-center justify-center"
                            title="Pure Vegetarian"
                          >
                            <div className="w-2 h-2 rounded-full bg-emerald-600" />
                          </div>
                        ) : (
                          <div
                            className="w-4 h-4 border border-rose-700 rounded-sm flex items-center justify-center"
                            title="Non-Vegetarian"
                          >
                            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[7px] border-b-rose-700" />
                          </div>
                        )}
                      </div>

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteProduct(prod.id);
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                          isFav
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-black/30 text-white hover:bg-black/50'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-600' : ''}`} />
                      </button>

                      {/* Unavailable / Sold Out Banner */}
                      {!isOrderable && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg">
                            Sold Out (86)
                          </span>
                        </div>
                      )}

                      {/* Prep time badge */}
                      {isOrderable && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{prod.prepTimeMinutes || 15}m</span>
                        </div>
                      )}
                    </div>

                    {/* Dish Content */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-cafe-primary group-hover:text-cafe-accent transition-colors leading-snug">
                          {prod.name}
                        </h3>
                      </div>

                      {prod.description && (
                        <p className="text-xs text-cafe-muted mt-1.5 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-3 text-xs">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{(prod.rating || 4.9).toFixed(1)}</span>
                        </div>
                        {prod.reviewCount ? (
                          <span className="text-cafe-muted text-[11px]">
                            ({prod.reviewCount}+ orders)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Footer */}
                  <div className="p-4 sm:p-5 pt-0 flex items-center justify-between border-t border-cafe-border/50 mt-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base sm:text-lg font-black text-cafe-primary">
                          {formatCurrency(prod.price, restaurant.currency_symbol || '₹')}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-xs text-cafe-muted line-through">
                            {formatCurrency(prod.originalPrice, restaurant.currency_symbol || '₹')}
                          </span>
                        )}
                      </div>
                      {prod.variants && prod.variants.length > 0 && (
                        <span className="text-[10px] text-cafe-accent font-semibold block">
                          Customizable
                        </span>
                      )}
                    </div>

                    {/* Action Button: Disabled if Sold Out */}
                    {!isOrderable ? (
                      <button
                        type="button"
                        disabled
                        className="px-3.5 py-2 rounded-xl bg-stone-200 text-stone-500 text-xs font-bold cursor-not-allowed"
                      >
                        Sold Out
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          if (
                            (prod.variants && prod.variants.length > 0) ||
                            (prod.customizationGroups && prod.customizationGroups.length > 0)
                          ) {
                            handleOpenCustomize(prod);
                          } else {
                            handleDirectAdd(prod, e);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all btn-press"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {(prod.variants && prod.variants.length > 0) ||
                          (prod.customizationGroups && prod.customizationGroups.length > 0)
                            ? 'Customize'
                            : 'Add'}
                        </span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar (Sticky when items exist) */}
      {isThisRestaurantInCart && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom-4">
          <div className="p-3 sm:p-4 rounded-2xl bg-cafe-primary text-white shadow-2xl border border-white/10 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cafe-accent text-white flex items-center justify-center font-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in Bag
                </p>
                <p className="text-xs font-bold text-cafe-accent">
                  Total: {formatCurrency(cartTotal, restaurant.currency_symbol || '₹')}
                </p>
              </div>
            </div>

            <NavLink
              to="/customer/cart"
              className="px-4 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black shadow-warm flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <span>View Bag</span>
              <span>&rarr;</span>
            </NavLink>
          </div>
        </div>
      )}

      {/* Product Customization Modal with Variants & Add-ons */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full border border-cafe-border shadow-2xl max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-cafe-border">
              <div className="flex items-center gap-3">
                <SafeImage
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  category={activeProduct.category}
                  className="w-14 h-14 rounded-2xl object-cover ring-1 ring-cafe-border"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    {activeProduct.isVeg ? (
                      <span className="w-3 h-3 border border-emerald-600 rounded-sm flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </span>
                    ) : (
                      <span className="w-3 h-3 border border-rose-700 rounded-sm flex items-center justify-center">
                        <span className="w-0 h-0 border-l-[2.5px] border-l-transparent border-r-[2.5px] border-r-transparent border-b-[5px] border-b-rose-700" />
                      </span>
                    )}
                    <h3 className="font-black text-sm text-cafe-primary leading-snug">
                      {activeProduct.name}
                    </h3>
                  </div>
                  <p className="text-xs text-cafe-accent font-black mt-1">
                    {formatCurrency(calculateModalUnitPrice(), restaurant.currency_symbol || '₹')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                className="p-1 rounded-full text-cafe-muted hover:bg-cafe-sand/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customization Body */}
            <div className="space-y-4 my-4">
              {/* Portion Sizes / Variants */}
              {activeProduct.variants && activeProduct.variants.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-cafe-primary">
                      Choose Portion Size
                    </span>
                    <span className="text-[10px] font-bold text-cafe-accent bg-cafe-accent/10 px-2 py-0.5 rounded-md">
                      Required
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {activeProduct.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`p-3 rounded-2xl border cursor-pointer text-xs transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-cafe-accent bg-cafe-cream/60 text-cafe-primary font-bold ring-2 ring-cafe-accent/40 shadow-sm'
                              : 'border-cafe-border hover:bg-cafe-sand/30 text-cafe-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{v.name}</span>
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-cafe-accent bg-cafe-accent' : 'border-stone-300'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <span className="text-[11px] font-extrabold text-cafe-accent mt-1">
                            {v.priceAdjustment === 0
                              ? 'Standard'
                              : `+${formatCurrency(
                                  v.priceAdjustment,
                                  restaurant.currency_symbol || '₹'
                                )}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add-on Groups */}
              {activeProduct.customizationGroups?.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-cafe-primary">
                      {group.title}
                    </span>
                    {group.required && (
                      <span className="text-[10px] font-bold text-cafe-accent bg-cafe-accent/10 px-2 py-0.5 rounded-md">
                        Required
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isSelected = selectedOptions[group.id]?.name === opt.name;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            setSelectedOptions((prev) => {
                              if (isSelected && !group.required) {
                                const next = { ...prev };
                                delete next[group.id];
                                return next;
                              }
                              return {
                                ...prev,
                                [group.id]: { name: opt.name, price: opt.price },
                              };
                            });
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-cafe-accent bg-cafe-cream/60 text-cafe-primary font-bold ring-1 ring-cafe-accent'
                              : 'border-cafe-border hover:bg-cafe-sand/30 text-cafe-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                isSelected
                                  ? 'border-cafe-accent bg-cafe-accent text-white'
                                  : 'border-stone-300'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span>{opt.name}</span>
                          </div>
                          {opt.price > 0 && (
                            <span className="text-cafe-accent font-bold">
                              +{formatCurrency(opt.price, restaurant.currency_symbol || '₹')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Special Instructions */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-cafe-muted block mb-1">
                  Special Kitchen Request
                </label>
                <input
                  type="text"
                  placeholder="e.g. less spicy, make naan crispy, extra mint chutney..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-cafe-light border border-cafe-border rounded-xl focus:outline-none focus:ring-1 focus:ring-cafe-accent"
                />
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-cafe-primary">Quantity</span>
                <div className="flex items-center gap-3 bg-cafe-light border border-cafe-border px-3 py-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="p-0.5 text-cafe-muted hover:text-cafe-primary"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-black text-sm w-4 text-center">{modalQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    className="p-0.5 text-cafe-muted hover:text-cafe-primary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddCustomizedToCart}
              className="w-full py-3.5 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-extrabold text-xs uppercase tracking-wider shadow-warm transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                Add to Bag •{' '}
                {formatCurrency(
                  calculateModalUnitPrice() * modalQuantity,
                  restaurant.currency_symbol || '₹'
                )}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Multi-Restaurant Bag Conflict Modal */}
      {conflictModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-cafe-border animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-cafe-primary">Replace items in bag?</h3>
              <p className="text-xs text-cafe-muted leading-relaxed">
                Your order bag currently contains items from{' '}
                <strong className="text-cafe-primary">{conflictModalData.conflictWith}</strong>.
                Each order must be from a single restaurant.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmReplaceCart}
                className="w-full py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black shadow-warm transition-all"
              >
                Clear Bag &amp; Add from {restaurant.name}
              </button>

              <button
                type="button"
                onClick={() => setConflictModalData(null)}
                className="w-full py-2.5 rounded-xl bg-cafe-light text-cafe-muted hover:text-cafe-primary text-xs font-bold transition-all"
              >
                Keep Existing Bag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMenuPage;
