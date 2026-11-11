import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type DateRangePreset = 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'quarter' | 'custom';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface FinancialSummary {
  grossSales: number;        // Sum of subtotal
  discounts: number;         // Sum of discounts
  netSales: number;          // Gross Sales - Discounts
  taxes: number;             // Sum of 5% GST
  totalRevenue: number;      // Net Sales + Taxes (Collected revenue)
  totalOrders: number;       // All placed orders
  completedOrders: number;   // Orders successfully served
  cancelledOrders: number;   // Cancelled tickets
  cancelledRevenue: number;  // Lost revenue from cancellations
  averageOrderValue: number; // Total Revenue / Valid Orders
  itemsPerOrder: number;     // Average items per ticket
  
  // Comparative trends vs previous period
  prevRevenue: number;
  prevOrders: number;
  prevAov: number;
  growthRevenuePct: number;
  growthOrdersPct: number;
  growthAovPct: number;
}

export interface DailyTrendPoint {
  date: string;       // YYYY-MM-DD
  day: string;        // E.g. "Mon, 04 Nov"
  revenue: number;    // Gross Total
  grossSales: number; // Subtotal
  netSales: number;   // Subtotal - Discount
  orders: number;     // Orders count
  dineIn: number;     // Dine-in orders
  takeaway: number;   // Takeaway orders
  delivery: number;   // Delivery orders
  aov: number;        // Day's AOV
}

export interface HourlyTrafficPoint {
  hour: string;       // E.g. "1 PM"
  hour24: number;     // 13
  traffic: number;    // Orders count
  sales: number;      // Revenue in ₹
}

export interface ProductPerformanceItem {
  productId: string;
  name: string;
  category: string;
  isVeg: boolean;
  unitsSold: number;
  unitPrice: number;
  revenue: number;
  orderCount: number;
  revenueSharePct: number;
}

export interface CategoryPerformanceItem {
  category: string;
  revenue: number;
  unitsSold: number;
  orderCount: number;
  sharePct: number;
}

export interface ChannelSplitItem {
  name: string;
  orderType: string;
  orders: number;
  revenue: number;
  percentage: number;
  color: string;
}

export interface PaymentSplitItem {
  method: string;
  label: string;
  orders: number;
  revenue: number;
  percentage: number;
}

export interface CompleteAnalyticsReport {
  summary: FinancialSummary;
  dailyTrends: DailyTrendPoint[];
  hourlyTraffic: HourlyTrafficPoint[];
  peakHour: { hour: string; traffic: number; sales: number };
  bestsellers: ProductPerformanceItem[];
  leastSelling: ProductPerformanceItem[];
  categories: CategoryPerformanceItem[];
  channelSplit: ChannelSplitItem[];
  paymentSplit: PaymentSplitItem[];
  orders: any[];
}

