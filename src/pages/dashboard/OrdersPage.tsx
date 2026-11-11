import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  Table as TableIcon,
  X,
  Printer,
  Phone,
  User,
  IndianRupee,
  AlertCircle
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { Order, OrderStatus } from '../../types';
import { formatCurrency, formatTimeAgo, formatTimeOnly, getStatusBadge, getPaymentBadge } from '../../utils/formatters';

export const OrdersPage: React.FC = () => {
  const { restaurant, orders, updateOrderStatus, updatePaymentStatus } = useCafe();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.tableNumber && o.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const statuses: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed'];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with View Mode switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
            Order Management & Dispatch
          </h1>
          <p className="text-xs text-cafe-muted mt-1">
            Track dine-in, takeaway and digital QR orders in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Table / Kanban switch */}
          <div className="bg-white dark:bg-cafe-surface-dark p-1 rounded-xl border border-cafe-border dark:border-cafe-border-dark flex items-center shadow-warm-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-cafe-primary text-white shadow-sm dark:bg-cafe-accent'
                  : 'text-cafe-muted hover:text-cafe-primary'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-cafe-primary text-white shadow-sm dark:bg-cafe-accent'
                  : 'text-cafe-muted hover:text-cafe-primary'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-cafe-surface-dark p-4 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'New Tickets' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'preparing', label: 'In Kitchen' },
            { id: 'ready', label: 'Ready' },
            { id: 'completed', label: 'Served' },
          ].map((st) => {
            const active = statusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-cafe-accent text-white shadow-warm-sm'
                    : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-sand/40'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-cafe-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search #order, guest, table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-cafe-accent"
          />
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-cafe-light/70 dark:bg-stone-900/60 border-b border-cafe-border/80 dark:border-cafe-border-dark text-[11px] font-extrabold uppercase tracking-wider text-cafe-muted">
                  <th className="py-3.5 px-6">Ticket & Time</th>
                  <th className="py-3.5 px-4">Guest / Table</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Kitchen Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-border/60 dark:divide-cafe-border-dark">
                {filteredOrders.map((ord) => {
                  const statusBadge = getStatusBadge(ord.status);
                  const payBadge = getPaymentBadge(ord.paymentStatus);

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-cafe-sand/20 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-extrabold text-sm text-cafe-primary dark:text-cafe-cream">
                            {ord.orderNumber}
                          </p>
                          <p className="text-cafe-muted text-[11px] flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-cafe-accent" />
                            {formatTimeAgo(ord.createdAt)} ({formatTimeOnly(ord.createdAt)})
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-cafe-primary dark:text-cafe-cream">
                          {ord.customerName}
                        </p>
                        <p className="text-[11px] text-cafe-muted font-medium">
                          {ord.tableNumber || 'Takeaway'}
                        </p>
                      </td>
                      <td className="py-4 px-4 capitalize font-semibold text-cafe-primary dark:text-stone-300">
                        {ord.orderType}
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-xs text-cafe-primary dark:text-cafe-cream truncate">
                          {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                        <p className="text-[11px] text-cafe-muted">
                          {ord.items.reduce((acc, i) => acc + i.quantity, 0)} total items
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${payBadge.badge}`}>
                          {payBadge.label} ({ord.paymentMethod.toUpperCase()})
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-cafe-accent text-sm">
                        {formatCurrency(ord.total, restaurant.currencySymbol)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusBadge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1.5 rounded-xl border border-cafe-border dark:border-stone-700 hover:bg-cafe-sand/50 text-xs font-semibold text-cafe-primary dark:text-cafe-cream inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-cafe-accent" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {statuses.slice(0, 4).map((colStatus) => {
            const colOrders = orders.filter((o) => o.status === colStatus);
            const statusConfig = getStatusBadge(colStatus);

            return (
              <div
                key={colStatus}
                className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-4 border border-cafe-border dark:border-cafe-border-dark shadow-warm min-h-[500px] flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-cafe-border/60 dark:border-cafe-border-dark">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
                    <h3 className="font-extrabold text-sm text-cafe-primary dark:text-cafe-cream capitalize">
                      {statusConfig.label}
                    </h3>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-cafe-sand/60 dark:bg-stone-800 font-bold text-xs flex items-center justify-center text-cafe-muted">
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colOrders.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className="p-3.5 rounded-2xl bg-cafe-light dark:bg-stone-800/60 border border-cafe-border/80 dark:border-stone-700 hover:shadow-warm-md cursor-pointer transition-all space-y-2.5 card-interactive hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-cafe-primary dark:text-cafe-cream">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-cafe-muted">
                          {formatTimeAgo(ord.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cafe-primary dark:text-stone-300 truncate max-w-[120px]">
                          {ord.customerName}
                        </span>
                        <span className="text-[11px] font-semibold text-cafe-accent">
                          {ord.tableNumber || 'Takeaway'}
                        </span>
                      </div>

                      <div className="text-[11px] text-cafe-muted bg-white dark:bg-stone-900/50 p-2 rounded-xl border border-cafe-border/50">
                        {ord.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                          </div>
                        ))}
                        {ord.items.length > 2 && (
                          <p className="text-[10px] text-cafe-accent font-semibold mt-0.5">
                            +{ord.items.length - 2} more items...
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-extrabold text-xs text-cafe-primary dark:text-cafe-cream">
                          {formatCurrency(ord.total, restaurant.currencySymbol)}
                        </span>
                        {/* Quick Advance Button */}
                        {colStatus === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(ord.id, 'accepted');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold"
                          >
                            Accept &rarr;
                          </button>
                        )}
                        {colStatus === 'accepted' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(ord.id, 'preparing');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-orange-600 text-white text-[10px] font-bold"
                          >
                            Start Cook &rarr;
                          </button>
                        )}
                        {colStatus === 'preparing' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(ord.id, 'ready');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                          >
                            Mark Ready &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {colOrders.length === 0 && (
                    <div className="text-center py-10 text-xs text-cafe-muted">
                      No orders in this column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-lg w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <div>
                <h2 className="text-lg font-black text-cafe-primary dark:text-cafe-cream">
                  {selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-cafe-muted">
                  Placed at {formatTimeOnly(selectedOrder.createdAt)} ({formatTimeAgo(selectedOrder.createdAt)})
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Location */}
            <div className="grid grid-cols-2 gap-3 my-4 p-3.5 rounded-2xl bg-cafe-light dark:bg-stone-800 border border-cafe-border/70 dark:border-stone-700 text-xs">
              <div>
                <span className="text-[11px] font-bold text-cafe-muted uppercase">Customer</span>
                <p className="font-extrabold text-cafe-primary dark:text-cafe-cream mt-0.5">
                  {selectedOrder.customerName}
                </p>
                {selectedOrder.customerPhone && (
                  <p className="text-cafe-muted flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {selectedOrder.customerPhone}
                  </p>
                )}
              </div>
              <div>
                <span className="text-[11px] font-bold text-cafe-muted uppercase">Location</span>
                <p className="font-extrabold text-cafe-accent mt-0.5">
                  {selectedOrder.tableNumber || 'Takeaway Pickup'}
                </p>
                <p className="text-cafe-muted capitalize mt-0.5">
                  Type: {selectedOrder.orderType}
                </p>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2.5 my-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cafe-muted">
                Order Items ({selectedOrder.items.length})
              </h3>
              <div className="divide-y divide-cafe-border/60 dark:divide-stone-700">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="py-2 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-cafe-primary dark:text-cafe-cream">
                        {item.quantity}x {item.name}
                      </p>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-[11px] text-cafe-muted">
                          Modifiers: {item.selectedOptions.join(', ')}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-[11px] text-amber-600 italic">
                          "{item.specialInstructions}"
                        </p>
                      )}
                    </div>
                    <span className="font-extrabold text-cafe-primary dark:text-cafe-cream">
                      {formatCurrency(item.price * item.quantity, restaurant.currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div className="bg-cafe-light dark:bg-stone-800 p-3.5 rounded-2xl border border-cafe-border/60 dark:border-stone-700 text-xs space-y-1.5 my-4">
              <div className="flex justify-between text-cafe-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal, restaurant.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-cafe-muted">
                <span>GST (5.0%)</span>
                <span>{formatCurrency(selectedOrder.tax, restaurant.currencySymbol)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-{formatCurrency(selectedOrder.discount, restaurant.currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-cafe-primary dark:text-cafe-cream pt-1 border-t border-dashed border-cafe-border dark:border-stone-700">
                <span>Total Amount</span>
                <span className="text-cafe-accent">{formatCurrency(selectedOrder.total, restaurant.currencySymbol)}</span>
              </div>
            </div>

            {/* Advance Status Controls */}
            <div className="pt-2 border-t border-cafe-border dark:border-cafe-border-dark space-y-2">
              <span className="text-xs font-bold text-cafe-muted block">
                Update Kitchen Stage:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'pending', label: 'New' },
                  { id: 'accepted', label: 'Accepted' },
                  { id: 'preparing', label: 'Cooking' },
                  { id: 'ready', label: 'Ready' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, st.id as OrderStatus);
                      setSelectedOrder((prev) => (prev ? { ...prev, status: st.id as OrderStatus } : null));
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      selectedOrder.status === st.id
                        ? 'bg-cafe-accent text-white shadow-warm'
                        : 'bg-cafe-sand/40 dark:bg-stone-800 text-cafe-primary dark:text-stone-300 hover:bg-cafe-sand'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

