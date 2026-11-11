import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Building2,
  Users,
  CreditCard,
  IndianRupee,
  Settings,
  HelpCircle,
  ArrowLeft,
  Activity,
  Menu,
  X,
  Sparkles,
  Server,
  Lock,
  LogOut,
  AlertCircle,
  Layers,
  MessageSquare
} from 'lucide-react';
import { ToastContainer } from '../components/shared/ToastContainer';
import { supabase } from '../lib/supabase';
import { superAdminService, PlatformOverviewMetrics } from '../services/superAdminService';

export const SuperAdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication & Authorization state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Login form state for privileged gate
  const [loginEmail, setLoginEmail] = useState('superadmin@cafeos.io');
  const [loginPassword, setLoginPassword] = useState('CafeOS@SuperAdmin2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Live platform metrics
  const [metrics, setMetrics] = useState<PlatformOverviewMetrics | null>(null);

  const checkPrivilege = async () => {
    try {
      setCheckingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthorized(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, is_super_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.is_super_admin) {
        setIsAuthorized(true);
        setAdminUser({ ...user, profile });
        const ov = await superAdminService.getPlatformOverview();
        setMetrics(ov);
      } else {
        setIsAuthorized(false);
      }
    } catch (err) {
      console.error('Auth verification error:', err);
      setIsAuthorized(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkPrivilege();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid administrator credentials');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin, full_name')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile || !profile.is_super_admin) {
        await supabase.auth.signOut();
        throw new Error('Access Denied: This account does not possess Platform Super Administrator authorization.');
      }

      setIsAuthorized(true);
      setAdminUser({ ...data.user, profile });
      const ov = await superAdminService.getPlatformOverview();
      setMetrics(ov);
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthorized(false);
    setAdminUser(null);
    navigate('/login');
  };

  const navItems = [
    { label: 'Platform Cockpit', to: '/super-admin', icon: Activity, exact: true },
    { label: 'Restaurant Tenants', to: '/super-admin/restaurants', icon: Building2 },
    { label: 'Subscription Tiers', to: '/super-admin/subscriptions', icon: CreditCard },
    { label: 'Support Desk', to: '/super-admin/support', icon: MessageSquare },
    { label: 'Platform Users', to: '/super-admin/users', icon: Users },
    { label: 'Global Settings & Audit', to: '/super-admin/settings', icon: Settings },
  ];

  // 1. Loading check
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-wider">Verifying Super Admin Credentials...</p>
      </div>
    );
  }

  // 2. Unauthenticated / Unauthorized Super Admin Gate
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
        <ToastContainer />
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto shadow-lg">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              CaféOS Platform Master Console
            </h1>
            <p className="text-xs text-slate-400">
              Restricted Area: Server-side Super Administrator privilege is required.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Quick Demo Credentials Info Banner */}
          <div className="mb-4 p-3 rounded-2xl bg-purple-950/40 border border-purple-800/60 text-xs text-purple-200 flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Super Admin Master Credentials</span>
              </p>
              <p className="text-[11px] text-purple-300/80 mt-0.5 font-mono">
                superadmin@cafeos.io • CafeOS@SuperAdmin2026
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoginEmail('superadmin@cafeos.io');
                setLoginPassword('CafeOS@SuperAdmin2026');
                setLoginError(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-600/70 hover:bg-purple-600 text-[10px] font-bold text-white transition-colors shrink-0"
            >
              Fill Credentials
            </button>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Super Admin Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Master Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all mt-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoggingIn ? 'Verifying Authorization...' : 'Authorize Master Session'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Restaurant POS</span>
            </button>
            <span className="text-[10px] text-slate-500">ap-south-1 • Protected</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Super Admin Layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      <ToastContainer />

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Super Admin Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    Café<span className="text-purple-400">OS</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase">
                    HQ
                  </span>
                </div>
                <p className="text-xs text-slate-400">Multi-Tenant Console</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              SaaS Administration
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="pt-6 px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Platform Switcher
            </div>
            <NavLink
              to="/dashboard"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Restaurant View</span>
            </NavLink>
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-3">
            <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">Monthly MRR</span>
                <span className="font-bold text-emerald-400">
                  ₹{(metrics?.mrr || 52993).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full w-4/5 rounded-full" />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-400" />
                <span>Cluster operational ({metrics?.uptimePct || 99.98}%)</span>
              </p>
            </div>

            <button
              onClick={handleAdminSignOut}
              className="w-full py-2 px-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>End Master Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-slate-300">
              Platform Master Console • Global SaaS Cloud
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{metrics?.activeRestaurants || 7} Tenants Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs text-white">
                HQ
              </div>
              <span className="text-xs font-semibold text-slate-300 hidden md:inline">
                {adminUser?.profile?.full_name || 'Super Administrator'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
