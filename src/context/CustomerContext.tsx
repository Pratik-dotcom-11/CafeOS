import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Product, CartItem } from '../types';
import {
  customerService,
  CustomerAddress,
  CustomerRewardSummary,
  CustomerNotification,
} from '../services/customerService';

export interface CustomerCartRestaurant {
  id: string;
  name: string;
  slug: string;
  currencySymbol: string;
  taxPercentage: number;
  delivery_available?: boolean;
  takeaway_available?: boolean;
  address?: string | null;
  city?: string | null;
  contact_phone?: string | null;
}

export interface CustomerCartState {
  restaurant: CustomerCartRestaurant | null;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

interface CustomerContextType {
  // Scoped Customer Cart
  cart: CartItem[];
  cartRestaurant: CustomerCartRestaurant | null;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  totalItemsCount: number;
  addToCart: (
    restaurant: CustomerCartRestaurant,
    product: Product,
    quantity?: number,
    selectedOptions?: CartItem['selectedOptions'],
    instructions?: string,
    variantId?: string,
    selectedAddonIds?: string[]
  ) => { success: boolean; conflictWith?: string };
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  updateItemInstructions: (cartItemId: string, instructions: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  confirmReplaceCart: (
    restaurant: CustomerCartRestaurant,
    product: Product,
    quantity?: number,
    selectedOptions?: CartItem['selectedOptions'],
    instructions?: string,
    variantId?: string,
    selectedAddonIds?: string[]
  ) => void;

  // Favorites
  favoriteRestaurantIds: Set<string>;
  favoriteProductIds: Set<string>;
  toggleFavoriteRestaurant: (restaurantId: string) => Promise<boolean>;
  toggleFavoriteProduct: (productId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;

  // Addresses
  addresses: CustomerAddress[];
  selectedAddress: CustomerAddress | null;
  setSelectedAddress: (address: CustomerAddress | null) => void;
  addAddress: (addr: Omit<CustomerAddress, 'id' | 'userId' | 'createdAt'>) => Promise<CustomerAddress>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
  refreshAddresses: () => Promise<void>;

  // Loyalty & Rewards
  rewards: CustomerRewardSummary | null;
  refreshRewards: () => Promise<void>;

  // Notifications
  notifications: CustomerNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;

  // Dining Mode
  diningMode: 'delivery' | 'takeaway' | 'dine-in';
  setDiningMode: (mode: 'delivery' | 'takeaway' | 'dine-in') => void;
  tableNumber: string;
  setTableNumber: (tbl: string) => void;
}

const CUSTOMER_CART_KEY = 'cafeos_customer_cart_v2';
const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // 1. Scoped Cart State
  const [cartState, setCartState] = useState<CustomerCartState>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_CART_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse customer cart from localStorage', e);
    }
    return {
      restaurant: null,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    };
  });

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_CART_KEY, JSON.stringify(cartState));
    } catch {}
  }, [cartState]);

  // Recalculate totals
  const recalculateCart = (items: CartItem[], rest: CustomerCartRestaurant | null): CustomerCartState => {
    if (!rest || items.length === 0) {
      return { restaurant: null, items: [], subtotal: 0, tax: 0, total: 0 };
    }
    const subtotal = items.reduce((acc, it) => acc + it.itemTotalPrice, 0);
    const tax = Math.round(subtotal * ((rest.taxPercentage || 5.0) / 100));
    const total = subtotal + tax;
    return { restaurant: rest, items, subtotal, tax, total };
  };

  const addToCart = useCallback(
    (
      restaurant: CustomerCartRestaurant,
      product: Product,
      quantity = 1,
      selectedOptions: CartItem['selectedOptions'] = [],
      instructions?: string,
      variantId?: string,
      selectedAddonIds?: string[]
    ) => {
      // Check for multi-restaurant collision
      if (cartState.restaurant && cartState.restaurant.id !== restaurant.id && cartState.items.length > 0) {
        return { success: false, conflictWith: cartState.restaurant.name };
      }

      const cartItemId = `${product.id}-${variantId || 'std'}-${(selectedAddonIds || []).sort().join('_')}`;

      // Calculate unit price with options
      let unitPrice = product.price;
      if (variantId && product.variants) {
        const v = product.variants.find((vr) => vr.id === variantId);
        if (v) unitPrice += v.priceAdjustment;
      }
      (selectedOptions || []).forEach((opt) => {
        unitPrice += opt.price || 0;
      });

      const itemTotalPrice = unitPrice * quantity;

      setCartState((prev) => {
        const existingIdx = prev.items.findIndex((it) => it.id === cartItemId);
        let updatedItems: CartItem[];

        if (existingIdx >= 0) {
          updatedItems = [...prev.items];
          const exist = updatedItems[existingIdx];
          const newQty = exist.quantity + quantity;
          updatedItems[existingIdx] = {
            ...exist,
            quantity: newQty,
            itemTotalPrice: unitPrice * newQty,
          };
        } else {
          const newItem: CartItem = {
            id: cartItemId,
            product,
            quantity,
            selectedOptions,
            variantId,
            selectedAddonIds,
            specialInstructions: instructions,
            itemTotalPrice,
          };
          updatedItems = [...prev.items, newItem];
        }

        return recalculateCart(updatedItems, restaurant);
      });

      return { success: true };
    },
    [cartState]
  );

  const confirmReplaceCart = useCallback(
    (
      restaurant: CustomerCartRestaurant,
      product: Product,
      quantity = 1,
      selectedOptions: CartItem['selectedOptions'] = [],
      instructions?: string,
      variantId?: string,
      selectedAddonIds?: string[]
    ) => {
      const cartItemId = `${product.id}-${variantId || 'std'}-${(selectedAddonIds || []).sort().join('_')}`;
      let unitPrice = product.price;
      if (variantId && product.variants) {
        const v = product.variants.find((vr) => vr.id === variantId);
        if (v) unitPrice += v.priceAdjustment;
      }
      (selectedOptions || []).forEach((opt) => {
        unitPrice += opt.price || 0;
      });

      const newItem: CartItem = {
        id: cartItemId,
        product,
        quantity,
        selectedOptions,
        variantId,
        selectedAddonIds,
        specialInstructions: instructions,
        itemTotalPrice: unitPrice * quantity,
      };

      setCartState(recalculateCart([newItem], restaurant));
    },
    []
  );

  const updateCartQuantity = useCallback((cartItemId: string, quantity: number) => {
    setCartState((prev) => {
      if (!prev.restaurant) return prev;
      if (quantity <= 0) {
        const remaining = prev.items.filter((it) => it.id !== cartItemId);
        return recalculateCart(remaining, remaining.length > 0 ? prev.restaurant : null);
      }
      const updated = prev.items.map((it) => {
        if (it.id === cartItemId) {
          const singleItemPrice = it.itemTotalPrice / it.quantity;
          return {
            ...it,
            quantity,
            itemTotalPrice: singleItemPrice * quantity,
          };
        }
        return it;
      });
      return recalculateCart(updated, prev.restaurant);
    });
  }, []);

  const updateItemInstructions = useCallback((cartItemId: string, instructions: string) => {
    setCartState((prev) => {
      if (!prev.restaurant) return prev;
      const updated = prev.items.map((it) => {
        if (it.id === cartItemId) {
          return {
            ...it,
            specialInstructions: instructions,
          };
        }
        return it;
      });
      return {
        ...prev,
        items: updated,
      };
    });
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCartState((prev) => {
      if (!prev.restaurant) return prev;
      const remaining = prev.items.filter((it) => it.id !== cartItemId);
      return recalculateCart(remaining, remaining.length > 0 ? prev.restaurant : null);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartState({
      restaurant: null,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    });
  }, []);

  // 2. Favorites
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState<Set<string>>(new Set());
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<string>>(new Set());

  const refreshFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteRestaurantIds(new Set());
      setFavoriteProductIds(new Set());
      return;
    }
    try {
      const { favoriteRestaurants, favoriteDishes } = await customerService.getFavorites(user.id);
      setFavoriteRestaurantIds(new Set(favoriteRestaurants.map((f) => f.restaurantId!).filter(Boolean)));
      setFavoriteProductIds(new Set(favoriteDishes.map((f) => f.productId!).filter(Boolean)));
    } catch (e) {
      console.warn('Error loading favorites', e);
    }
  }, [user]);

  const toggleFavoriteRestaurant = useCallback(
    async (restaurantId: string): Promise<boolean> => {
      if (!user) return false;
      const added = await customerService.toggleRestaurantFavorite(user.id, restaurantId);
      setFavoriteRestaurantIds((prev) => {
        const next = new Set(prev);
        if (added) next.add(restaurantId);
        else next.delete(restaurantId);
        return next;
      });
      return added;
    },
    [user]
  );

  const toggleFavoriteProduct = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!user) return false;
      const added = await customerService.toggleProductFavorite(user.id, productId);
      setFavoriteProductIds((prev) => {
        const next = new Set(prev);
        if (added) next.add(productId);
        else next.delete(productId);
        return next;
      });
      return added;
    },
    [user]
  );

  // 3. Addresses
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);

  const refreshAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setSelectedAddress(null);
      return;
    }
    try {
      const data = await customerService.getAddresses(user.id);
      setAddresses(data);
      const defaultAddr = data.find((a) => a.isDefault) || data[0] || null;
      setSelectedAddress(defaultAddr);
    } catch (e) {
      console.warn('Error loading addresses', e);
    }
  }, [user]);

  const addAddress = useCallback(
    async (addr: Omit<CustomerAddress, 'id' | 'userId' | 'createdAt'>): Promise<CustomerAddress> => {
      if (!user) throw new Error('Must be signed in to save delivery addresses');
      const created = await customerService.addAddress({
        ...addr,
        userId: user.id,
      });
      await refreshAddresses();
      setSelectedAddress(created);
      return created;
    },
    [user, refreshAddresses]
  );

  const deleteAddress = useCallback(
    async (addressId: string) => {
      if (!user) return;
      await customerService.deleteAddress(addressId, user.id);
      await refreshAddresses();
    },
    [user, refreshAddresses]
  );

  const setDefaultAddress = useCallback(
    async (addressId: string) => {
      if (!user) return;
      await customerService.setDefaultAddress(addressId, user.id);
      await refreshAddresses();
    },
    [user, refreshAddresses]
  );

  // 4. Rewards
  const [rewards, setRewards] = useState<CustomerRewardSummary | null>(null);

  const refreshRewards = useCallback(async () => {
    if (!user) {
      setRewards(null);
      return;
    }
    try {
      const data = await customerService.getRewards(user.id);
      setRewards(data);
    } catch (e) {
      console.warn('Error loading rewards', e);
    }
  }, [user]);

  // 5. Notifications
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const data = await customerService.getNotifications(user.id);
      setNotifications(data);
    } catch (e) {
      console.warn('Error loading notifications', e);
    }
  }, [user]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await customerService.markNotificationAsRead(id);
    } catch (e) {
      console.warn('Error marking notification as read', e);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await customerService.markAllNotificationsAsRead(user.id);
    } catch (e) {
      console.warn('Error marking all notifications as read', e);
    }
  }, [user]);

  // Realtime subscription for customer notifications
  useEffect(() => {
    if (!user) return;

    refreshNotifications();

    const unsub = customerService.subscribeToNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      try {
        // Play subtle sound or browser notification if allowed
        const audio = new Audio('/sounds/bell.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch {}
    });

    return () => {
      unsub();
    };
  }, [user, refreshNotifications]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // Initial load on auth change
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshFavorites();
      refreshAddresses();
      refreshRewards();
      refreshNotifications();
    } else {
      setFavoriteRestaurantIds(new Set());
      setFavoriteProductIds(new Set());
      setAddresses([]);
      setSelectedAddress(null);
      setRewards(null);
      setNotifications([]);
    }
  }, [isAuthenticated, user, refreshFavorites, refreshAddresses, refreshRewards, refreshNotifications]);

  // 5. Dining Mode & Table number
  const [diningMode, setDiningMode] = useState<'delivery' | 'takeaway' | 'dine-in'>('delivery');
  const [tableNumber, setTableNumber] = useState<string>(() => {
    try {
      return localStorage.getItem('cafeos_active_table') || 'Table 01';
    } catch {
      return 'Table 01';
    }
  });

  const totalItemsCount = cartState.items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <CustomerContext.Provider
      value={{
        cart: cartState.items,
        cartRestaurant: cartState.restaurant,
        cartSubtotal: cartState.subtotal,
        cartTax: cartState.tax,
        cartTotal: cartState.total,
        totalItemsCount,
        addToCart,
        updateCartQuantity,
        updateItemInstructions,
        removeFromCart,
        clearCart,
        confirmReplaceCart,

        favoriteRestaurantIds,
        favoriteProductIds,
        toggleFavoriteRestaurant,
        toggleFavoriteProduct,
        refreshFavorites,

        addresses,
        selectedAddress,
        setSelectedAddress,
        addAddress,
        deleteAddress,
        setDefaultAddress,
        refreshAddresses,

        rewards,
        refreshRewards,

        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        refreshNotifications,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,

        diningMode,
        setDiningMode,
        tableNumber,
        setTableNumber,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

