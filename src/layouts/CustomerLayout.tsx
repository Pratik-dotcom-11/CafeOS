import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Clock, MapPin, Phone, Star } from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import { ToastContainer } from '../components/shared/ToastContainer';
import { formatCurrency } from '../utils/formatters';
import { CafeLogo } from '../components/common/CafeLogo';

export const CustomerLayout: React.FC = () => {
  const { restaurant, cart, isDarkMode } = useCafe();
  const location = useLocation();

  const isCartOrCheckout = location.pathname.includes('/cart') || location.pathname.includes('/checkout');
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.itemTotalPrice, 0);

  return (
    <div className={`min-h-screen bg-[#FDFBF7] dark:bg-stone-950 text-cafe-primary dark:text-stone-100 flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      <ToastContainer />

      {/* Top Customer Brand Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-cafe-border/80 dark:border-stone-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isCartOrCheckout ? (
              <NavLink
                to={`/menu/${restaurant.slug}`}
                className="p-2 rounded-full hover:bg-cafe-sand/50 dark:hover:bg-stone-800 text-cafe-primary dark:text-stone-200 transition-colors"
                title="Back to Menu"
              >
                <ArrowLeft className="w-5 h-5" />
              </NavLink>
            ) : (
              <CafeLogo size={38} />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base lg:text-lg tracking-tight text-cafe-primary dark:text-stone-100">
                  {restaurant.name}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {restaurant.rating}
                </span>
              </div>
              <p className="text-xs text-cafe-muted dark:text-stone-400 flex items-center gap-2 truncate">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cafe-accent" />
                  Open Now (7 AM - 10 PM)
                </span>
                <span className="hidden md:inline">• Table Ordering Active</span>
              </p>
            </div>
          </div>

          {/* Cart Icon / Action */}
          <div className="flex items-center gap-2">
            <NavLink
              to="/cart"
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cafe-primary text-white dark:bg-cafe-accent shadow-warm hover:opacity-90 transition-all font-medium text-sm btn-press"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Order Bag</span>
              {totalCartCount > 0 && (
                <span className="bg-cafe-accent dark:bg-white dark:text-cafe-primary text-white font-bold text-xs px-2 py-0.5 rounded-full">
                  {totalCartCount}
                </span>
              )}
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Customer Page WITH SMOOTH ANIMATION */}
      <main className="flex-1 max-w-4xl w-full mx-auto pb-24 md:pb-12">
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

      {/* Sticky Bottom Cart Bar on Mobile when items in cart & not on cart/checkout */}
      {!isCartOrCheckout && totalCartCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <NavLink
            to="/cart"
            className="flex items-center justify-between p-4 bg-cafe-primary text-white rounded-2xl shadow-warm-lg border border-cafe-accent/40 btn-press"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cafe-accent flex items-center justify-center font-bold text-sm">
                {totalCartCount}
              </div>
              <div>
                <p className="text-xs text-cafe-cream/80 uppercase font-semibold">Your Order</p>
                <p className="font-display text-sm font-bold">{formatCurrency(cartSubtotal, restaurant.currencySymbol || '₹')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-cafe-cream">
              <span>View Cart</span>
              <span>&rarr;</span>
            </div>
          </NavLink>
        </div>
      )}

      {/* Subtle Footer */}
      <footer className="border-t border-cafe-border/80 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 py-6 text-center text-xs text-cafe-muted dark:text-stone-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 {restaurant.name}. Powered by <span className="font-display font-bold text-cafe-primary dark:text-stone-300">CaféOS</span>.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <NavLink to="/dashboard" className="text-cafe-accent hover:underline">
              Staff Portal Login
            </NavLink>
            <NavLink to="/kitchen" className="text-cafe-muted hover:text-cafe-primary">
              Kitchen Display
            </NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
};

