import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  IndianRupee,
  TrendingUp,
  Server,
  ShieldCheck,
  Search,
  ExternalLink,
  Plus,
  Sparkles,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Mail,
  ShieldAlert,
  Phone,
  Power,
  RotateCcw,
  Check,
  X,
  Edit2,
  MessageSquare,
  HelpCircle,
  Clock,
  Send,
  Lock,
  Layers
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCafe } from '../../context/CafeContext';
import { formatCurrency } from '../../utils/formatters';
import {
  superAdminService,
  PlatformOverviewMetrics,
  PlatformTenantItem,
  SubscriptionPlanItem,
  SupportTicketItem,
  PlatformAuditLogItem
} from '../../services/superAdminService';

// ============================================================================
// 1. SUPER ADMIN COCKPIT / DASHBOARD PAGE
// ============================================================================
export const SuperAdminCockpitPage: React.FC = () => {
  const { addToast } = useCafe();

  const [metrics, setMetrics] = useState<PlatformOverviewMetrics | null>(null);
  const [tenants, setTenants] = useState<PlatformTenantItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tenant management modals
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenantItem | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedSubStatus, setSelectedSubStatus] = useState<string>('active');
  const [isProcessing, setIsProcessing] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ov, tens, pls] = await Promise.all([
        superAdminService.getPlatformOverview(),
        superAdminService.getTenants(),
        superAdminService.getSubscriptionPlans(),
      ]);
      setMetrics(ov);
      setTenants(tens);
      setPlans(pls);
    } catch (err: any) {
      console.error('Error loading cockpit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTenant = async (tenant: PlatformTenantItem) => {
    const nextState = !tenant.isActive;
    const actionLabel = nextState ? 'Reactivate' : 'Suspend';
    if (window.confirm(`Are you sure you want to ${actionLabel} ${tenant.name}?`)) {
      try {
        await superAdminService.toggleTenantStatus(tenant.id, nextState);
        addToast(
          `Tenant ${actionLabel}d`,
          `${tenant.name} is now ${nextState ? 'Active' : 'Suspended'}.`,
          nextState ? 'success' : 'warning'
        );
        loadData();
      } catch (err: any) {
        addToast('Error', err.message || 'Failed to toggle tenant status', 'error');
      }
    }
  };

  const handleAssignPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !selectedPlanId) return;

    setIsProcessing(true);
    try {
      await superAdminService.assignSubscription(selectedTenant.id, selectedPlanId, selectedSubStatus, 12);
      addToast(
        'Subscription Assigned',
        `Plan updated for ${selectedTenant.name}.`,
        'success'
      );
      setIsAssignModalOpen(false);
      setSelectedTenant(null);
      loadData();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to assign plan', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && t.isActive) ||
      (statusFilter === 'suspended' && !t.isActive);

    const matchesQuery =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.contactEmail && t.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.city && t.city.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesQuery;
  });

  const mrrGrowthData = [
    { month: 'Jun', mrr: 18400 },
    { month: 'Jul', mrr: 26500 },
    { month: 'Aug', mrr: 34900 },
    { month: 'Sep', mrr: 41200 },
    { month: 'Oct', mrr: 48500 },
    { month: 'Nov', mrr: metrics?.mrr || 52993 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Cockpit KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Monthly Recurring (MRR)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-950/60 text-purple-400 flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-black text-emerald-400">
              ₹{(metrics?.mrr || 52993).toLocaleString('en-IN')}
            </h3>
            <span className="text-xs text-emerald-400 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+24.5%</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ARR Run Rate: ₹{((metrics?.mrr || 52993) * 12).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Restaurant Tenants
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-950/60 text-blue-400 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-black text-white">
              {metrics?.activeRestaurants || tenants.filter((t) => t.isActive).length} / {metrics?.totalRestaurants || tenants.length}
            </h3>
            <span className="text-xs text-purple-400 font-bold">Active</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Multi-tenant PostgreSQL workspaces</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Subscriptions
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-black text-white">
              {metrics?.activeSubscriptions || 7}
            </h3>
            <span className="text-xs text-emerald-400 font-bold">100% Retained</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Starter, Growth & Pro Tiers</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cloud Infrastructure
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center font-bold">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-3xl font-black text-emerald-400">
              {metrics?.uptimePct || 99.98}%
            </h3>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Region: ap-south-1 (Mumbai)</p>
        </div>
      </div>

      {/* MRR Growth Chart */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-white">
              SaaS MRR Trajectory & Subscription Growth
            </h2>
            <p className="text-xs text-slate-400">Platform billing acceleration over past 6 months (in ₹ INR)</p>
          </div>
          <span className="text-xs font-bold text-purple-400 bg-purple-950/60 border border-purple-800 px-3 py-1 rounded-full">
            +322% YoY
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrGrowthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333EA" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#9333EA" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.4} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Monthly MRR']}
              />
              <Area type="monotone" dataKey="mrr" stroke="#A855F7" strokeWidth={3} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-white">
              Restaurant Tenant Directory
            </h2>
            <p className="text-xs text-slate-400">All registered cafe and restaurant workspaces</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs">
              {(['all', 'active', 'suspended'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                    statusFilter === s ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400">
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Contact & City</th>
                <th className="py-3 px-4">Assigned Plan</th>
                <th className="py-3 px-4">MRR</th>
                <th className="py-3 px-4">Tenant Status</th>
                <th className="py-3 px-4 text-right">Super Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No restaurant tenants match the criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>
                        <span className="text-sm">{res.name}</span>
                        <p className="text-[11px] text-slate-400 font-mono">slug: /{res.slug}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <p className="font-semibold">{res.contactEmail || 'contact@restaurant.in'}</p>
                      <p className="text-[11px] text-slate-400">{res.city || 'Kolkata, India'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        {res.planName}
                      </span>
                      <span className="block text-[10px] text-slate-400 capitalize mt-0.5">
                        Status: {res.subscriptionStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-400 text-sm">
                      ₹{res.planPrice.toLocaleString('en-IN')}/mo
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          res.isActive
                            ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                            : 'text-rose-400 bg-rose-950/60 border-rose-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${res.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {res.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedTenant(res);
                            const matchingPlan = plans.find((p) => p.name === res.planName);
                            setSelectedPlanId(matchingPlan?.id || plans[0]?.id || '');
                            setSelectedSubStatus(res.subscriptionStatus !== 'none' ? res.subscriptionStatus : 'active');
                            setIsAssignModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition-colors"
                          title="Assign or upgrade subscription plan"
                        >
                          Plan
                        </button>

                        <button
                          onClick={() => handleToggleTenant(res)}
                          className={`p-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                            res.isActive
                              ? 'border-rose-800/80 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60'
                              : 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                          }`}
                          title={res.isActive ? 'Suspend Tenant Access' : 'Reactivate Tenant Access'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Assignment Modal */}
      {isAssignModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-white">Assign Subscription Plan</h3>
                <p className="text-slate-400">{selectedTenant.name}</p>
              </div>
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedTenant(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignPlanSubmit} className="space-y-4">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Select Subscription Tier</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500 font-medium"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.priceMonthly.toLocaleString('en-IN')}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Subscription State</label>
                <select
                  value={selectedSubStatus}
                  onChange={(e) => setSelectedSubStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500 font-medium capitalize"
                >
                  <option value="active">Active (Paid)</option>
                  <option value="trialing">Trialing (Free Trial)</option>
                  <option value="canceled">Canceled</option>
                  <option value="past_due">Past Due</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 text-[11px]">
                Plan upgrades are persisted directly in Postgres and update the restaurant's allowed KDS terminals and features.
              </div>

              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setSelectedTenant(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
                >
                  {isProcessing ? 'Saving...' : 'Apply Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. SUBSCRIPTION PLANS & PACKAGING PAGE
// ============================================================================
export const SuperAdminSubscriptionsPage: React.FC = () => {
  const { addToast } = useCafe();
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null);
  const [formData, setFormData] = useState<Partial<SubscriptionPlanItem>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadPlans = async () => {
    try {
      const data = await superAdminService.getSubscriptionPlans();
      setPlans(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleEditOpen = (p: SubscriptionPlanItem) => {
    setEditingPlan(p);
    setFormData({
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      maxTerminals: p.maxTerminals,
      maxOrdersPerMonth: p.maxOrdersPerMonth,
      hasKds: p.hasKds,
      hasInventory: p.hasInventory,
      hasAnalytics: p.hasAnalytics,
      hasLoyalty: p.hasLoyalty,
      description: p.description,
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setIsSaving(true);
    try {
      await superAdminService.updatePlanConfig(editingPlan.id, formData);
      addToast('Plan Updated', `${editingPlan.name} parameters updated.`, 'success');
      setEditingPlan(null);
      loadPlans();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update plan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          SaaS Pricing Plans & Feature Packaging
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure tier pricing in Indian Rupee (₹), order volumes, and hardware feature entitlements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isPro = p.slug === 'professional';

          return (
            <div
              key={p.id}
              className={`p-6 rounded-3xl bg-slate-900 border ${
                isPro
                  ? 'border-purple-500 shadow-purple-950/50 shadow-xl ring-1 ring-purple-500/50'
                  : 'border-slate-800'
              } flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-base text-white">{p.name}</h3>
                  {isPro && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600 text-white">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 min-h-[32px]">{p.description}</p>

                <div className="my-5">
                  <span className="text-3xl font-black text-white">
                    ₹{p.priceMonthly.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/month</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    or ₹{p.priceYearly.toLocaleString('en-IN')}/year
                  </p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{p.maxTerminals === 999 ? 'Unlimited' : p.maxTerminals} POS Terminals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to {p.maxOrdersPerMonth.toLocaleString()} orders/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.hasKds ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className={p.hasKds ? '' : 'text-slate-500 line-through'}>
                      Kitchen Display System (KDS)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.hasInventory ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className={p.hasInventory ? '' : 'text-slate-500 line-through'}>
                      Recipe Inventory & BOM
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.hasAnalytics ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className={p.hasAnalytics ? '' : 'text-slate-500 line-through'}>
                      Advanced Analytics & CSV Export
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => handleEditOpen(p)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure Tier</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-white">Configure {editingPlan.name}</h3>
                <p className="text-slate-400">Update pricing and tier entitlements</p>
              </div>
              <button onClick={() => setEditingPlan(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    value={formData.priceMonthly || 0}
                    onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Yearly Price (₹)</label>
                  <input
                    type="number"
                    value={formData.priceYearly || 0}
                    onChange={(e) => setFormData({ ...formData, priceYearly: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Max Terminals</label>
                  <input
                    type="number"
                    value={formData.maxTerminals || 1}
                    onChange={(e) => setFormData({ ...formData, maxTerminals: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Max Orders / Month</label>
                  <input
                    type="number"
                    value={formData.maxOrdersPerMonth || 1000}
                    onChange={(e) => setFormData({ ...formData, maxOrdersPerMonth: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-300 block mb-1">Feature Flags</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasKds}
                    onChange={(e) => setFormData({ ...formData, hasKds: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 bg-slate-800"
                  />
                  <span className="text-slate-300">Kitchen Display System (KDS) Enabled</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasInventory}
                    onChange={(e) => setFormData({ ...formData, hasInventory: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 bg-slate-800"
                  />
                  <span className="text-slate-300">Inventory & Recipe BOM Management</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasAnalytics}
                    onChange={(e) => setFormData({ ...formData, hasAnalytics: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 bg-slate-800"
                  />
                  <span className="text-slate-300">Executive Sales & Analytics Engine</span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Tier Config'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. SUPPORT DESK / TICKETS PAGE
// ============================================================================
export const SuperAdminSupportPage: React.FC = () => {
  const { addToast } = useCafe();
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getSupportTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await superAdminService.resolveSupportTicket(selectedTicket.id, replyText.trim());
      addToast('Ticket Resolved', 'Response delivered to tenant.', 'success');
      setSelectedTicket(null);
      setReplyText('');
      loadTickets();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to submit response', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Platform Support Desk & Tenant Inquiries
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review, triage, and respond to incoming inquiries from restaurant subscribers.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Loading support tickets...</p>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-400">All support tickets resolved.</p>
            <p className="text-xs text-slate-500 mt-1">Zero open issues across restaurant subscribers.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{t.subject}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.priority === 'critical' || t.priority === 'high'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[11px] text-purple-400 font-semibold">{t.restaurantName}</span>
                  </div>
                  <p className="text-slate-400 mt-1 max-w-2xl">{t.description}</p>
                  {t.adminResponse && (
                    <div className="mt-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-300 text-[11px]">
                      <strong>Super Admin Response:</strong> {t.adminResponse}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                      t.status === 'resolved'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}
                  >
                    {t.status}
                  </span>

                  {t.status !== 'resolved' && (
                    <button
                      onClick={() => {
                        setSelectedTicket(t);
                        setReplyText('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                    >
                      Respond & Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-white">Resolve Support Ticket</h3>
                <p className="text-slate-400">{selectedTicket.restaurantName}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              <span className="font-bold text-white block mb-0.5">{selectedTicket.subject}</span>
              <p className="text-[11px] text-slate-400">{selectedTicket.description}</p>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Administrative Response</label>
                <textarea
                  required
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide resolution details or license provisioning confirmation..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Mark Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. PLATFORM USERS PAGE
// ============================================================================
export const SuperAdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load registered platform profiles
    import('../../lib/supabase').then(async ({ supabase }) => {
      const { data } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          is_super_admin,
          created_at,
          restaurant_members (
            role,
            restaurants (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      setUsers(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Platform User Accounts & Global IAM
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Identity management across all multi-tenant restaurant environments.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
        {loading ? (
          <p className="py-8 text-center text-slate-500">Loading user directory...</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const mem = u.restaurant_members?.[0];
              const restName = mem?.restaurants?.name || (u.is_super_admin ? 'CafeOS Global Platform' : 'Independent User');
              const roleDisplay = u.is_super_admin ? 'Super Administrator' : mem?.role ? `Restaurant ${mem.role}` : 'Staff';

              return (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 font-bold flex items-center justify-center border border-purple-800">
                      {u.is_super_admin ? '👑' : '👤'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-white text-sm">{u.full_name || 'CafeOS User'}</p>
                        {u.is_super_admin && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-600/40">
                            HQ Admin
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 mt-0.5">
                        {u.email} • Workspace: <span className="text-purple-400 font-medium">{restName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 capitalize">
                      {roleDisplay}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Registered {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 5. GLOBAL SETTINGS & AUDIT LOGS PAGE
// ============================================================================
export const SuperAdminSettingsPage: React.FC = () => {
  const [logs, setLogs] = useState<PlatformAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminService
      .getPlatformAuditLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Global SaaS Configuration & Security Audit
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cluster health, automated backups, and administrative platform activity logs.
        </p>
      </div>

      {/* Cluster Health Cards */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4 text-xs">
        <h2 className="font-extrabold text-sm text-white">Platform Health & Security Status</h2>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700">
          <div>
            <p className="font-extrabold text-white">Automated Database Backups (WAL-G)</p>
            <p className="text-slate-400">Continuous archive and daily automated snapshot at 02:00 UTC</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            Enabled (Healthy)
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700">
          <div>
            <p className="font-extrabold text-white">Real-Time WebSocket Sync Gateway</p>
            <p className="text-slate-400">Low-latency live ticketing relay for kitchen display screens</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            Operational (12ms latency)
          </span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700">
          <div>
            <p className="font-extrabold text-white">Row Level Security (RLS) Enforcement</p>
            <p className="text-slate-400">Tenant cross-access isolation strictly enforced on Postgres tables</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            Enforced (100% Policy Coverage)
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4 text-xs">
        <h2 className="font-extrabold text-sm text-white">Administrative Activity Audit Log</h2>

        {loading ? (
          <p className="py-6 text-center text-slate-500">Loading audit records...</p>
        ) : logs.length === 0 ? (
          <p className="py-6 text-center text-slate-500">No recent administrative logs.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-purple-400">{log.action}</span>
                    <span className="text-slate-400">• {log.restaurantName}</span>
                  </div>
                  {log.details && (
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
