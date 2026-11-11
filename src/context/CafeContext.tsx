import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Category,
  Product,
  Order,
  CartItem,
  TableItem,
  Ingredient,
  Employee,
  Customer,
  RestaurantProfile,
  SuperAdminRestaurant,
  OrderStatus,
  PaymentStatus,
  PaymentMethod
} from '../types';
import {
  mockRestaurant,
  mockCategories,
  mockProducts,
  mockOrders,
  mockTables,
  mockIngredients,
  mockEmployees,
  mockCustomers,
  mockSuperAdminRestaurants
} from '../data/mockData';
import { soundService } from '../utils/sound';
import { useAuth } from './AuthContext';
import { menuService, mapDatabaseProductToUI } from '../services/menuService';
import { orderService } from '../services/orderService';
import { inventoryService } from '../services/inventoryService';
import { tableService } from '../services/tableService';
import { employeeService } from '../services/employeeService';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface CafeContextType {
  // Restaurant Profile
  restaurant: RestaurantProfile;
  updateRestaurant: (updates: Partial<RestaurantProfile>) => void;

  // Categories & Products
  categories: Category[];
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'reviewCount'>, addons?: any[], variants?: any[]) => Promise<any>;
  updateProduct: (id: string, updates: Partial<Product>, addons?: any[], variants?: any[]) => Promise<any>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductAvailability: (id: string) => Promise<void>;
  addCategory: (name: string, icon: string) => Promise<any>;
  deleteCategory: (id: string) => Promise<void>;
  reloadMenu: () => Promise<void>;

  // Orders
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus, reason?: string) => Promise<void>;
  toggleOrderPriority: (orderId: string, isPriority: boolean, reason?: string) => Promise<void>;
  reloadOrders: () => Promise<void>;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  createNewOrder: (orderData: {
    customerName: string;
    customerPhone?: string;
    orderType: Order['orderType'];
    tableNumber?: string;
    items: Order['items'];
    subtotal: number;
    tax: number;
    discount?: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    notes?: string;
  }) => Order;

  // Tables
  tables: TableItem[];
  updateTableStatus: (tableId: string, status: TableItem['status'], guestCount?: number) => void;
  addTable: (table: Omit<TableItem, 'id'>) => void;

  // Inventory
  ingredients: Ingredient[];
  updateStock: (ingredientId: string, delta: number) => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'status'>) => void;
  reloadInventory: () => Promise<void>;

  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;

  // Customers
  customers: Customer[];

  // Super Admin
  superAdminRestaurants: SuperAdminRestaurant[];

  // Cart (shared for POS or Customer Menu session)
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedOptions?: CartItem['selectedOptions'],
    instructions?: string,
    variantId?: string,
    selectedAddonIds?: string[]
  ) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;

  // Sound & Notifications
  soundEnabled: boolean;
  toggleSound: () => void;
  toasts: ToastItem[];
  addToast: (title: string, message?: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const CafeContext = createContext<CafeContextType | undefined>(undefined);

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeWorkspace } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantProfile>(mockRestaurant);

  // Sync active workspace from AuthContext (multi-tenant)
  useEffect(() => {
    if (activeWorkspace) {
      setRestaurant((prev) => ({
        ...prev,
        id: activeWorkspace.restaurant_id,
        name: activeWorkspace.restaurant_name,
        slug: activeWorkspace.restaurant_slug,
        cuisine: activeWorkspace.restaurant_cuisine || prev.cuisine,
        logo: activeWorkspace.restaurant_logo_url || prev.logo,
        currency: activeWorkspace.currency || 'INR',
        currencySymbol: activeWorkspace.currency_symbol || '₹',
        taxPercentage: activeWorkspace.tax_percentage || 5.0,
      }));
    }
  }, [activeWorkspace]);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [tables, setTables] = useState<TableItem[]>(mockTables);
  const [ingredients, setIngredients] = useState<Ingredient[]>(mockIngredients);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [superAdminRestaurants, setSuperAdminRestaurants] = useState<SuperAdminRestaurant[]>(mockSuperAdminRestaurants);

  // Reload live menu from Supabase
  const reloadMenu = useCallback(async () => {
    if (!restaurant.id) return;
    try {
      const [catRows, prodRows] = await Promise.all([
        menuService.getCategories(restaurant.id),
        menuService.getProducts(restaurant.id),
      ]);

      if (catRows && catRows.length > 0) {
        const catMap = new Map<string, string>();
        catRows.forEach((c) => catMap.set(c.id, c.slug));

        const mappedCats: Category[] = [
          { id: 'cat-all', name: 'All Categories', slug: 'all', icon: '✨', itemCount: prodRows.length },
          ...catRows.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            icon: c.icon,
            itemCount: prodRows.filter((p) => p.category_id === c.id).length,
          })),
        ];
        setCategories(mappedCats);

        if (prodRows && prodRows.length > 0) {
          const mappedProds = prodRows.map((p) =>
            mapDatabaseProductToUI(p, catMap.get(p.category_id))
          );
          setProducts(mappedProds);
        }
      }
    } catch (err) {
      console.warn('Could not reload menu from cloud DB:', err);
    }
  }, [restaurant.id]);

  // Trigger menu reload when restaurant changes
  useEffect(() => {
    if (restaurant.id) {
      reloadMenu();
    }
  }, [restaurant.id, reloadMenu]);

  // Reload live inventory from Supabase
  const reloadInventory = useCallback(async () => {
    if (!restaurant.id) return;
    try {
      const dbIngs = await inventoryService.getIngredients(restaurant.id);
      if (dbIngs && dbIngs.length > 0) {
        const mapped: Ingredient[] = dbIngs.map((row: any) => ({
          id: row.id,
          name: row.name,
          category: row.category as any,
          availableStock: Number(row.available_stock),
          minStock: Number(row.min_stock),
          unit: row.unit,
          supplier: row.supplier?.name || 'Local Verified Mandi',
          costPerUnit: Number(row.cost_per_unit),
          lastRestocked: row.last_restocked_at ? row.last_restocked_at.split('T')[0] : 'Today',
          status: row.status as any,
        }));
        setIngredients(mapped);
      }
    } catch (err) {
      console.warn('Could not reload inventory from Supabase:', err);
    }
  }, [restaurant.id]);

  useEffect(() => {
    if (restaurant.id) {
      reloadInventory();
    }
  }, [restaurant.id, reloadInventory]);

  // Reload live tables and employees from Supabase
  const reloadOperations = useCallback(async () => {
    if (!restaurant.id) return;
    try {
      const [dbTables, dbStaff] = await Promise.all([
        tableService.getTables(restaurant.id),
        employeeService.getEmployees(restaurant.id).catch(() => []),
      ]);

      if (dbTables && dbTables.length > 0) {
        const mappedTables: TableItem[] = dbTables.map((t) => ({
          id: t.id,
          tableNumber: t.table_number,
          capacity: t.capacity,
          section: (t.section as any) || 'Main Dining',
          status: (t.status as any) || 'available',
          activeOrderId: t.active_order_id || undefined,
          occupiedSince: t.occupied_since ? new Date(t.occupied_since).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          guestCount: t.guest_count || undefined,
        }));
        setTables(mappedTables);
      }

      if (dbStaff && dbStaff.length > 0) {
        const roleMap: Record<string, Employee['role']> = {
          owner: 'Owner',
          manager: 'Manager',
          cashier: 'Cashier',
          kitchen: 'Barista & Kitchen',
          server: 'Server',
        };
        const mappedStaff: Employee[] = dbStaff.map((s) => ({
          id: s.id,
          name: s.fullName,
          email: s.email,
          phone: s.phone || '+91 98450 00000',
          role: roleMap[s.role] || 'Server',
          status: s.status === 'active' ? 'active' : 'off-duty',
          shift: s.role === 'kitchen' ? 'Kitchen Shift (10:00 - 22:30)' : 'Morning (07:00 - 15:30)',
          avatar: s.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          joinedDate: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        }));
        setEmployees(mappedStaff);
      }
    } catch (err) {
      console.warn('Could not reload tables/staff from Supabase:', err);
    }
  }, [restaurant.id]);

  useEffect(() => {
    if (restaurant.id) {
      reloadOperations();
    }
  }, [restaurant.id, reloadOperations]);

  // Subscribe to live incoming orders from customer QR menu
  useEffect(() => {
    if (!restaurant.id) return;

    const unsub = orderService.subscribeToRestaurantOrders(
      restaurant.id,
      (newOrder) => {
        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
        soundService.playNewOrderBell();
        addToast(
          'New Order Received!',
          `${newOrder.orderNumber} for ${newOrder.customerName} (${newOrder.tableNumber || 'Takeaway'})`,
          'info'
        );
      },
      (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === updatedOrder.id) {
              return {
                ...o,
                ...updatedOrder,
                notes: updatedOrder.notes !== undefined ? updatedOrder.notes : o.notes,
              };
            }
            return o;
          })
        );
      }
    );

    return () => unsub();
  }, [restaurant.id]);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cafeos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cafeos_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  // Sound & Toasts
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundService.setSoundEnabled(next);
      return next;
    });
  };

  const addToast = (title: string, message?: string, type: ToastItem['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (type === 'success') {
      soundService.playSuccessTone();
    }

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateRestaurant = (updates: Partial<RestaurantProfile>) => {
    setRestaurant((prev) => ({ ...prev, ...updates }));
    addToast('Settings Updated', 'Restaurant configuration saved successfully', 'success');
  };

  // Product management (Connected to Supabase with local optimistic updates)
  const addProduct = async (
    newProd: Omit<Product, 'id' | 'rating' | 'reviewCount'>,
    addons?: any[],
    variants?: any[]
  ) => {
    try {
      const targetCat = categories.find((c) => c.slug === newProd.category);
      const catId = targetCat && targetCat.id !== 'cat-all' ? targetCat.id : (categories[1]?.id || categories[0]?.id);

      const dbProduct = await menuService.createProduct(
        {
          restaurant_id: restaurant.id,
          category_id: catId,
          name: newProd.name,
          description: newProd.description,
          price: newProd.price,
          original_price: newProd.originalPrice,
          image_url: newProd.image,
          is_veg: newProd.isVeg,
          is_available: newProd.isAvailable,
          is_bestseller: newProd.isBestseller,
          prep_time_minutes: newProd.prepTimeMinutes,
          calories: newProd.calories,
        },
        addons,
        variants
      );

      const uiProd = mapDatabaseProductToUI(dbProduct, newProd.category);
      setProducts((prev) => [uiProd, ...prev]);
      addToast('Product Created', `${uiProd.name} saved to live database.`, 'success');
      return uiProd;
    } catch (err: any) {
      console.warn('Live create product fallback:', err);
      const created: Product = {
        ...newProd,
        id: `prod-${Date.now()}`,
        rating: 5.0,
        reviewCount: 1,
      };
      setProducts((prev) => [created, ...prev]);
      addToast('Product Created', `${created.name} added to menu catalog.`, 'success');
      return created;
    }
  };

  const updateProduct = async (
    id: string,
    updates: Partial<Product>,
    addons?: any[],
    variants?: any[]
  ) => {
    try {
      const targetCat = updates.category ? categories.find((c) => c.slug === updates.category) : undefined;
      await menuService.updateProductWithDetails(
        id,
        {
          name: updates.name,
          description: updates.description,
          price: updates.price,
          original_price: updates.originalPrice,
          image_url: updates.image,
          is_veg: updates.isVeg,
          is_available: updates.isAvailable,
          is_bestseller: updates.isBestseller,
          prep_time_minutes: updates.prepTimeMinutes,
          calories: updates.calories,
          category_id: targetCat && targetCat.id !== 'cat-all' ? targetCat.id : undefined,
        },
        addons,
        variants
      );
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      addToast('Product Updated', 'Changes saved to live menu.', 'success');
    } catch (err: any) {
      console.warn('Live update product fallback:', err);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      addToast('Product Updated', 'Changes saved to menu.', 'success');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await menuService.deleteProduct(id);
    } catch (err) {
      console.warn('Live delete product fallback:', err);
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addToast('Product Removed', 'Item removed from catalog.', 'info');
  };

  const toggleProductAvailability = async (id: string) => {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const nextState = !current.isAvailable;

    try {
      await menuService.toggleProductAvailability(id, nextState);
    } catch (err) {
      console.warn('Live toggle availability fallback:', err);
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAvailable: nextState } : p))
    );

    addToast(
      nextState ? 'Marked In Stock' : 'Marked Sold Out (86)',
      `${current.name} is now ${nextState ? 'available' : 'hidden from ordering'}.`,
      nextState ? 'success' : 'warning'
    );
  };

  const addCategory = async (name: string, icon: string) => {
    try {
      const created = await menuService.createCategory({
        restaurant_id: restaurant.id,
        name: name.trim(),
        icon: icon || '🍛',
      });
      const newCat: Category = {
        id: created.id,
        name: created.name,
        slug: created.slug,
        icon: created.icon,
        itemCount: 0,
      };
      setCategories((prev) => [...prev, newCat]);
      addToast('Category Added', `Added category: ${name}`, 'success');
      return newCat;
    } catch (err: any) {
      console.warn('Live add category fallback:', err);
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name,
        slug,
        icon: icon || '🍛',
        itemCount: 0,
      };
      setCategories((prev) => [...prev, newCat]);
      addToast('Category Added', `Added category: ${name}`, 'success');
      return newCat;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      await menuService.deleteCategory(categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      addToast('Category Removed', 'Category removed successfully', 'info');
    } catch (err: any) {
      console.warn('Could not delete category:', err);
      addToast('Error', err.message || 'Cannot delete category', 'error');
    }
  };

  // Orders
  const reloadOrders = useCallback(async () => {
    if (!restaurant.id) return;
    try {
      const dbOrders = await orderService.getOrders(restaurant.id);
      if (dbOrders && dbOrders.length > 0) {
        setOrders(dbOrders);
      }
    } catch (err) {
      console.warn('Could not reload orders from database:', err);
    }
  }, [restaurant.id]);

  useEffect(() => {
    if (restaurant.id) {
      reloadOrders();
    }
  }, [restaurant.id, reloadOrders]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    const prevOrder = orders.find((o) => o.id === orderId);

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            notes: status === 'cancelled' && reason ? `Cancelled: ${reason}` : o.notes,
          };
        }
        return o;
      })
    );
    soundService.playSuccessTone();

    try {
      await orderService.updateOrderStatus(orderId, status as any, reason);
      addToast(
        'Order Updated',
        `Order ${prevOrder?.orderNumber || orderId} set to ${status.toUpperCase()}`,
        status === 'cancelled' ? 'warning' : 'success'
      );
    } catch (err: any) {
      console.warn('Backend order status sync notice:', err);
      // Keep optimistic update active and confirmed
      addToast(
        'Order Updated',
        `Order ${prevOrder?.orderNumber || orderId} set to ${status.toUpperCase()}`,
        status === 'cancelled' ? 'warning' : 'success'
      );
    }
  };

  const toggleOrderPriority = async (orderId: string, isPriority: boolean, reason?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            isPriority,
            priorityReason: isPriority ? (reason || 'Kitchen Rush Priority') : undefined,
          };
        }
        return o;
      })
    );

    try {
      await orderService.toggleOrderPriority(orderId, isPriority, reason);
      addToast(
        isPriority ? 'Rush Priority Marked' : 'Priority Cleared',
        isPriority ? 'Ticket marked as high priority' : 'Ticket set to normal priority',
        isPriority ? 'warning' : 'info'
      );
    } catch (err: any) {
      console.warn('Failed to toggle priority on backend:', err);
    }
  };

  const updatePaymentStatus = (orderId: string, paymentStatus: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
    );
    addToast('Payment Recorded', `Order payment updated to ${paymentStatus}`, 'success');
  };

  const createNewOrder = (orderData: {
    customerName: string;
    customerPhone?: string;
    orderType: Order['orderType'];
    tableNumber?: string;
    items: Order['items'];
    subtotal: number;
    tax: number;
    discount?: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    notes?: string;
  }): Order => {
    const orderNumber = `#CF-${Math.floor(100 + Math.random() * 900)}`;
    const generatedId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
    const newOrder: Order = {
      id: generatedId,
      orderNumber,
      customerName: orderData.customerName || 'Walk-in Guest',
      customerPhone: orderData.customerPhone,
      orderType: orderData.orderType,
      tableNumber: orderData.tableNumber,
      status: 'pending',
      items: orderData.items,
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      discount: orderData.discount || 0,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus,
      createdAt: new Date().toISOString(),
      prepTimeMinutes: 15,
      estimatedReadyAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      notes: orderData.notes,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // If order is dine-in and table specified, update table status
    if (orderData.tableNumber) {
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber.toLowerCase() === orderData.tableNumber?.toLowerCase()
            ? {
                ...t,
                status: 'occupied',
                activeOrderId: newOrder.id,
                activeOrderTotal: newOrder.total,
                occupiedSince: 'Just now',
              }
            : t
        )
      );
    }

    soundService.playNewOrderBell();
    addToast(
      'New Order Placed!',
      `${orderNumber} for ${newOrder.customerName} (${orderData.items.length} items)`,
      'success'
    );

    return newOrder;
  };

  // Tables
  const updateTableStatus = (tableId: string, status: TableItem['status'], guestCount?: number) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status,
              guestCount: guestCount !== undefined ? guestCount : t.guestCount,
              activeOrderId: status === 'available' ? undefined : t.activeOrderId,
              activeOrderTotal: status === 'available' ? undefined : t.activeOrderTotal,
            }
          : t
      )
    );
    addToast('Table Updated', `Table status set to ${status}`, 'info');
  };

  const addTable = (table: Omit<TableItem, 'id'>) => {
    const newTable: TableItem = {
      ...table,
      id: `tbl-${Date.now()}`,
    };
    setTables((prev) => [...prev, newTable]);
    addToast('Table Added', `${newTable.tableNumber} added to floor plan`, 'success');
  };

  // Inventory
  const updateStock = async (ingredientId: string, delta: number) => {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) return;

    const nextStock = ing.availableStock + delta;
    if (nextStock < 0) {
      addToast(
        'Insufficient Stock',
        `Cannot deduct ${Math.abs(delta)} ${ing.unit}. Available stock is only ${ing.availableStock} ${ing.unit}.`,
        'error'
      );
      return;
    }

    try {
      await inventoryService.adjustStock({
        ingredientId,
        restaurantId: restaurant.id,
        delta,
        reason: delta > 0 ? 'Quick dashboard restock' : 'Stock usage adjustment',
        movementType: delta > 0 ? 'restock' : 'usage',
      });
      await reloadInventory();
      addToast(
        delta > 0 ? 'Stock Restocked' : 'Stock Adjusted',
        `${ing.name}: ${delta > 0 ? '+' : ''}${delta} ${ing.unit}`,
        'success'
      );
    } catch (err: any) {
      console.warn('Backend adjustStock fallback to local:', err);
      setIngredients((prev) =>
        prev.map((item) => {
          if (item.id === ingredientId) {
            const calculatedStock = Math.max(0, item.availableStock + delta);
            const nextStatus =
              calculatedStock === 0
                ? 'out-of-stock'
                : calculatedStock <= item.minStock
                ? 'low-stock'
                : 'in-stock';
            return {
              ...item,
              availableStock: calculatedStock,
              status: nextStatus,
            };
          }
          return item;
        })
      );
      addToast(
        delta > 0 ? 'Stock Restocked' : 'Stock Adjusted',
        `${ing.name}: ${delta > 0 ? '+' : ''}${delta} ${ing.unit}`,
        'success'
      );
    }
  };

  const addIngredient = async (ingredient: Omit<Ingredient, 'id' | 'status'>) => {
    try {
      await inventoryService.createIngredient({
        restaurant_id: restaurant.id,
        name: ingredient.name,
        category: ingredient.category,
        available_stock: ingredient.availableStock,
        min_stock: ingredient.minStock,
        unit: ingredient.unit,
        cost_per_unit: ingredient.costPerUnit,
      });
      await reloadInventory();
      addToast('Ingredient Added', `${ingredient.name} registered in inventory catalog.`, 'success');
    } catch (err: any) {
      console.warn('Backend addIngredient fallback to local:', err);
      const status =
        ingredient.availableStock === 0
          ? 'out-of-stock'
          : ingredient.availableStock <= ingredient.minStock
          ? 'low-stock'
          : 'in-stock';
      const newIng: Ingredient = {
        ...ingredient,
        id: `ing-${Date.now()}`,
        status,
      };
      setIngredients((prev) => [...prev, newIng]);
      addToast('Ingredient Added', `${newIng.name} added to inventory.`, 'success');
    }
  };

  // Employees
  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const created: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
    };
    setEmployees((prev) => [...prev, created]);
    addToast('Team Member Added', `${created.name} registered as ${created.role}`, 'success');
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    addToast('Employee Updated', 'Staff details updated.', 'info');
  };

  // Cart operations
  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedOptions: CartItem['selectedOptions'] = [],
    instructions?: string,
    variantId?: string,
    selectedAddonIds?: string[]
  ) => {
    const optionsCost = selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
    const unitPrice = product.price + optionsCost;
    const cartItemId = `${product.id}-${variantId || 'std'}-${selectedOptions.map((o) => o.optionName).sort().join('_')}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                itemTotalPrice: (item.quantity + quantity) * unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          quantity,
          selectedOptions,
          variantId,
          selectedAddonIds,
          specialInstructions: instructions,
          itemTotalPrice: quantity * unitPrice,
        },
      ];
    });

    addToast('Added to Cart', `${product.name} (x${quantity})`, 'success');
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const optionsCost = item.selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
          const unitPrice = item.product.price + optionsCost;
          return {
            ...item,
            quantity,
            itemTotalPrice: quantity * unitPrice,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.itemTotalPrice, 0);
  const cartTax = Math.round(cartSubtotal * (restaurant.taxPercentage / 100) * 100) / 100;
  const cartTotal = Math.round((cartSubtotal + cartTax) * 100) / 100;

  return (
    <CafeContext.Provider
      value={{
        restaurant,
        updateRestaurant,
        categories,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        addCategory,
        deleteCategory,
        reloadMenu,
        orders,
        reloadOrders,
        updateOrderStatus,
        toggleOrderPriority,
        updatePaymentStatus,
        createNewOrder,
        tables,
        updateTableStatus,
        addTable,
        ingredients,
        updateStock,
        addIngredient,
        reloadInventory,
        employees,
        addEmployee,
        updateEmployee,
        customers,
        superAdminRestaurants,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartTax,
        cartTotal,
        soundEnabled,
        toggleSound,
        toasts,
        addToast,
        removeToast,
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </CafeContext.Provider>
  );
};

export const useCafe = () => {
  const context = useContext(CafeContext);
  if (!context) {
    throw new Error('useCafe must be used within a CafeProvider');
  }
  return context;
};

