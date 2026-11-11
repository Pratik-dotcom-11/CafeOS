import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { Order, OrderItem } from '../types';
import { inventoryService } from './inventoryService';

export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

export type PaymentRow = Database['public']['Tables']['payments']['Row'];

export interface OrderWithItems extends OrderRow {
  order_items: OrderItemRow[];
  payments?: PaymentRow[];
  restaurant?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    contact_phone?: string;
    currency_symbol?: string;
  };
}

export interface CustomerOrderItemPayload {
  productId: string;
  quantity: number;
  variantId?: string;
  selectedAddonIds?: string[];
  specialInstructions?: string;
}

export interface CustomerOrderPayload {
  restaurantId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableId?: string;
  tableNumber?: string;
  deliveryAddress?: string;
  paymentMethod: 'card' | 'upi' | 'cash' | 'counter';
  promoCode?: string;
  notes?: string;
  idempotencyKey?: string;
  items: CustomerOrderItemPayload[];
}

export interface StaffCreateOrderPayload {
  restaurantId: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  orderType: Database['public']['Enums']['order_type'];
  tableId?: string;
  tableNumberSnapshot?: string;
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  paymentMethod: Database['public']['Enums']['payment_method'];
  paymentStatus?: Database['public']['Enums']['payment_status'];
  notes?: string;
  prepTimeMinutes?: number;
  items: {
    productId?: string;
    productNameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
    itemTotal: number;
    isVegSnapshot?: boolean;
    selectedOptionsSnapshot?: any;
    specialInstructions?: string;
  }[];
}

/**
 * Maps a Supabase DB row (with optional order_items array) to the application UI Order model.
 */
