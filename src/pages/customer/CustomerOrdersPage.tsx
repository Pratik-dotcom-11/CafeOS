import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Clock,
  ShoppingBag,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  UtensilsCrossed,
  Receipt,
  Bell,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';
import { formatCurrency, getStatusBadge } from '../../utils/formatters';
import { ReviewModal } from '../../components/customer/ReviewModal';

export const CustomerOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const {
    addToCart,
    confirmReplaceCart,
    cartRestaurant,
    unreadNotificationsCount,
    setIsNotificationCenterOpen,
  } = useCustomer();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [replaceCartPrompt, setReplaceCartPrompt] = useState<{
    targetOrder: Order;
  } | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (!user) return;
      try {
        setIsLoading(true);
        const data = await orderService.getCustomerOrders(user.id);
        setOrders(data);
      } catch (err) {
        console.warn('Error loading customer orders', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  const handleReorder = (order: Order) => {
    const targetRest = {
      id: (order as any).restaurant_id || '22222222-2222-2222-2222-222222222201',
      name: (order as any).restaurant?.name || 'CafeOS Restaurant',
      slug: (order as any).restaurant?.slug || 'artisan-brew',
      currencySymbol: (order as any).restaurant?.currency_symbol || '₹',
      taxPercentage: 5.0,
    };

    // If active cart is from another restaurant, show prompt
    if (cartRestaurant && cartRestaurant.id !== targetRest.id) {
      setReplaceCartPrompt({ targetOrder: order });
      return;
    }

    // Add items to cart
    order.items.forEach((it) => {
      addToCart(
        targetRest,
        {
          id: it.productId,
          name: it.name,
          description: '',
          category: 'Reorder',
          price: it.price,
          image: '/placeholder-food.jpg',
          isVeg: it.isVeg,
          isAvailable: true,
          rating: 4.8,
          reviewCount: 120,
          prepTimeMinutes: 15,
        },
        it.quantity
      );
    });

    navigate('/customer/cart');
  };

  const handleConfirmReplace = () => {
    if (!replaceCartPrompt) return;
    const order = replaceCartPrompt.targetOrder;
    const targetRest = {
      id: (order as any).restaurant_id || '22222222-2222-2222-2222-222222222201',
      name: (order as any).restaurant?.name || 'CafeOS Restaurant',
      slug: (order as any).restaurant?.slug || 'artisan-brew',
      currencySymbol: (order as any).restaurant?.currency_symbol || '₹',
      taxPercentage: 5.0,
    };

    if (order.items.length > 0) {
      const first = order.items[0];
      confirmReplaceCart(
        targetRest,
        {
          id: first.productId,
          name: first.name,
          description: '',
          category: 'Reorder',
          price: first.price,
          image: '/placeholder-food.jpg',
          isVeg: first.isVeg,
          isAvailable: true,
          rating: 4.8,
          reviewCount: 120,
          prepTimeMinutes: 15,
        },
        first.quantity
      );

      // add remaining
      for (let i = 1; i < order.items.length; i++) {
        const it = order.items[i];
        addToCart(
          targetRest,
          {
            id: it.productId,
            name: it.name,
            description: '',
            category: 'Reorder',
            price: it.price,
            image: '/placeholder-food.jpg',
            isVeg: it.isVeg,
            isAvailable: true,
            rating: 4.8,
            reviewCount: 120,
            prepTimeMinutes: 15,
          },
          it.quantity
        );
      }
    }

    setReplaceCartPrompt(null);
    navigate('/customer/cart');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-cafe-primary tracking-tight">
            My Orders & Dining Receipts
          </h1>
          <p className="text-xs text-cafe-muted mt-0.5">
            View live kitchen preparation status, re-order your favorite meals, or download receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNotificationCenterOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-cafe-border bg-white hover:bg-cafe-light text-cafe-primary text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Bell className="w-4 h-4 text-cafe-accent" />
            <span>Alerts</span>
            {unreadNotificationsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <NavLink
            to="/customer/restaurants"
            className="px-4 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>New Order</span>
          </NavLink>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-3xl bg-white border border-cafe-border animate-pulse p-5" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-cafe-border space-y-4 my-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-cafe-accent flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-cafe-primary">No previous orders placed</h3>
          <p className="text-xs text-cafe-muted max-w-sm mx-auto">
            You haven't placed any orders yet. Discover our verified partner restaurants and place your first meal!
          </p>
          <NavLink
            to="/customer/restaurants"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
          >
            <span>Browse Restaurants</span>
            <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const isLive = ord.status === 'pending' || ord.status === 'accepted' || ord.status === 'preparing' || ord.status === 'ready';
            const restName = (ord as any).restaurant?.name || 'Arsalan – Park Circus';

            return (
              <div
                key={ord.id}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-cafe-border shadow-warm hover:shadow-warm-md card-interactive hover:-translate-y-1 transition-all space-y-4"
              >
                {/* Top Row: Order Number, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cafe-border/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cafe-light text-cafe-primary flex items-center justify-center font-black text-xs">
                      <Receipt className="w-5 h-5 text-cafe-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-cafe-primary">
                          {ord.orderNumber}
                        </span>
                        <span className="text-xs font-bold text-cafe-muted">•</span>
                        <span className="text-xs font-extrabold text-cafe-accent">
                          {restName}
                        </span>
                      </div>
                      <p className="text-[11px] text-cafe-muted mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-cafe-muted" />
                        <span>{new Date(ord.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span>•</span>
                        <span className="capitalize font-semibold">{ord.orderType}</span>
                        {ord.tableNumber && <span>({ord.tableNumber})</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const badge = getStatusBadge(ord.status);
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>
                      );
                    })()}
                    {isLive && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-cafe-muted">
                    Order Items ({ord.items.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ord.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-cafe-light/60 text-cafe-primary text-xs font-semibold border border-cafe-border/50"
                      >
                        {it.quantity}x {it.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Total & Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-cafe-muted uppercase tracking-wider block">
                      Total Bill Amount
                    </span>
                    <span className="font-display text-lg font-black text-cafe-primary">
                      {formatCurrency(ord.total, '₹')}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold ml-2">
                      ({ord.paymentMethod.toUpperCase()} • {ord.paymentStatus})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Live Tracker Button */}
                    <NavLink
                      to={`/customer/orders/${ord.id}`}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isLive
                          ? 'bg-emerald-600 text-white shadow-warm hover:bg-emerald-700 animate-pulse'
                          : 'bg-cafe-light text-cafe-primary hover:bg-cafe-sand'
                      }`}
                    >
                      <span>{isLive ? 'Live Prep Tracker' : 'View Ticket'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </NavLink>

                    {/* Write Review Button for Completed Orders */}
                    {ord.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => setReviewOrder(ord)}
                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>Write Review</span>
                      </button>
                    )}

                    {/* Re-order Button */}
                    <button
                      type="button"
                      onClick={() => handleReorder(ord)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm transition-all flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Write Review Modal */}
      {reviewOrder && (
        <ReviewModal
          isOpen={!!reviewOrder}
          onClose={() => setReviewOrder(null)}
          restaurantId={reviewOrder.restaurantId || (reviewOrder as any).restaurant?.id || '22222222-2222-2222-2222-222222222201'}
          restaurantName={(reviewOrder as any).restaurant?.name || 'Restaurant'}
          orderId={reviewOrder.id}
          orderNumber={reviewOrder.orderNumber}
          orderItems={reviewOrder.items.map((it) => ({
            productId: it.productId,
            productName: it.name,
          }))}
          onReviewSubmitted={() => {
            // refresh or toast handled inside modal
          }}
        />
      )}

      {/* Cart Conflict Modal */}
      {replaceCartPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-cafe-border shadow-warm-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-cafe-primary">Replace Active Cart?</h3>
            <p className="text-xs text-cafe-muted leading-relaxed">
              Your cart currently contains items from another cafe ({cartRestaurant?.name}). Reordering from this ticket will replace your active cart items.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReplaceCartPrompt(null)}
                className="flex-1 py-2.5 rounded-xl border border-cafe-border text-xs font-bold hover:bg-cafe-light text-cafe-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReplace}
                className="flex-1 py-2.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm hover:bg-cafe-accent-hover"
              >
                Yes, Replace Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
