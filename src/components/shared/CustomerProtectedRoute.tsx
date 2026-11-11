import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateSafeRedirect } from '../../utils/securityUtils';
import { Sparkles } from 'lucide-react';

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

export const CustomerProtectedRoute: React.FC<CustomerProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cafe-accent flex items-center justify-center text-white shadow-warm animate-bounce">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs font-bold text-cafe-muted">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const safeTarget = validateSafeRedirect(location.pathname + location.search, '/customer');
    return <Navigate to={`/customer/login?redirect=${encodeURIComponent(safeTarget)}`} replace />;
  }

  return <>{children}</>;
};

export default CustomerProtectedRoute;

