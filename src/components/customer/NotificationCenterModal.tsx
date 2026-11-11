import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ChefHat,
  Flame,
  CheckCircle2,
  Utensils,
  Bike,
  XCircle,
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { CustomerNotification } from '../../services/customerService';
import { formatTimeAgo } from '../../utils/formatters';

export const NotificationCenterModal: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
  } = useCustomer();

  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  if (!isNotificationCenterOpen) return null;

  const filtered = notifications.filter((n) => (filter === 'all' ? true : !n.isRead));

  const getNotificationIcon = (title: string, type: string) => {
    const t = (title + ' ' + type).toLowerCase();
    if (t.includes('cancelled') || t.includes('rejected')) {
      return <XCircle className="w-4 h-4 text-rose-500" />;
    }
    if (t.includes('ready') || t.includes('plated')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (t.includes('cooking') || t.includes('preparing')) {
      return <Flame className="w-4 h-4 text-orange-500" />;
    }
    if (t.includes('accepted')) {
      return <ChefHat className="w-4 h-4 text-blue-600" />;
    }
    if (t.includes('delivery')) {
      return <Bike className="w-4 h-4 text-indigo-600" />;
    }
    if (t.includes('completed') || t.includes('enjoy')) {
      return <Utensils className="w-4 h-4 text-amber-600" />;
    }
    return <Sparkles className="w-4 h-4 text-cafe-accent" />;
  };

  const handleNotificationClick = async (notif: CustomerNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    setIsNotificationCenterOpen(false);
    if (notif.orderId) {
      navigate(`/customer/orders/${notif.orderId}`);
    }
  };

  const handleRequestPush = async () => {
    if (!('Notification' in window)) {
      setPushStatus('Push notifications not supported on this browser.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushStatus('Push notifications enabled successfully!');
      } else {
        setPushStatus('Notifications were not granted.');
      }
    } catch {
      setPushStatus('Could not request notification permission.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-cafe-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 mt-12 sm:mt-0">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cafe-border flex items-center justify-between bg-cafe-light/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cafe-accent text-white flex items-center justify-center shadow-warm">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-cafe-primary">Order Alerts &amp; Updates</h2>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {unreadNotificationsCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-cafe-muted">Real-time status alerts for your culinary orders</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNotificationCenterOpen(false)}
            className="w-8 h-8 rounded-full bg-white border border-cafe-border text-cafe-muted hover:text-cafe-primary flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Bulk Action Row */}
        <div className="px-4 py-2.5 border-b border-cafe-border flex items-center justify-between bg-white text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                filter === 'all'
                  ? 'bg-cafe-primary text-white shadow-sm'
                  : 'text-cafe-muted hover:text-cafe-primary'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                filter === 'unread'
                  ? 'bg-cafe-primary text-white shadow-sm'
                  : 'text-cafe-muted hover:text-cafe-primary'
              }`}
            >
              Unread ({unreadNotificationsCount})
            </button>
          </div>

          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-xs font-bold text-cafe-accent hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notification Stream */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-cafe-border/50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-cafe-muted">
              <Bell className="w-10 h-10 text-cafe-muted/40 mx-auto" />
              <p className="text-xs font-bold text-cafe-primary">No notifications right now</p>
              <p className="text-[11px] text-cafe-muted">
                {filter === 'unread'
                  ? 'You are completely caught up!'
                  : 'Live kitchen and dispatch updates will appear here automatically.'}
              </p>
            </div>
          ) : (
            filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`pt-2.5 pb-2 px-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 hover:bg-cafe-light/70 ${
                  !notif.isRead ? 'bg-amber-50/60 font-medium' : 'bg-white opacity-85'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-cafe-border flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  {getNotificationIcon(notif.title, notif.notificationType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-black text-cafe-primary line-clamp-1">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-cafe-muted shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                    </span>
                  </div>

                  <p className="text-xs text-cafe-muted mt-0.5 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.orderId && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-cafe-accent">
                      <span>View Live Order Status</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-cafe-accent shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Optional Push Notification Consent Footnote */}
        <div className="p-3 border-t border-cafe-border bg-cafe-light/40 flex items-center justify-between text-[11px] text-cafe-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authorized via Supabase Realtime</span>
          </div>

          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
            <button
              type="button"
              onClick={handleRequestPush}
              className="text-[10px] font-bold text-cafe-accent hover:underline"
            >
              Enable Browser Alerts
            </button>
          )}

          {pushStatus && (
            <span className="text-[10px] text-emerald-700 font-bold">{pushStatus}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterModal;

