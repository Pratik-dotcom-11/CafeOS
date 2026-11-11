export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'cash' | 'paypal' | 'counter';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // Emoji or Lucide icon name
  itemCount: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface CustomizationGroup {
  id: string;
  title: string;
  required: boolean;
  maxSelect?: number;
  options: CustomizationOption[];
}

export interface ProductVariant {
  id: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  isBestseller?: boolean;
  rating: number;
  reviewCount: number;
  prepTimeMinutes: number;
  calories?: number;
  customizationGroups?: CustomizationGroup[];
  variants?: ProductVariant[];
}

export interface CartItem {
  id: string; // cart item unique ID (product.id + variant/modifiers)
  product: Product;
  quantity: number;
  selectedOptions: {
    groupTitle: string;
    optionName: string;
    price: number;
    addonId?: string;
  }[];
  variantId?: string;
  selectedAddonIds?: string[];
  specialInstructions?: string;
  itemTotalPrice: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  selectedOptions?: string[];
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  orderType: OrderType;
  tableNumber?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string; // ISO string
  prepTimeMinutes?: number;
  estimatedReadyAt?: string;
  notes?: string;
  isPriority?: boolean;
  priorityReason?: string;
  prepStartedAt?: string;
  readyAt?: string;
  completedAt?: string;
}

export interface TableItem {
  id: string;
  tableNumber: string;
  capacity: number;
  section: 'Main Dining' | 'Patio Garden' | 'Mezzanine' | 'Bar Area';
  status: 'available' | 'occupied' | 'reserved' | 'billing';
  activeOrderId?: string;
  activeOrderTotal?: number;
  occupiedSince?: string;
  guestCount?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  category: 'Dairy' | 'Coffee Beans' | 'Bakery & Grains' | 'Produce' | 'Syrups & Flavors' | 'Packaging';
  availableStock: number;
  minStock: number;
  unit: string;
  supplier: string;
  costPerUnit: number;
  lastRestocked: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Owner' | 'Manager' | 'Cashier' | 'Barista & Kitchen' | 'Server';
  status: 'active' | 'on-break' | 'off-duty';
  shift: string;
  avatar: string;
  joinedDate: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  lastVisit: string;
  favoriteItem: string;
}

export interface RestaurantProfile {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string;
  bannerImage: string;
  cuisine: string;
  rating: number;
  address: string;
  city: string;
  contactEmail: string;
  contactPhone: string;
  openingHours: string;
  currency: string;
  currencySymbol: string;
  taxPercentage: number;
  deliveryAvailable: boolean;
  takeawayAvailable: boolean;
}

export interface SuperAdminRestaurant {
  id: string;
  name: string;
  owner: string;
  email: string;
  plan: 'Starter' | 'Growth' | 'Professional' | 'Enterprise';
  status: 'active' | 'trial' | 'suspended';
  mrr: number;
  ordersProcessed: number;
  joinedDate: string;
}

