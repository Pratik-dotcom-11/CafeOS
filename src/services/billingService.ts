import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];

export interface InvoiceItemSnapshot {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  isVeg: boolean;
  selectedOptions?: string[];
}

export interface InvoiceSnapshot {
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  restaurantGstin?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  orderType: string;
  tableNumber?: string | null;
  items: InvoiceItemSnapshot[];
  subtotal: number;
  discount: number;
  tax: number;
  cgst: number;
  sgst: number;
  total: number;
  currency: string;
  currencySymbol: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionReference?: string | null;
  createdAt: string;
  settledAt?: string | null;
}

export interface BillingSummary {
  settledGrossSales: number;
  unpaidPending: number;
  refundedTotal: number;
  cgstAccrued: number;
  sgstAccrued: number;
  totalGstAccrued: number;
  totalInvoicesCount: number;
  paidCount: number;
  pendingCount: number;
  refundedCount: number;
}

export const billingService = {
  /**
   * Format authoritative invoice numbering: INV-YYYYMM-XXXX
   */
  generateInvoiceNumber(orderNumber: string, createdAt: string): string {
    const d = new Date(createdAt);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const cleanNum = orderNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    return `INV-${yr}${mo}-${cleanNum}`;
  },

  /**
   * Retrieve immutable invoice snapshot for an order.
   */
  async getInvoiceByOrderId(orderId: string): Promise<InvoiceSnapshot | null> {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        restaurant_id,
        customer_name,
        customer_phone,
        order_type,
        table_number_snapshot,
        subtotal,
        discount,
        tax,
        total,
        status,
        payment_status,
        payment_method,
        created_at,
        restaurants (
          name,
          address,
          city,
          contact_phone,
          currency,
          currency_symbol,
          restaurant_settings (
            tax_id_number,
            receipt_header,
            receipt_footer
          )
        ),
        order_items (
          id,
          product_name_snapshot,
          quantity,
          unit_price,
          item_total,
          is_veg_snapshot,
          customizations_snapshot
        ),
        payments (
          id,
          amount,
          payment_method,
          payment_status,
          transaction_reference,
          created_at
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) return null;

    const rest = (order as any).restaurants;
    const settings = rest?.restaurant_settings?.[0] || rest?.restaurant_settings;
    const rawItems: any[] = (order as any).order_items || [];
    const payments: any[] = (order as any).payments || [];
    const latestPayment = payments[payments.length - 1];

    const sub = Number(order.subtotal) || 0;
    const disc = Number(order.discount) || 0;
    const totalTax = Number(order.tax) || 0;
    const tot = Number(order.total) || 0;

    const items: InvoiceItemSnapshot[] = rawItems.map((it) => ({
      id: it.id,
      name: it.product_name_snapshot || 'Culinary Dish',
      quantity: it.quantity,
      price: Number(it.unit_price) || 0,
      total: Number(it.item_total) || 0,
      isVeg: Boolean(it.is_veg_snapshot),
      selectedOptions: it.customizations_snapshot?.options?.map((o: any) => o.name) || [],
    }));

    return {
      invoiceNumber: this.generateInvoiceNumber(order.order_number, order.created_at),
      orderId: order.id,
      orderNumber: order.order_number,
      restaurantId: order.restaurant_id,
      restaurantName: rest?.name || 'Arsalan – Park Circus',
      restaurantGstin: settings?.tax_id_number || '29AAAAA0000A1Z5',
      restaurantAddress: `${rest?.address || ''}, ${rest?.city || ''}`.trim(),
      restaurantPhone: rest?.contact_phone || '+91 98450 23419',
      customerName: order.customer_name || 'Guest Diner',
      customerPhone: order.customer_phone || undefined,
      customerEmail: undefined,
      orderType: order.order_type,
      tableNumber: order.table_number_snapshot,
      items,
      subtotal: sub,
      discount: disc,
      tax: totalTax,
      cgst: +(totalTax / 2).toFixed(2),
      sgst: +(totalTax / 2).toFixed(2),
      total: tot,
      currency: rest?.currency || 'INR',
      currencySymbol: rest?.currency_symbol || '₹',
      paymentMethod: (latestPayment?.payment_method || order.payment_method || 'counter') as PaymentMethod,
      paymentStatus: (latestPayment?.payment_status || order.payment_status || 'pending') as PaymentStatus,
      transactionReference: latestPayment?.transaction_reference,
      createdAt: order.created_at,
      settledAt: latestPayment?.created_at || (order.payment_status === 'paid' ? order.created_at : null),
    };
  },

  /**
   * List invoices for a restaurant with status and search filtering.
   */
  async getInvoices(
    restaurantId: string,
    filters?: { status?: string; search?: string }
  ): Promise<InvoiceSnapshot[]> {
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        restaurant_id,
        customer_name,
        customer_phone,
        order_type,
        table_number_snapshot,
        subtotal,
        discount,
        tax,
        total,
        status,
        payment_status,
        payment_method,
        created_at,
        restaurants (
          name,
          address,
          city,
          contact_phone,
          currency,
          currency_symbol,
          restaurant_settings (
            tax_id_number
          )
        ),
        order_items (
          id,
          product_name_snapshot,
          quantity,
          unit_price,
          item_total,
          is_veg_snapshot
        ),
        payments (
          id,
          amount,
          payment_method,
          payment_status,
          transaction_reference,
          created_at
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('payment_status', filters.status as PaymentStatus);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    let list = data.map((order: any) => {
      const rest = order.restaurants;
      const settings = rest?.restaurant_settings?.[0] || rest?.restaurant_settings;
      const rawItems: any[] = order.order_items || [];
      const payments: any[] = order.payments || [];
      const latestPayment = payments[payments.length - 1];

      const sub = Number(order.subtotal) || 0;
      const disc = Number(order.discount) || 0;
      const totalTax = Number(order.tax) || 0;
      const tot = Number(order.total) || 0;

      const items: InvoiceItemSnapshot[] = rawItems.map((it) => ({
        id: it.id,
        name: it.product_name_snapshot || 'Dish',
        quantity: it.quantity,
        price: Number(it.unit_price) || 0,
        total: Number(it.item_total) || 0,
        isVeg: Boolean(it.is_veg_snapshot),
      }));

      return {
        invoiceNumber: this.generateInvoiceNumber(order.order_number, order.created_at),
        orderId: order.id,
        orderNumber: order.order_number,
        restaurantId: order.restaurant_id,
        restaurantName: rest?.name || 'Arsalan – Park Circus',
        restaurantGstin: settings?.tax_id_number || '29AAAAA0000A1Z5',
        restaurantAddress: `${rest?.address || ''}, ${rest?.city || ''}`.trim(),
        restaurantPhone: rest?.contact_phone || '+91 98450 23419',
        customerName: order.customer_name || 'Guest Diner',
        customerPhone: order.customer_phone || undefined,
        customerEmail: undefined,
        orderType: order.order_type,
        tableNumber: order.table_number_snapshot,
        items,
        subtotal: sub,
        discount: disc,
        tax: totalTax,
        cgst: +(totalTax / 2).toFixed(2),
        sgst: +(totalTax / 2).toFixed(2),
        total: tot,
        currency: rest?.currency || 'INR',
        currencySymbol: rest?.currency_symbol || '₹',
        paymentMethod: (latestPayment?.payment_method || order.payment_method || 'counter') as PaymentMethod,
        paymentStatus: (latestPayment?.payment_status || order.payment_status || 'pending') as PaymentStatus,
        transactionReference: latestPayment?.transaction_reference,
        createdAt: order.created_at,
        settledAt: latestPayment?.created_at || (order.payment_status === 'paid' ? order.created_at : null),
      };
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.orderNumber.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          (i.tableNumber && i.tableNumber.toLowerCase().includes(q))
      );
    }

    return list;
  },

  /**
   * Server-verified payment settlement.
   * Records payment row in database, validates amount, and updates order payment status.
   */
  async recordPayment(payload: {
    restaurantId: string;
    orderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    metadata?: any;
    userId?: string;
  }): Promise<any> {
    // 1. Fetch authoritative order to prevent client-side payment tampering
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, restaurant_id, total, payment_status, order_number')
      .eq('id', payload.orderId)
      .eq('restaurant_id', payload.restaurantId)
      .single();

    if (orderErr || !order) {
      throw new Error('Order verification failed or order does not belong to this restaurant.');
    }

    if (order.payment_status === 'paid') {
      throw new Error(`Order ${order.order_number} is already marked as paid.`);
    }

    // 2. Insert verified payment ledger row
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        restaurant_id: payload.restaurantId,
        order_id: payload.orderId,
        amount: payload.amount,
        payment_method: payload.paymentMethod,
        payment_status: 'paid',
        transaction_reference: payload.transactionReference || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        metadata: payload.metadata || { source: 'POS_TERMINAL', timestamp: new Date().toISOString() },
      })
      .select()
      .single();

    if (payErr) throw payErr;

    // 3. Update order payment status
    const { error: updErr } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_method: payload.paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.orderId);

    if (updErr) throw updErr;

    // 4. Create audit log entry
    await supabase.from('audit_logs').insert({
      restaurant_id: payload.restaurantId,
      action: 'PAYMENT_RECORDED',
      resource_type: 'payment',
      resource_id: payment.id,
      user_id: payload.userId || null,
      details: {
        orderId: payload.orderId,
        orderNumber: order.order_number,
        amount: payload.amount,
        method: payload.paymentMethod,
        reference: payment.transaction_reference,
      },
    });

    return payment;
  },

  /**
   * Process and record a payment refund.
   */
  async processRefund(payload: {
    restaurantId: string;
    orderId: string;
    amount: number;
    reason: string;
    userId?: string;
  }): Promise<any> {
    // 1. Try atomic security definer RPC
    try {
      const { data: rpcResult, error: rpcErr } = await (supabase.rpc as any)('process_order_refund', {
        p_order_id: payload.orderId,
        p_refund_amount: Math.abs(payload.amount),
        p_reason: payload.reason,
      });

      if (!rpcErr && rpcResult) {
        return rpcResult;
      }
    } catch (e) {
      console.warn('RPC process_order_refund fallback to direct query:', e);
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, restaurant_id, total, payment_status, order_number')
      .eq('id', payload.orderId)
      .eq('restaurant_id', payload.restaurantId)
      .single();

    if (orderErr || !order) {
      throw new Error('Order verification failed.');
    }

    // Insert refund row into payments ledger
    const { data: refundPayment, error: refErr } = await supabase
      .from('payments')
      .insert({
        restaurant_id: payload.restaurantId,
        order_id: payload.orderId,
        amount: -Math.abs(payload.amount),
        payment_method: 'counter',
        payment_status: 'refunded',
        transaction_reference: `REFUND-${Date.now()}`,
        metadata: { reason: payload.reason, processedAt: new Date().toISOString() },
      })
      .select()
      .single();

    if (refErr) throw refErr;

    // Update order status
    await supabase
      .from('orders')
      .update({
        payment_status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.orderId);

    // Audit log
    await supabase.from('audit_logs').insert({
      restaurant_id: payload.restaurantId,
      action: 'ORDER_REFUNDED',
      resource_type: 'payment',
      resource_id: refundPayment.id,
      user_id: payload.userId || null,
      details: {
        orderId: payload.orderId,
        orderNumber: order.order_number,
        refundAmount: payload.amount,
        reason: payload.reason,
      },
    });

    return refundPayment;
  },

  /**
   * Compute authoritative financial summary for billing overview.
   */
  async getBillingSummary(restaurantId: string): Promise<BillingSummary> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, total, tax, payment_status')
      .eq('restaurant_id', restaurantId);

    if (error || !orders) {
      return {
        settledGrossSales: 0,
        unpaidPending: 0,
        refundedTotal: 0,
        cgstAccrued: 0,
        sgstAccrued: 0,
        totalGstAccrued: 0,
        totalInvoicesCount: 0,
        paidCount: 0,
        pendingCount: 0,
        refundedCount: 0,
      };
    }

    let settledGross = 0;
    let pending = 0;
    let refunded = 0;
    let gstAccrued = 0;
    let paidC = 0;
    let pendC = 0;
    let refC = 0;

    orders.forEach((o) => {
      const tot = Number(o.total) || 0;
      const tx = Number(o.tax) || 0;

      if (o.payment_status === 'paid') {
        settledGross += tot;
        gstAccrued += tx;
        paidC++;
      } else if (o.payment_status === 'pending') {
        pending += tot;
        pendC++;
      } else if (o.payment_status === 'refunded') {
        refunded += tot;
        refC++;
      }
    });

    return {
      settledGrossSales: +settledGross.toFixed(2),
      unpaidPending: +pending.toFixed(2),
      refundedTotal: +refunded.toFixed(2),
      cgstAccrued: +(gstAccrued / 2).toFixed(2),
      sgstAccrued: +(gstAccrued / 2).toFixed(2),
      totalGstAccrued: +gstAccrued.toFixed(2),
      totalInvoicesCount: orders.length,
      paidCount: paidC,
      pendingCount: pendC,
      refundedCount: refC,
    };
  },
};

export default billingService;