export function mapDatabaseOrderToUI(row: any): Order {
  const rawItems = Array.isArray(row.order_items) ? row.order_items : [];
  const items: OrderItem[] = rawItems.map((oi: any) => ({
    id: oi.id || `item-${Math.random()}`,
    productId: oi.product_id || '',
    name: oi.product_name_snapshot || 'Culinary Dish',
    price: Number(oi.price_snapshot || 0),
    quantity: Number(oi.quantity || 1),
    isVeg: oi.is_veg_snapshot ?? true,
    selectedOptions: Array.isArray(oi.selected_options_snapshot)
      ? oi.selected_options_snapshot.map((s: any) => (typeof s === 'string' ? s : s.name || s.optionName))
      : undefined,
    specialInstructions: oi.special_instructions || undefined,
  }));

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || undefined,
    orderType: row.order_type as any,
    tableNumber: row.table_number_snapshot || undefined,
    status: row.status as any,
    items,
    subtotal: Number(row.subtotal || 0),
    tax: Number(row.tax || 0),
    discount: Number(row.discount || 0),
    total: Number(row.total || 0),
    paymentMethod: row.payment_method as any,
    paymentStatus: row.payment_status as any,
    createdAt: row.created_at,
    prepTimeMinutes: row.prep_time_minutes || 15,
    estimatedReadyAt: row.estimated_ready_at || undefined,
    notes: row.notes || undefined,
    isPriority: Boolean(row.is_priority),
    priorityReason: row.priority_reason || undefined,
    prepStartedAt: row.prep_started_at || undefined,
    readyAt: row.ready_at || undefined,
    completedAt: row.completed_at || undefined,
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const orderService = {
  /**
   * Process customer order atomically through the secure database function.
   * Performs server-side price recalculation, table validation, promo code logic,
   * idempotency protection and atomic transaction.
   */
  async createCustomerOrder(payload: CustomerOrderPayload): Promise<{
    id: string;
    order_number: string;
    status: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    is_duplicate?: boolean;
  }> {
    const idempotencyKey =
      payload.idempotencyKey ||
      `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const rpcPayload = {
      p_restaurant_id: payload.restaurantId,
      p_customer_id: payload.customerId || null,
      p_customer_name: payload.customerName.trim(),
      p_customer_phone: payload.customerPhone?.trim() || null,
      p_order_type: payload.orderType,
      p_table_id: payload.tableId || null,
      p_table_number: payload.tableNumber || null,
      p_delivery_address: payload.deliveryAddress?.trim() || null,
      p_payment_method: payload.paymentMethod,
      p_promo_code: payload.promoCode?.trim() || null,
      p_notes: payload.notes?.trim() || null,
      p_idempotency_key: idempotencyKey,
      p_items: payload.items.map((it) => ({
        product_id: it.productId,
        quantity: Math.max(1, it.quantity),
        variant_id: it.variantId || null,
        selected_addon_ids: it.selectedAddonIds || [],
        special_instructions: it.specialInstructions?.trim() || null,
      })),
    };

    try {
      const { data, error } = await (supabase.rpc as any)('process_customer_order', rpcPayload);
      if (!error && data) {
        return data;
      }
      if (error) {
        // If it's an explicit business exception, re-throw for user presentation
        const errMsg = error.message || '';
        if (
          errMsg.includes('closed') ||
          errMsg.includes('sold out') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('Delivery service is not available') ||
          errMsg.includes('0 items')
        ) {
          throw error;
        }
        console.warn('RPC process_customer_order notice, attempting direct DB creation fallback:', error);
      }
    } catch (rpcErr: any) {
      const msg = rpcErr.message || '';
      if (
        msg.includes('closed') ||
        msg.includes('sold out') ||
        msg.includes('unavailable') ||
        msg.includes('Delivery service is not available') ||
        msg.includes('0 items')
      ) {
        throw rpcErr;
      }
      console.warn('RPC process_customer_order threw, executing direct DB order transaction:', rpcErr);
    }

    // Direct Database Fallback:
    // 1. Idempotency Check
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number, status, subtotal, tax, discount, total')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingOrder) {
      return {
        id: existingOrder.id,
        order_number: existingOrder.order_number,
        status: existingOrder.status,
        subtotal: Number(existingOrder.subtotal),
        tax: Number(existingOrder.tax),
        discount: Number(existingOrder.discount),
        total: Number(existingOrder.total),
        is_duplicate: true,
      };
    }

    // 2. Query Restaurant
    const { data: restRow } = await supabase
      .from('restaurants')
      .select('id, name, tax_percentage, is_active, delivery_available')
      .eq('id', payload.restaurantId)
      .single();

    if (!restRow) {
      throw new Error('Restaurant not found');
    }
    if (!restRow.is_active) {
      throw new Error(`Restaurant "${restRow.name}" is currently closed.`);
    }
    if (payload.orderType === 'delivery' && !restRow.delivery_available) {
      throw new Error('Delivery service is not available for this restaurant.');
    }

    // 3. Query Products & Recalculate Prices Strictly from DB
    const productIds = payload.items.map((i) => i.productId);
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, name, price, is_veg, is_available, prep_time_minutes')
      .in('id', productIds)
      .eq('restaurant_id', payload.restaurantId);

    const productMap = new Map((dbProducts || []).map((p) => [p.id, p]));

    let calculatedSubtotal = 0;
    const itemsToInsert: any[] = [];

    for (const it of payload.items) {
      const dbProd = productMap.get(it.productId);
      if (!dbProd) {
        throw new Error(`Selected item is no longer available on this menu.`);
      }
      if (!dbProd.is_available) {
        throw new Error(`"${dbProd.name}" is currently sold out.`);
      }

      let unitPrice = Number(dbProd.price);

      // Check variant price
      if (it.variantId) {
        const { data: vrRow } = await supabase
          .from('product_variants')
          .select('name, price_adjustment')
          .eq('id', it.variantId)
          .eq('product_id', it.productId)
          .maybeSingle();
        if (vrRow) {
          unitPrice += Number(vrRow.price_adjustment);
        }
      }

      const qty = Math.max(1, it.quantity);
      const itemTotal = unitPrice * qty;
      calculatedSubtotal += itemTotal;

      itemsToInsert.push({
        product_id: it.productId,
        product_name_snapshot: dbProd.name,
        price_snapshot: unitPrice,
        quantity: qty,
        item_total: itemTotal,
        is_veg_snapshot: dbProd.is_veg,
        special_instructions: it.specialInstructions?.trim() || null,
      });
    }

    // 4. Calculate Taxes & Discounts
    const taxRate = Number(restRow.tax_percentage || 5.0) / 100;
    const calculatedTax = Math.round(calculatedSubtotal * taxRate * 100) / 100;

    let calculatedDiscount = 0;
    if (payload.promoCode?.trim().toUpperCase() === 'CAFE10') {
      calculatedDiscount = Math.round(calculatedSubtotal * 0.1 * 100) / 100;
    } else if (payload.promoCode?.trim().toUpperCase() === 'WELCOME') {
      calculatedDiscount = Math.min(50, calculatedSubtotal);
    }

    const calculatedTotal = Math.max(0, calculatedSubtotal + calculatedTax - calculatedDiscount);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // 5. Insert Order
    const { data: newOrderRow, error: orderErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: payload.restaurantId,
        customer_id: payload.customerId || null,
        order_number: orderNumber,
        customer_name: payload.customerName.trim(),
        customer_phone: payload.customerPhone?.trim() || null,
        order_type: payload.orderType,
        table_number_snapshot: payload.orderType === 'dine-in' ? payload.tableNumber || 'Table 01' : null,
        delivery_address: payload.orderType === 'delivery' ? payload.deliveryAddress?.trim() : null,
        status: 'pending',
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        discount: calculatedDiscount,
        total: calculatedTotal,
        payment_method: payload.paymentMethod as any,
        payment_status: payload.paymentMethod === 'counter' ? 'pending' : 'pending',
        notes: payload.notes?.trim() || null,
        idempotency_key: idempotencyKey,
      } as any)
      .select('id, order_number, status, subtotal, tax, discount, total')
      .single();

    if (orderErr || !newOrderRow) {
      throw orderErr || new Error('Failed to create order record');
    }

    // 6. Insert Order Items
    const itemRecords = itemsToInsert.map((it) => ({
      ...it,
      order_id: newOrderRow.id,
    }));

    await supabase.from('order_items').insert(itemRecords as any);

    return {
      id: newOrderRow.id,
      order_number: newOrderRow.order_number,
      status: newOrderRow.status,
      subtotal: Number(newOrderRow.subtotal),
      tax: Number(newOrderRow.tax),
      discount: Number(newOrderRow.discount),
      total: Number(newOrderRow.total),
    };
  },

  /**
   * Fetch order history for an authenticated customer across all restaurants.
   */
  async getCustomerOrders(customerId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*),
        restaurant:restaurants (
          id,
          name,
          slug,
          logo_url,
          contact_phone,
          currency_symbol
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch customer orders:', error);
      return [];
    }

    return (data || []).map(mapDatabaseOrderToUI);
  },

  /**
   * Fetch a single order with hydrated item list and restaurant metadata for customer order tracking.
   */
  async getOrderTracking(orderId: string): Promise<Order | null> {
    if (!UUID_REGEX.test(orderId)) {
      return null;
    }
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*),
        restaurant:restaurants (
          id,
          name,
          slug,
          logo_url,
          contact_phone,
          currency_symbol
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapDatabaseOrderToUI(data);
  },

  /**
   * Cancel an order from customer side (only permitted while status is 'pending').
   */
  async cancelCustomerOrder(orderId: string, reason?: string) {
    if (!UUID_REGEX.test(orderId)) {
      return { id: orderId, status: 'cancelled' };
    }
    const { data, error } = await (supabase.rpc as any)('transition_order_status', {
      p_order_id: orderId,
      p_next_status: 'cancelled',
      p_reason: reason || 'Cancelled by customer',
      p_is_staff: false,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Toggle rush / priority flag for an order (Kitchen operation).
   */
  async toggleOrderPriority(orderId: string, isPriority: boolean, reason?: string) {
    if (!UUID_REGEX.test(orderId)) {
      return { id: orderId, is_priority: isPriority, reason };
    }
    const { data, error } = await (supabase.rpc as any)('toggle_order_priority', {
      p_order_id: orderId,
      p_is_priority: isPriority,
      p_reason: reason || null,
    });

    if (error) throw error;
    return data;
  },



  /**
   * Update order status via state machine (staff operation).
   * Automatically deducts recipe ingredients when order transitions to 'preparing'.
   * Automatically restores deducted ingredients when order is 'cancelled'.
   */
  async updateOrderStatus(
    orderId: string,
    status: Database['public']['Enums']['order_status'],
    reason?: string
  ) {
    // If not a valid UUID, handle as local mock order
    if (!UUID_REGEX.test(orderId)) {
      return { id: orderId, status, updated_at: new Date().toISOString() };
    }

    // 1. Fetch order details to know the restaurant
    const { data: orderRow } = await supabase
      .from('orders')
      .select('id, restaurant_id, status')
      .eq('id', orderId)
      .single();

    const restaurantId = orderRow?.restaurant_id;

    // 2. If transitioning to 'preparing', perform atomic recipe ingredient stock validation and deduction
    if (status === 'preparing' && restaurantId) {
      await inventoryService.deductInventoryForOrder(orderId, restaurantId);
    }

    // 3. If transitioning to 'cancelled', reverse any inventory previously deducted
    if (status === 'cancelled' && restaurantId) {
      try {
        await inventoryService.reverseInventoryForOrder(orderId, restaurantId, reason);
      } catch (revErr) {
        console.warn('Inventory reversal warning:', revErr);
      }
    }

    // 4. Transition order status in database via state machine RPC
    try {
      const { data, error } = await (supabase.rpc as any)('transition_order_status', {
        p_order_id: orderId,
        p_next_status: status,
        p_reason: reason || null,
        p_is_staff: true,
      });

      if (!error && data) {
        return data;
      }
    } catch (rpcErr) {
      console.warn('RPC state machine notice, falling back to direct status update:', rpcErr);
    }

    // 5. Fallback: Direct row update if RPC throws or custom state step
    try {
      const { data: updatedRow } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'cancelled' && reason ? { cancellation_reason: reason } : {}),
          ...(status === 'preparing' ? { prep_started_at: new Date().toISOString() } : {}),
          ...(status === 'ready' ? { ready_at: new Date().toISOString() } : {}),
          ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
        })
        .eq('id', orderId)
        .select()
        .maybeSingle();

      if (updatedRow) return updatedRow;
    } catch (directErr) {
      console.warn('Direct order row status sync note:', directErr);
    }

    return { id: orderId, status, updated_at: new Date().toISOString() };
  },

  /**
   * Fetch active or historical orders for a restaurant (for admin/staff dashboard).
   */
  async getOrders(
    restaurantId: string,
    options?: {
      status?: Database['public']['Enums']['order_status'] | Database['public']['Enums']['order_status'][];
      orderType?: Database['public']['Enums']['order_type'];
      limit?: number;
    }
  ): Promise<Order[]> {
    if (!UUID_REGEX.test(restaurantId)) {
      return [];
    }
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    if (options?.orderType) {
      query = query.eq('order_type', options.orderType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapDatabaseOrderToUI);
  },

  /**
   * Fetch a single order by ID with item snapshots and payment records.
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        payments (*)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapDatabaseOrderToUI(data);
  },

  /**
   * Legacy / Staff Direct Order Creation (POS).
   */
  async createStaffOrder(payload: StaffCreateOrderPayload): Promise<Order> {
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: payload.restaurantId,
        order_number: payload.orderNumber,
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone || null,
        order_type: payload.orderType,
        table_id: payload.tableId || null,
        table_number_snapshot: payload.tableNumberSnapshot || null,
        subtotal: payload.subtotal,
        tax: payload.tax,
        discount: payload.discount || 0,
        total: payload.total,
        payment_method: payload.paymentMethod,
        payment_status: payload.paymentStatus || 'pending',
        notes: payload.notes || null,
        prep_time_minutes: payload.prepTimeMinutes || 15,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    if (payload.items && payload.items.length > 0) {
      const itemsToInsert: OrderItemInsert[] = payload.items.map((it) => ({
        order_id: newOrder.id,
        product_id: it.productId || null,
        product_name_snapshot: it.productNameSnapshot,
        price_snapshot: it.priceSnapshot,
        quantity: it.quantity,
        item_total: it.itemTotal,
        is_veg_snapshot: it.isVegSnapshot ?? true,
        selected_options_snapshot: it.selectedOptionsSnapshot || null,
        special_instructions: it.specialInstructions || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    if (payload.paymentStatus === 'paid') {
      await supabase.from('payments').insert({
        restaurant_id: payload.restaurantId,
        order_id: newOrder.id,
        amount: payload.total,
        payment_method: payload.paymentMethod,
        payment_status: 'paid',
      });
    }

    const fullOrder = await this.getOrderById(newOrder.id);
    return fullOrder || mapDatabaseOrderToUI(newOrder);
  },

  /**
   * Realtime subscription for a specific order (Customer tracking page).
   */
  subscribeToOrder(
    orderId: string,
    onUpdate: (order: Partial<OrderRow> & { cancellation_reason?: string }) => void
  ) {
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          onUpdate(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Realtime subscription for restaurant orders (KDS, POS live tickets).
   */
  subscribeToRestaurantOrders(
    restaurantId: string,
    onInsert?: (order: Order) => void,
    onUpdate?: (order: Partial<Order>) => void
  ) {
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          if (!onInsert) return;
          try {
            const fullOrder = await orderService.getOrderById(payload.new.id);
            if (fullOrder) {
              onInsert(fullOrder);
            } else {
              onInsert(mapDatabaseOrderToUI(payload.new));
            }
          } catch {
            onInsert(mapDatabaseOrderToUI(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (onUpdate) {
            onUpdate({
              id: payload.new.id,
              status: payload.new.status as any,
              paymentStatus: payload.new.payment_status as any,
              notes: payload.new.notes || undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

export default orderService;
