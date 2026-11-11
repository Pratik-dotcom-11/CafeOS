import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  ChefHat,
  BellRing,
  RotateCcw,
  Check,
  Utensils,
  AlertTriangle,
  X,
  XCircle,
  Star,
  Bike,
  ShoppingBag,
  History,
  Undo2
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { Order, OrderStatus } from '../../types';
import { formatTimeAgo, formatTimeOnly, formatCurrency } from '../../utils/formatters';

interface KitchenOutletContext {
  activeStation: string;
  showHistoryModal: boolean;
  setShowHistoryModal: (show: boolean) => void;
}

export const KitchenPage: React.FC = () => {
  const { orders, updateOrderStatus, toggleOrderPriority, restaurant } = useCafe();
  const { activeStation, showHistoryModal, setShowHistoryModal } =
    useOutletContext<KitchenOutletContext>() || {
      activeStation: 'all',
      showHistoryModal: false,
      setShowHistoryModal: () => {},
    };

  // Timer tick every 5s for live countdown & elapsed times
  const [, setTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  // Reject / 86 modal state
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Ingredient 86d / Out of Stock');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [mobileColumnTab, setMobileColumnTab] = useState<string>('all');

  const getElapsedMinutes = (isoString: string) => {
    return Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60));
  };

  // Match station filter
  const isItemInStation = (itemName: string, station: string) => {
    if (station === 'all') return true;
    const lower = itemName.toLowerCase();
    if (station === 'biryani_curry') {
      return (
        lower.includes('biryani') ||
        lower.includes('butter chicken') ||
        lower.includes('makhani') ||
        lower.includes('curry') ||
        lower.includes('thali') ||
        lower.includes('rice')
      );
    }
    if (station === 'tandoor') {
      return (
        lower.includes('tikka') ||
        lower.includes('kebab') ||
        lower.includes('tandoori') ||
        lower.includes('naan') ||
        lower.includes('paratha') ||
        lower.includes('kulcha') ||
        lower.includes('samosa') ||
        lower.includes('chaat') ||
        lower.includes('pav')
      );
    }
    if (station === 'beverages') {
      return (
        lower.includes('chai') ||
        lower.includes('tea') ||
        lower.includes('lassi') ||
        lower.includes('kaapi') ||
        lower.includes('falooda') ||
        lower.includes('jamun') ||
        lower.includes('rasmalai') ||
        lower.includes('dessert')
      );
    }
    return true;
  };

  const matchesActiveStation = (order: Order) => {
    if (activeStation === 'all') return true;
    return order.items.some((i) => isItemInStation(i.name, activeStation));
  };

  const activeColumns: { status: OrderStatus; title: string; color: string; badge: string }[] = [
    { status: 'pending', title: 'New Tickets', color: 'bg-amber-500/20 text-amber-400', badge: 'bg-amber-500/30 text-amber-300' },
    { status: 'accepted', title: 'Accepted', color: 'bg-blue-500/20 text-blue-400', badge: 'bg-blue-500/30 text-blue-300' },
    { status: 'preparing', title: 'Cooking / In Prep', color: 'bg-orange-500/20 text-orange-400', badge: 'bg-orange-500/30 text-orange-300' },
    { status: 'ready', title: 'Ready to Serve', color: 'bg-emerald-500/20 text-emerald-400', badge: 'bg-emerald-500/30 text-emerald-300' },
  ];

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    setIsRejecting(true);
    try {
      await updateOrderStatus(rejectingOrder.id, 'cancelled', rejectReason);
      setRejectingOrder(null);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRecallOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'ready', 'Recalled to kitchen ready list');
  };

  const completedOrders = orders.filter((o) => o.status === 'completed');

  return (
    <div className="h-full space-y-3 sm:space-y-4">
      {/* Mobile Queue Switcher Tabs for Phones & Small Tablets */}
      <div className="flex lg:hidden overflow-x-auto gap-1.5 pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Queues' },
          { id: 'pending', label: 'New', count: orders.filter((o) => o.status === 'pending').length },
          { id: 'accepted', label: 'Accepted', count: orders.filter((o) => o.status === 'accepted').length },
          { id: 'preparing', label: 'In Prep', count: orders.filter((o) => o.status === 'preparing').length },
          { id: 'ready', label: 'Ready', count: orders.filter((o) => o.status === 'ready').length },
        ].map((tab) => {
          const isSelected = mobileColumnTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMobileColumnTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-400'
                  : 'bg-[#1F1B18] text-stone-400 border border-[#332D28] hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-[#2B2622] text-stone-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full items-start">
        {activeColumns.map((col) => {
          const rawOrders = orders.filter((o) => o.status === col.status && matchesActiveStation(o));

          // Sort: Rush priority orders first, then oldest tickets first
          const colOrders = [...rawOrders].sort((a, b) => {
            if (a.isPriority && !b.isPriority) return -1;
            if (!a.isPriority && b.isPriority) return 1;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });

          const isVisibleOnMobile = mobileColumnTab === 'all' || mobileColumnTab === col.status;

          return (
            <div
              key={col.status}
              className={`${
                isVisibleOnMobile ? 'flex' : 'hidden lg:flex'
              } bg-[#181614] border border-[#2B2724] rounded-2xl flex-col min-h-[220px] lg:min-h-[750px] shadow-2xl overflow-hidden`}
            >
              {/* Column Header */}
              <div className={`p-3.5 border-b border-[#2B2724] flex items-center justify-between ${col.color}`}>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black uppercase tracking-wider">
                    {col.title}
                  </h2>
                </div>
                <span className="w-6 h-6 rounded-lg bg-black/40 font-mono font-bold text-xs flex items-center justify-center border border-white/10">
                  {colOrders.length}
                </span>
              </div>

              {/* Order Cards Stream */}
              <div className="p-3 space-y-3.5 flex-1 overflow-y-auto">
                {colOrders.map((order) => {
                  const elapsed = getElapsedMinutes(order.createdAt);
                  const isDelayed = elapsed >= 8 && elapsed < 15;
                  const isCriticalUrgent = elapsed >= 15;

                  return (
                    <div
                      key={order.id}
                      className={`kds-card bg-[#211E1B] rounded-2xl p-4 border transition-all ${
                        order.isPriority
                          ? 'border-red-500 shadow-red-950/60 shadow-xl ring-2 ring-red-500/50 bg-[#261816]'
                          : isCriticalUrgent
                          ? 'border-rose-500/80 shadow-rose-950/40 shadow-lg ring-1 ring-rose-500/40'
                          : isDelayed
                          ? 'border-amber-500/60 shadow-amber-950/30'
                          : 'border-[#332D28] hover:border-[#453D37]'
                      }`}
                    >
                      {/* Priority Rush Banner */}
                      {order.isPriority && (
                        <div className="mb-2 px-2.5 py-1 rounded-lg bg-red-600 text-white flex items-center justify-between text-[11px] font-black uppercase tracking-wider animate-pulse">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" />
                            <span>RUSH / PRIORITY TICKET</span>
                          </span>
                          <span className="text-[10px] opacity-90">{order.priorityReason || 'VIP'}</span>
                        </div>
                      )}

                      {/* Ticket Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#302B26]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-white">
                            {order.orderNumber}
                          </span>

                          {/* Order Type Tag */}
                          <span className="px-2 py-0.5 rounded-lg bg-orange-600/30 text-orange-300 font-bold text-xs border border-orange-500/30 flex items-center gap-1">
                            {order.orderType === 'dine-in' && (
                              <span>{order.tableNumber || 'Dine-In'}</span>
                            )}
                            {order.orderType === 'takeaway' && (
                              <>
                                <ShoppingBag className="w-3 h-3" />
                                <span>Takeaway</span>
                              </>
                            )}
                            {order.orderType === 'delivery' && (
                              <>
                                <Bike className="w-3 h-3" />
                                <span>Delivery</span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Rush Toggle & Elapsed Timer */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleOrderPriority(order.id, !order.isPriority)}
                            title={order.isPriority ? 'Clear Rush Priority' : 'Mark as Rush Priority'}
                            className={`p-1.5 rounded-lg border transition-all ${
                              order.isPriority
                                ? 'bg-red-500/30 text-red-400 border-red-500/50'
                                : 'bg-[#2E2824] text-stone-400 border-stone-700 hover:text-amber-400'
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </button>

                          <div
                            className={`flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded-lg ${
                              isCriticalUrgent
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                                : isDelayed
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-[#2E2824] text-stone-300'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{elapsed}m</span>
                          </div>
                        </div>
                      </div>

                      {/* Guest Details */}
                      <div className="flex items-center justify-between text-xs text-stone-400 mt-2">
                        <span className="font-semibold truncate">
                          Guest: <strong className="text-stone-200">{order.customerName}</strong>
                        </span>
                        <span className="font-mono text-[11px] text-stone-500">
                          {formatTimeOnly(order.createdAt)}
                        </span>
                      </div>

                      {/* Items List (Glanceable, high contrast) */}
                      <div className="my-3 space-y-2">
                        {order.items.map((item) => {
                          const itemMatchesFilter =
                            activeStation === 'all' || isItemInStation(item.name, activeStation);

                          return (
                            <div
                              key={item.id}
                              className={`p-2.5 rounded-xl border transition-all ${
                                itemMatchesFilter
                                  ? 'bg-[#181614] border-[#2B2724]'
                                  : 'bg-[#181614]/40 border-transparent opacity-40'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-extrabold text-sm text-white leading-snug">
                                  <span className="text-orange-400 mr-2 font-mono text-base">
                                    {item.quantity}x
                                  </span>
                                  {item.name}
                                </span>

                                {/* Veg / Non-Veg Indicator */}
                                {item.isVeg ? (
                                  <span
                                    title="Vegetarian"
                                    className="w-3 h-3 rounded-sm border border-emerald-500 flex items-center justify-center shrink-0 mt-1"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  </span>
                                ) : (
                                  <span
                                    title="Non-Vegetarian"
                                    className="w-3 h-3 rounded-sm border border-rose-500 flex items-center justify-center shrink-0 mt-1"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  </span>
                                )}
                              </div>

                              {/* Customization Options */}
                              {item.selectedOptions && item.selectedOptions.length > 0 && (
                                <p className="text-[11px] text-amber-300 font-medium mt-1 pl-5">
                                  • {item.selectedOptions.join(' • ')}
                                </p>
                              )}

                              {/* Special Instructions Alert */}
                              {item.specialInstructions && (
                                <p className="text-[11px] text-rose-300 font-semibold italic mt-1.5 bg-rose-950/40 p-1.5 rounded-lg border border-rose-800/40 flex items-center gap-1.5">
                                  <AlertCircle className="w-3 h-3 shrink-0 text-rose-400" />
                                  <span>{item.specialInstructions}</span>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* General Order Notes */}
                      {order.notes && (
                        <div className="mb-3 text-[11px] text-amber-400 bg-amber-950/30 p-2 rounded-xl border border-amber-900/40">
                          <strong>Order Note:</strong> {order.notes}
                        </div>
                      )}

                      {/* Kitchen Action Buttons (Large touch targets: min 44px) */}
                      <div className="pt-2 border-t border-[#302B26] flex items-center gap-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'accepted')}
                              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 btn-press"
                            >
                              <Check className="w-4 h-4" />
                              <span>Accept Ticket</span>
                            </button>
                            <button
                              onClick={() => setRejectingOrder(order)}
                              title="Reject / 86 Order"
                              className="px-3 py-3 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 text-xs font-bold transition-all btn-press"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {order.status === 'accepted' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 btn-press"
                            >
                              <Flame className="w-4 h-4" />
                              <span>Start Prep</span>
                            </button>
                            <button
                              onClick={() => setRejectingOrder(order)}
                              title="Reject / 86 Order"
                              className="px-3 py-3 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 text-xs font-bold transition-all btn-press"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {order.status === 'preparing' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 btn-press"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Mark as Ready</span>
                            </button>
                            <button
                              onClick={() => setRejectingOrder(order)}
                              title="Cancel / 86 Ticket"
                              className="px-3 py-3 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 text-xs font-bold transition-all btn-press"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {order.status === 'ready' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="flex-1 py-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 btn-press"
                            >
                              <Utensils className="w-4 h-4" />
                              <span>Order Served</span>
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing', 'Remake requested')}
                              title="Send back to cooking / remake"
                              className="px-3 py-3 rounded-xl border border-[#3A332E] bg-[#292420] text-amber-300 hover:bg-[#342D27] text-xs font-bold transition-all btn-press"
                            >
                              <Undo2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colOrders.length === 0 && (
                  <div className="text-center py-10 lg:py-24 text-stone-500 text-xs flex flex-col items-center">
                    <ChefHat className="w-8 h-8 mb-2 opacity-30" />
                    <span>No tickets in this queue</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject / 86 Order Confirmation Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1B18] border border-[#36302B] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 text-rose-400 flex items-center justify-center mx-auto border border-rose-800">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-black text-lg text-white">
                Reject Ticket {rejectingOrder.orderNumber}?
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Please select the reason for rejecting or cancelling this order.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-400 block mb-1">
                Reason
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-[#161412] border border-[#36302B] rounded-xl text-white font-medium"
              >
                <option value="Ingredient 86d / Out of Stock">Ingredient 86'd / Out of Stock</option>
                <option value="Kitchen at Peak Capacity">Kitchen at Peak Capacity</option>
                <option value="Customer Requested Cancel">Customer Requested Cancel</option>
                <option value="Duplicate Ticket">Duplicate Ticket</option>
                <option value="Operational Kitchen Issue">Operational Kitchen Issue</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="flex-1 py-3 rounded-xl border border-[#36302B] text-xs font-bold text-stone-300 hover:bg-[#2B2521]"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={handleConfirmReject}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Orders / Recall Drawer */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="bg-[#1A1816] border-l border-[#2E2824] w-full max-w-md h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#2E2824]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-orange-400" />
                <h3 className="font-black text-base text-white">Served & Completed Tickets</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl bg-[#25211E] text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400 mt-2 mb-4">
              Recently served orders. You can recall any accidentally completed order back to the live kitchen board.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {completedOrders.length === 0 ? (
                <div className="text-center py-24 text-stone-500 text-xs">
                  No completed orders yet today.
                </div>
              ) : (
                completedOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-2xl bg-[#211E1B] border border-[#2E2824] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-white text-sm">
                          {o.orderNumber}
                        </span>
                        <span className="text-xs text-stone-400">
                          • {o.tableNumber || o.orderType}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800">
                        Served
                      </span>
                    </div>

                    <p className="text-xs text-stone-300">
                      {o.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#2B2622] text-xs">
                      <span className="text-stone-400 font-mono text-[11px]">
                        {formatTimeOnly(o.createdAt)}
                      </span>
                      <button
                        onClick={() => handleRecallOrder(o.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600/30 text-orange-300 border border-orange-500/40 hover:bg-orange-600 hover:text-white text-xs font-bold transition-all"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Recall to Ready</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default KitchenPage;
