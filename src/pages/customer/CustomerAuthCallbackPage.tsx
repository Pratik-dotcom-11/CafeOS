import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation, NavLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { restaurantService } from '../../services/restaurantService';
import { CafeLogo } from '../../components/common/CafeLogo';
import { validateSafeRedirect } from '../../utils/securityUtils';
import {
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Building2,
  Utensils,
  LogOut,
  CheckCircle2
} from 'lucide-react';

export const CustomerAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine target portal: 'restaurant' vs 'customer'
  const portalParam = searchParams.get('portal');
  const targetPortal: 'restaurant' | 'customer' =
    portalParam === 'restaurant' || location.pathname === '/auth/callback'
      ? 'restaurant'
      : 'customer';

  const defaultFallback = targetPortal === 'restaurant' ? '/dashboard' : '/customer';
  const rawRedirect = searchParams.get('redirect');
  const safeRedirectTarget = validateSafeRedirect(
    rawRedirect,
    defaultFallback,
    targetPortal === 'customer' ? '/customer' : undefined
  );

  const [statusText, setStatusText] = useState('Verifying secure Google session...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noRestaurantMembershipUser, setNoRestaurantMembershipUser] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      // 1. Check for OAuth error query params in URL
      const oauthError = searchParams.get('error_description') || searchParams.get('error');
      if (oauthError) {
        if (isMounted) {
          setErrorMessage(decodeURIComponent(oauthError).replace(/\+/g, ' '));
        }
        return;
      }

      try {
        // 2. Exchange token / fetch established session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session || !session.user) {
          // Listen for onAuthStateChange in case hash parsing is still in progress
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_IN' && newSession?.user) {
              await processPortalAuthentication(newSession.user);
            }
          });

          // Timeout fallback if no session received
          setTimeout(() => {
            if (isMounted && !session?.user) {
              setErrorMessage('Authentication session timed out or was cancelled. Please try signing in again.');
            }
          }, 6000);

          return () => subscription.unsubscribe();
        }

        await processPortalAuthentication(session.user);
      } catch (err: any) {
        console.error('OAuth callback processing error:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to complete Google authentication.');
        }
      }
    }

    async function processPortalAuthentication(user: any) {
      if (!isMounted) return;

      if (targetPortal === 'restaurant') {
        // ==========================================
        // RESTAURANT PORTAL AUTHENTICATION GATE
        // ==========================================
        setStatusText('Verifying restaurant staff memberships and roles...');

        try {
          // Check backend restaurant membership
          const [memberRows, profile] = await Promise.all([
            authService.getUserRestaurants(user.id),
            authService.getCurrentProfile(user.id),
          ]);

          const isSuperAdmin = Boolean(profile?.is_super_admin);
          const hasMembership = Array.isArray(memberRows) && memberRows.length > 0;

          if (hasMembership || isSuperAdmin) {
            // Authorized restaurant staff member
            if (hasMembership) {
              const activeRestaurant = memberRows[0].restaurants;
              if (activeRestaurant) {
                localStorage.setItem('cafeos_active_workspace_id', activeRestaurant.id);
              }
            }
            navigate(safeRedirectTarget, { replace: true });
          } else {
            // User authenticated with Google but has NO restaurant staff membership
            if (isMounted) {
              setNoRestaurantMembershipUser(user);
            }
          }
        } catch (memberErr: any) {
          console.error('Error verifying restaurant membership:', memberErr);
          if (isMounted) {
            setNoRestaurantMembershipUser(user);
          }
        }
      } else {
        // ==========================================
        // CUSTOMER PORTAL AUTHENTICATION GATE
        // ==========================================
        setStatusText('Syncing diner profile, preferences and coin rewards...');

        try {
          // Retrieve or create customer profile
          const { data: profile } = await supabase
            .from('customer_profiles')
            .select('id, full_name, phone_number')
            .eq('id', user.id)
            .maybeSingle();

          const fullName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Valued Diner';
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
          const phone = profile?.phone_number || user.user_metadata?.phone || null;

          if (!profile) {
            await supabase.from('customer_profiles').upsert({
              id: user.id,
              email: user.email,
              full_name: fullName,
              phone_number: phone,
              profile_image: avatarUrl,
              updated_at: new Date().toISOString(),
            });

            // Initialize welcome loyalty rewards if not present
            try {
              await supabase.from('customer_rewards').upsert({
                user_id: user.id,
                points_balance: 100,
                lifetime_points: 100,
                tier: 'Bronze',
              });
            } catch (rewardErr) {
              console.warn('Rewards initialization notice:', rewardErr);
            }
          }

          // If phone number is missing, prompt to complete contact details for order delivery updates
          if (!phone) {
            navigate(`/customer/onboarding?redirect=${encodeURIComponent(safeRedirectTarget)}`, { replace: true });
          } else {
            navigate(safeRedirectTarget, { replace: true });
          }
        } catch (profileErr) {
          console.warn('Customer profile sync notice:', profileErr);
          navigate(safeRedirectTarget, { replace: true });
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, safeRedirectTarget, searchParams, targetPortal]);

  // Handle Sign Out from Callback Gate
  const handleSwitchAccount = async () => {
    await supabase.auth.signOut();
    navigate(targetPortal === 'restaurant' ? '/login' : '/customer/login');
  };

  // 1. Error Display View
  if (errorMessage) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-cafe-border p-8 shadow-warm-lg text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-cafe-primary tracking-tight">Authentication Notice</h2>
            <p className="text-xs text-cafe-muted mt-2 leading-relaxed">{errorMessage}</p>
          </div>
          <button
            onClick={() => navigate(targetPortal === 'restaurant' ? '/login' : '/customer/login')}
            className="w-full py-3 rounded-xl bg-cafe-primary hover:bg-cafe-accent text-white text-xs font-bold shadow-warm transition-all flex items-center justify-center gap-2"
          >
            <span>Return to {targetPortal === 'restaurant' ? 'Staff Login' : 'Diner Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Strict Role Segregation Notice: User authenticated with Google but has no restaurant membership
  if (noRestaurantMembershipUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-cafe-border p-8 shadow-warm-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              Restaurant Membership Required
            </span>
            <h2 className="text-xl font-black text-cafe-primary tracking-tight">
              No Restaurant Membership Found
            </h2>
            <p className="text-xs text-cafe-muted leading-relaxed max-w-md mx-auto">
              You authenticated successfully with Google as{' '}
              <strong className="text-cafe-primary">{noRestaurantMembershipUser.email}</strong>.
              However, this account does not currently hold active staff or owner membership in any restaurant.
            </p>
          </div>

          {/* Action Options */}
          <div className="space-y-3 pt-2">
            <NavLink
              to="/onboarding"
              className="w-full py-3 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black tracking-wide shadow-warm transition-all flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Register a New Restaurant Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>

            <NavLink
              to="/customer"
              className="w-full py-3 rounded-xl bg-white hover:bg-stone-50 border border-cafe-border text-cafe-primary text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Utensils className="w-4 h-4 text-cafe-accent" />
              <span>Continue to Diner Customer Portal</span>
            </NavLink>

            <button
              type="button"
              onClick={handleSwitchAccount}
              className="w-full py-2.5 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out & Use Another Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Loading Animation View
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-cafe-border p-8 shadow-warm-lg text-center space-y-6">
        <div className="flex justify-center animate-bounce">
          <CafeLogo size={52} />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>CaféOS Secure OAuth Gateway</span>
          </div>
          <h2 className="text-lg font-black text-cafe-primary tracking-tight">
            {statusText}
          </h2>
          <p className="text-xs text-cafe-muted">
            Establishing your encrypted session. You will be redirected momentarily.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuthCallbackPage;
