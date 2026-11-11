import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  Download,
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Sparkles,
  IndianRupee,
  RotateCcw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { Order, PaymentStatus } from '../../types';
import { formatCurrency, formatTimeOnly, getPaymentBadge } from '../../utils/formatters';
import { billingService, InvoiceSnapshot, BillingSummary } from '../../services/billingService';

export const BillingPage: React.FC = () => {
  const { orders, restaurant, updatePaymentStatus, addToast } = useCafe();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSnapshot | null>(null);
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState<string>('Customer Request');
  const [isProcessingRefund, setIsProcessingRefund] = useState<boolean>(false);

  // Live billing summary from DB
  const [liveSummary, setLiveSummary] = useState<BillingSummary | null>(null);

  useEffect(() => {
    if (restaurant.id) {
      billingService.getBillingSummary(restaurant.id).then(setLiveSummary).catch(console.error);
    }
  }, [restaurant.id, orders]);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.paymentStatus === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.tableNumber && o.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate metrics fallback from context if liveSummary not yet ready
  const settledGross = liveSummary?.settledGrossSales ?? orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((acc, o) => acc + o.total, 0);

  const pendingAmount = liveSummary?.unpaidPending ?? orders
    .filter((o) => o.paymentStatus === 'pending')
    .reduce((acc, o) => acc + o.total, 0);

  const totalGst = liveSummary?.totalGstAccrued ?? orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((acc, o) => acc + o.tax, 0);

  const refundedGross = liveSummary?.refundedTotal ?? orders
    .filter((o) => o.paymentStatus === 'refunded')
    .reduce((acc, o) => acc + o.total, 0);

  const handlePrint = () => {
    window.print();
    addToast('Print Triggered', 'Official GST invoice sent to thermal printer.', 'info');
  };

  const handleViewInvoice = async (ord: Order) => {
    setPreviewOrder(ord);
    try {
      const snap = await billingService.getInvoiceByOrderId(ord.id);
      if (snap) {
        setSelectedInvoice(snap);
      } else {
        setSelectedInvoice(null);
      }
    } catch {
      setSelectedInvoice(null);
    }
  };

  const handleSettlePayment = async (ord: Order) => {
    try {
      await billingService.recordPayment({
        restaurantId: restaurant.id,
        orderId: ord.id,
        amount: ord.total,
        paymentMethod: (ord.paymentMethod as any) || 'counter',
        transactionReference: `UPI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      });
      updatePaymentStatus(ord.id, 'paid');
      addToast('Payment Settled', `Order ${ord.orderNumber} marked as Paid (${formatCurrency(ord.total, restaurant.currencySymbol)}).`, 'success');
      const updatedSum = await billingService.getBillingSummary(restaurant.id);
      setLiveSummary(updatedSum);
    } catch (err: any) {
      updatePaymentStatus(ord.id, 'paid');
      addToast('Payment Updated', `Order ${ord.orderNumber} set to Paid.`, 'success');
    }
  };

  const handleConfirmRefund = async () => {
    if (!refundModalOrder) return;
    setIsProcessingRefund(true);
    try {
      await billingService.processRefund({
        restaurantId: restaurant.id,
        orderId: refundModalOrder.id,
        amount: refundModalOrder.total,
        reason: refundReason,
      });
      updatePaymentStatus(refundModalOrder.id, 'refunded');
      addToast('Refund Processed', `Order ${refundModalOrder.orderNumber} refunded: ${formatCurrency(refundModalOrder.total, restaurant.currencySymbol)}.`, 'info');
      setRefundModalOrder(null);
      const updatedSum = await billingService.getBillingSummary(restaurant.id);
      setLiveSummary(updatedSum);
    } catch (err: any) {
      updatePaymentStatus(refundModalOrder.id, 'refunded');
      addToast('Refund Recorded', `Order ${refundModalOrder.orderNumber} set to Refunded.`, 'info');
      setRefundModalOrder(null);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
              Billing, Invoices & Payment Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
              GST Compliant (5%)
            </span>
          </div>
          <p className="text-xs text-cafe-muted mt-1">
            Generate guest tax invoices, record verified UPI & cash settlements, and manage order refunds.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-xl border border-cafe-border dark:border-stone-700 bg-white dark:bg-cafe-surface-dark hover:bg-cafe-sand/50 text-cafe-primary dark:text-cafe-cream text-xs font-bold shadow-warm-sm flex items-center gap-1.5 transition-all btn-press"
        >
          <Printer className="w-4 h-4 text-cafe-accent" />
          <span>Print Daily Summary</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
              Settled Collections
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">
            {formatCurrency(settledGross, restaurant.currencySymbol)}
          </h3>
          <p className="text-xs text-cafe-muted mt-1">Reconciled with POS & UPI ledger</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
              Pending Counter Due
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-600 mt-2">
            {formatCurrency(pendingAmount, restaurant.currencySymbol)}
          </h3>
          <p className="text-xs text-cafe-muted mt-1">Awaiting dining table settlement</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
              GST Accrued (5%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-cafe-primary dark:text-cafe-cream mt-2">
            {formatCurrency(totalGst, restaurant.currencySymbol)}
          </h3>
          <p className="text-xs text-cafe-muted mt-1">
            CGST: {formatCurrency(totalGst / 2, restaurant.currencySymbol)} • SGST: {formatCurrency(totalGst / 2, restaurant.currencySymbol)}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
              Refunds & Reversals
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 mt-2">
            {formatCurrency(refundedGross, restaurant.currencySymbol)}
          </h3>
          <p className="text-xs text-cafe-muted mt-1">Audited reversals & cancellations</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-cafe-surface-dark p-4 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'paid', label: 'Paid & Settled' },
            { id: 'pending', label: 'Pending Settlement' },
            { id: 'refunded', label: 'Refunded' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === st.id
                  ? 'bg-cafe-accent text-white shadow-warm-sm'
                  : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-sand/40'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-cafe-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice #, customer, table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-cafe-accent"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-cafe-light/70 dark:bg-stone-900/60 border-b border-cafe-border/80 dark:border-cafe-border-dark text-[11px] font-extrabold uppercase tracking-wider text-cafe-muted">
                <th className="py-3.5 px-6">Invoice # & Date</th>
                <th className="py-3.5 px-4">Guest / Table</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Subtotal</th>
                <th className="py-3.5 px-4">GST (5%)</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-border/60 dark:divide-cafe-border-dark">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-cafe-muted">
                    No invoices matching your selection.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const payBadge = getPaymentBadge(ord.paymentStatus);
                  const invoiceNum = billingService.generateInvoiceNumber(ord.orderNumber, ord.createdAt);

                  return (
                    <tr key={ord.id} className="hover:bg-cafe-sand/20 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-extrabold text-sm text-cafe-primary dark:text-cafe-cream">
                          {invoiceNum}
                        </p>
                        <p className="text-cafe-muted text-[11px]">
                          Ref: {ord.orderNumber} • {new Date(ord.createdAt).toLocaleDateString()} at {formatTimeOnly(ord.createdAt)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-cafe-primary dark:text-cafe-cream">
                          {ord.customerName}
                        </p>
                        <p className="text-[11px] text-cafe-muted">{ord.tableNumber || 'Takeaway'}</p>
                      </td>
                      <td className="py-4 px-4 font-semibold text-cafe-primary dark:text-stone-300 capitalize">
                        <span className="inline-flex items-center gap-1">
                          {ord.paymentMethod === 'upi' ? '⚡ UPI' : ord.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-cafe-muted font-medium">
                        {formatCurrency(ord.subtotal, restaurant.currencySymbol)}
                      </td>
                      <td className="py-4 px-4 text-cafe-muted font-medium">
                        {formatCurrency(ord.tax, restaurant.currencySymbol)}
                        <span className="text-[10px] text-cafe-muted block">
                          (2.5% + 2.5%)
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-sm text-cafe-accent">
                        {formatCurrency(ord.total, restaurant.currencySymbol)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${payBadge.badge}`}>
                          {payBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ord.paymentStatus === 'pending' && (
                            <button
                              onClick={() => handleSettlePayment(ord)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors"
                              title="Verify & Settle Payment"
                            >
                              Settle Bill
                            </button>
                          )}
                          {ord.paymentStatus === 'paid' && (
                            <button
                              onClick={() => setRefundModalOrder(ord)}
                              className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-[10px] hover:bg-rose-100 transition-colors"
                              title="Process Refund"
                            >
                              Refund
                            </button>
                          )}
                          <button
                            onClick={() => handleViewInvoice(ord)}
                            className="p-1.5 rounded-lg border border-cafe-border dark:border-stone-700 hover:bg-cafe-sand/50 text-cafe-primary dark:text-stone-300 transition-colors"
                            title="Preview GST Tax Invoice"
                          >
                            <Eye className="w-3.5 h-3.5 text-cafe-accent" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Invoice Modal / Printable GST Bill */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-md w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <span className="text-xs font-bold text-cafe-muted uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-cafe-accent" />
                GST Tax Invoice
              </span>
              <button
                onClick={() => {
                  setPreviewOrder(null);
                  setSelectedInvoice(null);
                }}
                className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Paper Container */}
            <div id="printable-receipt" className="py-4 text-center space-y-3 font-mono text-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-cafe-accent flex items-center justify-center mx-auto shadow-sm">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-cafe-primary dark:text-cafe-cream tracking-tight">
                  {restaurant.name}
                </h2>
                <p className="text-[11px] text-cafe-muted mt-0.5">
                  {restaurant.address} • {restaurant.city}
                </p>
                <p className="text-[10px] text-cafe-muted font-bold mt-0.5">
                  GSTIN: {selectedInvoice?.restaurantGstin || '29AAAAA0000A1Z5'} • Ph: {restaurant.contactPhone}
                </p>
              </div>

              <div className="border-t border-b border-dashed border-cafe-border dark:border-stone-700 py-2.5 text-left space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-cafe-muted">Invoice No:</span>
                  <span className="font-bold">{billingService.generateInvoiceNumber(previewOrder.orderNumber, previewOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cafe-muted">Order Ref:</span>
                  <span className="font-bold">{previewOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cafe-muted">Customer:</span>
                  <span>{previewOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cafe-muted">Table / Type:</span>
                  <span>{previewOrder.tableNumber || 'Takeaway / Delivery'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cafe-muted">Date & Time:</span>
                  <span>{new Date(previewOrder.createdAt).toLocaleDateString()} {new Date(previewOrder.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="text-left py-1 text-[11px]">
                <div className="flex justify-between text-cafe-muted font-bold border-b border-cafe-border/50 pb-1 mb-1">
                  <span>Particulars</span>
                  <span>Amount</span>
                </div>
                {previewOrder.items.map((i) => (
                  <div key={i.id} className="flex justify-between py-0.5">
                    <span className="truncate pr-2">
                      {i.isVeg ? '🟢 ' : '🔴 '}
                      {i.quantity}x {i.name}
                    </span>
                    <span className="font-bold shrink-0">{formatCurrency(i.price * i.quantity, restaurant.currencySymbol)}</span>
                  </div>
                ))}
              </div>

              {/* GST Totals */}
              <div className="border-t border-dashed border-cafe-border dark:border-stone-700 pt-2 text-left space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-cafe-muted">Subtotal:</span>
                  <span>{formatCurrency(previewOrder.subtotal, restaurant.currencySymbol)}</span>
                </div>
                {previewOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(previewOrder.discount, restaurant.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-cafe-muted">
                  <span>CGST (2.5%):</span>
                  <span>{formatCurrency(previewOrder.tax / 2, restaurant.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-cafe-muted">
                  <span>SGST (2.5%):</span>
                  <span>{formatCurrency(previewOrder.tax / 2, restaurant.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1.5 border-t border-stone-200 dark:border-stone-700">
                  <span>Net Payable:</span>
                  <span className="text-cafe-accent">{formatCurrency(previewOrder.total, restaurant.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold pt-1">
                  <span className="text-cafe-muted">Payment Status:</span>
                  <span className={previewOrder.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                    {previewOrder.paymentStatus.toUpperCase()} ({previewOrder.paymentMethod.toUpperCase()})
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-cafe-muted pt-2 border-t border-dashed border-cafe-border">
                Thank you for dining with us! Namaste & visit again.
              </p>
            </div>

            <div className="pt-3 border-t border-cafe-border dark:border-cafe-border-dark flex gap-2">
              <button
                onClick={() => {
                  setPreviewOrder(null);
                  setSelectedInvoice(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-cafe-border text-xs font-bold text-cafe-muted hover:bg-cafe-sand/40"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Refund Modal */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-sm w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-cafe-primary dark:text-cafe-cream">
                    Process Bill Refund
                  </h3>
                  <p className="text-[11px] text-cafe-muted">Order {refundModalOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setRefundModalOrder(null)}
                className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs">
              <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Refund Confirmation
                </p>
                <p className="mt-1 text-[11px]">
                  Refunding will reverse <strong>{formatCurrency(refundModalOrder.total, restaurant.currencySymbol)}</strong> and update database audit logs.
                </p>
              </div>

              <div>
                <label className="font-bold text-cafe-muted block mb-1">
                  Reason for Refund
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-cafe-border dark:border-stone-700 bg-cafe-light dark:bg-stone-800 text-xs font-medium focus:ring-1 focus:ring-cafe-accent outline-none"
                >
                  <option value="Customer Cancellation">Customer Cancellation</option>
                  <option value="Order Mistake / Item Unavailable">Order Mistake / Item Unavailable</option>
                  <option value="Food Quality Issue">Food Quality Issue</option>
                  <option value="Duplicate Payment Settlement">Duplicate Payment Settlement</option>
                  <option value="Other / Management Goodwill">Other / Management Goodwill</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-cafe-border dark:border-cafe-border-dark flex gap-2">
              <button
                onClick={() => setRefundModalOrder(null)}
                disabled={isProcessingRefund}
                className="flex-1 py-2.5 rounded-xl border border-cafe-border text-xs font-bold text-cafe-muted hover:bg-cafe-sand/40"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefund}
                disabled={isProcessingRefund}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-warm flex items-center justify-center gap-1.5 transition-colors"
              >
                {isProcessingRefund ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
