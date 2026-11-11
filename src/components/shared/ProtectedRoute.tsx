import React from 'react';
import { Navigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import { ShieldAlert, Sparkles, Building2, Utensils } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireWorkspace?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireWorkspace = true,
}) => {
  const { user, isAuthenticated, isLoading, activeWorkspace, workspaces, canAccess, userRole, profile } = useAuth();
  const location = useLocation();

  // 1. Loading state with brand styling
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cafe-light dark:bg-cafe-dark flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-cafe-accent flex items-center justify-center text-white shadow-warm">
            <Sparkles className="w-7 h-7 animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
              Authenticating CaféOS
            </h2>
            <p className="text-xs text-cafe-muted mt-1">Verifying encrypted session & restaurant workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated check
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Check restaurant workspace presence (Customers cannot access restaurant staff routes)
  if (requireWorkspace && workspaces.length === 0 && !profile?.is_super_admin) {
    return (
      <div className="min-h-screen bg-cafe-light dark:bg-cafe-dark flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-cafe-border dark:border-stone-800 p-8 shadow-warm-lg space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              Restaurant Membership Required
            </span>
            <h2 className="text-xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
              Access Restricted
            </h2>
            <p className="text-xs text-cafe-muted leading-relaxed">
              You are signed in as <strong className="text-cafe-primary dark:text-white">{user?.email}</strong>. However, this account does not have active staff or manager membership in any restaurant on CaféOS. Customer accounts cannot access the restaurant backoffice.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <NavLink
              to="/customer"
              className="w-full py-3 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black shadow-warm transition-all flex items-center justify-center gap-2"
            >
              <Utensils className="w-4 h-4" />
              <span>Go to Customer Portal</span>
            </NavLink>
            <NavLink
              to="/onboarding"
              className="w-full py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-cafe-border dark:border-stone-700 text-cafe-primary dark:text-stone-200 hover:border-cafe-accent text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Register a New Restaurant</span>
            </NavLink>
            <NavLink
              to="/login"
              className="w-full py-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 text-xs font-medium block"
            >
              Sign in with a different staff account &rarr;
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  // 4. Role-based check
  if (allowedRoles && allowedRoles.length > 0 && !canAccess(allowedRoles)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-cafe-primary dark:text-cafe-cream">
          Access Restricted
        </h2>
        <p className="text-xs text-cafe-muted mt-2 max-w-sm">
          Your active role (<strong className="capitalize">{userRole || 'Member'}</strong>) in {activeWorkspace?.restaurant_name} does not have permission to view this module.
        </p>
        <p className="text-[11px] text-cafe-muted/70 mt-1">
          Required roles: {allowedRoles.join(', ')}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <a
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold transition-all shadow-warm"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

