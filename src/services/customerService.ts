import { supabase } from '../lib/supabase';

export interface CustomerAddress {
  id: string;
  userId: string;
  label: 'Home' | 'Work' | 'Other' | string;
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  fullAddress?: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface CustomerFavorite {
  id: string;
  userId: string;
  restaurantId?: string;
  productId?: string;
  createdAt: string;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
    cuisine: string;
    logoUrl?: string;
    rating: number;
    city: string;
  };
  product?: {
    id: string;
    name: string;
    price: number;
    isVeg: boolean;
    image?: string;
    restaurantId: string;
    restaurantName?: string;
  };
}

export interface CustomerRewardSummary {
  userId: string;
  pointsBalance: number;
  currentBalance?: number;
  lifetimePoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  updatedAt: string;
}

export interface CustomerRewardTransaction {
  id: string;
  userId: string;
  orderId?: string;
  pointsDelta: number;
  description: string;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerNotification {
  id: string;
  customerId: string;
  restaurantId?: string;
  orderId?: string;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
}

export interface CustomerReview {
  id: string;
  customerId: string;
  restaurantId: string;
  orderId: string;
  productId?: string;
  rating: number;
  reviewText?: string;
  ownerReply?: string;
  ownerReplyAt?: string;
  isReported?: boolean;
  reportReason?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    fullName?: string;
    profileImage?: string;
  };
  product?: {
    name?: string;
  };
}

export interface CustomerSupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  restaurantId?: string;
  orderId?: string;
  category?: 'order_issue' | 'missing_item' | 'incorrect_item' | 'payment_issue' | 'account_issue' | 'other' | string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'urgent';
  resolutionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerSupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'customer' | 'staff' | 'admin';
  message: string;
  createdAt: string;
}

