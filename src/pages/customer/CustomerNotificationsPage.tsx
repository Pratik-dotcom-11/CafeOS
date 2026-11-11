import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  ChefHat,
  Flame,
  Utensils,
  Bike,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { CustomerNotification } from '../../services/customerService';
import { formatTimeAgo } from '../../utils/formatters';

export const CustomerNotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useCustomer();

  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const filtered = notifications.filter((n) => (filter === 'all' ? true : !n.isRead));

  const getNotificationIcon = (title: string, type: string) => {
    const t = (title + ' ' + type).toLowerCase();
    if (t.includes('cancelled') || t.includes('rejected')) {
      return <XCircle className="w-5 h-5 text-rose-500" />;
    }
    if (t.includes('ready') || t.includes('plated')) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    }
    if (t.includes('cooking') || t.includes('preparing')) {
      return <Flame className="w-5 h-5 text-orange-500" />;
    }
    if (t.includes('accepted')) {
      return <ChefHat className="w-5 h-5 text-blue-600" />;
    }
    if (t.includes('delivery')) {
      return <Bike className="w-5 h-5 text-indigo-600" />;
    }
    if (t.includes('completed') || t.includes('enjoy')) {
      return <Utensils className="w-5 h-5 text-amber-600" />;
    }
    return <Sparkles className="w-5 h-5 text-cafe-accent" />;
  };

  const handleNotificationClick = async (notif: CustomerNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
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
        setPushStatus('Notification permission was not granted.');
      }
    } catch {
      setPushStatus('Could not request notification permission.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cafe-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-cafe-primary tracking-tight">
              Order Notifications & Alerts
            </h1>
          </div>
          <p className="text-xs text-cafe-muted mt-1">
            Real-time kitchen updates, delivery progress, and promotional reward announcements.
          </p>
        </div>

        {unreadNotificationsCount > 0 && (
          <button
            onClick={() => markAllNotificationsAsRead()}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-cafe-border text-cafe-primary text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Push Permission Notification Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="font-extrabold text-cafe-primary">Instant Kitchen Status Push Alerts</p>
            <p className="text-cafe-muted text-[11px]">Receive chimes when your food is accepted or out for delivery.</p>
          </div>
        </div>
        <button
          onClick={handleRequestPush}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-cafe-primary hover:bg-cafe-accent text-white font-bold text-xs transition-colors shrink-0 shadow-warm"
        >
          Enable Alerts
        </button>
      </div>

      {pushStatus && (
        <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-xs">
          {pushStatus}
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-cafe-primary text-white shadow-warm'
              : 'bg-white text-cafe-muted hover:text-cafe-primary border border-cafe-border'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-cafe-primary text-white shadow-warm'
              : 'bg-white text-cafe-muted hover:text-cafe-primary border border-cafe-border'
          }`}
        >
          <span>Unread</span>
          {unreadNotificationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-cafe-border space-y-3 shadow-warm">
            <div className="w-14 h-14 rounded-2xl bg-cafe-sand/60 text-cafe-muted flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-cafe-primary">No notifications</h3>
            <p className="text-xs text-cafe-muted max-w-sm mx-auto">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : 'Place an order at any partner restaurant to receive live status updates here.'}
            </p>
            <NavLink
              to="/customer/restaurants"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm mt-2 transition-all"
            >
              <span>Explore Restaurants</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                notif.isRead
                  ? 'bg-white border-cafe-border hover:border-cafe-accent/40'
                  : 'bg-amber-50/40 border-amber-200 hover:border-amber-400 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-white border border-cafe-border/80 shadow-sm shrink-0 mt-0.5">
                  {getNotificationIcon(notif.title, notif.notificationType)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs text-cafe-primary">{notif.title}</h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-cafe-muted leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-cafe-muted/70 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(notif.createdAt)}</span>
                    {notif.orderId && (
                      <span className="text-cafe-accent font-bold ml-1">
                        • Track Order &rarr;
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {!notif.isRead && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationAsRead(notif.id);
                  }}
                  className="p-1.5 rounded-lg text-cafe-muted hover:text-cafe-primary hover:bg-white transition-colors"
                  title="Mark as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerNotificationsPage;

