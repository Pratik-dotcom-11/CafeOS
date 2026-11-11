import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

export const notificationService = {
  /**
   * Fetch system notifications for a restaurant or user.
   */
  async getNotifications(
    restaurantId: string,
    options?: { unreadOnly?: boolean; limit?: number }
  ): Promise<NotificationRow[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Mark a notification as read.
   */
  async markAsRead(notificationId: string): Promise<NotificationRow> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark all notifications for a restaurant as read.
   */
  async markAllAsRead(restaurantId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('restaurant_id', restaurantId)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Post a system or staff notification (e.g. low stock, new online order, table call).
   */
  async createNotification(notification: NotificationInsert): Promise<NotificationRow> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Listen to real-time notifications for the restaurant.
   */
  subscribeToNotifications(
    restaurantId: string,
    onNotification: (notif: NotificationRow) => void
  ) {
    const channel = supabase
      .channel(`notifications-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          onNotification(payload.new as NotificationRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

export default notificationService;

