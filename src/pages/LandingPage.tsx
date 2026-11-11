import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChefHat,
  ShoppingBag,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Receipt,
  Boxes,
  Users2,
  Coffee,
  Star,
  Zap,
  IndianRupee,
  Utensils,
  Smartphone,
  ChevronRight,
  Clock,
  Flame,
  Check,
  Store,
  HelpCircle,
  Play,
  Award,
  Globe,
  LogOut,
  User,
  Menu,
  X,
  Lock
} from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { CafeLogo } from '../components/common/CafeLogo';
import { SubscriptionCheckoutModal, PricingPlanData } from '../components/payment/SubscriptionCheckoutModal';

// Animation variants for smooth scroll-triggered reveals and micro-interactions
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export const LandingPage: React.FC = () => {
  const { restaurant } = useCafe();
  const { user, profile, isAuthenticated, signOut, workspaces } = useAuth();
  const [activeTab, setActiveTab] = useState<'pos' | 'qr' | 'kds' | 'inventory' | 'admin'>('pos');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<PricingPlanData | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const isStaff = (Array.isArray(workspaces) && workspaces.length > 0) || Boolean(profile?.is_super_admin);

  const restaurantSlug = restaurant?.slug || 'artisan-brew';

  // 1. Original Core Interfaces & Portals (Step 139 restored & expanded)
  const coreInterfaces = [
    {
      title: 'Customer Dining & Discovery Portal',
      badge: 'New Consumer App',
      desc: 'Browse curated restaurants, discover mouthwatering dishes, filter cuisines, explore photo menus, customize orders, and track live kitchen progress with Google Sign-In.',
      to: '/customer',
      color: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800',
      icon: Utensils,
      preview: 'Multi-restaurant discovery, cart & real-time tracking'
    },
    {
      title: 'Restaurant Admin Dashboard',
      badge: 'Backoffice HQ',
      desc: 'Executive command center: track gross sales KPIs, net revenue, live order queues, employee attendance, and table occupancy.',
      to: '/dashboard',
      color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
      icon: LayoutDashboard,
      preview: 'Executive analytics, inventory alerts & order velocity'
    },
    {
      title: 'Touch POS & Cashier Terminal',
      badge: 'High Velocity',
      desc: 'High-speed touch cashier terminal: quick dish search, spice customizations, split bills, and instant GST tax invoices.',
      to: '/dashboard/pos',
      color: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800',
      icon: ShoppingBag,
      preview: 'Fast cashier ordering, modifiers & UPI checkout'
    },
    {
      title: 'Customer Digital QR Menu',
      badge: 'Contactless Dine-In',
      desc: 'Mobile-first dining experience. Guests scan table-specific QR stickers to browse vivid photography, dietary tags, and pay via UPI.',
      to: `/menu/${restaurantSlug}`,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
      icon: QrCode,
      preview: 'Zero app installation required, responsive & fast'
    },
    {
      title: 'Kitchen Display System (KDS)',
      badge: 'Kitchen Tactical',
      desc: 'High-contrast operational board with elapsed timers, sound bell alerts, and status transitions for busy kitchen lines.',
      to: '/kitchen',
      color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
      icon: ChefHat,
      preview: 'Urgency color alerts, station filters & ticket queue'
    },
    {
      title: 'SaaS Super Admin Console',
      badge: 'Multi-Tenant HQ',
      desc: 'Platform control center for monitoring active restaurant tenants, MRR growth, and subscription plans.',
      to: '/super-admin',
      color: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800',
      icon: ShieldCheck,
      preview: 'Cross-tenant analytics, ARR tracking & plan limits'
    },
    {
      title: 'Restaurant Onboarding Wizard',
      badge: 'Self-Serve SaaS',
      desc: '4-step interactive setup wizard configuring store identity, location, operating hours, and floor layout in under 2 minutes.',
      to: '/onboarding',
      color: 'bg-stone-500/10 text-stone-700 border-stone-200 dark:border-stone-800',
      icon: Sparkles,
      preview: 'Instant restaurant setup in under 2 minutes'
    },
  ];

  // 2. Interactive Product Modules Data
  const productEngines = {
    pos: {
      tag: 'Front-of-House High Velocity',
      title: 'Touch POS & Cashier Terminal',
      description: 'Engineered for high-volume rush hours. Search dishes in milliseconds, customize biryani spice levels and add-ons with one tap, split dine-in bills, and generate instant GST tax invoices.',
      badge: '5x Faster Checkout',
      stats: [
        { label: 'Avg Ticket Entry', value: '1.8s' },
        { label: 'Hardware Cost', value: '₹0 (Any Device)' },
        { label: 'GST Compliance', value: '100% Automated' },
      ],
      image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1000&q=80',
      actionLink: '/dashboard/pos',
      actionText: 'Launch Live POS Terminal',
      features: [
        'Visual category tabs with real-time stock availability indicators',
        'Dynamic modifiers & spice customizations (Boneless, White Butter, Mirchi Salan)',
        'Table mapping with active dine-in orders and occupancy tracking',
        'Split billing, UPI QR generation, and thermal receipt printing',
      ],
    },
    qr: {
      tag: 'Contactless Guest Delight',
      title: 'Customer Digital QR Menu & UPI Checkout',
      description: 'Guests scan the table-specific QR code on their smartphones to explore vivid culinary photography, dietary filters (100% Veg / Halal), chef recommendations, and pay instantly via Google Pay or PhonePe.',
      badge: '+28% Average Order Value',
      stats: [
        { label: 'App Install Required', value: 'None (Browser Native)' },
        { label: 'Payment Speed', value: 'Instant UPI 3-sec' },
        { label: 'AOV Increase', value: '+28%' },
      ],
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1000&q=80',
      actionLink: `/menu/${restaurantSlug}`,
      actionText: 'Open Live QR Menu Demo',
      features: [
        'Vivid high-resolution food photography for every authentic Indian dish',
        'Veg/Non-Veg badges and allergen indicators (Dairy, Nuts, Gluten)',
        'Custom chef notes: "Extra spicy, less oil, serve raita separately"',
        'Direct UPI / Card checkout right at the dining table',
      ],
    },
    kds: {
      tag: 'Back-of-House Tactical Display',
      title: 'Kitchen Display System (KDS)',
      description: 'Replace noisy, easily-lost paper kitchen chits with an ultra-responsive, high-contrast digital display. Kitchen chefs receive real-time tickets with live urgency color timers and sound bell alerts.',
      badge: 'Zero Missed Orders',
      stats: [
        { label: 'Prep Time Reduction', value: '-35%' },
        { label: 'Order Audio Chime', value: 'Web Audio API' },
        { label: 'Ticket Contrast', value: 'Tactical Dark' },
      ],
      image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1000&q=80',
      actionLink: '/kitchen',
      actionText: 'Open Kitchen KDS Display',
      features: [
        'Dynamic elapsed timers with amber and red urgency thresholds',
        'Single-click status progression: Pending ➔ Cook ➔ Ready ➔ Served',
        'Automatic audio chime bell rings whenever a customer places an order',
        'Live bidirectional sync: Customer tracking screen updates instantly',
      ],
    },
    inventory: {
      tag: 'Automated Recipe Costing & BOM',
      title: 'Ingredient Inventory & Stock Control',
      description: 'Never run out of Basmati rice, Malai paneer, or Desi cow ghee during Saturday dinner rush. When an order begins cooking, ingredients are atomically deducted based on verified recipes and Bill of Materials.',
      badge: 'Zero Food Wastage',
      stats: [
        { label: 'Stock Valuation', value: 'Real-Time ₹ INR' },
        { label: 'Deduction Accuracy', value: '100% Atomic' },
        { label: 'Low Stock Alerts', value: 'Automated' },
      ],
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80',
      actionLink: '/dashboard/inventory',
      actionText: 'Inspect Recipe BOM & Inventory',
      features: [
        'Associates menu dishes with exact raw ingredients (grams, kg, liters, units)',
        'Automatic inventory deduction triggered upon kitchen acceptance',
        'Instant stock restoration if an order is cancelled prior to cooking',
        'Supplier directory, reorder thresholds, and live procurement valuation',
      ],
    },
    admin: {
      tag: 'Multi-Tenant HQ & Analytics',
      title: 'Executive Analytics & Super Admin HQ',
      description: 'Oversee your entire restaurant portfolio from a single dashboard. Track gross sales, discount deductions, CGST, SGST, Net Revenue, employee attendance, and subscription tier licenses across all branches.',
      badge: 'Enterprise Multi-Branch',
      stats: [
        { label: 'Branch Switching', value: 'Instant 1-Click' },
        { label: 'GST Reporting', value: 'GSTR-3B Ready' },
        { label: 'MRR / ARR Tracking', value: 'Live Cloud RPC' },
      ],
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
      actionLink: '/dashboard',
      actionText: 'Explore Restaurant Analytics',
      features: [
        'Comprehensive sales velocity breakdown: Gross Sales, Net Revenue, AOV',
        'Multi-tenant workspace switcher (Park Street Flagship, Salt Lake Hub)',
        'Role-Based Access Control (Owner, Manager, Cashier, Kitchen, Waiter)',
        'Audit logs recording all administrative, financial, and inventory actions',
      ],
    },
  };

  const currentEngine = productEngines[activeTab];

  // 3. Subscription Tiers in ₹ INR
  const pricingPlans = [
    {
      name: 'Starter Tier',
      tagline: 'Ideal for independent tea kiosks, chaat stalls & micro cafes.',
      priceMonthly: 2499,
      priceYearly: 24990,
      terminals: '1 Active Terminal',
      ordersPerMonth: '500 Orders / mo',
      features: [
        'Contactless Customer QR Menu',
        'Standard POS Cashier Terminal',
        'Basic Daily Revenue Analytics',
        'Thermal Receipt Printing',
        'Standard Indian GST Calculation',
      ],
      ctaText: 'Start with Starter',
      isPopular: false,
    },
    {
      name: 'Growth Tier',
      tagline: 'Full restaurant operations with kitchen sync & inventory control.',
      priceMonthly: 5999,
      priceYearly: 59990,
      terminals: 'Up to 3 Terminals',
      ordersPerMonth: '5,000 Orders / mo',
      features: [
        'Everything in Starter Tier',
        'Real-time Kitchen Display System (KDS)',
        'Audio Chime New-Order Bell',
        'Automated Recipe BOM Inventory',
        'Stock Movement Audit Ledger',
        'Table Floor Plan & Occupancy Manager',
      ],
      ctaText: 'Upgrade to Growth',
      isPopular: true,
    },
    {
      name: 'Professional Tier',
      tagline: 'Multi-station bistro with staff permissions & loyalty CRM.',
      priceMonthly: 11999,
      priceYearly: 119990,
      terminals: 'Up to 10 Terminals',
      ordersPerMonth: '50,000 Orders / mo',
      features: [
        'Everything in Growth Tier',
        'Executive Financial Analytics (Recharts)',
        'Multi-Branch Workspace Switching',
        'Employee Role Permissions (RBAC)',
        'Customer Loyalty Points & CRM',
        'Priority Phone & WhatsApp Support',
      ],
      ctaText: 'Choose Professional',
      isPopular: false,
    },
    {
      name: 'Enterprise Tier',
      tagline: 'Multi-city fine dining restaurant chains & franchises.',
      priceMonthly: 24999,
      priceYearly: 249990,
      terminals: 'Unlimited Terminals',
      ordersPerMonth: 'Unlimited Orders',
      features: [
        'Everything in Professional Tier',
        'Custom API Integrations & Webhooks',
        'Dedicated 99.99% Enterprise SLA',
        'Custom Floor Plan Layouts & Kiosks',
        'Centralized Master Menu Synchronization',
        'Dedicated Technical Account Manager',
      ],
      ctaText: 'Contact Enterprise Team',
      isPopular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-cafe-light text-cafe-primary antialiased selection:bg-cafe-accent selection:text-white">
      {/* 1. TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-cafe-border/80 dark:border-stone-800 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo & Brand */}
          <NavLink to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 mr-2 sm:mr-4">
            <CafeLogo size={36} className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-cafe-primary dark:text-white">
                  Café<span className="text-cafe-accent">OS</span>
                </span>
                <span className="hidden md:inline-flex text-[10px] font-black px-2 py-0.5 rounded-full bg-cafe-accent/15 text-cafe-accent uppercase tracking-wider border border-cafe-accent/20">
                  India Restaurant Cloud
                </span>
              </div>
              <p className="text-[10px] font-bold text-cafe-muted hidden sm:block">
                Hospitality & Dining Operating System
              </p>
            </div>
          </NavLink>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-cafe-muted">
            <a href="#portals" className="hover:text-cafe-primary dark:hover:text-white transition-colors">
              Product Portals
            </a>
            <a href="#solutions" className="hover:text-cafe-primary dark:hover:text-white transition-colors">
              Engines
            </a>
            <a href="#culinary" className="hover:text-cafe-primary dark:hover:text-white transition-colors">
              Culinary OS
            </a>
            <a href="#pricing" className="hover:text-cafe-primary dark:hover:text-white transition-colors">
              Pricing (₹ INR)
            </a>
            <a href="#features" className="hover:text-cafe-primary dark:hover:text-white transition-colors">
              Engine Features
            </a>
          </nav>

          {/* Action CTAs: Direct access to Customer Portal, Auth, and Dashboard */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto">
            <NavLink
              to={isAuthenticated ? '/customer' : '/customer/login'}
              className="text-xs font-extrabold text-cafe-accent hover:text-cafe-primary dark:text-amber-400 dark:hover:text-white transition-colors px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl hover:bg-cafe-sand/50 flex items-center gap-1.5 border border-cafe-accent/30 shadow-sm btn-press"
              title="Customer Portal"
            >
              <Utensils className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Customer Portal</span>
              <span className="sm:hidden">Customer</span>
            </NavLink>

            <NavLink
              to={isAuthenticated && isStaff ? '/dashboard' : '/login'}
              className="relative group px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-2xl bg-gradient-to-r from-cafe-accent to-amber-600 hover:from-amber-600 hover:to-cafe-accent text-white text-xs font-black shadow-warm hover:shadow-warm-md transition-all flex items-center gap-1.5 sm:gap-2 btn-press"
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Restaurant Portal</span>
              <span className="sm:hidden">Restaurant</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform hidden sm:inline" />
            </NavLink>

            {isAuthenticated && (
              <>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cafe-sand/50 text-[11px] font-bold text-cafe-primary truncate max-w-[140px]">
                  <User className="w-3.5 h-3.5 text-cafe-accent shrink-0" />
                  <span className="truncate">{user?.email?.split('@')[0]}</span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs font-bold text-cafe-muted hover:text-rose-600 transition-colors p-2 rounded-xl hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-cafe-primary dark:text-white hover:bg-cafe-sand/50 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-cafe-accent" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden border-t border-cafe-border dark:border-stone-800 bg-white/98 dark:bg-stone-900/98 backdrop-blur-xl px-4 py-4 space-y-4 shadow-xl overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-cafe-primary dark:text-stone-200">
                <a
                  href="#portals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-cafe-sand/40 dark:bg-stone-800 hover:bg-cafe-accent/15 transition-colors flex items-center gap-2"
                >
                  <Store className="w-4 h-4 text-cafe-accent" />
                  <span>Portals</span>
                </a>
                <a
                  href="#solutions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-cafe-sand/40 dark:bg-stone-800 hover:bg-cafe-accent/15 transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Engines</span>
                </a>
                <a
                  href="#culinary"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-cafe-sand/40 dark:bg-stone-800 hover:bg-cafe-accent/15 transition-colors flex items-center gap-2"
                >
                  <ChefHat className="w-4 h-4 text-orange-600" />
                  <span>Culinary OS</span>
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-cafe-sand/40 dark:bg-stone-800 hover:bg-cafe-accent/15 transition-colors flex items-center gap-2"
                >
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span>Pricing</span>
                </a>
              </div>

              {/* Mobile Quick Action Links */}
              <div className="space-y-2 pt-2 border-t border-cafe-border/60 dark:border-stone-800">
                <p className="text-[10px] font-black uppercase tracking-wider text-cafe-muted">
                  Quick Direct Access
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <NavLink
                    to={isAuthenticated ? '/customer' : '/customer/login'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 font-extrabold text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Customer App</span>
                  </NavLink>
                  <NavLink
                    to={isAuthenticated && isStaff ? '/dashboard' : '/login'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-xs flex items-center gap-2 border border-amber-200 dark:border-amber-900"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Admin HQ</span>
                  </NavLink>
                  <NavLink
                    to="/dashboard/pos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-orange-500/10 text-orange-700 dark:text-orange-400 font-extrabold text-xs flex items-center gap-2 border border-orange-200 dark:border-orange-900"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>POS Terminal</span>
                  </NavLink>
                  <NavLink
                    to="/kitchen"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 font-extrabold text-xs flex items-center gap-2 border border-blue-200 dark:border-blue-900"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Kitchen KDS</span>
                  </NavLink>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. HERO SECTION WITH RICH VISUAL SHOWCASE */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Animated Radiant Ambient Backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[480px] bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-rose-500/10 blur-3xl pointer-events-none -z-10 rounded-full animate-pulse-glow" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-gradient-to-bl from-amber-400/10 to-transparent blur-2xl pointer-events-none -z-10 rounded-full" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-orange-400/10 to-transparent blur-2xl pointer-events-none -z-10 rounded-full" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Narrative & Primary CTAs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            {/* Tag Pill */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cafe-cream/90 dark:bg-stone-800/90 backdrop-blur-sm border border-cafe-accent/30 text-xs font-extrabold text-cafe-primary dark:text-stone-100 shadow-warm-sm"
            >
              <Sparkles className="w-4 h-4 text-cafe-accent animate-pulse" />
              <span>Next-Gen Indian Restaurant Operating System</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ml-1" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-6xl font-black text-cafe-primary dark:text-stone-100 tracking-tight leading-[1.12]"
            >
              The Operating System for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cafe-accent via-amber-600 to-orange-700">
                Regal Dining
              </span>{' '}
              & High-Velocity Kitchens.
            </motion.h1>

            {/* Subhead */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-cafe-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal"
            >
              CafeOS harmonizes multi-restaurant customer discovery, table QR ordering, lightning-fast cashier POS terminals, tactical Kitchen Display Systems (KDS), automated recipe inventory BOM, and seamless Indian UPI/Card payments into one cohesive cloud platform.
            </motion.p>

            {/* Call to Actions: Flagship Portals & Operational Modules */}
            <motion.div
              variants={itemVariants}
              className="pt-2 flex flex-col items-center lg:items-start gap-3 w-full"
            >
              {/* Primary Portals: Customer Portal & Restaurant Portal */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 w-full sm:w-auto max-w-md sm:max-w-none">
                <NavLink
                  to={isAuthenticated ? '/customer' : '/customer/login'}
                  className="px-6 py-3.5 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-black text-xs uppercase tracking-wider shadow-warm-md hover:shadow-warm-lg transition-all flex items-center justify-center gap-2 group btn-press ring-2 ring-cafe-accent/20"
                >
                  <Utensils className="w-4 h-4 text-white shrink-0" />
                  <span>Customer Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </NavLink>

                <NavLink
                  to={isAuthenticated && isStaff ? '/dashboard' : '/login'}
                  className="px-6 py-3.5 rounded-2xl bg-cafe-primary dark:bg-white dark:text-stone-900 text-white font-black text-xs uppercase tracking-wider shadow-warm hover:shadow-warm-md hover:bg-stone-800 transition-all flex items-center justify-center gap-2 group btn-press"
                >
                  <Store className="w-4 h-4 text-cafe-accent shrink-0" />
                  <span>Restaurant Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </NavLink>
              </div>

              {/* Operational Tools: POS Cashier right beside Kitchen KDS */}
              <div className="flex items-center justify-center lg:justify-start gap-3 w-full sm:w-auto max-w-md sm:max-w-none">
                <NavLink
                  to="/dashboard/pos"
                  className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 text-cafe-primary dark:text-stone-100 border border-cafe-border dark:border-stone-700 font-extrabold text-xs uppercase tracking-wider shadow-warm-sm hover:border-cafe-accent/60 transition-all flex items-center justify-center gap-1.5 btn-press"
                >
                  <ShoppingBag className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>POS Cashier</span>
                </NavLink>

                <NavLink
                  to="/kitchen"
                  className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-stone-900 text-orange-400 font-extrabold text-xs shadow-warm flex items-center justify-center gap-1.5 border border-orange-500/30 hover:bg-black transition-all btn-press"
                >
                  <ChefHat className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Kitchen KDS</span>
                </NavLink>
              </div>
            </motion.div>

            {/* Quick Proof Metrics */}
            <motion.div
              variants={itemVariants}
              className="pt-6 border-t border-cafe-border/70 dark:border-stone-800 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left"
            >
              <div>
                <p className="text-2xl font-black text-cafe-primary dark:text-stone-100">500+</p>
                <p className="text-[11px] font-bold text-cafe-muted">Active Indian Bistros</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-600">3.2x</p>
                <p className="text-[11px] font-bold text-cafe-muted">Faster Table Turnover</p>
              </div>
              <div>
                <p className="text-2xl font-black text-cafe-accent">₹0</p>
                <p className="text-[11px] font-bold text-cafe-muted">Proprietary Hardware</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Layered Interactive Visual Showcase with Live Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* Main Centerpiece Image Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-stone-800 bg-stone-900 group">
              <img
                src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
                alt="Hyderabadi Chicken Dum Biryani"
                className="w-full h-[440px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

              {/* Bottom Card Snapshot */}
              <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cafe-accent text-white">
                    Live Dining Ticket
                  </span>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    <span>4.9 (3,840+ Orders)</span>
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Hyderabadi Chicken Dum Biryani
                </h3>
                <p className="text-xs text-stone-300 line-clamp-2">
                  Aged Daawat basmati rice slow dum-cooked with tender saffron chicken, browned onions, and whole spices in sealed earthen handi.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="font-bold text-stone-300">Table 04 • Dine-In</span>
                  <span className="text-lg font-black text-cafe-accent">₹380.00</span>
                </div>
              </div>
            </div>

            {/* Floating Live Badge 1 (Top-Right): Kitchen KDS Speed Alert */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute top-2 right-2 sm:-top-4 sm:-right-6 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-warm-lg border border-cafe-border dark:border-stone-700 max-w-[190px] sm:max-w-[210px] z-10"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black uppercase text-emerald-600">
                  Kitchen Realtime
                </span>
              </div>
              <p className="text-xs font-black text-cafe-primary dark:text-white">
                Ticket #CF-804 Accepted
              </p>
              <p className="text-[11px] text-cafe-muted mt-0.5">
                Elapsed: 06:42 mins • In Kitchen
              </p>
            </motion.div>

            {/* Floating Live Badge 2 (Bottom-Left): Revenue Momentum */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-2 left-2 sm:-bottom-6 sm:-left-6 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-warm-lg border border-cafe-border dark:border-stone-700 max-w-[200px] sm:max-w-[230px] z-10"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-cafe-muted">
                  Daily Net Sales
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                  +18.4%
                </span>
              </div>
              <p className="text-xl font-black text-cafe-primary dark:text-white">
                ₹1,14,267.00
              </p>
              <p className="text-[10px] text-cafe-muted font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>164 completed tickets</span>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. TRUSTED RESTAURANT PROFILES & PARTNERS BAR */}
      <section className="py-8 bg-cafe-sand/30 dark:bg-stone-900/50 border-y border-cafe-border/80 dark:border-stone-800 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-6 text-center text-xs font-black tracking-wide text-cafe-muted uppercase">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-cafe-accent" />
            <span>Royal Awadhi Durbars</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600" />
            <span>Clay Tandoor Roasteries</span>
          </div>
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-700" />
            <span>Artisanal Chai & Kaapi Bars</span>
          </div>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Multi-Branch Franchise Chains</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Cloud Kitchen Networks</span>
          </div>
        </div>
      </section>

      {/* 4. RESTORED: DEDICATED PRODUCT PORTALS & OPERATIONAL INTERFACES GRID */}
      <section id="portals" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-cafe-accent">
            Unified Hospitality Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-cafe-primary dark:text-white tracking-tight">
            Seven Purpose-Built Product Portals
          </h2>
          <p className="text-xs sm:text-sm text-cafe-muted leading-relaxed">
            Not a single landing page or simple table. Every module is tailored for its exact operational workflow and user role.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {coreInterfaces.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title} variants={itemVariants}>
                <NavLink
                  to={item.to}
                  className="p-6 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-cafe-border/80 dark:border-stone-800 shadow-warm hover:shadow-warm-lg hover:border-cafe-accent/60 transition-all flex flex-col justify-between group h-full hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-cafe-sand/60 dark:bg-stone-800 text-cafe-primary flex items-center justify-center font-bold group-hover:scale-110 group-hover:bg-cafe-accent/15 transition-all">
                        <Icon className="w-6 h-6 text-cafe-accent" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${item.color}`}>
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-cafe-primary dark:text-white group-hover:text-cafe-accent transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-cafe-muted mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-cafe-border/60 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-cafe-accent">
                    <span className="text-[11px] text-cafe-muted font-normal line-clamp-1">{item.preview}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform shrink-0">
                      <span>Launch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </NavLink>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 5. INTERACTIVE PRODUCT SUITES DEEP-DIVE (TABBED SHOWCASE) */}
      <section id="solutions" className="py-20 bg-cafe-sand/20 dark:bg-stone-900/40 border-y border-cafe-border/80 dark:border-stone-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-cafe-accent">
              Operational Engines
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-cafe-primary dark:text-white tracking-tight">
              Five Purpose-Built Engines. Zero Bloat.
            </h2>
            <p className="text-xs sm:text-sm text-cafe-muted leading-relaxed">
              Every screen in CafeOS was meticulously designed for its exact operational role—from 2-second cashier barcode touches to heat-resistant kitchen screens.
            </p>
          </div>

          {/* Interactive Tab Switcher */}
          <div className="flex items-center justify-start sm:justify-center overflow-x-auto gap-2 pb-2 scrollbar-none">
            {[
              { id: 'pos', label: 'Cashier POS', icon: ShoppingBag },
              { id: 'qr', label: 'Customer QR Menu', icon: QrCode },
              { id: 'kds', label: 'Kitchen KDS', icon: ChefHat },
              { id: 'inventory', label: 'Recipe BOM & Stock', icon: Boxes },
              { id: 'admin', label: 'Multi-Branch & HQ', icon: LayoutDashboard },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer btn-press ${
                    active
                      ? 'bg-cafe-primary dark:bg-white text-white dark:text-stone-900 shadow-warm'
                      : 'bg-white dark:bg-stone-800 text-cafe-muted hover:text-cafe-primary dark:hover:text-white border border-cafe-border dark:border-stone-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-cafe-accent' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Tab Showcase Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-stone-900 border border-cafe-border/80 dark:border-stone-800 shadow-warm-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Content */}
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-cafe-accent/15 text-cafe-accent border border-cafe-accent/20">
                    {currentEngine.tag}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{currentEngine.badge}</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-cafe-primary dark:text-white">
                  {currentEngine.title}
                </h3>

                <p className="text-xs sm:text-sm text-cafe-muted leading-relaxed">
                  {currentEngine.description}
                </p>

                {/* Feature Bullet Points */}
                <div className="space-y-2.5 pt-2">
                  {currentEngine.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-cafe-primary dark:text-stone-200 font-semibold">
                      <Check className="w-4 h-4 text-cafe-accent shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Metric Callouts */}
                <div className="pt-4 grid grid-cols-3 gap-3 border-t border-cafe-border/60 dark:border-stone-800">
                  {currentEngine.stats.map((st, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-bold text-cafe-muted">{st.label}</p>
                      <p className="text-sm font-black text-cafe-primary dark:text-stone-100">{st.value}</p>
                    </div>
                  ))}
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <NavLink
                    to={currentEngine.actionLink}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-black text-xs uppercase tracking-wider shadow-warm transition-all group"
                  >
                    <span>{currentEngine.actionText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </NavLink>
                </div>
              </div>

              {/* Right Visual Image Frame */}
              <div className="lg:col-span-6 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-cafe-border dark:border-stone-800 aspect-[4/3] group">
                  <img
                    src={currentEngine.image}
                    alt={currentEngine.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-cafe-border dark:border-stone-700 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cafe-accent/15 text-cafe-accent flex items-center justify-center font-bold">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-cafe-primary dark:text-white">
                          {currentEngine.title}
                        </p>
                        <p className="text-[10px] text-cafe-muted font-medium">
                          Live Production Sandbox Active
                        </p>
                      </div>
                    </div>
                    <NavLink
                      to={currentEngine.actionLink}
                      className="text-xs font-extrabold text-cafe-accent hover:underline flex items-center gap-1"
                    >
                      <span>Try Module</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </NavLink>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 6. CULINARY EXCELLENCE SHOWCASE (INDIAN FOOD PHOTOGRAPHY) */}
      <section id="culinary" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-cafe-accent">
            Culinary Artistry Meets High Technology
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-cafe-primary dark:text-white tracking-tight">
            Mouthwatering Menus that Drive Ticket Volume.
          </h2>
          <p className="text-xs sm:text-sm text-cafe-muted leading-relaxed">
            High-resolution appetizing photography increases guest check averages by up to 28%. CafeOS features optimized photo delivery and instant zoom.
          </p>
        </div>

        {/* 4 Culinary Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              title: 'Royal Awadhi Dum Biryanis',
              tag: 'Bestseller',
              desc: 'Aged basmati rice sealed in earthen handis with saffron, mint, and fried onions.',
              image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
              price: '₹460',
            },
            {
              title: 'Old Delhi Butter Chicken',
              tag: 'Chef Signature',
              desc: 'Tandoor-charred chicken simmered in rich cashew tomato gravy with churned butter.',
              image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
              price: '₹390',
            },
            {
              title: 'Paneer Butter Masala',
              tag: '100% Pure Veg',
              desc: 'Fresh artisan cottage cheese cubes bathed in velvety sun-ripened makhani sauce.',
              image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
              price: '₹330',
            },
            {
              title: 'Royal Kulhad Masala Chai',
              tag: 'Handcrafted',
              desc: 'Assam CTC black tea infused with hand-pounded ginger, green cardamom, and farm milk.',
              image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
              price: '₹50',
            },
          ].map((dish, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="rounded-3xl bg-white dark:bg-stone-900 border border-cafe-border/80 dark:border-stone-800 overflow-hidden shadow-warm hover:shadow-warm-lg transition-all group flex flex-col justify-between hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={dish.image}
                  alt={dish.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cafe-accent text-white shadow-sm">
                    {dish.tag}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-cafe-primary dark:text-white group-hover:text-cafe-accent transition-colors">
                      {dish.title}
                    </h4>
                    <span className="text-xs font-black text-cafe-accent">{dish.price}</span>
                  </div>
                  <p className="text-xs text-cafe-muted mt-1 leading-relaxed">
                    {dish.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-cafe-border/60 dark:border-stone-800 flex items-center justify-between text-[11px] text-cafe-muted font-bold">
                  <span>Recipe BOM Active</span>
                  <span className="text-emerald-600">In Stock</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 7. TRANSPARENT PRICING TIERS IN INDIAN RUPEES (₹) */}
      <section id="pricing" className="py-20 bg-cafe-sand/30 dark:bg-stone-900/30 border-y border-cafe-border/80 dark:border-stone-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-cafe-accent">
              Simple, Transparent Indian SaaS Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-cafe-primary dark:text-white tracking-tight">
              Invest in Growth. Zero Hidden Fees.
            </h2>
            <p className="text-xs sm:text-sm text-cafe-muted">
              All prices in Indian Rupees (₹ INR). No lock-in contracts. Upgrade or switch plans anytime.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-cafe-primary dark:text-white' : 'text-cafe-muted'}`}>
                Billed Monthly
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle((prev) => (prev === 'monthly' ? 'yearly' : 'monthly'))}
                className="w-14 h-8 rounded-full bg-cafe-primary dark:bg-stone-700 p-1 flex items-center transition-all cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-cafe-accent shadow-md transform transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${billingCycle === 'yearly' ? 'text-cafe-primary dark:text-white' : 'text-cafe-muted'}`}>
                  Billed Annually
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Save 20% + 2 Mo Free
                </span>
              </div>
            </div>
          </div>

          {/* 4 Pricing Cards Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {pricingPlans.map((plan) => {
              const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
              return (
                <motion.div
                  key={plan.name}
                  variants={itemVariants}
                  className={`rounded-3xl p-6 flex flex-col justify-between transition-all hover:-translate-y-1 ${
                    plan.isPopular
                      ? 'bg-white dark:bg-stone-900 border-2 border-cafe-accent shadow-warm-lg ring-4 ring-cafe-accent/15 relative'
                      : 'bg-white dark:bg-stone-900 border border-cafe-border dark:border-stone-800 shadow-warm hover:shadow-warm-md'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cafe-accent text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      Most Popular Choice
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-black text-lg text-cafe-primary dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-cafe-muted mt-1 min-h-[32px]">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-cafe-border/60 dark:border-stone-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-cafe-primary dark:text-white">
                          {formatCurrency(price, '₹')}
                        </span>
                        <span className="text-xs text-cafe-muted font-bold">/ month</span>
                      </div>
                      <p className="text-[11px] text-cafe-muted mt-1">
                        {plan.terminals} • {plan.ordersPerMonth}
                      </p>
                    </div>

                    {/* Feature Checklist */}
                    <div className="space-y-2 pt-3 border-t border-cafe-border/60 dark:border-stone-800">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-cafe-primary dark:text-stone-300 font-medium">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubscriptionPlan(plan);
                        setIsCheckoutModalOpen(true);
                      }}
                      className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all btn-press ${
                        plan.isPopular
                          ? 'bg-cafe-accent hover:bg-cafe-accent-hover text-white shadow-warm'
                          : 'bg-cafe-sand/60 dark:bg-stone-800 text-cafe-primary dark:text-white hover:bg-cafe-sand'
                      }`}
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Pricing Section Footer Links */}
          <div className="pt-6 text-center text-xs text-cafe-muted flex flex-wrap items-center justify-center gap-4 border-t border-cafe-border/50 dark:border-stone-800">
            <span>
              Need a custom multi-chain SLA?{' '}
              <button
                type="button"
                onClick={() => {
                  setSelectedSubscriptionPlan(pricingPlans[3]);
                  setIsCheckoutModalOpen(true);
                }}
                className="text-cafe-accent font-black hover:underline"
              >
                Inquire with Enterprise Team &rarr;
              </button>
            </span>
            <span>•</span>
            <NavLink
              to="/super-admin/subscriptions"
              className="hover:text-cafe-primary dark:hover:text-white transition-colors flex items-center gap-1 text-[11px]"
            >
              <Lock className="w-3 h-3 text-purple-500" />
              <span>Platform Master Console (Super Admins)</span>
            </NavLink>
          </div>
        </div>
      </section>

      {/* 8. RESTORED: ENTERPRISE RESTAURANT ENGINE FEATURE HIGHLIGHTS (Step 139) */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-cafe-accent">
            Enterprise Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-cafe-primary dark:text-white tracking-tight">
            High-Performance Restaurant Engine
          </h2>
          <p className="text-xs sm:text-sm text-cafe-muted leading-relaxed">
            Built on scalable, reactive architecture with zero broken states, offline resiliency, and instant cross-device updates.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants} className="p-6 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-cafe-border/80 dark:border-stone-800 shadow-warm hover:shadow-warm-lg hover:border-cafe-accent/40 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-cafe-accent" />
            </div>
            <h4 className="font-extrabold text-sm text-cafe-primary dark:text-white">Synthetic Web Audio</h4>
            <p className="text-xs text-cafe-muted mt-1 leading-relaxed">
              Zero audio file dependencies. Native browser Web Audio API bells alert kitchen staff instantly when new orders arrive.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-cafe-border/80 dark:border-stone-800 shadow-warm hover:shadow-warm-lg hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-extrabold text-sm text-cafe-primary dark:text-white">Instant QR Generation</h4>
            <p className="text-xs text-cafe-muted mt-1 leading-relaxed">
              Generate crisp high-resolution PNGs for Tables 01-20 or storefront takeout with branded color presets and direct URLs.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-cafe-border/80 dark:border-stone-800 shadow-warm hover:shadow-warm-lg hover:border-blue-500/40 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-extrabold text-sm text-cafe-primary dark:text-white">Real-Time Data Layer</h4>
            <p className="text-xs text-cafe-muted mt-1 leading-relaxed">
              Orders placed in the customer portal or table QR checkout instantly reflect in the KDS and POS with zero page reloads.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="p-6 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-cafe-border/80 dark:border-stone-800 shadow-warm hover:shadow-warm-lg hover:border-purple-500/40 transition-all hover:-translate-y-1">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-extrabold text-sm text-cafe-primary dark:text-white">Printable Thermal Receipts</h4>
            <p className="text-xs text-cafe-muted mt-1 leading-relaxed">
              CSS print stylesheets calibrated for 58mm and 80mm thermal POS receipt printers and GST customer tax invoices.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 9. SOCIAL PROOF & TESTIMONIALS */}
      <section className="py-20 bg-cafe-sand/20 dark:bg-stone-900/20 border-y border-cafe-border/80 dark:border-stone-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-cafe-accent">
              Loved by Acclaimed Restaurateurs
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-cafe-primary dark:text-white tracking-tight">
              Trusted Across India's Premier Dining Destinations
            </h2>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                quote: 'CafeOS solved our Saturday night chaos. Order chits never get lost because the KDS chime alerts the chefs immediately. Our table turnaround went from 48 minutes to 31 minutes.',
                author: 'Chef Rajesh Sharma',
                role: 'Executive Chef, Arsalan Park Circus Flagship, Kolkata',
                avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
                rating: 5,
              },
              {
                quote: 'The customer QR menu with Razorpay UPI integration is magical. Customers scan at Table 07, pay via Google Pay, and the kitchen gets to work. No more waiting 15 minutes for the bill.',
                author: 'Priya Sharma',
                role: 'Managing Partner, Dawat-e-Khaas Bistro',
                avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
                rating: 5,
              },
              {
                quote: 'Automated recipe costing stopped ingredient leakage. We know exactly how many kilograms of Basmati rice and Amul butter were consumed against orders placed. Total peace of mind.',
                author: 'Kabir Varma',
                role: 'Founder, Roastery & Chai Bar Group',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                rating: 5,
              },
            ].map((t, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="p-6 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-cafe-border/80 dark:border-stone-800 shadow-warm hover:shadow-warm-lg transition-all flex flex-col justify-between space-y-4 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs text-cafe-primary dark:text-stone-200 leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-cafe-border/60 dark:border-stone-800">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-10 h-10 rounded-full object-cover border border-cafe-accent/40"
                  />
                  <div>
                    <h5 className="font-black text-xs text-cafe-primary dark:text-white">
                      {t.author}
                    </h5>
                    <p className="text-[10px] text-cafe-muted">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 10. HIGH-CONVERTING BOTTOM CTA BANNER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-cafe-primary via-stone-900 to-amber-950 p-8 sm:p-14 text-white text-center shadow-2xl border border-cafe-accent/30 space-y-6"
        >
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-cafe-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-cafe-accent text-white shadow-warm-sm border border-white/10">
              Instant Self-Serve Deployment
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready to Upgrade Your Restaurant Operations?
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
              Launch your restaurant workspace in under 2 minutes. Generate table QR codes, invite your kitchen staff, and start taking customer orders immediately.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-2">
            <NavLink
              to={isAuthenticated ? '/customer' : '/customer/login'}
              className="px-8 py-4 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-black text-xs uppercase tracking-wider shadow-warm-lg flex items-center gap-2 group transition-all btn-press"
            >
              <Utensils className="w-4 h-4 text-white" />
              <span>Open Customer Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </NavLink>

            <NavLink
              to={isAuthenticated && isStaff ? '/dashboard' : '/login'}
              className="px-8 py-4 rounded-2xl bg-white text-cafe-primary hover:bg-cafe-sand font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-warm btn-press"
            >
              <Store className="w-4 h-4 text-cafe-accent" />
              <span>Open Restaurant Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </NavLink>

            <NavLink
              to="/onboarding"
              className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider border border-white/20 transition-all btn-press"
            >
              <span>Start Free 14-Day Trial</span>
            </NavLink>
          </div>
        </motion.div>
      </section>

      {/* 11. REFINED FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-cafe-border/80 dark:border-stone-800 bg-white dark:bg-stone-950 text-xs text-cafe-muted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <CafeLogo size={36} />
            <div>
              <span className="font-black text-sm text-cafe-primary dark:text-white">CaféOS India</span>
              <p className="text-[10px] text-cafe-muted">
                Hospitality Cloud Architecture • Park Street, Kolkata, West Bengal 700016
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-bold text-xs">
            <NavLink to="/customer" className="text-cafe-accent hover:underline">
              Customer Portal
            </NavLink>
            <NavLink to="/dashboard" className="hover:text-cafe-primary dark:hover:text-white">
              Restaurant Dashboard
            </NavLink>
            <NavLink to="/kitchen" className="hover:text-cafe-primary dark:hover:text-white">
              Kitchen Display (KDS)
            </NavLink>
            <NavLink to="/dashboard/pos" className="hover:text-cafe-primary dark:hover:text-white">
              POS Terminal
            </NavLink>
            <NavLink to="/super-admin" className="hover:text-cafe-primary dark:hover:text-white">
              Super Admin HQ
            </NavLink>
            <NavLink to="/about" className="hover:text-cafe-primary dark:hover:text-white">
              About CaféOS
            </NavLink>
            <NavLink to="/privacy" className="hover:text-cafe-primary dark:hover:text-white">
              Privacy Policy
            </NavLink>
            <NavLink to="/terms" className="hover:text-cafe-primary dark:hover:text-white">
              Terms of Service
            </NavLink>
          </div>

          <p className="text-[11px] text-cafe-muted">
            © 2026 CaféOS Platform. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Subscription Plan Checkout & Payment Gateway Modal */}
      <SubscriptionCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        plan={selectedSubscriptionPlan}
        billingCycle={billingCycle}
        onBillingCycleChange={setBillingCycle}
      />
    </div>
  );
};
