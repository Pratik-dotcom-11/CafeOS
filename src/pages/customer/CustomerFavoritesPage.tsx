import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Star, MapPin, ArrowRight, Plus, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import { customerService, CustomerFavorite } from '../../services/customerService';
import { SafeImage } from '../../components/common/SafeImage';
import { formatCurrency } from '../../utils/formatters';

export const CustomerFavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const {
    addToCart,
    favoriteRestaurantIds,
    toggleFavoriteRestaurant,
    favoriteProductIds,
    toggleFavoriteProduct,
  } = useCustomer();

  const [activeTab, setActiveTab] = useState<'restaurants' | 'dishes'>('restaurants');
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<CustomerFavorite[]>([]);
  const [favoriteDishes, setFavoriteDishes] = useState<CustomerFavorite[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadFavs() {
      if (!user) return;
      try {
        setIsLoading(true);
        const data = await customerService.getFavorites(user.id);
        setFavoriteRestaurants(data.favoriteRestaurants);
        setFavoriteDishes(data.favoriteDishes);
      } catch (err) {
        console.warn('Error loading favorites', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFavs();
  }, [user, favoriteRestaurantIds, favoriteProductIds]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-cafe-primary tracking-tight">Saved Favorites</h1>
        <p className="text-xs text-cafe-muted mt-0.5">
          Your bookmarked partner restaurants and go-to signature dishes for instant ordering.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-cafe-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('restaurants')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'restaurants'
              ? 'bg-cafe-primary text-white shadow-warm'
              : 'bg-white hover:bg-cafe-light text-cafe-muted border border-cafe-border'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Favorite Cafes ({favoriteRestaurants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dishes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'dishes'
              ? 'bg-cafe-primary text-white shadow-warm'
              : 'bg-white hover:bg-cafe-light text-cafe-muted border border-cafe-border'
          }`}
        >
          <Heart className="w-4 h-4 fill-current text-rose-500" />
          <span>Favorite Dishes ({favoriteDishes.length})</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-60 rounded-3xl bg-white border border-cafe-border animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'restaurants' ? (
        favoriteRestaurants.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-cafe-border space-y-3">
            <Heart className="w-12 h-12 text-cafe-muted/40 mx-auto" />
            <h3 className="text-base font-black text-cafe-primary">No favorite cafes bookmarked</h3>
            <p className="text-xs text-cafe-muted max-w-sm mx-auto">
              Explore our restaurant directory and tap the heart icon to save your favorite dining spots.
            </p>
            <NavLink
              to="/customer/restaurants"
              className="inline-block px-5 py-2 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
            >
              Discover Restaurants
            </NavLink>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteRestaurants.map((fav) => {
              const r = fav.restaurant!;
              return (
                <div
                  key={fav.id}
                  className="bg-white rounded-3xl border border-cafe-border overflow-hidden shadow-warm p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-cafe-primary line-clamp-1">{r.name}</h3>
                        <p className="text-xs text-cafe-muted mt-0.5">{r.cuisine} • {r.city}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFavoriteRestaurant(r.id)}
                        className="p-2 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Remove favorite"
                      >
                        <Heart className="w-4 h-4 fill-rose-600" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        <span>{r.rating}</span>
                      </span>
                      <span className="text-xs text-cafe-muted">Verified Direct Kitchen</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-cafe-border/60 flex items-center justify-between">
                    <NavLink
                      to={`/customer/restaurants/${r.id}`}
                      className="text-xs font-bold text-cafe-muted hover:text-cafe-primary"
                    >
                      Overview
                    </NavLink>
                    <NavLink
                      to={`/customer/menu/${r.id}`}
                      className="px-4 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5"
                    >
                      <span>Open Menu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </NavLink>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : favoriteDishes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-cafe-border space-y-3">
          <Heart className="w-12 h-12 text-cafe-muted/40 mx-auto" />
          <h3 className="text-base font-black text-cafe-primary">No favorite dishes saved yet</h3>
          <p className="text-xs text-cafe-muted max-w-sm mx-auto">
            Save individual biryanis, curries, or teas while exploring menus for quick 1-click ordering.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favoriteDishes.map((fav) => {
            const p = fav.product!;
            return (
              <div
                key={fav.id}
                className="p-4 rounded-3xl bg-white border border-cafe-border shadow-warm flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-sm border flex items-center justify-center p-0.5 ${p.isVeg ? 'border-emerald-600' : 'border-rose-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                    </span>
                    <span className="text-[10px] font-bold text-cafe-muted uppercase truncate max-w-[140px]">{p.restaurantName}</span>
                  </div>
                  <h4 className="text-sm font-black text-cafe-primary line-clamp-1">{p.name}</h4>
                  <p className="text-xs font-black text-cafe-accent">{formatCurrency(p.price, '₹')}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleFavoriteProduct(p.id)}
                    className="p-2 rounded-xl hover:bg-rose-50 text-rose-500"
                    title="Remove from favorites"
                  >
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(
                        {
                          id: p.restaurantId,
                          name: p.restaurantName || 'CafeOS Restaurant',
                          slug: 'artisan-brew',
                          currencySymbol: '₹',
                          taxPercentage: 5.0,
                        },
                        {
                          id: p.id,
                          name: p.name,
                          description: '',
                          category: 'Favorites',
                          price: p.price,
                          image: p.image || '/placeholder-food.jpg',
                          isVeg: p.isVeg,
                          isAvailable: true,
                          rating: 4.9,
                          reviewCount: 150,
                          prepTimeMinutes: 15,
                        },
                        1
                      );
                    }}
                    className="p-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white shadow-warm"
                    title="Add to cart"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerFavoritesPage;

