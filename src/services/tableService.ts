import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type TableRow = Database['public']['Tables']['restaurant_tables']['Row'];
export type TableInsert = Database['public']['Tables']['restaurant_tables']['Insert'];
export type TableUpdate = Database['public']['Tables']['restaurant_tables']['Update'];

export interface TableOrderHistoryItem {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  itemsSummary: string;
}

export const tableService = {
  /**
   * Fetch all tables for a given restaurant.
   */
  async getTables(restaurantId: string): Promise<TableRow[]> {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('table_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new dining table.
   */
  async createTable(table: TableInsert): Promise<TableRow> {
    // Check if table number already exists in restaurant
    const { data: existing } = await supabase
      .from('restaurant_tables')
      .select('id')
      .eq('restaurant_id', table.restaurant_id)
      .eq('table_number', table.table_number)
      .maybeSingle();

    if (existing) {
      throw new Error(`Table number '${table.table_number}' already exists in this restaurant.`);
    }

    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert({
        ...table,
        status: table.status || 'available',
        section: table.section || 'Main Dining',
        capacity: table.capacity || 4,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update table properties (number, capacity, section).
   */
  async updateTable(tableId: string, updates: Partial<TableUpdate>): Promise<TableRow> {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tableId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update table status, guest count, and active order linkage.
   */
  async updateTableStatus(
    tableId: string,
    status: string,
    guestCount?: number | null,
    activeOrderId?: string | null
  ): Promise<TableRow> {
    const updates: TableUpdate = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (guestCount !== undefined) {
      updates.guest_count = guestCount;
    }

    if (activeOrderId !== undefined) {
      updates.active_order_id = activeOrderId;
    }

    if (status === 'occupied') {
      updates.occupied_since = new Date().toISOString();
    } else if (status === 'available') {
      updates.occupied_since = null;
      updates.active_order_id = null;
      updates.guest_count = null;
    }

    const { data, error } = await supabase
      .from('restaurant_tables')
      .update(updates)
      .eq('id', tableId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a table from the floor plan with safety checks.
   * Prevents deleting tables that are currently occupied or have an active order.
   */
  async deleteTable(tableId: string): Promise<void> {
    const { data: table, error: fetchErr } = await supabase
      .from('restaurant_tables')
      .select('id, table_number, status, active_order_id')
      .eq('id', tableId)
      .single();

    if (fetchErr) throw fetchErr;

    if (table.status === 'occupied' || table.active_order_id) {
      throw new Error(
        `Cannot delete table ${table.table_number} while it is occupied with active dining guests. Settle or reassign the order first.`
      );
    }

    const { error } = await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', tableId);

    if (error) throw error;
  },

  /**
   * Retrieve active and historical orders for a specific table.
   */
  async getTableOrders(restaurantId: string, tableNumber: string): Promise<TableOrderHistoryItem[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        status,
        payment_status,
        total,
        created_at,
        order_items (
          product_name_snapshot,
          quantity
        )
      `)
      .eq('restaurant_id', restaurantId)
      .or(`table_number_snapshot.eq.${tableNumber},table_number_snapshot.eq.Table ${tableNumber}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    if (!data) return [];

    return data.map((o: any) => {
      const items: any[] = o.order_items || [];
      const summary = items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ');

      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name || 'Guest',
        status: o.status,
        paymentStatus: o.payment_status,
        total: Number(o.total) || 0,
        createdAt: o.created_at,
        itemsSummary: summary || 'Dine-in items',
      };
    });
  },

  /**
   * Generate canonical QR Menu URL for a table.
   */
  generateTableQrUrl(restaurantSlug: string, tableNumber: string, baseUrl?: string): string {
    const host = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
    return `${host}/menu/${restaurantSlug}?table=${encodeURIComponent(tableNumber)}`;
  },
};

export default tableService;
