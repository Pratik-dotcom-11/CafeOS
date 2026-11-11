import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Star,
  Check,
  Heart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  Sparkles,
  ShoppingBag,
  Info
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { Product, PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { SafeImage } from '../../components/common/SafeImage';

export const PosPage: React.FC = () => {
  const {
    restaurant,
    categories,
    products,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    createNewOrder,
    addToast
  } = useCafe();

  const [selectedCategory, setSelectedCategory] = useState<string>('biryani');
  const [activeTab, setActiveTab] = useState<'popular' | 'recent'>('popular');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('Table 04');
  const [customerName, setCustomerName] = useState<string>('Vikram Malhotra');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleWishlist = (productId: string, productName: string) => {
    if (wishlist.includes(productId)) {
      setWishlist((prev) => prev.filter((id) => id !== productId));
      addToast('Removed from Favorites', productName, 'info');
    } else {
      setWishlist((prev) => [...prev, productId]);
      addToast('Saved to Favorites', productName, 'success');
    }
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      addToast('Empty Order', 'Please add items before placing an order', 'warning');
      return;
    }

    createNewOrder({
      customerName: customerName.trim() || 'Guest Customer',
      orderType: 'dine-in',
      tableNumber: selectedTable,
      items: cart.map((c) => ({
        id: `item-${Date.now()}-${Math.random()}`,
        productId: c.product.id,
        name: c.product.name,
        price: c.product.price,
        quantity: c.quantity,
        isVeg: c.product.isVeg,
        selectedOptions: c.selectedOptions.map((o) => o.optionName),
        specialInstructions: c.specialInstructions,
      })),
      subtotal: cartSubtotal,
      tax: cartTax,
      total: cartTotal,
      paymentMethod,
      paymentStatus: 'paid',
    });

    clearCart();
  };

  // Indian restaurant category list matching reference design
  const exploreCategories = [
    { id: 'cat-all', slug: 'all', name: 'All Dishes', icon: '🍽️' },
    { id: 'cat-biryani', slug: 'biryani', name: 'Dum Biryanis', icon: '🍚' },
    { id: 'cat-curries', slug: 'curries', name: 'Royal Curries', icon: '🍲' },
    { id: 'cat-tandoor', slug: 'tandoor', name: 'Tandoori Kebabs', icon: '🍢' },
    { id: 'cat-street', slug: 'street', name: 'Dilli Chaat', icon: '🥟' },
    { id: 'cat-breads', slug: 'breads', name: 'Naan & Roti', icon: '🫓' },
    { id: 'cat-desserts', slug: 'desserts', name: 'Mithai & Kulfi', icon: '🍨' },
    { id: 'cat-chai', slug: 'chai', name: 'Chai & Lassi', icon: '☕' },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-[1700px] mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Section: Food Catalog & Categories (8 Columns on desktop) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Top Bar: Search and Filter matching reference image */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-cafe-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Biryani, Butter Chicken, Paneer, Chaat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-cafe-accent/30 text-cafe-primary dark:text-cafe-cream shadow-warm-sm"
              />
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-warm transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Reset Filter</span>
            </button>
          </div>

          {/* Explore Categories (Pill buttons matching reference design) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-cafe-primary dark:text-cafe-cream">
                Explore Categories
              </h2>
              <span className="text-xs text-cafe-muted">
                Showing {filteredProducts.length} authentic dishes
              </span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {exploreCategories.map((cat) => {
                const isSelected = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-cafe-cream/90 text-cafe-primary border-cafe-accent/80 shadow-warm-sm ring-1 ring-cafe-accent/30 dark:bg-stone-800 dark:text-white dark:border-cafe-accent'
                        : 'bg-white dark:bg-cafe-surface-dark text-cafe-primary/80 dark:text-stone-300 border-cafe-border/80 dark:border-cafe-border-dark hover:bg-cafe-cream/40'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabs: Popular / Recent */}
          <div className="flex items-center gap-6 border-b border-cafe-border/70 dark:border-cafe-border-dark pb-2">
            <button
              onClick={() => setActiveTab('popular')}
              className={`text-sm font-bold pb-2 relative transition-colors ${
                activeTab === 'popular'
                  ? 'text-cafe-accent'
                  : 'text-cafe-muted hover:text-cafe-primary dark:hover:text-white'
              }`}
            >
              Popular
              {activeTab === 'popular' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cafe-accent rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`text-sm font-bold pb-2 relative transition-colors ${
                activeTab === 'recent'
                  ? 'text-cafe-accent'
                  : 'text-cafe-muted hover:text-cafe-primary dark:hover:text-white'
              }`}
            >
              Recent
              {activeTab === 'recent' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cafe-accent rounded-full" />
              )}
            </button>
          </div>

          {/* Products Grid matching the reference cards layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => {
              const inWishlist = wishlist.includes(product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-4 border border-cafe-border/80 dark:border-cafe-border-dark shadow-warm hover:shadow-warm-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top action row: Veg/Non-Veg symbol and Wishlist */}
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border text-[10px] font-bold ${
                          product.isVeg
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-rose-600 bg-rose-50 text-rose-700'
                        }`}
                        title={product.isVeg ? 'Pure Veg' : 'Non-Vegetarian'}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                      </div>

                      <button
                        onClick={() => toggleWishlist(product.id, product.name)}
                        className={`p-1.5 rounded-full transition-colors ${
                          inWishlist
                            ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
                            : 'text-stone-300 hover:text-rose-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Centered Appetizing Circular Image */}
                    <div className="flex justify-center my-3">
                      <div className="w-32 h-32 rounded-full overflow-hidden shadow-warm p-1 bg-white dark:bg-stone-800 ring-2 ring-cafe-border/60 group-hover:scale-105 transition-transform duration-300">
                        <SafeImage
                          src={product.image}
                          alt={product.name}
                          category={product.category}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    </div>

                    {/* Food Info */}
                    <div className="text-center mt-2">
                      <h3 className="font-extrabold text-sm text-cafe-primary dark:text-cafe-cream truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="font-display text-base font-extrabold text-cafe-accent">
                          {formatCurrency(product.price, restaurant.currencySymbol)}
                        </span>
                        {product.originalPrice && (
                          <span className="font-display text-xs text-stone-400 line-through">
                            {formatCurrency(product.originalPrice, restaurant.currencySymbol)}
                          </span>
                        )}
                        <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-0.5 ml-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>2.5K+</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons: Wishlist & Order Now */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-cafe-border/60 dark:border-cafe-border-dark">
                    <button
                      onClick={() => toggleWishlist(product.id, product.name)}
                      className="py-2 px-3 rounded-xl border border-cafe-border dark:border-cafe-border-dark text-xs font-semibold text-cafe-primary dark:text-stone-300 hover:bg-cafe-cream/50 transition-colors text-center"
                    >
                      Wishlist
                    </button>
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="py-2 px-3 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm transition-all text-center flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Order Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: Invoice & Live Cart Panel (4 Columns matching reference image) */}
        <div id="pos-invoice" className="xl:col-span-4 bg-white dark:bg-cafe-surface-dark rounded-3xl p-5 border border-cafe-border/80 dark:border-cafe-border-dark shadow-warm sticky top-20">
          <div className="flex items-center justify-between pb-4 border-b border-cafe-border/70 dark:border-cafe-border-dark">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-cafe-accent" />
              <h2 className="font-display text-lg font-extrabold text-cafe-primary dark:text-cafe-cream">
                Invoice & Active Order
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Table & Customer Config */}
          <div className="grid grid-cols-2 gap-2 my-4">
            <div>
              <label className="text-[11px] font-bold text-cafe-muted uppercase">Guest Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-cafe-muted uppercase">Dine-in Table</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-medium"
              >
                <option value="Table 01">Table 01 (2 Pax)</option>
                <option value="Table 02">Table 02 (4 Pax)</option>
                <option value="Table 04">Table 04 (6 Pax)</option>
                <option value="Table 07">Table 07 (2 Pax)</option>
                <option value="Takeaway Counter">Takeaway Counter</option>
              </select>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 max-h-80 overflow-y-auto py-2 pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-10 px-4">
                <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-cafe-primary dark:text-cafe-cream">
                  No items in invoice
                </p>
                <p className="text-xs text-cafe-muted mt-1">
                  Select authentic biryanis, royal curries, and chai to build this order.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-cafe-light/60 dark:bg-stone-800/50 border border-cafe-border/50 dark:border-cafe-border-dark"
                >
                  <SafeImage
                    src={item.product.image}
                    alt={item.product.name}
                    category={item.product.category}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-cafe-primary dark:text-cafe-cream truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs font-bold text-cafe-accent mt-0.5">
                      {formatCurrency(item.product.price, restaurant.currencySymbol)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-cafe-border dark:border-stone-700 px-2 py-1 rounded-xl">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="text-stone-500 hover:text-cafe-primary p-0.5"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="text-stone-500 hover:text-cafe-primary p-0.5"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Summary */}
          <div className="mt-4 pt-4 border-t border-cafe-border/70 dark:border-cafe-border-dark space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cafe-muted">
              Payment Summary
            </h3>
            <div className="flex justify-between text-xs text-cafe-muted">
              <span>Sub Total</span>
              <span className="font-semibold text-cafe-primary dark:text-cafe-cream">
                {formatCurrency(cartSubtotal, restaurant.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-cafe-muted">
              <span>GST (5.0%)</span>
              <span className="font-semibold text-cafe-primary dark:text-cafe-cream">
                {formatCurrency(cartTax, restaurant.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-cafe-primary dark:text-cafe-cream pt-2 border-t border-dashed border-cafe-border dark:border-cafe-border-dark">
              <span>Total Payment</span>
              <span className="font-display font-extrabold text-cafe-accent text-base">
                {formatCurrency(cartTotal, restaurant.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector matching reference cards */}
          <div className="mt-4 pt-4 border-t border-cafe-border/70 dark:border-cafe-border-dark">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cafe-muted mb-2.5">
              Payment Mode
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'upi', label: 'UPI QR', icon: '⚡' },
                { id: 'card', label: 'RuPay/Card', icon: '💳' },
                { id: 'cash', label: 'Cash', icon: '💵' },
                { id: 'counter', label: 'Counter', icon: '🏢' },
              ].map((method) => {
                const active = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
                      active
                        ? 'border-cafe-accent bg-cafe-cream/80 text-cafe-primary ring-1 ring-cafe-accent dark:bg-stone-800 dark:text-white'
                        : 'border-cafe-border dark:border-cafe-border-dark hover:bg-cafe-sand/40 text-cafe-muted'
                    }`}
                  >
                    <span className="text-base mb-0.5">{method.icon}</span>
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Action: Place Order */}
          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0}
            className="w-full mt-5 py-3.5 px-4 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-extrabold text-sm shadow-warm-md hover:shadow-warm-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 btn-press"
          >
            <Sparkles className="w-4 h-4" />
            <span>Place Order • {formatCurrency(cartTotal, restaurant.currencySymbol)}</span>
          </button>
        </div>
      </div>

      {/* Mobile Sticky Invoice Trigger Bar */}
      {cart.length > 0 && (
        <div className="xl:hidden fixed bottom-4 inset-x-4 z-40 bg-cafe-primary dark:bg-stone-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-cafe-accent/40 backdrop-blur-md">
          <div>
            <span className="text-xs text-stone-300 block font-medium">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items in invoice
            </span>
            <span className="text-base font-black text-cafe-accent">
              {formatCurrency(cartTotal, restaurant.currencySymbol)}
            </span>
          </div>
          <a
            href="#pos-invoice"
            className="px-4 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 btn-press"
          >
            <span>View Invoice</span>
            <Receipt className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
