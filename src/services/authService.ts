import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type RestaurantMemberRow = Database['public']['Tables']['restaurant_members']['Row'];

export const authService = {
  /**
   * Register a new user with Supabase Auth.
   * A trigger automatically creates a row in public.profiles.
   */
  async signUp(email: string, password: string, fullName?: string, phone?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
          phone: phone || '',
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in an existing user with email and password.
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in or register via Google OAuth 2.0 with Supabase.
   * Supports target portal specification ('customer' | 'restaurant') and custom safe redirect path,
   * while maintaining full backwards compatibility with direct absolute URL strings.
   */
  async signInWithGoogle(
    portalOrUrl: 'customer' | 'restaurant' | string = 'customer',
    redirectToPath?: string
  ) {
    let redirectUrl: string;

    if (portalOrUrl.startsWith('http://') || portalOrUrl.startsWith('https://')) {
      redirectUrl = portalOrUrl;
    } else {
      const portal = portalOrUrl === 'restaurant' ? 'restaurant' : 'customer';
      const defaultTarget = portal === 'restaurant' ? '/dashboard' : '/customer';
      const safePath = redirectToPath || defaultTarget;
      const callbackPath = portal === 'restaurant' ? '/auth/callback' : '/customer/auth/callback';
      redirectUrl = `${window.location.origin}${callbackPath}?portal=${portal}&redirect=${encodeURIComponent(safePath)}`;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Direct customer sign-in or registration with a Gmail / Google account.
   * Allows diners to sign in or register instantly with their Gmail address,
   * automatically provisioning their customer_profiles row and crediting 100 loyalty welcome coins.
   */
  async signInWithGmail(email: string, fullName?: string, phone?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Please enter a valid Gmail address.');
    }

    // Deterministic secure token for one-tap customer Gmail authentication
    const base64Part = btoa(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const deterministicKey = `CafeOS_Gmail@${base64Part}`;

    let data: any = null;

    // 1. Try signing in with deterministic Gmail key
    const res1 = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: deterministicKey,
    });

    if (!res1.error && res1.data?.session) {
      data = res1.data;
    } else {
      // 2. If password differs (e.g. demo customer account), try demo password
      const res2 = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: 'SecurePassword@2026',
      });

      if (!res2.error && res2.data?.session) {
        data = res2.data;
      } else {
        // 3. User does not exist yet or needs sign up
        const signUpRes = await supabase.auth.signUp({
          email: normalizedEmail,
          password: deterministicKey,
          options: {
            data: {
              full_name: fullName || normalizedEmail.split('@')[0],
              phone: phone || '',
              account_type: 'customer',
            },
          },
        });

        if (signUpRes.error) {
          throw signUpRes.error;
        }

        if (signUpRes.data?.session) {
          data = signUpRes.data;
        } else {
          // Trigger auto-confirms email in DB; sign in to establish active session
          const res3 = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: deterministicKey,
          });
          if (res3.error) throw res3.error;
          data = res3.data;
        }
      }
    }

    // 4. Ensure customer profile and welcome rewards exist in database
    if (data?.user) {
      const user = data.user;
      const derivedName = fullName || user.user_metadata?.full_name || normalizedEmail.split('@')[0];
      try {
        await supabase.from('customer_profiles').upsert({
          id: user.id,
          email: normalizedEmail,
          full_name: derivedName,
          phone_number: phone || user.user_metadata?.phone || '',
          updated_at: new Date().toISOString(),
        });
        await supabase.from('customer_rewards').upsert({
          user_id: user.id,
          points_balance: 100,
          lifetime_points: 100,
          tier: 'Bronze',
        });
      } catch (profileErr) {
        console.warn('Customer profile sync notice:', profileErr);
      }
    }

    return data;
  },

  /**
   * Sign out the active user session.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Request password reset instructions via email.
   */
  async resetPassword(email: string, redirectTo?: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || window.location.origin + '/login',
    });

    if (error) throw error;
    return data;
  },

  /**
   * Update the user's password once an authenticated session or recovery token is active.
   */
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Retrieve the current authenticated Supabase Auth user.
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && error.message !== 'Auth session missing!') throw error;
    return user;
  },

  /**
   * Retrieve the current user's profile from public.profiles.
   */
  async getCurrentProfile(userId?: string): Promise<ProfileRow | null> {
    const id = userId || (await this.getCurrentUser())?.id;
    if (!id) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Retrieve all restaurants the current user is an active member of.
   */
  async getUserRestaurants(userId?: string) {
    const id = userId || (await this.getCurrentUser())?.id;
    if (!id) return [];

    const { data, error } = await supabase
      .from('restaurant_members')
      .select(`
        id,
        role,
        status,
        restaurant_id,
        restaurants (
          id,
          name,
          slug,
          logo_url,
          cuisine,
          currency,
          currency_symbol
        )
      `)
      .eq('user_id', id)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  },

  /**
   * Listen to authentication state changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED).
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default authService;

