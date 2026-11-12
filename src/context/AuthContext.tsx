import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService, type ProfileRow } from '../services/authService';
import { restaurantService } from '../services/restaurantService';

export type UserRole = 'owner' | 'manager' | 'cashier' | 'kitchen' | 'waiter';

export interface UserWorkspace {
  restaurant_id: string;
  restaurant_name: string;
  restaurant_slug: string;
  restaurant_cuisine: string;
  restaurant_logo_url: string;
  currency: string;
  currency_symbol: string;
  tax_percentage: number;
  user_role: UserRole;
  member_status: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  workspaces: UserWorkspace[];
  activeWorkspace: UserWorkspace | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: (portalOrUrl?: 'customer' | 'restaurant' | string, redirectToPath?: string) => Promise<any>;
  signInWithGmail: (email: string, fullName?: string, phone?: string, portal?: 'customer' | 'restaurant') => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  switchWorkspace: (restaurantId: string) => void;
  refreshWorkspaces: () => Promise<UserWorkspace[]>;
  refreshProfile: () => Promise<ProfileRow | null>;
  canAccess: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_WORKSPACE_KEY = 'cafeos_active_workspace_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [workspaces, setWorkspaces] = useState<UserWorkspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<UserWorkspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch workspaces for currently authenticated user
  const loadWorkspaces = useCallback(async (userId?: string): Promise<UserWorkspace[]> => {
    try {
      // 1. Try RPC get_user_workspaces
      const rpcResult = await restaurantService.getUserWorkspaces();
      if (rpcResult && Array.isArray(rpcResult) && rpcResult.length > 0) {
        setWorkspaces(rpcResult);
        return rpcResult;
      }

      // 2. Fallback to direct query on restaurant_members + restaurants
      const memberRows = await authService.getUserRestaurants(userId);
      if (memberRows && memberRows.length > 0) {
        const mapped: UserWorkspace[] = memberRows
          .filter((m: any) => m.restaurants)
          .map((m: any) => ({
            restaurant_id: m.restaurant_id,
            restaurant_name: m.restaurants.name,
            restaurant_slug: m.restaurants.slug,
            restaurant_cuisine: m.restaurants.cuisine || 'Indian Specialty',
            restaurant_logo_url: m.restaurants.logo_url || '',
            currency: m.restaurants.currency || 'INR',
            currency_symbol: m.restaurants.currency_symbol || '₹',
            tax_percentage: 5.0,
            user_role: m.role as UserRole,
            member_status: m.status,
            is_active: true,
          }));
        setWorkspaces(mapped);
        return mapped;
      }

      setWorkspaces([]);
      return [];
    } catch (err) {
      console.warn('Could not load user workspaces:', err);
      return [];
    }
  }, []);

  // Sync active workspace from available list and localStorage
  const syncActiveWorkspace = useCallback((availableWorkspaces: UserWorkspace[]) => {
    if (availableWorkspaces.length === 0) {
      setActiveWorkspace(null);
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      return;
    }

    const savedId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    const matched = availableWorkspaces.find((w) => w.restaurant_id === savedId);

    if (matched) {
      setActiveWorkspace(matched);
    } else {
      // Prefer the flagship workspace with full historical records
      const flagship = availableWorkspaces.find(
        (w) => w.restaurant_id === '22222222-2222-2222-2222-222222222201' || w.restaurant_slug === 'artisan-brew'
      );
      const chosen = flagship || availableWorkspaces[0];
      setActiveWorkspace(chosen);
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, chosen.restaurant_id);
    }
  }, []);

  // Fetch user profile
  const loadProfile = useCallback(async (userId?: string): Promise<ProfileRow | null> => {
    try {
      const p = await authService.getCurrentProfile(userId);
      setProfile(p);
      return p;
    } catch (err) {
      console.warn('Could not load user profile:', err);
      return null;
    }
  }, []);

  // Initial bootstrap and session listener
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const [loadedProfile, loadedWorkspaces] = await Promise.all([
            loadProfile(initialSession.user.id),
            loadWorkspaces(initialSession.user.id),
          ]);
          if (isMounted) {
            syncActiveWorkspace(loadedWorkspaces);
          }
        } else {
          setProfile(null);
          setWorkspaces([]);
          setActiveWorkspace(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (newSession?.user) {
          const [, loadedWorkspaces] = await Promise.all([
            loadProfile(newSession.user.id),
            loadWorkspaces(newSession.user.id),
          ]);
          syncActiveWorkspace(loadedWorkspaces);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setWorkspaces([]);
        setActiveWorkspace(null);
        localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, loadWorkspaces, syncActiveWorkspace]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authService.signIn(email, password);
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadProfile(data.user.id);
        const ws = await loadWorkspaces(data.user.id);
        syncActiveWorkspace(ws);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up
  const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
    setIsLoading(true);
    try {
      const data = await authService.signUp(email, password, fullName, phone);
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        if (data.session) {
          await loadProfile(data.user.id);
          const ws = await loadWorkspaces(data.user.id);
          syncActiveWorkspace(ws);
        }
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign In with Google OAuth (Supports portal separation)
  const signInWithGoogle = async (portalOrUrl?: 'customer' | 'restaurant' | string, redirectToPath?: string) => {
    return authService.signInWithGoogle(portalOrUrl, redirectToPath);
  };

  // Sign In or Register directly with Gmail account (Customer & Restaurant Portals)
  const signInWithGmail = async (email: string, fullName?: string, phone?: string, portal: 'customer' | 'restaurant' = 'customer') => {
    setIsLoading(true);
    try {
      const data = await authService.signInWithGmail(email, fullName, phone, portal);
      if (data?.session) {
        setSession(data.session);
        setUser(data.user);
        const [_, ws] = await Promise.all([
          loadProfile(data.user.id),
          loadWorkspaces(data.user.id),
        ]);
        if (ws && Array.isArray(ws)) {
          syncActiveWorkspace(ws);
        }
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setWorkspaces([]);
      setActiveWorkspace(null);
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    return authService.resetPassword(email);
  };

  // Switch Active Workspace
  const switchWorkspace = (restaurantId: string) => {
    const target = workspaces.find((w) => w.restaurant_id === restaurantId);
    if (target) {
      setActiveWorkspace(target);
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, target.restaurant_id);
    }
  };

  // Refresh workspaces
  const refreshWorkspaces = async (): Promise<UserWorkspace[]> => {
    const ws = await loadWorkspaces(user?.id);
    syncActiveWorkspace(ws);
    return ws;
  };

  // Refresh profile
  const refreshProfile = async (): Promise<ProfileRow | null> => {
    return loadProfile(user?.id);
  };

  // Check role-based permission for current workspace
  const canAccess = (allowedRoles: UserRole[]): boolean => {
    if (!activeWorkspace) return false;
    return allowedRoles.includes(activeWorkspace.user_role);
  };

  const userRole = activeWorkspace?.user_role ?? null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        workspaces,
        activeWorkspace,
        userRole,
        isLoading,
        isAuthenticated,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithGmail,
        signOut,
        resetPassword,
        switchWorkspace,
        refreshWorkspaces,
        refreshProfile,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

