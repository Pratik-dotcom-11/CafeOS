import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Flame,
  Utensils,
  BellRing,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  XCircle,
  ShoppingBag,
  Bike,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import { Order, OrderStatus } from '../../types';
import { formatCurrency, formatTimeOnly, formatTimeAgo } from '../../utils/formatters';
import { orderService } from '../../services/orderService';
import { restaurantService, RestaurantRow } from '../../services/restaurantService';
import { paymentService, RazorpayOrderPayload } from '../../services/paymentService';
import { RazorpayModal } from '../../components/payment/RazorpayModal';
import { ReviewModal } from '../../components/customer/ReviewModal';

interface TimelineStep {
  key: string;
  label: string;
  desc: string;
  icon: any;
  isDone: boolean;
  isCurrent: boolean;
}

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const customer = useCustomer();

  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unauthorized, setUnauthorized] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Changed dining plan');
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  // Online Payment state
  const [razorpayModalOpen, setRazorpayModalOpen] = useState<boolean>(false);
  const [razorpayPayload, setRazorpayPayload] = useState<RazorpayOrderPayload | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  const fetchLiveOrder = useCallback(
    async (showSilentLoading = false) => {
      if (!orderId) return;
      if (!showSilentLoading) setIsReconnecting(true);

      try {
        const live = await orderService.getOrderTracking(orderId);
        if (live) {
          // Security Authorization Check:
          // If the order has a customer_id and the current user is logged in with a different id, block access.
          const orderCustId = (live as any).customer_id || (live as any).customerId;
          if (orderCustId && user && user.id !== orderCustId) {
            setUnauthorized(true);
            setLoading(false);
            setIsReconnecting(false);
            return;
          }

          setOrder(live);

          // Fetch fulfilling restaurant details
          const restId = (live as any).restaurant_id || (live as any).restaurantId || (live as any).restaurant?.id;
          if (restId) {
            const rest = await restaurantService.getRestaurantById(restId);
            if (rest) setRestaurant(rest);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live order:', err);
      } finally {
        setLoading(false);
        setIsReconnecting(false);
      }
    },
    [orderId, user]
  );

  // Initial fetch and Realtime subscription
  useEffect(() => {
    let isMounted = true;
    if (!orderId) return;

    fetchLiveOrder();

    // Subscribe to live Realtime status changes via Supabase
    const unsub = orderService.subscribeToOrder(orderId, (update) => {
      if (!isMounted) return;

      const u = update as any;
      setOrder((prev) => {
        if (!prev) return null;
        const nextStatus = (u.status as OrderStatus) || prev.status;
        const nextPaymentStatus = (u.payment_status as any) || prev.paymentStatus;
        const nextNotes = u.cancellation_reason
          ? `Cancelled: ${u.cancellation_reason}`
          : prev.notes;

        return {
          ...prev,
          status: nextStatus,
          paymentStatus: nextPaymentStatus,
          notes: nextNotes,
        };
      });

      // Play audio notification chime
      try {
        const audio = new Audio('/sounds/bell.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch {}
    });

    // Reconnection listener: automatically re-fetch when coming back online or switching tabs
    const handleOnline = () => fetchLiveOrder();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchLiveOrder(true);
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic safety poll every 7 seconds
    const interval = setInterval(() => {
      fetchLiveOrder(true);
    }, 7000);

    return () => {
      isMounted = false;
      unsub();
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [orderId, fetchLiveOrder]);

  // Dynamic Timeline steps tailored to Order Type
  const timelineSteps = useMemo<TimelineStep[]>(() => {
    if (!order) return [];

    const status = order.status;
    const type = order.orderType;

    if (type === 'delivery') {
      // 6-step Delivery Lifecycle
      const isPlaced = true;
      const isAccepted = status === 'accepted' || status === 'preparing' || status === 'ready' || status === 'completed';
      const isCooking = status === 'preparing' || status === 'ready' || status === 'completed';
      const isPacked = status === 'ready' || status === 'completed';
      const isOutForDelivery = status === 'ready'; // In delivery workflow, 'ready' means out for delivery dispatch
      const isDelivered = status === 'completed';

      return [
        {
          key: 'placed',
          label: 'Order Placed',
          desc: 'Verified by CafeOS backend',
          icon: Clock,
          isDone: isAccepted,
          isCurrent: status === 'pending',
        },
        {
          key: 'accepted',
          label: 'Accepted by Kitchen',
          desc: 'Chef reviewed & acknowledged',
          icon: ChefHat,
          isDone: isCooking,
          isCurrent: status === 'accepted',
        },
        {
          key: 'preparing',
          label: 'Cooking Fresh',
          desc: 'Tandoor searing & slow-simmering',
          icon: Flame,
          isDone: isPacked,
          isCurrent: status === 'preparing',
        },
        {
          key: 'ready',
          label: 'Packed for Delivery',
          desc: 'Hygienically sealed in thermal packaging',
          icon: ShoppingBag,
          isDone: isDelivered,
          isCurrent: status === 'ready',
        },
        {
          key: 'completed',
          label: 'Delivered & Relished',
          desc: 'Enjoy your warm culinary meal!',
          icon: Utensils,
          isDone: isDelivered,
          isCurrent: status === 'completed',
        },
      ];
    }

    if (type === 'dine-in') {
      // 5-step Dine-In Lifecycle
      const isAccepted = status === 'accepted' || status === 'preparing' || status === 'ready' || status === 'completed';
      const isCooking = status === 'preparing' || status === 'ready' || status === 'completed';
      const isReady = status === 'ready' || status === 'completed';
      const isCompleted = status === 'completed';

      return [
        {
          key: 'placed',
          label: 'Order Placed',
          desc: `Sent to Kitchen for ${order.tableNumber || 'Table'}`,
          icon: Clock,
          isDone: isAccepted,
          isCurrent: status === 'pending',
        },
        {
          key: 'accepted',
          label: 'Accepted by Kitchen',
          desc: 'Station chef assigned to ticket',
          icon: ChefHat,
          isDone: isCooking,
          isCurrent: status === 'accepted',
        },
        {
          key: 'preparing',
          label: 'Cooking in Kitchen',
          desc: 'Flavors blending to royal perfection',
          icon: Flame,
          isDone: isReady,
          isCurrent: status === 'preparing',
        },
        {
          key: 'ready',
          label: 'Plated & Hot',
          desc: 'Food is plated and ready for serving',
          icon: CheckCircle2,
          isDone: isCompleted,
          isCurrent: status === 'ready',
        },
        {
          key: 'completed',
          label: 'Served at Table',
          desc: 'Enjoy your dining experience!',
          icon: Utensils,
          isDone: isCompleted,
          isCurrent: status === 'completed',
        },
      ];
    }

    // Takeaway / Pickup Lifecycle
    const isAccepted = status === 'accepted' || status === 'preparing' || status === 'ready' || status === 'completed';
    const isCooking = status === 'preparing' || status === 'ready' || status === 'completed';
    const isReady = status === 'ready' || status === 'completed';
    const isCompleted = status === 'completed';

    return [
      {
        key: 'placed',
        label: 'Order Received',
        desc: 'Ticket confirmed at pickup counter',
        icon: Clock,
        isDone: isAccepted,
        isCurrent: status === 'pending',
      },
      {
        key: 'accepted',
        label: 'Accepted by Restaurant',
        desc: 'Kitchen added ticket to preparation queue',
        icon: ChefHat,
        isDone: isCooking,
        isCurrent: status === 'accepted',
      },
      {
        key: 'preparing',
        label: 'Now Cooking',
        desc: 'Freshly prepared to order',
        icon: Flame,
        isDone: isReady,
        isCurrent: status === 'preparing',
      },
      {
        key: 'ready',
        label: 'Ready for Pickup',
        desc: 'Packed & waiting at the billing counter',
        icon: ShoppingBag,
        isDone: isCompleted,
        isCurrent: status === 'ready',
      },
      {
        key: 'completed',
        label: 'Handed Over',
        desc: 'Thank you for dining with us!',
        icon: Utensils,
        isDone: isCompleted,
        isCurrent: status === 'completed',
      },
    ];
  }, [order]);

  const handleOpenRazorpay = async () => {
    if (!order) return;
    try {
      const payload = await paymentService.createPaymentOrder({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: order.total,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
      });
      setRazorpayPayload(payload);
      setRazorpayModalOpen(true);
    } catch (err: any) {
      alert(`Cannot open payment gateway: ${err.message || 'Please pay at the counter.'}`);
    }
  };

  const handlePaymentSuccess = () => {
    setRazorpayModalOpen(false);
    setOrder((prev) => (prev ? { ...prev, paymentStatus: 'paid', paymentMethod: 'upi' } : null));
    fetchLiveOrder();
  };

  const handleConfirmCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      await orderService.cancelCustomerOrder(order.id, cancelReason);
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      setShowCancelModal(false);
      fetchLiveOrder();
    } catch (err: any) {
      alert(err.message || 'Cannot cancel: the kitchen has already started cooking.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 border-4 border-cafe-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-sm font-black text-cafe-primary">Connecting to Live Kitchen Feed...</h2>
        <p className="text-xs text-cafe-muted">Verifying order cryptographic authorization</p>
      </div>
    );
  }

  // Security Block: Unauthorized Access
  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-rose-200 space-y-4 shadow-warm">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-cafe-primary">Unauthorized Order Access</h2>
        <p className="text-xs text-cafe-muted leading-relaxed">
          This order ticket is private and belongs to another customer account. You cannot view receipt
          details or delivery locations of other patrons.
        </p>
        <NavLink
          to="/customer/orders"
          className="inline-block px-5 py-2.5 rounded-xl bg-cafe-primary text-white text-xs font-bold shadow-warm"
        >
          View My Orders
        </NavLink>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-cafe-border space-y-4 shadow-warm">
        <div className="w-16 h-16 rounded-full bg-cafe-sand/50 text-cafe-primary flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-cafe-primary">Order Not Found</h2>
        <p className="text-xs text-cafe-muted">
          The requested order ticket could not be located in the database.
        </p>
        <NavLink
          to="/customer/orders"
          className="inline-block px-5 py-2.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
        >
          Back to Order History
        </NavLink>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currencySymbol = restaurant?.currency_symbol || '₹';

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <NavLink
          to="/customer/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cafe-muted hover:text-cafe-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Orders</span>
        </NavLink>

        <div className="flex items-center gap-2">
          {/* Live indicator badge */}
          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Realtime Live</span>
          </span>

          <button
            type="button"
            onClick={() => fetchLiveOrder()}
            title="Refresh order status"
            className="p-1.5 rounded-lg border border-cafe-border bg-white text-cafe-muted hover:text-cafe-primary transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Status Banner Card */}
      <div className="text-center p-6 sm:p-8 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-cafe-sand/50 flex items-center justify-center mx-auto shadow-inner">
          {isCancelled ? (
            <XCircle className="w-9 h-9 text-rose-500" />
          ) : order.status === 'completed' ? (
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          ) : order.status === 'ready' ? (
            <Utensils className="w-9 h-9 text-cafe-accent animate-bounce" />
          ) : order.status === 'preparing' ? (
            <Flame className="w-9 h-9 text-orange-500 animate-pulse" />
          ) : (
            <Clock className="w-9 h-9 text-blue-600" />
          )}
        </div>

        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-cafe-accent bg-cafe-accent/10 px-3 py-1 rounded-full inline-block">
            Ticket #{order.orderNumber}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-cafe-primary tracking-tight mt-1.5">
            {isCancelled
              ? 'Order Cancelled'
              : order.status === 'ready'
              ? order.orderType === 'dine-in'
                ? 'Plated & Ready for Service!'
                : order.orderType === 'takeaway'
                ? 'Ready for Counter Pickup!'
                : 'Packed & Out for Delivery!'
              : order.status === 'preparing'
              ? 'Chef is Cooking Your Dishes'
              : order.status === 'accepted'
              ? 'Order Accepted by Kitchen'
              : order.status === 'completed'
              ? 'Order Completed'
              : 'Order Received & Placed'}
          </h1>
          <p className="text-xs text-cafe-muted mt-1">
            {order.orderType === 'dine-in' && `Dine-In • ${order.tableNumber || 'Table'}`}
            {order.orderType === 'takeaway' && 'Curbside Takeaway Pickup'}
            {order.orderType === 'delivery' && `Doorstep Delivery`}
            {order.createdAt && ` • Placed ${formatTimeAgo(order.createdAt)}`}
          </p>
        </div>

        {isCancelled && (
          <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <strong>Cancellation Notice:</strong>{' '}
            {order.notes || 'This ticket was cancelled.'}
          </div>
        )}

        {/* Rate & Review Experience Banner for Completed Orders */}
        {!isCancelled && order.status === 'completed' && (
          <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300 dark:border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-warm shrink-0">
                <Star className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-cafe-primary dark:text-cafe-cream">
                  How was your dining experience?
                </h3>
                <p className="text-xs text-cafe-muted mt-0.5">
                  Share your verified diner review and rate your dishes to help fellow food lovers.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black shadow-warm transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>Rate & Review</span>
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Lifecycle Timeline (Tailored to Dine-In / Takeaway / Delivery) */}
      {!isCancelled && (
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cafe-border">
            <h3 className="text-xs font-black uppercase tracking-wider text-cafe-primary">
              Order Lifecycle Progress
            </h3>
            <span className="text-[10px] font-bold text-cafe-muted">
              Auto-updates when kitchen advances stage
            </span>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-cafe-sand before:z-0">
            {timelineSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.key} className="relative z-10 flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                      step.isCurrent
                        ? 'bg-cafe-accent text-white border-cafe-accent shadow-warm ring-4 ring-cafe-accent/20 animate-pulse'
                        : step.isDone
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-cafe-light text-cafe-muted border-cafe-border'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-black text-sm ${
                          step.isCurrent
                            ? 'text-cafe-accent'
                            : step.isDone
                            ? 'text-cafe-primary'
                            : 'text-cafe-muted'
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.isCurrent && (
                        <span className="text-[10px] font-black text-cafe-accent bg-cafe-accent/15 px-2 py-0.5 rounded-full">
                          Current Stage
                        </span>
                      )}
                      {step.isDone && !step.isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-600">Completed</span>
                      )}
                    </div>
                    <p className="text-xs text-cafe-muted mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fulfilling Restaurant Contact & Location Card */}
      {restaurant && (
        <div className="p-5 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-cafe-muted">
              Fulfilling Restaurant
            </span>
            <NavLink
              to={`/customer/restaurants/${restaurant.id}`}
              className="text-xs font-bold text-cafe-accent hover:underline flex items-center gap-1"
            >
              <span>View Restaurant</span>
              <ExternalLink className="w-3 h-3" />
            </NavLink>
          </div>

          <div className="flex items-start justify-between gap-3 pt-1">
            <div>
              <h4 className="text-sm font-black text-cafe-primary">{restaurant.name}</h4>
              {restaurant.address && (
                <p className="text-xs text-cafe-muted mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cafe-accent shrink-0" />
                  <span>
                    {restaurant.address}, {restaurant.city}
                  </span>
                </p>
              )}
            </div>

            {restaurant.contact_phone && (
              <a
                href={`tel:${restaurant.contact_phone}`}
                className="px-3 py-1.5 rounded-xl bg-cafe-light hover:bg-cafe-sand text-cafe-primary text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call Kitchen</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Ordered Items Breakdown Snapshot */}
      <div className="p-5 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-cafe-primary">
          Order Items ({order.items.length})
        </h3>

        <div className="divide-y divide-cafe-border/60 text-xs">
          {order.items.map((i) => (
            <div key={i.id} className="py-2.5 flex justify-between items-start gap-3">
              <div>
                <p className="font-extrabold text-cafe-primary">
                  {i.quantity}x {i.name}
                </p>
                {i.selectedOptions && i.selectedOptions.length > 0 && (
                  <p className="text-[11px] text-cafe-muted">{i.selectedOptions.join(' • ')}</p>
                )}
                {i.specialInstructions && (
                  <p className="text-[10px] text-amber-700 italic mt-0.5">
                    Note: "{i.specialInstructions}"
                  </p>
                )}
              </div>
              <span className="font-bold text-cafe-primary shrink-0">
                {formatCurrency(i.price * i.quantity, currencySymbol)}
              </span>
            </div>
          ))}
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-1.5 pt-3 border-t border-dashed border-cafe-border text-xs text-cafe-muted">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal, currencySymbol)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes &amp; GST</span>
            <span>{formatCurrency(order.tax, currencySymbol)}</span>
          </div>
          {order.discount && order.discount > 0 ? (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Promotional Discount</span>
              <span>-{formatCurrency(order.discount, currencySymbol)}</span>
            </div>
          ) : null}
          <div className="flex justify-between font-black text-sm text-cafe-primary pt-2 border-t border-cafe-border">
            <span>Total Amount</span>
            <span className="text-cafe-accent text-base">
              {formatCurrency(order.total, currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Status & Pay Online CTA */}
      <div className="space-y-3">
        {order.paymentStatus === 'paid' ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Payment Completed &amp; Verified</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {order.paymentMethod?.toUpperCase() || 'PAID'}
            </span>
          </div>
        ) : !isCancelled ? (
          <div className="space-y-2">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {order.paymentMethod === 'counter'
                    ? 'Pay at counter or on delivery'
                    : 'Payment Pending'}
                </span>
              </div>
              <span className="font-black text-cafe-primary">
                {formatCurrency(order.total, currencySymbol)}
              </span>
            </div>

            {/* Complete Payment Online */}
            <button
              type="button"
              onClick={handleOpenRazorpay}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-warm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Online via UPI / Cards (Razorpay Test Gateway)</span>
            </button>
          </div>
        ) : null}

        {/* Customer Self-Cancellation (Only allowed when in 'pending' status) */}
        {order.status === 'pending' && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="w-full py-3 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Order (Before Kitchen Accepts)</span>
          </button>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-cafe-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-cafe-primary">
                Cancel Ticket #{order.orderNumber}?
              </h3>
              <p className="text-xs text-cafe-muted">
                You can only cancel before the kitchen begins cooking your dishes.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-cafe-muted block mb-1">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-cafe-light border border-cafe-border rounded-xl focus:outline-none focus:border-cafe-accent"
              >
                <option value="Changed dining plan">Changed dining plan</option>
                <option value="Ordered wrong dishes">Ordered wrong dishes</option>
                <option value="Need to leave urgently">Need to leave urgently</option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-cafe-border text-xs font-bold text-cafe-primary hover:bg-cafe-sand/40"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Sandbox Payment Modal */}
      {razorpayPayload && (
        <RazorpayModal
          isOpen={razorpayModalOpen}
          onClose={() => setRazorpayModalOpen(false)}
          orderPayload={razorpayPayload}
          currencySymbol={currencySymbol}
          onSuccess={handlePaymentSuccess}
          onFailure={(err) => alert(`Payment error: ${err}`)}
        />
      )}

      {/* Verified Diner Review Modal */}
      {order && isReviewModalOpen && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          restaurantId={order.restaurantId || restaurant?.id || '22222222-2222-2222-2222-222222222201'}
          restaurantName={restaurant?.name || 'Restaurant'}
          orderId={order.id}
          orderNumber={order.orderNumber}
          orderItems={order.items.map((it) => ({
            productId: it.productId,
            productName: it.name,
          }))}
        />
      )}
    </div>
  );
};

export default OrderTrackingPage;
