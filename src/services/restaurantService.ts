import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type RestaurantRow = Database['public']['Tables']['restaurants']['Row'];
export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update'];
export type RestaurantSettingsRow = Database['public']['Tables']['restaurant_settings']['Row'];
export type RestaurantSettingsUpdate = Database['public']['Tables']['restaurant_settings']['Update'];

export const restaurantService = {
  /**
   * Retrieve public or tenant restaurant details by URL slug (e.g. for QR Menu).
   */
  async getRestaurantBySlug(slug: string): Promise<RestaurantRow | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Retrieve all active public restaurants for customer discovery directory.
   */
  async getPublicRestaurants(): Promise<RestaurantRow[]> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (error) {
      console.warn('Could not fetch public restaurants:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Retrieve restaurant by UUID or slug.
   */
  async getRestaurantById(id: string): Promise<RestaurantRow | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Update restaurant profile details (Owner/Manager role required).
   */
  async updateRestaurant(id: string, updates: RestaurantUpdate): Promise<RestaurantRow> {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Retrieve team members / staff for a given restaurant.
   */
  async getRestaurantMembers(restaurantId: string) {
    const { data, error } = await supabase
      .from('restaurant_members')
      .select(`
        id,
        restaurant_id,
        user_id,
        role,
        status,
        created_at,
        profiles (
          id,
          email,
          full_name,
          phone,
          avatar_url
        )
      `)
      .eq('restaurant_id', restaurantId);

    if (error) throw error;
    return data;
  },

  /**
   * Update member role.
   */
  async updateMemberRole(
    memberId: string,
    role: Database['public']['Enums']['restaurant_role']
  ) {
    const { data, error } = await supabase
      .from('restaurant_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove member from restaurant.
   */
  async removeMember(memberId: string) {
    const { error } = await supabase
      .from('restaurant_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
    return true;
  },

  /**
   * Retrieve system and hardware settings for a restaurant.
   */
  async getRestaurantSettings(restaurantId: string): Promise<RestaurantSettingsRow | null> {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Update restaurant settings (sound, receipt header, auto-accept, KDS chime).
   */
  async updateRestaurantSettings(
    restaurantId: string,
    settings: RestaurantSettingsUpdate
  ): Promise<RestaurantSettingsRow> {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .upsert({
        restaurant_id: restaurantId,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Initialize a new restaurant workspace and assign the authenticated caller as owner (RPC).
   */
  async createRestaurantWorkspace(params: {
    name: string;
    slug: string;
    cuisine?: string;
    logo_url?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    currency?: string;
    currency_symbol?: string;
    tax_percentage?: number;
    tax_number?: string;
    open_time?: string;
    close_time?: string;
  }) {
    const { data, error } = await (supabase.rpc as any)('create_restaurant_workspace', {
      p_name: params.name,
      p_slug: params.slug,
      p_cuisine: params.cuisine || 'Indian Specialty & Fine Dining',
      p_logo_url: params.logo_url || '',
      p_address: params.address || '',
      p_city: params.city || 'Mumbai',
      p_state: params.state || 'Maharashtra',
      p_postal_code: params.postal_code || '',
      p_country: params.country || 'India',
      p_phone: params.phone || '',
      p_email: params.email || '',
      p_currency: params.currency || 'INR',
      p_currency_symbol: params.currency_symbol || '₹',
      p_tax_percentage: params.tax_percentage || 5.0,
      p_tax_number: params.tax_number || '',
      p_open_time: params.open_time || '09:00',
      p_close_time: params.close_time || '23:00',
    });

    if (error) throw error;
    return data;
  },

  /**
   * Retrieve all restaurants the current authenticated user belongs to via RPC.
   */
  async getUserWorkspaces() {
    const { data, error } = await (supabase.rpc as any)('get_user_workspaces');
    if (error) throw error;
    return data;
  },

  /**
   * Retrieve subscription plan details and status for restaurant.
   */
  async getSubscription(restaurantId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        restaurant_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        subscription_plans (
          id,
          name,
          slug,
          price_monthly,
          price_yearly,
          max_terminals,
          max_orders_per_month,
          has_kds,
          has_inventory,
          has_analytics,
          has_loyalty
        )
      `)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};

export default restaurantService;