export const customerService = {
  // ==========================================
  // 1. Delivery Addresses
  // ==========================================
  async getAddresses(userId: string): Promise<CustomerAddress[]> {
    const { data, error } = await (supabase.from as any)('customer_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch customer addresses:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      label: row.label,
      recipientName: row.recipient_name,
      recipientPhone: row.recipient_phone,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2 || undefined,
      landmark: row.landmark || undefined,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      fullAddress: [row.address_line1, row.address_line2, row.landmark, row.city, row.postal_code].filter(Boolean).join(', '),
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at,
    }));
  },

  async addAddress(address: Omit<CustomerAddress, 'id' | 'createdAt'>): Promise<CustomerAddress> {
    // If setting as default, clear existing default first
    if (address.isDefault) {
      await (supabase.from as any)('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', address.userId);
    }

    const { data, error } = await (supabase.from as any)('customer_addresses')
      .insert({
        user_id: address.userId,
        label: address.label,
        recipient_name: address.recipientName,
        recipient_phone: address.recipientPhone,
        address_line1: address.addressLine1,
        address_line2: address.addressLine2 || null,
        landmark: address.landmark || null,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        is_default: address.isDefault,
      })
      .select()
      .single();

    if (error) throw error;
    const row = data as any;

    return {
      id: row.id,
      userId: row.user_id,
      label: row.label,
      recipientName: row.recipient_name,
      recipientPhone: row.recipient_phone,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2 || undefined,
      landmark: row.landmark || undefined,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      fullAddress: [row.address_line1, row.address_line2, row.landmark, row.city, row.postal_code].filter(Boolean).join(', '),
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at,
    };
  },

  async deleteAddress(addressId: string, userId?: string): Promise<void> {
    let query = (supabase.from as any)('customer_addresses')
      .delete()
      .eq('id', addressId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;
    if (error) throw error;
  },

  async setDefaultAddress(addressId: string, userId: string): Promise<void> {
    await (supabase.from as any)('customer_addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    const { error } = await (supabase.from as any)('customer_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // ==========================================
  // 2. Customer Favorites (Restaurants & Dishes)
  // ==========================================
  async getFavorites(userId: string): Promise<{
    favoriteRestaurants: CustomerFavorite[];
    favoriteDishes: CustomerFavorite[];
  }> {
    const { data, error } = await (supabase.from as any)('customer_favorites')
      .select(`
        id,
        user_id,
        restaurant_id,
        product_id,
        created_at,
        restaurant:restaurants (
          id,
          name,
          slug,
          cuisine,
          logo_url,
          rating,
          city
        ),
        product:products (
          id,
          name,
          price,
          is_veg,
          image_url,
          restaurant_id,
          restaurant:restaurants (
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch favorites:', error);
      return { favoriteRestaurants: [], favoriteDishes: [] };
    }

    const favoriteRestaurants: CustomerFavorite[] = [];
    const favoriteDishes: CustomerFavorite[] = [];

    (data || []).forEach((row: any) => {
      if (row.restaurant_id && row.restaurant) {
        favoriteRestaurants.push({
          id: row.id,
          userId: row.user_id,
          restaurantId: row.restaurant_id,
          createdAt: row.created_at,
          restaurant: {
            id: row.restaurant.id,
            name: row.restaurant.name,
            slug: row.restaurant.slug,
            cuisine: row.restaurant.cuisine || 'Multi-Cuisine',
            logoUrl: row.restaurant.logo_url || undefined,
            rating: Number(row.restaurant.rating) || 4.8,
            city: row.restaurant.city || 'Kolkata',
          },
        });
      } else if (row.product_id && row.product) {
        favoriteDishes.push({
          id: row.id,
          userId: row.user_id,
          productId: row.product_id,
          createdAt: row.created_at,
          product: {
            id: row.product.id,
            name: row.product.name,
            price: Number(row.product.price) || 0,
            isVeg: Boolean(row.product.is_veg),
            image: row.product.image_url || undefined,
            restaurantId: row.product.restaurant_id,
            restaurantName: row.product.restaurant?.name || 'CafeOS Kitchen',
          },
        });
      }
    });

    return { favoriteRestaurants, favoriteDishes };
  },

  async toggleRestaurantFavorite(userId: string, restaurantId: string): Promise<boolean> {
    const { data: existing } = await (supabase.from as any)('customer_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (existing) {
      await (supabase.from as any)('customer_favorites').delete().eq('id', existing.id);
      return false; // Removed
    } else {
      await (supabase.from as any)('customer_favorites').insert({
        user_id: userId,
        restaurant_id: restaurantId,
      });
      return true; // Added
    }
  },

  async toggleProductFavorite(userId: string, productId: string): Promise<boolean> {
    const { data: existing } = await (supabase.from as any)('customer_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      await (supabase.from as any)('customer_favorites').delete().eq('id', existing.id);
      return false; // Removed
    } else {
      await (supabase.from as any)('customer_favorites').insert({
        user_id: userId,
        product_id: productId,
      });
      return true; // Added
    }
  },

  // ==========================================
  // 3. Rewards & Loyalty
  // ==========================================
  async getRewards(userId: string): Promise<CustomerRewardSummary> {
    const { data, error } = await (supabase.from as any)('customer_rewards')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      // Initialize if missing
      const { data: initData } = await (supabase.rpc as any)('initialize_customer_rewards', {
        p_user_id: userId,
      });

      if (initData) {
        return {
          userId: initData.user_id,
          pointsBalance: initData.points_balance || 0,
          currentBalance: initData.points_balance || 0,
          lifetimePoints: initData.lifetime_points || 0,
          tier: initData.tier || 'Bronze',
          updatedAt: initData.updated_at || new Date().toISOString(),
        };
      }

      return {
        userId,
        pointsBalance: 100,
        currentBalance: 100,
        lifetimePoints: 100,
        tier: 'Bronze',
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      userId: data.user_id,
      pointsBalance: data.points_balance || 0,
      currentBalance: data.points_balance || 0,
      lifetimePoints: data.lifetime_points || 0,
      tier: data.tier || 'Bronze',
      updatedAt: data.updated_at,
    };
  },

  async getRewardTransactions(userId: string): Promise<CustomerRewardTransaction[]> {
    const { data, error } = await (supabase.from as any)('customer_reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch reward transactions:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      orderId: row.order_id || undefined,
      pointsDelta: row.points_delta,
      description: row.description,
      createdAt: row.created_at,
    }));
  },

  // ==========================================
  // 4. Customer Support
  // ==========================================
  async getSupportTickets(userId: string): Promise<CustomerSupportTicket[]> {
    const { data, error } = await (supabase.from as any)('customer_support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch support tickets:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      ticketNumber: row.ticket_number,
      userId: row.user_id,
      restaurantId: row.restaurant_id || undefined,
      orderId: row.order_id || undefined,
      category: row.category || 'order_issue',
      subject: row.subject,
      message: row.message,
      status: row.status,
      priority: row.priority,
      resolutionNotes: row.resolution_notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async getRestaurantSupportTickets(restaurantId: string): Promise<CustomerSupportTicket[]> {
    const { data, error } = await (supabase.from as any)('customer_support_tickets')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch restaurant support tickets:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      ticketNumber: row.ticket_number,
      userId: row.user_id,
      restaurantId: row.restaurant_id || undefined,
      orderId: row.order_id || undefined,
      category: row.category || 'order_issue',
      subject: row.subject,
      message: row.message,
      status: row.status,
      priority: row.priority,
      resolutionNotes: row.resolution_notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createSupportTicket(ticket: {
    userId: string;
    subject: string;
    message: string;
    category?: string;
    restaurantId?: string;
    orderId?: string;
  }): Promise<CustomerSupportTicket> {
    const ticketNumber = `SUP-${Date.now().toString().slice(-6)}`;

    const { data, error } = await (supabase.from as any)('customer_support_tickets')
      .insert({
        ticket_number: ticketNumber,
        user_id: ticket.userId,
        subject: ticket.subject,
        message: ticket.message,
        category: ticket.category || 'order_issue',
        restaurant_id: ticket.restaurantId || null,
        order_id: ticket.orderId || null,
        status: 'open',
        priority: 'normal',
      })
      .select()
      .single();

    if (error) throw error;
    const row = data as any;

    return {
      id: row.id,
      ticketNumber: row.ticket_number,
      userId: row.user_id,
      restaurantId: row.restaurant_id || undefined,
      orderId: row.order_id || undefined,
      category: row.category || 'order_issue',
      subject: row.subject,
      message: row.message,
      status: row.status,
      priority: row.priority,
      resolutionNotes: row.resolution_notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async updateTicketStatus(
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
    resolutionNotes?: string
  ): Promise<void> {
    const { error } = await (supabase.from as any)('customer_support_tickets')
      .update({
        status,
        resolution_notes: resolutionNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (error) throw error;
  },

  async getSupportTicketMessages(ticketId: string): Promise<CustomerSupportMessage[]> {
    const { data, error } = await (supabase.from as any)('customer_support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Could not fetch ticket messages:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      ticketId: row.ticket_id,
      senderId: row.sender_id,
      senderRole: row.sender_role,
      message: row.message,
      createdAt: row.created_at,
    }));
  },

  async sendSupportTicketMessage(
    ticketId: string,
    senderId: string,
    message: string,
    senderRole: 'customer' | 'staff' | 'admin' = 'customer'
  ): Promise<CustomerSupportMessage> {
    const { data, error } = await (supabase.from as any)('customer_support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: senderId,
        sender_role: senderRole,
        message: message.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    const row = data as any;

    return {
      id: row.id,
      ticketId: row.ticket_id,
      senderId: row.sender_id,
      senderRole: row.sender_role,
      message: row.message,
      createdAt: row.created_at,
    };
  },

  // ==========================================
  // 5. Customer Profiles
  // ==========================================
  async getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
    const { data, error } = await (supabase.from as any)('customer_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      fullName: data.full_name || undefined,
      email: data.email,
      phoneNumber: data.phone_number || undefined,
      profileImage: data.profile_image || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateCustomerProfile(userId: string, updates: {
    fullName?: string;
    phoneNumber?: string;
    profileImage?: string;
  }): Promise<CustomerProfile> {
    const { data, error } = await (supabase.from as any)('customer_profiles')
      .update({
        full_name: updates.fullName,
        phone_number: updates.phoneNumber,
        profile_image: updates.profileImage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    const row = data as any;

    return {
      id: row.id,
      fullName: row.full_name || undefined,
      email: row.email,
      phoneNumber: row.phone_number || undefined,
      profileImage: row.profile_image || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  // ==========================================
  // 6. Customer Notifications
  // ==========================================
  async getNotifications(customerId: string): Promise<CustomerNotification[]> {
    const { data, error } = await (supabase.from as any)('customer_notifications')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch notifications:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      restaurantId: row.restaurant_id || undefined,
      orderId: row.order_id || undefined,
      title: row.title,
      message: row.message,
      notificationType: row.notification_type,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at,
    }));
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await (supabase.from as any)('customer_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  },

  async markAllNotificationsAsRead(customerId: string): Promise<void> {
    await (supabase.from as any)('customer_notifications')
      .update({ is_read: true })
      .eq('customer_id', customerId)
      .eq('is_read', false);
  },

  subscribeToNotifications(
    customerId: string,
    onNotification: (notif: CustomerNotification) => void
  ) {
    const channel = supabase
      .channel(`cust-notifications-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_notifications',
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            onNotification({
              id: row.id,
              customerId: row.customer_id,
              restaurantId: row.restaurant_id || undefined,
              orderId: row.order_id || undefined,
              title: row.title,
              message: row.message,
              notificationType: row.notification_type,
              isRead: Boolean(row.is_read),
              createdAt: row.created_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 7. Customer Reviews
  // ==========================================
  async getRestaurantReviews(restaurantId: string): Promise<CustomerReview[]> {
    const { data, error } = await (supabase.from as any)('customer_reviews')
      .select(`
        id,
        customer_id,
        restaurant_id,
        order_id,
        product_id,
        rating,
        review_text,
        owner_reply,
        owner_reply_at,
        is_reported,
        report_reason,
        created_at,
        updated_at,
        customer:customer_profiles (
          full_name,
          profile_image
        ),
        product:products (
          name
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch reviews:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      restaurantId: row.restaurant_id,
      orderId: row.order_id,
      productId: row.product_id || undefined,
      rating: row.rating,
      reviewText: row.review_text || undefined,
      ownerReply: row.owner_reply || undefined,
      ownerReplyAt: row.owner_reply_at || undefined,
      isReported: Boolean(row.is_reported),
      reportReason: row.report_reason || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      customer: row.customer ? {
        fullName: row.customer.full_name || 'Verified Diner',
        profileImage: row.customer.profile_image || undefined,
      } : undefined,
      product: row.product ? {
        name: row.product.name,
      } : undefined,
    }));
  },

  async getProductReviews(productId: string): Promise<CustomerReview[]> {
    const { data, error } = await (supabase.from as any)('customer_reviews')
      .select(`
        id,
        customer_id,
        restaurant_id,
        order_id,
        product_id,
        rating,
        review_text,
        owner_reply,
        owner_reply_at,
        created_at,
        updated_at,
        customer:customer_profiles (
          full_name,
          profile_image
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch product reviews:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      customerId: row.customer_id,
      restaurantId: row.restaurant_id,
      orderId: row.order_id,
      productId: row.product_id || undefined,
      rating: row.rating,
      reviewText: row.review_text || undefined,
      ownerReply: row.owner_reply || undefined,
      ownerReplyAt: row.owner_reply_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      customer: row.customer ? {
        fullName: row.customer.full_name || 'Verified Diner',
        profileImage: row.customer.profile_image || undefined,
      } : undefined,
    }));
  },

  async checkOrderReviewEligibility(
    orderId: string,
    customerId: string
  ): Promise<{ canReview: boolean; alreadyReviewed: boolean }> {
    // 1. Check if already reviewed
    const { data: existingReview } = await (supabase.from as any)('customer_reviews')
      .select('id')
      .eq('order_id', orderId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (existingReview) {
      return { canReview: false, alreadyReviewed: true };
    }

    // 2. Check if order is completed
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, customer_id')
      .eq('id', orderId)
      .maybeSingle();

    if (!order || order.status !== 'completed' || order.customer_id !== customerId) {
      return { canReview: false, alreadyReviewed: false };
    }

    return { canReview: true, alreadyReviewed: false };
  },

  async createReview(review: {
    customerId: string;
    restaurantId: string;
    orderId: string;
    productId?: string;
    rating: number;
    reviewText?: string;
  }): Promise<CustomerReview> {
    const { data, error } = await (supabase.from as any)('customer_reviews')
      .insert({
        customer_id: review.customerId,
        restaurant_id: review.restaurantId,
        order_id: review.orderId,
        product_id: review.productId || null,
        rating: review.rating,
        review_text: review.reviewText || null,
      })
      .select()
      .single();

    if (error) throw error;
    const row = data as any;

    return {
      id: row.id,
      customerId: row.customer_id,
      restaurantId: row.restaurant_id,
      orderId: row.order_id,
      productId: row.product_id || undefined,
      rating: row.rating,
      reviewText: row.review_text || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async respondToReview(reviewId: string, reply: string): Promise<void> {
    const { error } = await (supabase.from as any)('customer_reviews')
      .update({
        owner_reply: reply.trim(),
        owner_reply_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (error) throw error;
  },

  async reportReview(reviewId: string, reason: string): Promise<void> {
    const { error } = await (supabase.from as any)('customer_reviews')
      .update({
        is_reported: true,
        report_reason: reason.trim(),
      })
      .eq('id', reviewId);

    if (error) throw error;
  },
};

export default customerService;
