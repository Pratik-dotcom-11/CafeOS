import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import {
  Utensils,
  ShoppingBag,
  Bike,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  Phone,
  User,
  Check,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import { OrderType, PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { orderService } from '../../services/orderService';
import { paymentService, RazorpayOrderPayload } from '../../services/paymentService';
import { RazorpayModal } from '../../components/payment/RazorpayModal';

export const CheckoutPage: React.FC = () => {
  const { user, profile } = useAuth();
  const customer = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    cart,
    cartRestaurant,
    cartSubtotal,
    cartTax,
    cartTotal,
    totalItemsCount,
    clearCart,
    diningMode,
    tableNumber: contextTable,
    addresses,
    selectedAddress,
    setSelectedAddress,
    addAddress,
    refreshRewards
  } = customer;

  const currencySymbol = cartRestaurant?.currencySymbol || '₹';
  const discountAmount = location.state?.discountAmount || 0;
  const promoCode = location.state?.promoCode;

  // Active table prefill from context / localStorage
  const savedTable = typeof window !== 'undefined' ? localStorage.getItem('cafeos_active_table') : null;

  // Ordering mode support
  const isDeliverySupported = cartRestaurant?.delivery_available !== false;
  const isTakeawaySupported = cartRestaurant?.takeaway_available !== false;

  const [orderType, setOrderType] = useState<OrderType>(() => {
    if (diningMode === 'delivery' && isDeliverySupported) return 'delivery';
    if (diningMode === 'takeaway' && isTakeawaySupported) return 'takeaway';
    return 'dine-in';
  });

  const [tableNumber, setTableNumber] = useState<string>(
    contextTable || savedTable || 'Table 01'
  );

  // Address state
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    selectedAddress ? `${selectedAddress.fullAddress}, ${selectedAddress.city}` : ''
  );
  const [saveNewAddress, setSaveNewAddress] = useState<boolean>(false);
  const [addressLabel, setAddressLabel] = useState<string>('Home');

  // Customer info state
  const defaultName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split('@')[0] ||
    '';
  const defaultPhone = profile?.phone || user?.phone || '';

  const [customerName, setCustomerName] = useState<string>(defaultName);
  const [customerPhone, setCustomerPhone] = useState<string>(defaultPhone);
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('counter');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Online Payment (Razorpay) state
  const [razorpayModalOpen, setRazorpayModalOpen] = useState<boolean>(false);
  const [activeRazorpayOrder, setActiveRazorpayOrder] = useState<RazorpayOrderPayload | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultName && !customerName) setCustomerName(defaultName);
    if (defaultPhone && !customerPhone) setCustomerPhone(defaultPhone);
  }, [defaultName, defaultPhone]);

  useEffect(() => {
    if (selectedAddress && !deliveryAddress) {
      setDeliveryAddress(`${selectedAddress.fullAddress}, ${selectedAddress.city}`);
    }
  }, [selectedAddress]);

  const payableTotal = Math.max(0, cartTotal - discountAmount);
  const projectedCoins = Math.round(payableTotal * 0.05);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart.length === 0 || !cartRestaurant) {
      navigate('/customer/restaurants');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please provide your name to identify your order.');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Please enter your phone number so the kitchen or delivery driver can reach you.');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Please provide a complete delivery address for doorstep delivery.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save address to customer profile if requested
      if (orderType === 'delivery' && saveNewAddress && user) {
        try {
          await addAddress({
            label: addressLabel || 'Home',
            recipientName: customerName.trim(),
            recipientPhone: customerPhone.trim(),
            addressLine1: deliveryAddress.trim(),
            city: cartRestaurant.city || 'Kolkata',
            state: 'West Bengal',
            postalCode: '700016',
            fullAddress: deliveryAddress.trim(),
            isDefault: addresses.length === 0,
          });
        } catch (addrErr) {
          console.warn('Address save notice:', addrErr);
        }
      }

      // Generate client idempotency key to prevent duplicate orders
      const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Map cart items into DB schema payload
      const payloadItems = cart.map((c) => ({
        productId: c.product.id,
        quantity: c.quantity,
        variantId: c.variantId,
        selectedAddonIds: c.selectedAddonIds,
        specialInstructions: c.specialInstructions,
      }));

      // Call secure atomic backend order creation
      const result = await orderService.createCustomerOrder({
        restaurantId: cartRestaurant.id,
        customerId: user?.id || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        paymentMethod: paymentMethod === 'counter' ? 'counter' : 'upi',
        promoCode,
        notes: specialNotes.trim() || undefined,
        idempotencyKey,
        items: payloadItems,
      });

      // If user selected Online Payment (UPI / Cards)
      if (paymentMethod === 'upi' || paymentMethod === 'card') {
        const rzpOrder = await paymentService.createPaymentOrder({
          orderId: result.id,
          orderNumber: result.order_number,
          amount: result.total,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
        });

        setActiveRazorpayOrder(rzpOrder);
        setCreatedOrderId(result.id);
        setRazorpayModalOpen(true);
        return;
      }

      // Pay at Counter / Cash on Delivery flow:
      clearCart();
      if (user) refreshRewards();

      // Navigate to live order tracking
      navigate(`/customer/orders/${result.id}`, { replace: true });
    } catch (err: any) {
      console.error('Order checkout error:', err);
      const msg = err.message || 'Could not place order. Please try again or ask kitchen staff.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentModalSuccess = (paymentId: string, reference: string) => {
    setRazorpayModalOpen(false);
    clearCart();
    if (user) refreshRewards();

    if (createdOrderId) {
      navigate(`/customer/orders/${createdOrderId}`, { replace: true });
    }
  };

  const handlePaymentModalFailure = (errMsg: string) => {
    setErrorMessage(`Payment could not be verified: ${errMsg}`);
  };

  if (cart.length === 0 || !cartRestaurant) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-cafe-border space-y-4 shadow-warm">
        <div className="w-16 h-16 rounded-full bg-cafe-sand/50 text-cafe-primary flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-cafe-primary">No items in order bag</h2>
        <p className="text-xs text-cafe-muted">
          Please add dishes from a restaurant menu before proceeding to checkout.
        </p>
        <NavLink
          to="/customer/restaurants"
          className="inline-block px-5 py-2.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
        >
          Explore Restaurants
        </NavLink>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto pb-24">
      {/* Top Breadcrumb */}
      <div>
        <NavLink
          to="/customer/cart"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cafe-muted hover:text-cafe-primary transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Order Bag</span>
        </NavLink>
        <h1 className="font-display text-xl sm:text-2xl font-black text-cafe-primary tracking-tight">
          Checkout &amp; Order Confirmation
        </h1>
        <p className="text-xs text-cafe-muted mt-0.5">
          Your order will be verified and sent directly to the restaurant kitchen.
        </p>
      </div>

      {/* Restaurant Header Summary */}
      <div className="p-4 rounded-3xl bg-white border border-cafe-border flex items-center justify-between gap-3 shadow-warm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cafe-sand/50 text-cafe-primary flex items-center justify-center font-black shrink-0 border border-cafe-border">
            <Utensils className="w-6 h-6 text-cafe-accent" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cafe-accent block">
              Fulfilling Restaurant
            </span>
            <p className="text-sm font-black text-cafe-primary">{cartRestaurant.name}</p>
            {cartRestaurant.address && (
              <p className="text-[11px] text-cafe-muted truncate">
                {cartRestaurant.address}, {cartRestaurant.city}
              </p>
            )}
          </div>
        </div>
        <span className="text-xs font-extrabold text-cafe-primary bg-cafe-light px-3 py-1.5 rounded-xl border border-cafe-border">
          {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Loyalty Reward Preview Banner */}
      {user && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-warm shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-cafe-primary">
                Earn +{projectedCoins} Café Coins on this order!
              </p>
              <p className="text-[11px] text-cafe-muted">
                5% credited to your rewards balance upon order fulfillment.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="space-y-5">
        {/* Supported Ordering Modes */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-cafe-primary block">
            Select Dining Mode
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {/* Dine-In */}
            <button
              type="button"
              onClick={() => setOrderType('dine-in')}
              className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all btn-press ${
                orderType === 'dine-in'
                  ? 'border-cafe-accent bg-cafe-cream/70 text-cafe-primary ring-2 ring-cafe-accent shadow-sm'
                  : 'border-cafe-border text-cafe-muted hover:bg-cafe-sand/40'
              }`}
            >
              <Utensils className="w-5 h-5 text-cafe-accent" />
              <span>Dine-In</span>
            </button>

            {/* Takeaway */}
            {isTakeawaySupported ? (
              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all btn-press ${
                  orderType === 'takeaway'
                    ? 'border-cafe-accent bg-cafe-cream/70 text-cafe-primary ring-2 ring-cafe-accent shadow-sm'
                    : 'border-cafe-border text-cafe-muted hover:bg-cafe-sand/40'
                }`}
              >
                <ShoppingBag className="w-5 h-5 text-cafe-accent" />
                <span>Curbside Takeaway</span>
              </button>
            ) : null}

            {/* Delivery */}
            {isDeliverySupported ? (
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all btn-press ${
                  orderType === 'delivery'
                    ? 'border-cafe-accent bg-cafe-cream/70 text-cafe-primary ring-2 ring-cafe-accent shadow-sm'
                    : 'border-cafe-border text-cafe-muted hover:bg-cafe-sand/40'
                }`}
              >
                <Bike className="w-5 h-5 text-cafe-accent" />
                <span>Doorstep Delivery</span>
              </button>
            ) : null}
          </div>

          {/* Dine-In Table Selection */}
          {orderType === 'dine-in' && (
            <div className="mt-4 pt-3 border-t border-cafe-border space-y-1.5">
              <label className="text-xs font-bold text-cafe-primary flex items-center justify-between">
                <span>Table Identifier / Number</span>
                {savedTable && (
                  <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                    Verified from Table QR
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. Table 04"
                className="w-full px-3.5 py-2.5 text-xs bg-cafe-light border border-cafe-border rounded-xl font-bold text-cafe-primary focus:outline-none focus:border-cafe-accent"
              />
            </div>
          )}

          {/* Delivery Address Field */}
          {orderType === 'delivery' && (
            <div className="mt-4 pt-3 border-t border-cafe-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cafe-primary">
                  Delivery Address <span className="text-rose-500">*</span>
                </label>
              </div>

              {/* Saved Address Chips */}
              {addresses.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddress(addr);
                        setDeliveryAddress(`${addr.fullAddress}, ${addr.city}`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        selectedAddress?.id === addr.id
                          ? 'bg-cafe-accent text-white shadow-warm'
                          : 'bg-cafe-light border border-cafe-border text-cafe-primary hover:bg-cafe-sand/50'
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{addr.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <textarea
                required
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Flat / House No., Apartment, Street, Landmark, PIN code"
                className="w-full px-3.5 py-2.5 text-xs bg-cafe-light border border-cafe-border rounded-xl focus:outline-none focus:border-cafe-accent"
              />

              {user && (
                <label className="flex items-center gap-2 text-xs text-cafe-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveNewAddress}
                    onChange={(e) => setSaveNewAddress(e.target.checked)}
                    className="w-4 h-4 rounded text-cafe-accent focus:ring-cafe-accent"
                  />
                  <span>Save this address for fast checkout next time</span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Customer Information Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-cafe-primary block">
            Customer Information
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-cafe-muted block mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full px-3.5 py-2.5 text-xs bg-cafe-light border border-cafe-border rounded-xl text-cafe-primary focus:outline-none focus:border-cafe-accent"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-cafe-muted block mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full px-3.5 py-2.5 text-xs bg-cafe-light border border-cafe-border rounded-xl text-cafe-primary focus:outline-none focus:border-cafe-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-cafe-muted block mb-1">
              Order Notes / Instructions for Kitchen
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. Extra spicy, serve green chutney, call upon arrival..."
              className="w-full px-3.5 py-2.5 text-xs bg-cafe-light border border-cafe-border rounded-xl text-cafe-primary focus:outline-none focus:border-cafe-accent"
            />
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-cafe-primary block">
            Payment Selection
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pay at Counter / Cash */}
            <div
              onClick={() => setPaymentMethod('counter')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'counter'
                  ? 'border-cafe-accent bg-cafe-cream/60 ring-2 ring-cafe-accent font-bold'
                  : 'border-cafe-border hover:bg-cafe-sand/30 text-cafe-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-black text-cafe-primary flex items-center gap-1.5">
                  <span>💵</span>
                  <span>Pay at Counter / Cash</span>
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'counter'
                      ? 'border-cafe-accent bg-cafe-accent'
                      : 'border-stone-300'
                  }`}
                >
                  {paymentMethod === 'counter' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <p className="text-[11px] text-cafe-muted">
                {orderType === 'delivery'
                  ? 'Cash on Delivery to delivery driver.'
                  : 'Pay at the billing counter via cash, card or UPI when food is ready.'}
              </p>
            </div>

            {/* Pay Online */}
            <div
              onClick={() => setPaymentMethod('upi')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'upi' || paymentMethod === 'card'
                  ? 'border-cafe-accent bg-cafe-cream/60 ring-2 ring-cafe-accent font-bold'
                  : 'border-cafe-border hover:bg-cafe-sand/30 text-cafe-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-black text-cafe-primary flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Pay Online (UPI / Card)</span>
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'upi' || paymentMethod === 'card'
                      ? 'border-cafe-accent bg-cafe-accent'
                      : 'border-stone-300'
                  }`}
                >
                  {(paymentMethod === 'upi' || paymentMethod === 'card') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <p className="text-[11px] text-cafe-muted">
                Instant verification via Google Pay, PhonePe, Paytm, or Credit/Debit Card.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-cafe-light border border-cafe-border text-[11px] text-cafe-muted flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Secure 256-bit encrypted checkout. Prices verified directly by restaurant database.</span>
          </div>
        </div>

        {/* Final Financial Summary & Submission */}
        <div className="p-5 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-3">
          <div className="flex justify-between text-xs text-cafe-muted">
            <span>Item Subtotal ({totalItemsCount} items)</span>
            <span className="font-bold text-cafe-primary">
              {formatCurrency(cartSubtotal, currencySymbol)}
            </span>
          </div>

          <div className="flex justify-between text-xs text-cafe-muted">
            <span>Taxes &amp; GST ({cartRestaurant.taxPercentage || 5}%)</span>
            <span className="font-bold text-cafe-primary">
              {formatCurrency(cartTax, currencySymbol)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 font-bold">
              <span>Promotional Discount ({promoCode || 'Coupon'})</span>
              <span>-{formatCurrency(discountAmount, currencySymbol)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-black text-cafe-primary pt-2 border-t border-dashed border-cafe-border">
            <span>Total Payable Amount</span>
            <span className="font-display font-extrabold text-cafe-accent text-lg">
              {formatCurrency(payableTotal, currencySymbol)}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black uppercase tracking-wider shadow-warm-md hover:shadow-warm-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 btn-press"
          >
            {isSubmitting ? (
              <span>Confirming with Kitchen...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  Confirm &amp; Place Order • {formatCurrency(payableTotal, currencySymbol)}
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Razorpay Modal for online payment */}
      {activeRazorpayOrder && (
        <RazorpayModal
          isOpen={razorpayModalOpen}
          onClose={() => setRazorpayModalOpen(false)}
          orderPayload={activeRazorpayOrder}
          currencySymbol={currencySymbol}
          onSuccess={handlePaymentModalSuccess}
          onFailure={handlePaymentModalFailure}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