/**
 * Helper to compute date range window and previous comparison window
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const toLocalDateStr = (d: Date | string): string => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function calculateDateWindows(filter: DateRangeFilter): {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
} {
  const now = new Date();
  let end = new Date(now);
  let start = new Date(now);

  switch (filter.preset) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'yesterday': {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    }

    case '7days':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case '30days':
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case 'quarter':
      start.setDate(now.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'custom':
      if (filter.startDate) {
        start = new Date(filter.startDate);
        start.setHours(0, 0, 0, 0);
      }
      if (filter.endDate) {
        end.setTime(new Date(filter.endDate).getTime());
        end.setHours(23, 59, 59, 999);
      }
      break;
  }

  // Calculate prior period of equivalent duration for comparison
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return { start, end, prevStart, prevEnd };
}

export const analyticsService = {
  /**
   * Fetch complete authoritative sales analytics from actual database records.
   */
  async getFullAnalyticsReport(
    restaurantId: string,
    filter: DateRangeFilter = { preset: '7days' }
  ): Promise<CompleteAnalyticsReport> {
    const { start, end, prevStart, prevEnd } = calculateDateWindows(filter);
    if (!UUID_REGEX.test(restaurantId)) {
      // Safe fallback for demo / non-UUID workspace ID
      return {
        summary: {
          grossSales: 114267,
          discounts: 4200,
          netSales: 110067,
          taxes: 5713,
          totalRevenue: 115780,
          cancelledRevenue: 1250,
          totalOrders: 164,
          completedOrders: 158,
          cancelledOrders: 6,
          averageOrderValue: 706,
          itemsPerOrder: 3.2,
          prevRevenue: 98120,
          prevOrders: 146,
          prevAov: 672,
          growthRevenuePct: 18.4,
          growthOrdersPct: 12.1,
          growthAovPct: 5.1,
        },
        dailyTrends: [],
        hourlyTraffic: [],
        peakHour: { hour: '1:00 PM', traffic: 28, sales: 21400 },
        bestsellers: [],
        leastSelling: [],
        categories: [],
        channelSplit: [],
        paymentSplit: [],
        orders: [],
      };
    }
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const prevStartIso = prevStart.toISOString();
    const prevEndIso = prevEnd.toISOString();

    // 1. Fetch current period orders with line items
    const { data: currentOrders, error: curErr } = await (supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        order_type,
        status,
        subtotal,
        discount,
        tax,
        total,
        payment_method,
        payment_status,
        created_at,
        order_items (
          id,
          product_id,
          product_name_snapshot,
          price_snapshot,
          quantity,
          is_veg_snapshot,
          item_total
        )
      `)
      .eq('restaurant_id', restaurantId)
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .order('created_at', { ascending: false }) as any);

    if (curErr) throw curErr;
    const orders: any[] = currentOrders || [];

    // 2. Fetch previous period orders for delta growth comparison
    const { data: previousOrders } = await supabase
      .from('orders')
      .select('subtotal, discount, tax, total, status')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', prevStartIso)
      .lte('created_at', prevEndIso)
      .neq('status', 'cancelled');

    const prevOrdersList = previousOrders || [];
    const prevRevenue = prevOrdersList.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const prevOrdersCount = prevOrdersList.length;
    const prevAov = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

    // 3. Financial calculations
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const cancelledOrdersList = orders.filter((o) => o.status === 'cancelled');

    const grossSales = validOrders.reduce((acc, o) => acc + (Number(o.subtotal) || 0), 0);
    const discounts = validOrders.reduce((acc, o) => acc + (Number(o.discount) || 0), 0);
    const netSales = grossSales - discounts;
    const taxes = validOrders.reduce((acc, o) => acc + (Number(o.tax) || 0), 0);
    const totalRevenue = validOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const cancelledRevenue = cancelledOrdersList.reduce((acc, o) => acc + (Number(o.total) || 0), 0);

    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const totalOrdersCount = orders.length;
    const validCount = validOrders.length;
    const aov = validCount > 0 ? totalRevenue / validCount : 0;

    // Items per order
    let totalItemsCount = 0;
    validOrders.forEach((o) => {
      (o.order_items || []).forEach((it: any) => {
        totalItemsCount += Number(it.quantity) || 1;
      });
    });
    const itemsPerOrder = validCount > 0 ? Number((totalItemsCount / validCount).toFixed(1)) : 0;

    // Growth rates
    const growthRevenuePct = prevRevenue > 0
      ? Number((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
      : 0;

    const growthOrdersPct = prevOrdersCount > 0
      ? Number((((validCount - prevOrdersCount) / prevOrdersCount) * 100).toFixed(1))
      : 0;

    const growthAovPct = prevAov > 0
      ? Number((((aov - prevAov) / prevAov) * 100).toFixed(1))
      : 0;

    const summary: FinancialSummary = {
      grossSales,
      discounts,
      netSales,
      taxes,
      totalRevenue,
      totalOrders: totalOrdersCount,
      completedOrders,
      cancelledOrders: cancelledOrdersList.length,
      cancelledRevenue,
      averageOrderValue: aov,
      itemsPerOrder,
      prevRevenue,
      prevOrders: prevOrdersCount,
      prevAov,
      growthRevenuePct,
      growthOrdersPct,
      growthAovPct,
    };

    // 4. Daily revenue and orders time-series
    const dailyMap = new Map<string, {
      date: string;
      day: string;
      revenue: number;
      grossSales: number;
      netSales: number;
      orders: number;
      dineIn: number;
      takeaway: number;
      delivery: number;
    }>();

    // Initialize all days in date window so there are no empty gaps in chart
    const currDay = new Date(start);
    while (currDay <= end) {
      const dateStr = toLocalDateStr(currDay);
      const dayLabel = currDay.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
      dailyMap.set(dateStr, {
        date: dateStr,
        day: dayLabel,
        revenue: 0,
        grossSales: 0,
        netSales: 0,
        orders: 0,
        dineIn: 0,
        takeaway: 0,
        delivery: 0,
      });
      currDay.setDate(currDay.getDate() + 1);
    }

    validOrders.forEach((o) => {
      const dateStr = toLocalDateStr(o.created_at);
      if (dailyMap.has(dateStr)) {
        const d = dailyMap.get(dateStr)!;
        d.revenue += Number(o.total) || 0;
        d.grossSales += Number(o.subtotal) || 0;
        d.netSales += (Number(o.subtotal) || 0) - (Number(o.discount) || 0);
        d.orders += 1;
        if (o.order_type === 'dine-in') d.dineIn += 1;
        else if (o.order_type === 'takeaway') d.takeaway += 1;
        else if (o.order_type === 'delivery') d.delivery += 1;
      }
    });

    const dailyTrends: DailyTrendPoint[] = Array.from(dailyMap.values()).map((d) => ({
      ...d,
      aov: d.orders > 0 ? Number((d.revenue / d.orders).toFixed(2)) : 0,
    }));

    // 5. Hourly traffic distribution (Peak business hours)
    const hourlyMap = new Map<number, { hour: string; traffic: number; sales: number }>();
    for (let h = 8; h <= 23; h++) {
      const ampm = h >= 12 ? (h === 12 ? '12 PM' : `${h - 12} PM`) : `${h} AM`;
      hourlyMap.set(h, { hour: ampm, traffic: 0, sales: 0 });
    }

    validOrders.forEach((o) => {
      const orderDate = new Date(o.created_at);
      let h = orderDate.getHours();
      try {
        const istStr = orderDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric' });
        const parsed = parseInt(istStr, 10);
        if (!isNaN(parsed)) h = parsed;
      } catch {
        // fallback to getHours()
      }

      // Map to cafe operational hours (8 AM - 11 PM)
      const bucketHour = Math.max(8, Math.min(23, h));
      if (hourlyMap.has(bucketHour)) {
        const item = hourlyMap.get(bucketHour)!;
        item.traffic += 1;
        item.sales += Number(o.total) || 0;
      }
    });

    const hourlyTraffic: HourlyTrafficPoint[] = Array.from(hourlyMap.entries()).map(([hour24, val]) => ({
      hour24,
      hour: val.hour,
      traffic: val.traffic,
      sales: val.sales,
    }));

    let peakHour = { hour: '1 PM', traffic: 0, sales: 0 };
    hourlyTraffic.forEach((ht) => {
      if (ht.traffic > peakHour.traffic) {
        peakHour = { hour: ht.hour, traffic: ht.traffic, sales: ht.sales };
      }
    });

    // 6. Product performance analytics & bestsellers
    const productStatsMap = new Map<string, {
      productId: string;
      name: string;
      category: string;
      isVeg: boolean;
      unitsSold: number;
      revenue: number;
      orderCount: number;
    }>();

    // Also fetch categories mapping
    const { data: catList } = await supabase
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', restaurantId);
    
    const catNameMap = new Map<string, string>();
    (catList || []).forEach((c) => catNameMap.set(c.id, c.name));

    // Fetch product category mapping
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, name, category_id, is_veg')
      .eq('restaurant_id', restaurantId);

    const prodCategoryMap = new Map<string, { category: string; isVeg: boolean }>();
    (dbProducts || []).forEach((p) => {
      prodCategoryMap.set(p.id, {
        category: catNameMap.get(p.category_id) || 'Specialties',
        isVeg: Boolean(p.is_veg),
      });
    });

    validOrders.forEach((o) => {
      const orderItems = o.order_items || [];
      const seenInThisOrder = new Set<string>();

      orderItems.forEach((it: any) => {
        const name = it.product_name_snapshot || 'Menu Item';
        const pId = it.product_id || name;
        const meta = prodCategoryMap.get(pId) || { category: 'Specialties', isVeg: Boolean(it.is_veg_snapshot) };

        if (!productStatsMap.has(name)) {
          productStatsMap.set(name, {
            productId: pId,
            name,
            category: meta.category,
            isVeg: meta.isVeg,
            unitsSold: 0,
            revenue: 0,
            orderCount: 0,
          });
        }

        const stat = productStatsMap.get(name)!;
        stat.unitsSold += Number(it.quantity) || 1;
        stat.revenue += Number(it.item_total) || 0;

        if (!seenInThisOrder.has(name)) {
          stat.orderCount += 1;
          seenInThisOrder.add(name);
        }
      });
    });

    const allProductsArray: ProductPerformanceItem[] = Array.from(productStatsMap.values()).map((p) => ({
      ...p,
      unitPrice: p.unitsSold > 0 ? Math.round(p.revenue / p.unitsSold) : 0,
      revenueSharePct: totalRevenue > 0 ? Number(((p.revenue / totalRevenue) * 100).toFixed(1)) : 0,
    }));

    const bestsellers = [...allProductsArray].sort((a, b) => b.revenue - a.revenue);
    const leastSelling = [...allProductsArray].sort((a, b) => a.unitsSold - b.unitsSold);

    // 7. Category performance aggregation
    const categoryStatsMap = new Map<string, { revenue: number; unitsSold: number; orderCount: number }>();
    allProductsArray.forEach((p) => {
      if (!categoryStatsMap.has(p.category)) {
        categoryStatsMap.set(p.category, { revenue: 0, unitsSold: 0, orderCount: 0 });
      }
      const c = categoryStatsMap.get(p.category)!;
      c.revenue += p.revenue;
      c.unitsSold += p.unitsSold;
      c.orderCount += p.orderCount;
    });

    const categories: CategoryPerformanceItem[] = Array.from(categoryStatsMap.entries())
      .map(([catName, val]) => ({
        category: catName,
        revenue: val.revenue,
        unitsSold: val.unitsSold,
        orderCount: val.orderCount,
        sharePct: totalRevenue > 0 ? Number(((val.revenue / totalRevenue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 8. Dining channel split
    let dineInCount = 0;
    let takeawayCount = 0;
    let deliveryCount = 0;
    let dineInRev = 0;
    let takeawayRev = 0;
    let deliveryRev = 0;

    validOrders.forEach((o) => {
      const tot = Number(o.total) || 0;
      if (o.order_type === 'dine-in') {
        dineInCount++;
        dineInRev += tot;
      } else if (o.order_type === 'takeaway') {
        takeawayCount++;
        takeawayRev += tot;
      } else if (o.order_type === 'delivery') {
        deliveryCount++;
        deliveryRev += tot;
      }
    });

    const totalChannelOrders = validCount || 1;
    const channelSplit: ChannelSplitItem[] = [
      {
        name: 'Dine-In Tables',
        orderType: 'dine-in',
        orders: dineInCount,
        revenue: dineInRev,
        percentage: Math.round((dineInCount / totalChannelOrders) * 100),
        color: '#D97736',
      },
      {
        name: 'Takeaway Counter',
        orderType: 'takeaway',
        orders: takeawayCount,
        revenue: takeawayRev,
        percentage: Math.round((takeawayCount / totalChannelOrders) * 100),
        color: '#75452F',
      },
      {
        name: 'Home / Online Delivery',
        orderType: 'delivery',
        orders: deliveryCount,
        revenue: deliveryRev,
        percentage: Math.round((deliveryCount / totalChannelOrders) * 100),
        color: '#B45309',
      },
    ];

    // 9. Payment method split
    const payMap = new Map<string, { label: string; orders: number; revenue: number }>();
    payMap.set('upi', { label: 'UPI (GPay / PhonePe / QR)', orders: 0, revenue: 0 });
    payMap.set('card', { label: 'Credit / Debit Card', orders: 0, revenue: 0 });
    payMap.set('counter', { label: 'Cash / Pay at Counter', orders: 0, revenue: 0 });

    validOrders.forEach((o) => {
      const m = o.payment_method || 'upi';
      const tot = Number(o.total) || 0;
      if (payMap.has(m)) {
        const item = payMap.get(m)!;
        item.orders += 1;
        item.revenue += tot;
      } else {
        const item = payMap.get('counter')!;
        item.orders += 1;
        item.revenue += tot;
      }
    });

    const paymentSplit: PaymentSplitItem[] = Array.from(payMap.entries()).map(([method, val]) => ({
      method,
      label: val.label,
      orders: val.orders,
      revenue: val.revenue,
      percentage: validCount > 0 ? Math.round((val.orders / validCount) * 100) : 0,
    }));

    return {
      summary,
      dailyTrends,
      hourlyTraffic,
      peakHour,
      bestsellers,
      leastSelling,
      categories,
      channelSplit,
      paymentSplit,
      orders,
    };
  },

  // ==========================================
  // CSV EXPORT GENERATORS
  // ==========================================

  /**
   * Export comprehensive sales summary to CSV
   */
  exportSalesSummaryCSV(report: CompleteAnalyticsReport, restaurantName = 'Arsalan – Park Circus'): void {
    const lines: string[] = [];
    lines.push(`"CafeOS - Executive Sales & Financial Report"`);
    lines.push(`"Restaurant","${restaurantName}"`);
    lines.push(`"Generated At","${new Date().toLocaleString('en-IN')}"`);
    lines.push('');
    lines.push('"Metric","Value"');
    lines.push(`"Gross Sales (Subtotal)","₹${report.summary.grossSales.toFixed(2)}"`);
    lines.push(`"Promotional Discounts","₹${report.summary.discounts.toFixed(2)}"`);
    lines.push(`"Net Food Sales","₹${report.summary.netSales.toFixed(2)}"`);
    lines.push(`"GST Taxes Collected (5%)","₹${report.summary.taxes.toFixed(2)}"`);
    lines.push(`"Total Gross Revenue","₹${report.summary.totalRevenue.toFixed(2)}"`);
    lines.push(`"Total Orders Placed","${report.summary.totalOrders}"`);
    lines.push(`"Completed / Fulfilled Orders","${report.summary.completedOrders}"`);
    lines.push(`"Cancelled Tickets","${report.summary.cancelledOrders}"`);
    lines.push(`"Lost Sales from Cancellations","₹${report.summary.cancelledRevenue.toFixed(2)}"`);
    lines.push(`"Average Order Value (AOV)","₹${report.summary.averageOrderValue.toFixed(2)}"`);
    lines.push(`"Average Items Per Ticket","${report.summary.itemsPerOrder}"`);
    lines.push(`"Revenue Growth vs Prior Window","${report.summary.growthRevenuePct}%"`);
    lines.push('');
    lines.push('"Daily Breakdown"');
    lines.push('"Date","Day","Orders","Dine-In","Takeaway","Delivery","Gross Sales (₹)","Net Sales (₹)","Total Revenue (₹)","AOV (₹)"');
    report.dailyTrends.forEach((d) => {
      lines.push(`"${d.date}","${d.day}",${d.orders},${d.dineIn},${d.takeaway},${d.delivery},${d.grossSales.toFixed(2)},${d.netSales.toFixed(2)},${d.revenue.toFixed(2)},${d.aov.toFixed(2)}`);
    });

    downloadCSV(lines.join('\n'), `CafeOS-Sales-Summary-${new Date().toISOString().split('T')[0]}.csv`);
  },

  /**
   * Export detailed orders ledger to CSV
   */
  exportOrdersLedgerCSV(orders: any[], restaurantName = 'Arsalan – Park Circus'): void {
    const lines: string[] = [];
    lines.push(`"CafeOS - Orders Transaction Ledger"`);
    lines.push(`"Restaurant","${restaurantName}"`);
    lines.push(`"Generated At","${new Date().toLocaleString('en-IN')}"`);
    lines.push('');
    lines.push('"Order #","Date & Time","Customer","Channel","Table / Address","Status","Payment Method","Subtotal (₹)","Discount (₹)","Tax (₹)","Total (₹)","Items Summary"');
    
    orders.forEach((o) => {
      const itemsSummary = (o.order_items || [])
        .map((i: any) => `${i.quantity}x ${i.product_name_snapshot}`)
        .join('; ');
      const dateFormatted = new Date(o.created_at).toLocaleString('en-IN');
      const tableOrAddr = o.table_number_snapshot || o.delivery_address || 'Counter Pickup';
      lines.push(
        `"${o.order_number}","${dateFormatted}","${o.customer_name || 'Guest'}","${o.order_type}","${tableOrAddr}","${o.status}","${o.payment_method || 'counter'}",${Number(o.subtotal).toFixed(2)},${Number(o.discount).toFixed(2)},${Number(o.tax).toFixed(2)},${Number(o.total).toFixed(2)},"${itemsSummary}"`
      );
    });

    downloadCSV(lines.join('\n'), `CafeOS-Orders-Ledger-${new Date().toISOString().split('T')[0]}.csv`);
  },

  /**
   * Export product velocity & performance report to CSV
   */
  exportProductPerformanceCSV(products: ProductPerformanceItem[], restaurantName = 'Arsalan – Park Circus'): void {
    const lines: string[] = [];
    lines.push(`"CafeOS - Product Sales Velocity & Margin Report"`);
    lines.push(`"Restaurant","${restaurantName}"`);
    lines.push(`"Generated At","${new Date().toLocaleString('en-IN')}"`);
    lines.push('');
    lines.push('"Rank","Product Name","Category","Classification","Units Sold","Unit Price (₹)","Total Revenue (₹)","Revenue Share (%)","Orders Containing Item"');
    
    products.forEach((p, idx) => {
      lines.push(
        `"${idx + 1}","${p.name}","${p.category}","${p.isVeg ? 'Veg' : 'Non-Veg'}",${p.unitsSold},${p.unitPrice.toFixed(2)},${p.revenue.toFixed(2)},${p.revenueSharePct}%,${p.orderCount}`
      );
    });

    downloadCSV(lines.join('\n'), `CafeOS-Product-Performance-${new Date().toISOString().split('T')[0]}.csv`);
  },
};

function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default analyticsService;
