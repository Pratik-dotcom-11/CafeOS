import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Tag,
  Check,
  AlertCircle,
  Utensils,
  Bike,
  Clock,
  Sparkles,
  MessageSquare,
  Award
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { SafeImage } from '../../components/common/SafeImage';

export const CartPage: React.FC = () => {
  const customer = useCustomer();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    cart,
    cartRestaurant,
    cartSubtotal,
    cartTax,
    cartTotal,
    totalItemsCount,
    updateCartQuantity,
    updateItemInstructions,
    removeFromCart,
    clearCart,
    diningMode,
    setDiningMode,
    tableNumber,
    rewards
  } = customer;

  const currencySymbol = cartRestaurant?.currencySymbol || '₹';
  const taxPct = cartRestaurant?.taxPercentage ?? 5.0;

  const [promoCode, setPromoCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoCode.trim().toUpperCase();

    if (code === 'CAFE10') {
      const discount = Math.round(cartSubtotal * 0.1);
      setDiscountAmount(discount);
      setPromoApplied(true);
    } else if (code === 'WELCOME') {
      const discount = Math.min(50, cartSubtotal);
      setDiscountAmount(discount);
      setPromoApplied(true);
    } else {
      setPromoError('Invalid coupon. Try "WELCOME" for ₹50 off or "CAFE10" for 10% off.');
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setDiscountAmount(0);
    setPromoApplied(false);
    setPromoError(null);
  };

  const finalTotal = Math.max(0, cartTotal - discountAmount);
  const projectedCoins = Math.round(finalTotal * 0.05);

  const menuLink = cartRestaurant?.id
    ? `/customer/menu/${cartRestaurant.id}`
    : '/customer/restaurants';

  const handleStartEditNote = (itemId: string, currentNote?: string) => {
    setEditingNoteItemId(itemId);
    setNoteInput(currentNote || '');
  };

  const handleSaveNote = (itemId: string) => {
    updateItemInstructions(itemId, noteInput.trim());
    setEditingNoteItemId(null);
    setNoteInput('');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-cafe-sand/50 flex items-center justify-center text-cafe-muted shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-cafe-primary">
          Your order bag is empty
        </h2>
        <p className="text-xs text-cafe-muted leading-relaxed">
          Explore fragrant Dum Biryanis, sizzling Tandoori kebabs, slow-simmered royal curries, and freshly brewed Kulhad Chai!
        </p>
        <NavLink
          to={menuLink}
          className="px-6 py-3 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-black text-xs shadow-warm transition-all"
        >
          Browse Restaurants &amp; Menus
        </NavLink>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cafe-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-cafe-primary tracking-tight">
            Review Your Order Bag
          </h1>
          <p className="text-xs text-cafe-muted mt-0.5">
            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            {cartRestaurant ? ` • Fulfilled by ${cartRestaurant.name}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Selected Restaurant Information Card */}
      {cartRestaurant && (
        <div className="p-4 rounded-2xl bg-white border border-cafe-border flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cafe-sand/50 text-cafe-primary flex items-center justify-center font-black shrink-0 border border-cafe-border">
              <Utensils className="w-5 h-5 text-cafe-accent" />
            </div>
            <div>
              <p className="text-xs font-black text-cafe-primary">{cartRestaurant.name}</p>
              <p className="text-[11px] text-cafe-muted">Verified Kitchen Partner on CafeOS</p>
            </div>
          </div>
          <NavLink
            to={`/customer/menu/${cartRestaurant.id}`}
            className="text-xs font-bold text-cafe-accent hover:underline shrink-0"
          >
            + Add More
          </NavLink>
        </div>
      )}

      {/* Dining Mode Selector Card */}
      <div className="p-4 rounded-2xl bg-white border border-cafe-border space-y-3 shadow-sm">
        <span className="text-xs font-black uppercase tracking-wider text-cafe-primary block">
          Choose How You Would Like to Enjoy
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDiningMode('dine-in')}
            className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
              diningMode === 'dine-in'
                ? 'bg-cafe-primary text-white border-cafe-primary shadow-sm'
                : 'bg-cafe-light border-cafe-border text-cafe-primary hover:bg-cafe-sand/40'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Dine-In ({tableNumber || 'Table'})</span>
          </button>

          <button
            type="button"
            onClick={() => setDiningMode('takeaway')}
            className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
              diningMode === 'takeaway'
                ? 'bg-cafe-primary text-white border-cafe-primary shadow-sm'
                : 'bg-cafe-light border-cafe-border text-cafe-primary hover:bg-cafe-sand/40'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Takeaway</span>
          </button>

          <button
            type="button"
            onClick={() => setDiningMode('delivery')}
            className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
              diningMode === 'delivery'
                ? 'bg-cafe-primary text-white border-cafe-primary shadow-sm'
                : 'bg-cafe-light border-cafe-border text-cafe-primary hover:bg-cafe-sand/40'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Delivery</span>
          </button>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3">
        {cart.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-3xl bg-white border border-cafe-border shadow-warm hover:shadow-warm-md card-interactive hover:-translate-y-0.5 transition-all flex flex-col gap-3"
          >
            <div className="flex items-start gap-3.5">
              <SafeImage
                src={item.product.image}
                alt={item.product.name}
                category={item.product.category}
                className="w-16 h-16 rounded-2xl object-cover shrink-0 ring-1 ring-cafe-border"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {item.product.isVeg ? (
                      <span className="w-3 h-3 border border-emerald-600 rounded-sm flex items-center justify-center p-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </span>
                    ) : (
                      <span className="w-3 h-3 border border-rose-700 rounded-sm flex items-center justify-center p-0.5">
                        <span className="w-0 h-0 border-l-[2.5px] border-l-transparent border-r-[2.5px] border-r-transparent border-b-[5px] border-b-rose-700" />
                      </span>
                    )}
                    <h3 className="font-extrabold text-sm text-cafe-primary truncate">
                      {item.product.name}
                    </h3>
                  </div>
                  <span className="font-extrabold text-sm text-cafe-accent">
                    {formatCurrency(item.itemTotalPrice, currencySymbol)}
                  </span>
                </div>

                {/* Modifiers / Variants */}
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <p className="text-[11px] text-cafe-muted mt-0.5">
                    {item.selectedOptions.map((o) => o.optionName).join(' • ')}
                  </p>
                )}

                {/* Item Notes / Instructions */}
                {item.specialInstructions && editingNoteItemId !== item.id && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 mt-1.5">
                    <MessageSquare className="w-3 h-3 shrink-0" />
                    <span className="italic truncate">"{item.specialInstructions}"</span>
                    <button
                      type="button"
                      onClick={() => handleStartEditNote(item.id, item.specialInstructions)}
                      className="ml-auto text-[10px] font-bold text-amber-800 underline"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* Inline Note Editor */}
                {editingNoteItemId === item.id ? (
                  <div className="mt-2 space-y-1.5 bg-cafe-light p-2.5 rounded-xl border border-cafe-border">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="e.g. extra spicy, crispy naan, less oil..."
                      className="w-full px-2.5 py-1 text-xs bg-white border border-cafe-border rounded-lg focus:outline-none focus:border-cafe-accent"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingNoteItemId(null)}
                        className="px-2 py-0.5 text-[10px] font-bold text-cafe-muted hover:text-cafe-primary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveNote(item.id)}
                        className="px-2.5 py-0.5 text-[10px] font-bold bg-cafe-accent text-white rounded-md shadow-sm"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                ) : !item.specialInstructions ? (
                  <button
                    type="button"
                    onClick={() => handleStartEditNote(item.id)}
                    className="text-[11px] text-cafe-muted hover:text-cafe-accent font-semibold flex items-center gap-1 mt-1 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>+ Add kitchen note</span>
                  </button>
                ) : null}

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-cafe-border/50">
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>

                  <div className="flex items-center gap-2.5 bg-cafe-light border border-cafe-border px-2.5 py-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="p-0.5 text-cafe-muted hover:text-cafe-primary transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="p-0.5 text-cafe-muted hover:text-cafe-primary transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Input Card */}
      <div className="p-4 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-2">
        <form onSubmit={handleApplyPromo} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-cafe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Coupon (e.g. WELCOME, CAFE10)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={promoApplied}
              className="w-full pl-10 pr-3 py-2.5 text-xs bg-cafe-light border border-cafe-border rounded-2xl uppercase tracking-wider font-bold focus:outline-none focus:border-cafe-accent"
            />
          </div>
          {promoApplied ? (
            <button
              type="button"
              onClick={handleRemovePromo}
              className="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors"
            >
              Remove
            </button>
          ) : (
            <button
              type="submit"
              disabled={!promoCode.trim()}
              className="px-5 py-2.5 rounded-2xl bg-cafe-primary text-white text-xs font-bold hover:bg-cafe-accent disabled:opacity-50 transition-colors shadow-sm"
            >
              Apply
            </button>
          )}
        </form>

        {promoApplied && (
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Coupon applied! You saved {formatCurrency(discountAmount, currencySymbol)}.</span>
          </p>
        )}

        {promoError && (
          <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{promoError}</span>
          </p>
        )}
      </div>

      {/* Bill Breakdown Card */}
      <div className="p-5 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-2.5 text-xs">
        <div className="flex justify-between text-cafe-muted">
          <span>Item Subtotal</span>
          <span className="font-semibold text-cafe-primary">
            {formatCurrency(cartSubtotal, currencySymbol)}
          </span>
        </div>
        <div className="flex justify-between text-cafe-muted">
          <span>GST ({taxPct}%)</span>
          <span className="font-semibold text-cafe-primary">
            {formatCurrency(cartTax, currencySymbol)}
          </span>
        </div>
        {promoApplied && discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Promotional Discount</span>
            <span>-{formatCurrency(discountAmount, currencySymbol)}</span>
          </div>
        )}
        <div className="pt-2 border-t border-dashed border-cafe-border flex justify-between text-sm font-black text-cafe-primary">
          <span>Final Amount</span>
          <span className="text-cafe-accent text-base">
            {formatCurrency(finalTotal, currencySymbol)}
          </span>
        </div>

        {/* Loyalty Reward Preview */}
        {user && (
          <div className="mt-2 pt-2 border-t border-cafe-border/50 flex items-center justify-between text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-xl">
            <span className="flex items-center gap-1 font-bold">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Café Coins Earnable:</span>
            </span>
            <span className="font-black text-amber-900">+{projectedCoins} Coins (5%)</span>
          </div>
        )}
      </div>

      {/* Action Navigation */}
      <div className="flex items-center gap-3">
        <NavLink
          to={menuLink}
          className="flex-1 py-3.5 rounded-2xl border border-cafe-border text-xs font-bold text-cafe-primary text-center hover:bg-cafe-sand/40 transition-colors"
        >
          + Add More Items
        </NavLink>
        <button
          type="button"
          onClick={() =>
            navigate('/customer/checkout', {
              state: {
                discountAmount,
                promoCode: promoApplied ? promoCode : undefined,
              },
            })
          }
          className="flex-1 py-3.5 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-extrabold uppercase tracking-wider text-center shadow-warm transition-all flex items-center justify-center gap-1.5 active:scale-98"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-cafe-border animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-cafe-primary">Clear your order bag?</h3>
              <p className="text-xs text-cafe-muted">
                All {totalItemsCount} dishes will be removed from your order bag.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="py-2.5 rounded-xl bg-cafe-light text-cafe-muted hover:text-cafe-primary text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm"
              >
                Yes, Clear Bag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
