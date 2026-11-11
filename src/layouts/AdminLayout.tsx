import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  QrCode,
  ChefHat,
  Boxes,
  Grid,
  TrendingUp,
  Receipt,
  Users2,
  UserCheck,
  Settings,
  Bell,
  Search,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  ShieldAlert,
  Sparkles,
  LogOut,
  HelpCircle,
  Store,
  Check,
} from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { CafeLogo } from '../components/common/CafeLogo';

export const AdminLayout: React.FC = () => {
  const {
    restaurant,
    soundEnabled,
    toggleSound,
    isDarkMode,
    toggleDarkMode,
    orders,
    addToast
  } = useCafe();

  const {
    user,
    profile,
    workspaces,
    activeWorkspace,
    userRole,
    switchWorkspace,
    signOut
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'accepted').length;

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Live POS Order', to: '/dashboard/pos', icon: ShoppingBag, badge: 'Reference' },
    { label: 'Order History', to: '/dashboard/orders', icon: UtensilsCrossed, count: pendingOrdersCount },
    { label: 'Menu Management', to: '/dashboard/menu', icon: Grid },
    { label: 'Table & QR Menu', to: '/dashboard/qr-code', icon: QrCode },
    { label: 'Kitchen (KDS)', to: '/kitchen', icon: ChefHat, isExternalView: true },
    { label: 'Inventory Stock', to: '/dashboard/inventory', icon: Boxes },
    { label: 'Floor Tables', to: '/dashboard/tables', icon: Grid },
    { label: 'Sales Analytics', to: '/dashboard/analytics', icon: TrendingUp },
    { label: 'Billing & Invoices', to: '/dashboard/billing', icon: Receipt },
    { label: 'Staff & Roles', to: '/dashboard/employees', icon: Users2 },
    { label: 'Customers & CRM', to: '/dashboard/customers', icon: UserCheck },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    addToast('Global Search', `Filtered views for "${searchQuery}"`, 'info');
    navigate(`/dashboard/orders?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className={`min-h-screen bg-cafe-light dark:bg-cafe-dark transition-colors duration-200 flex ${isDarkMode ? 'dark' : ''}`}>
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-cafe-surface-dark border-r border-cafe-border dark:border-cafe-border-dark flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Workspace Switcher */}
          <div className="p-5 border-b border-cafe-border/70 dark:border-cafe-border-dark flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CafeLogo size={38} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-cafe-primary dark:text-cafe-cream">
                    Café<span className="text-cafe-accent">OS</span>
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cafe-accent/15 text-cafe-accent">
                    SaaS
                  </span>
                </div>
                <p className="text-xs text-cafe-muted truncate max-w-[130px]">
                  {restaurant.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-cafe-muted hover:bg-cafe-sand/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-cafe-muted/80">
              Operations
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive: navActive }) => {
                    const active = item.exact ? location.pathname === item.to : navActive;
                    return `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      active
                        ? 'bg-cafe-primary text-white shadow-warm dark:bg-cafe-accent dark:text-white'
                        : 'text-cafe-primary/80 dark:text-stone-300 hover:bg-cafe-cream/60 dark:hover:bg-stone-800/60'
                    }`;
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-cafe-accent text-white animate-pulse">
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            <div className="pt-4 px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-cafe-muted/80">
              Platforms
            </div>

            <NavLink
              to="/super-admin"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4" />
                <span>Super Admin</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-purple-200 text-purple-900">
                HQ
              </span>
            </NavLink>

            <a
              href={`/menu/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4" />
                <span>Customer QR Menu</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 font-semibold rounded bg-emerald-200 text-emerald-900">
                Live
              </span>
            </a>

            <NavLink
              to="/customer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4" />
                <span>Customer Portal</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-amber-200 text-amber-900">
                Dine
              </span>
            </NavLink>
          </nav>

          {/* Quick Support / Version Footer */}
          <div className="p-4 border-t border-cafe-border dark:border-cafe-border-dark bg-cafe-light/60 dark:bg-stone-900/40">
            <div className="bg-cafe-cream/80 dark:bg-stone-800/80 p-3 rounded-xl border border-cafe-border/60">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-cafe-accent" />
                <span className="text-xs font-bold text-cafe-primary dark:text-cafe-cream">
                  CafeOS Pro Tier
                </span>
              </div>
              <p className="text-[11px] text-cafe-muted leading-tight mb-2">
                All POS terminals & real-time KDS active.
              </p>
              <NavLink
                to="/dashboard/settings"
                className="text-[11px] font-semibold text-cafe-accent hover:underline inline-flex items-center gap-1"
              >
                Plan Details &rarr;
              </NavLink>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white dark:bg-cafe-surface-dark border-b border-cafe-border dark:border-cafe-border-dark px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-cafe-primary dark:text-cafe-cream hover:bg-cafe-sand/50"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search form */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 text-cafe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, dishes, customers, tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-cafe-light dark:bg-stone-800/70 border border-cafe-border dark:border-cafe-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-cafe-accent/40 focus:border-cafe-accent text-cafe-primary dark:text-cafe-cream placeholder-cafe-muted"
              />
            </form>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Restaurant Workspace Switcher (Multi-Tenant) */}
            <div className="relative">
              <button
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cafe-border dark:border-cafe-border-dark bg-cafe-sand/40 dark:bg-stone-800 hover:bg-cafe-sand/70 transition-all text-left btn-press"
                title="Switch Restaurant Workspace"
              >
                <div className="w-6 h-6 rounded-lg bg-cafe-accent text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold leading-tight text-cafe-primary dark:text-cafe-cream truncate max-w-[130px]">
                      {activeWorkspace?.restaurant_name || restaurant.name}
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {userRole || 'Owner'}
                    </span>
                  </div>
                  <p className="text-[10px] text-cafe-muted truncate max-w-[130px]">
                    {workspaces.length > 1 ? `${workspaces.length} Branches • Switch` : 'Active Branch'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-cafe-muted" />
              </button>

              {workspaceMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-cafe-surface-dark rounded-2xl shadow-warm-lg border border-cafe-border dark:border-cafe-border-dark p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-cafe-border dark:border-cafe-border-dark flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-cafe-muted">
                      Your Restaurant Workspaces
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Multi-Tenant
                    </span>
                  </div>

                  <div className="py-2 space-y-1 max-h-60 overflow-y-auto">
                    {workspaces.length > 0 ? (
                      workspaces.map((ws) => {
                        const isCurrent = ws.restaurant_id === (activeWorkspace?.restaurant_id || restaurant.id);
                        return (
                          <button
                            key={ws.restaurant_id}
                            onClick={() => {
                              switchWorkspace(ws.restaurant_id);
                              setWorkspaceMenuOpen(false);
                              addToast('Workspace Switched', `Active branch set to ${ws.restaurant_name}`, 'success');
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all text-xs ${
                              isCurrent
                                ? 'bg-cafe-primary text-white font-bold shadow-sm dark:bg-cafe-accent'
                                : 'hover:bg-cafe-sand/50 text-cafe-primary dark:text-cafe-cream font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Store className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-cafe-accent'}`} />
                              <div className="truncate">
                                <p className="truncate font-bold">{ws.restaurant_name}</p>
                                <p className={`text-[10px] truncate ${isCurrent ? 'text-white/80' : 'text-cafe-muted'}`}>
                                  {ws.restaurant_cuisine} • {ws.currency_symbol} {ws.currency}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold shrink-0 ${
                              isCurrent ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-stone-800 text-cafe-muted'
                            }`}>
                              {ws.user_role}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-xs text-cafe-muted">
                        <p className="font-semibold text-cafe-primary dark:text-stone-200">{restaurant.name}</p>
                        <p className="text-[10px] mt-0.5">{restaurant.cuisine} • Single Branch</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-cafe-border dark:border-cafe-border-dark">
                    <NavLink
                      to="/onboarding"
                      onClick={() => setWorkspaceMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-cafe-sand/60 dark:bg-stone-800 text-cafe-primary dark:text-cafe-cream hover:bg-cafe-sand transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cafe-accent" />
                      <span>+ Register New Restaurant</span>
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Kitchen & POS Chimes Enabled' : 'Chimes Muted'}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-amber-50 text-cafe-accent border-amber-200 dark:bg-amber-950/40 dark:border-amber-900'
                  : 'bg-stone-100 text-stone-400 border-stone-200 dark:bg-stone-800 dark:border-stone-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              title="Toggle Theme"
              className="p-2 rounded-xl border border-cafe-border dark:border-cafe-border-dark bg-cafe-light dark:bg-stone-800 text-cafe-primary dark:text-cafe-cream hover:bg-cafe-sand/40 transition-colors btn-press"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl border border-cafe-border dark:border-cafe-border-dark bg-cafe-light dark:bg-stone-800 text-cafe-primary dark:text-cafe-cream hover:bg-cafe-sand/40 relative transition-colors btn-press"
              >
                <Bell className="w-4 h-4" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cafe-accent rounded-full ring-2 ring-white dark:ring-cafe-surface-dark" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-cafe-surface-dark rounded-2xl shadow-warm-lg border border-cafe-border dark:border-cafe-border-dark p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
                    <span className="font-bold text-sm text-cafe-primary dark:text-cafe-cream">
                      Live Kitchen Activity
                    </span>
                    <span className="text-xs text-cafe-accent font-semibold">
                      {pendingOrdersCount} Active
                    </span>
                  </div>
                  <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                    {orders.slice(0, 4).map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate('/dashboard/orders');
                        }}
                        className="p-2 rounded-xl hover:bg-cafe-sand/40 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-cafe-primary dark:text-cafe-cream">
                            {ord.orderNumber} - {ord.customerName}
                          </p>
                          <p className="text-cafe-muted text-[11px]">
                            {ord.items.length} items • {formatCurrency(ord.total, restaurant.currencySymbol)}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 uppercase">
                          {ord.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <NavLink
                    to="/dashboard/orders"
                    onClick={() => setNotificationsOpen(false)}
                    className="block text-center pt-2 text-xs font-semibold text-cafe-accent hover:underline border-t border-cafe-border dark:border-cafe-border-dark"
                  >
                    View All Orders &rarr;
                  </NavLink>
                </div>
              )}
            </div>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-cafe-border dark:border-cafe-border-dark hover:bg-cafe-sand/40 transition-colors"
              >
                <img
                  src={profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                  alt={profile?.full_name || "User Avatar"}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold leading-tight text-cafe-primary dark:text-cafe-cream truncate max-w-[120px]">
                    {profile?.full_name || user?.email?.split('@')[0] || 'Rahul Sharma'}
                  </p>
                  <p className="text-[10px] text-cafe-muted capitalize">{userRole || 'Owner'}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-cafe-muted" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-cafe-surface-dark rounded-2xl shadow-warm-lg border border-cafe-border dark:border-cafe-border-dark p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-cafe-border dark:border-cafe-border-dark mb-1">
                    <p className="text-xs font-bold text-cafe-primary dark:text-cafe-cream truncate">
                      {activeWorkspace?.restaurant_name || restaurant.name}
                    </p>
                    <p className="text-[11px] text-cafe-muted truncate">
                      {user?.email || 'manager@cafeos.in'}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                      Role: {userRole || 'Owner'}
                    </span>
                  </div>
                  <NavLink
                    to="/dashboard/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-cafe-sand/50 text-cafe-primary dark:text-cafe-cream"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Restaurant Settings</span>
                  </NavLink>
                  <NavLink
                    to="/dashboard/employees"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-cafe-sand/50 text-cafe-primary dark:text-cafe-cream"
                  >
                    <Users2 className="w-3.5 h-3.5" />
                    <span>Manage Staff & Roles</span>
                  </NavLink>
                  <NavLink
                    to="/onboarding"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-cafe-sand/50 text-cafe-primary dark:text-cafe-cream"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cafe-accent" />
                    <span>+ Add New Restaurant</span>
                  </NavLink>
                  <div className="my-1 border-t border-cafe-border dark:border-cafe-border-dark" />
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await signOut();
                      addToast('Logged Out', 'Signed out of CafeOS session', 'info');
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Viewport WITH SMOOTH ANIMATION */}
        <main className="flex-1 overflow-y-auto">
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

