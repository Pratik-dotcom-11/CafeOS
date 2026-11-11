import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  UtensilsCrossed,
  ShoppingBag,
  Heart,
  Clock,
  User,
  MapPin,
  Search,
  Sparkles,
  Award,
  HelpCircle,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Bell,
  Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCustomer } from '../context/CustomerContext';
import { CafeLogo } from '../components/common/CafeLogo';
import { formatCurrency } from '../utils/formatters';
import { NotificationCenterModal } from '../components/customer/NotificationCenterModal';

export const CustomerPortalLayout: React.FC = () => {
  const { user, profile, isAuthenticated, signOut, workspaces } = useAuth();
  const {
    totalItemsCount,
    cartTotal,
    cartRestaurant,
    selectedAddress,
    rewards,
    favoriteRestaurantIds,
    favoriteProductIds,
    unreadNotificationsCount,
    setIsNotificationCenterOpen,
  } = useCustomer();

  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalFavoritesCount = favoriteRestaurantIds.size + favoriteProductIds.size;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/restaurants?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUserDropdownOpen(false);
    navigate('/customer');
  };

  const isCartActive = location.pathname === '/customer/cart';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-cafe-primary flex flex-col font-sans selection:bg-cafe-accent/20">
      {/* 1. TOP CONSUMER HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cafe-border/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Location */}
          <div className="flex items-center gap-4 shrink-0">
            <NavLink to="/customer" className="flex items-center gap-2.5 group">
              <CafeLogo size={36} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-cafe-primary group-hover:text-cafe-accent transition-colors">
                    Café<span className="text-cafe-accent">OS</span>
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    Dining
                  </span>
                </div>
                <p className="text-[10px] font-medium text-cafe-muted -mt-0.5 hidden sm:block">
                  Curated Culinary Discovery
                </p>
              </div>
            </NavLink>

            {/* Delivery Location Pill */}
            <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-cafe-border text-xs">
              <MapPin className="w-3.5 h-3.5 text-cafe-accent shrink-0" />
              <div className="truncate max-w-[180px]">
                <span className="font-extrabold text-cafe-primary">
                  {selectedAddress ? selectedAddress.label : 'Deliver to'}
                </span>
                <span className="text-cafe-muted ml-1 truncate">
                  {selectedAddress ? `${selectedAddress.landmark || selectedAddress.city}` : 'Kolkata'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex flex-1 max-w-md mx-2 relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, biryani, artisanal coffee, cafes..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-cafe-light/70 border border-cafe-border/90 focus:border-cafe-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-cafe-accent/20 transition-all placeholder:text-cafe-muted"
            />
            <Search className="w-4 h-4 text-cafe-muted absolute left-3.5 top-2.5 pointer-events-none" />
          </form>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Explore Link */}
            <NavLink
              to="/customer/restaurants"
              className={({ isActive }) =>
                `hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-cafe-accent text-white shadow-warm'
                    : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-light/60'
                }`
              }
            >
              <Compass className="w-4 h-4" />
              <span>Restaurants</span>
            </NavLink>

            {/* Favorites Icon */}
            <NavLink
              to="/customer/favorites"
              className={({ isActive }) =>
                `relative p-2.5 rounded-xl transition-all hidden sm:flex items-center justify-center ${
                  isActive
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-cafe-muted hover:text-rose-600 hover:bg-rose-50/60'
                }`
              }
              title="Saved Favorites"
            >
              <Heart className="w-5 h-5" />
              {totalFavoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalFavoritesCount}
                </span>
              )}
            </NavLink>

            {/* Notification Bell */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsNotificationCenterOpen(true)}
                className="relative p-2.5 rounded-xl text-cafe-muted hover:text-cafe-primary hover:bg-cafe-light/60 transition-all flex items-center justify-center"
                title="Order Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-sm">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Cart Button */}
            <NavLink
              to="/customer/cart"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-warm ${
                isCartActive
                  ? 'bg-cafe-accent text-white'
                  : 'bg-cafe-primary text-white hover:bg-stone-800'
              }`}
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-cafe-primary font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">
                {totalItemsCount > 0 ? formatCurrency(cartTotal, cartRestaurant?.currencySymbol || '₹') : 'Cart'}
              </span>
            </NavLink>

            {/* User Account / Login */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-cafe-border/80 bg-white hover:bg-cafe-light/50 transition-all text-xs font-bold"
                >
                  <div className="w-7 h-7 rounded-lg bg-cafe-accent/15 text-cafe-accent font-black flex items-center justify-center text-xs">
                    {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="truncate max-w-[100px] text-[11px] font-extrabold text-cafe-primary">
                      {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                      <span>{rewards?.pointsBalance ?? 100} Coins</span>
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-cafe-muted hidden sm:block" />
                </button>

                {/* Account Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-cafe-border shadow-warm-lg p-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 mb-2">
                        <p className="text-xs font-black text-cafe-primary">
                          {profile?.full_name || 'CaféOS Member'}
                        </p>
                        <p className="text-[11px] text-cafe-muted truncate">{user?.email}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                          <span className="text-amber-800 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600 fill-amber-600" />
                            {rewards?.pointsBalance ?? 100} Loyalty Coins
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-200/60 text-amber-900 text-[10px]">
                            {rewards?.tier ?? 'Bronze'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5 text-xs font-semibold text-cafe-primary">
                        <NavLink
                          to="/customer/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cafe-light/60 transition-colors"
                        >
                          <Clock className="w-4 h-4 text-cafe-accent" />
                          <span>My Orders & Receipts</span>
                        </NavLink>
                        <NavLink
                          to="/customer/favorites"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cafe-light/60 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span>Saved Favorites</span>
                        </NavLink>
                        <NavLink
                          to="/customer/rewards"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cafe-light/60 transition-colors"
                        >
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>Rewards & Perks</span>
                        </NavLink>
                        <NavLink
                          to="/customer/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cafe-light/60 transition-colors"
                        >
                          <User className="w-4 h-4 text-blue-500" />
                          <span>Profile & Addresses</span>
                        </NavLink>
                        <NavLink
                          to="/customer/notifications"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cafe-light/60 transition-colors"
                        >
                          <Bell className="w-4 h-4 text-amber-500" />
                          <span>Notifications</span>
                          {unreadNotificationsCount > 0 && (
                            <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                              {unreadNotificationsCount}
                            </span>
                          )}
                        </NavLink>
                        <NavLink
                          to="/customer/support"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cafe-light/60 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4 text-purple-500" />
                          <span>Help & Support</span>
                        </NavLink>

                        {workspaces && workspaces.length > 0 && (
                          <NavLink
                            to="/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors font-bold"
                          >
                            <Store className="w-4 h-4 text-amber-600" />
                            <span>Restaurant HQ ({workspaces[0].restaurant_name})</span>
                          </NavLink>
                        )}

                        <hr className="my-1 border-cafe-border/60" />

                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <NavLink
                to="/customer/login"
                className="px-4 py-2 rounded-xl bg-cafe-light hover:bg-cafe-sand text-cafe-primary text-xs font-bold transition-all border border-cafe-border"
              >
                Sign In
              </NavLink>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-cafe-light/70 text-cafe-primary transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Search & Links */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 bg-white border-t border-cafe-border space-y-3 animate-in slide-in-from-top-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes or restaurants..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-cafe-light/70 border border-cafe-border focus:outline-none focus:border-cafe-accent"
              />
              <Search className="w-4 h-4 text-cafe-muted absolute left-3 top-2.5 pointer-events-none" />
            </form>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <NavLink
                to="/customer"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-cafe-light/60 text-cafe-primary flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-cafe-accent" />
                <span>Explore</span>
              </NavLink>
              <NavLink
                to="/customer/restaurants"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-cafe-light/60 text-cafe-primary flex items-center gap-2"
              >
                <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                <span>All Restaurants</span>
              </NavLink>
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN OUTLET BODY WITH SMOOTH PAGE TRANSITION */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-24 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. MOBILE BOTTOM NAVIGATION DOCK */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-cafe-border/80 z-30 px-3 py-1.5 shadow-warm-lg">
        <div className="grid grid-cols-5 items-center text-center">
          <NavLink
            to="/customer"
            end
            className={({ isActive }) =>
              `flex flex-col items-center py-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-cafe-accent font-extrabold' : 'text-cafe-muted hover:text-cafe-primary'
              }`
            }
          >
            <Compass className="w-5 h-5 mb-0.5" />
            <span>Discover</span>
          </NavLink>

          <NavLink
            to="/customer/restaurants"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-cafe-accent font-extrabold' : 'text-cafe-muted hover:text-cafe-primary'
              }`
            }
          >
            <UtensilsCrossed className="w-5 h-5 mb-0.5" />
            <span>Cafes</span>
          </NavLink>

          <NavLink
            to="/customer/orders"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-cafe-accent font-extrabold' : 'text-cafe-muted hover:text-cafe-primary'
              }`
            }
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/customer/rewards"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-cafe-accent font-extrabold' : 'text-cafe-muted hover:text-cafe-primary'
              }`
            }
          >
            <Award className="w-5 h-5 mb-0.5" />
            <span>Rewards</span>
          </NavLink>

          <NavLink
            to={isAuthenticated ? '/customer/profile' : '/customer/login'}
            className={({ isActive }) =>
              `flex flex-col items-center py-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-cafe-accent font-extrabold' : 'text-cafe-muted hover:text-cafe-primary'
              }`
            }
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>Profile</span>
          </NavLink>
        </div>
      </nav>

      {/* 4. FOOTER */}
      <footer className="hidden md:block bg-white border-t border-cafe-border py-8 mt-12 text-xs text-cafe-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CafeLogo size={28} />
            <span className="font-bold text-cafe-primary">CaféOS Customer Dining Platform</span>
            <span>•</span>
            <span>Real-time kitchen syncing & verified atomic billing</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <NavLink to="/customer/restaurants" className="hover:text-cafe-primary">All Restaurants</NavLink>
            <NavLink to="/customer/rewards" className="hover:text-cafe-primary">Loyalty Rewards</NavLink>
            <NavLink to="/customer/support" className="hover:text-cafe-primary">Customer Care</NavLink>
            <NavLink to="/about" className="hover:text-cafe-primary">About</NavLink>
            <NavLink to="/privacy" className="hover:text-cafe-primary">Privacy</NavLink>
            <NavLink to="/terms" className="hover:text-cafe-primary">Terms</NavLink>
            <NavLink to="/login" className="text-cafe-accent font-bold hover:underline">Restaurant Partner Login &rarr;</NavLink>
          </div>
        </div>
      </footer>

      {/* 5. In-App Realtime Notification Center Modal */}
      <NotificationCenterModal />
    </div>
  );
};

export default CustomerPortalLayout;

