import { OrderStatus, PaymentStatus } from '../types';

/**
 * Format currency with Indian Rupee (₹) by default, using standard Indian number formatting.
 */
export function formatCurrency(amount: number, currencySymbol: string = '₹'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currencySymbol}0`;
  }

  // Format with Indian locale grouping (e.g. 1,00,000)
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currencySymbol}${formatted}`;
}

export function formatTimeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes === 1) return '1 min ago';
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const hours = Math.floor(diffInMinutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

export function formatTimeOnly(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getStatusBadge(status: OrderStatus): { label: string; bg: string; text: string; dot: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'New Order',
        bg: 'bg-amber-50 text-amber-800 border border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-500 animate-pulse'
      };
    case 'accepted':
      return {
        label: 'Accepted',
        bg: 'bg-blue-50 text-blue-800 border border-blue-200',
        text: 'text-blue-700',
        dot: 'bg-blue-500'
      };
    case 'preparing':
      return {
        label: 'In Kitchen',
        bg: 'bg-orange-50 text-orange-800 border border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-500 animate-spin'
      };
    case 'ready':
      return {
        label: 'Ready for Pickup',
        bg: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500'
      };
    case 'completed':
      return {
        label: 'Served / Done',
        bg: 'bg-stone-100 text-stone-700 border border-stone-200',
        text: 'text-stone-600',
        dot: 'bg-stone-400'
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50 text-rose-700 border border-rose-200',
        text: 'text-rose-600',
        dot: 'bg-rose-500'
      };
    default:
      return {
        label: status,
        bg: 'bg-stone-100 text-stone-800 border border-stone-200',
        text: 'text-stone-700',
        dot: 'bg-stone-400'
      };
  }
}

export function getPaymentBadge(status: PaymentStatus): { label: string; badge: string } {
  switch (status) {
    case 'paid':
      return { label: 'Paid', badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200' };
    case 'pending':
      return { label: 'Unpaid', badge: 'bg-amber-100 text-amber-800 border border-amber-200' };
    case 'refunded':
      return { label: 'Refunded', badge: 'bg-stone-100 text-stone-700 border border-stone-200' };
    default:
      return { label: status, badge: 'bg-stone-100 text-stone-700' };
  }
}
