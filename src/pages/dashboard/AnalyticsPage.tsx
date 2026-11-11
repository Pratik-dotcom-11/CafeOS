import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Calendar,
  TrendingUp,
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
  IndianRupee,
  Utensils,
  ChevronDown,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  PieChart as PieIcon,
  BarChart3,
  Percent,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useCafe } from '../../context/CafeContext';
import { formatCurrency } from '../../utils/formatters';
import {
  analyticsService,
  CompleteAnalyticsReport,
  DateRangePreset,
  DateRangeFilter
} from '../../services/analyticsService';

export const AnalyticsPage: React.FC = () => {
  const { restaurant, addToast } = useCafe();

  // Date Range States
  const [preset, setPreset] = useState<DateRangePreset>('7days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(false);

  // View States
  const [trendMetric, setTrendMetric] = useState<'revenue' | 'orders'>('revenue');
  const [productTab, setProductTab] = useState<'bestsellers' | 'least_selling' | 'categories'>('bestsellers');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);

  // Report Data
  const [report, setReport] = useState<CompleteAnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch Report
  const loadAnalytics = useCallback(async () => {
    if (!restaurant.id) return;
    setIsLoading(true);
    try {
      const filter: DateRangeFilter = {
        preset,
        startDate: preset === 'custom' ? customStart : undefined,
        endDate: preset === 'custom' ? customEnd : undefined,
      };

      const data = await analyticsService.getFullAnalyticsReport(restaurant.id, filter);
      setReport(data);
    } catch (err: any) {
      console.error('Analytics load error:', err);
      addToast('Analytics Error', err.message || 'Failed to load report', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [restaurant.id, preset, customStart, customEnd, addToast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Export handlers
  const handleExportSummary = () => {
    if (!report) return;
    analyticsService.exportSalesSummaryCSV(report, restaurant.name);
    addToast('Report Downloaded', 'Executive sales summary CSV exported', 'success');
    setIsExportMenuOpen(false);
  };

  const handleExportOrders = () => {
    if (!report) return;
    analyticsService.exportOrdersLedgerCSV(report.orders, restaurant.name);
    addToast('Report Downloaded', 'Orders transaction ledger CSV exported', 'success');
    setIsExportMenuOpen(false);
  };

  const handleExportProducts = () => {
    if (!report) return;
    analyticsService.exportProductPerformanceCSV(report.bestsellers, restaurant.name);
    addToast('Report Downloaded', 'Product performance & velocity CSV exported', 'success');
    setIsExportMenuOpen(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
              Executive Sales Analytics & Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-200">
              Live Database
            </span>
          </div>
          <p className="text-xs text-cafe-muted mt-1">
            Authoritative revenue analytics, customer rush hours, product velocity, and tax breakdowns.
          </p>
        </div>

        {/* Filter Controls & Export Menu */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Preset Buttons */}
          <div className="bg-white dark:bg-cafe-surface-dark p-1 rounded-xl border border-cafe-border dark:border-cafe-border-dark flex items-center shadow-warm-sm">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'this_month', label: 'This Month' },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setPreset(r.id);
                  setIsCustomOpen(false);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  preset === r.id && !isCustomOpen
                    ? 'bg-cafe-primary text-white shadow-sm dark:bg-cafe-accent'
                    : 'text-cafe-muted hover:text-cafe-primary dark:hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}

            <button
              onClick={() => setIsCustomOpen(!isCustomOpen)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                preset === 'custom' || isCustomOpen
                  ? 'bg-cafe-primary text-white shadow-sm dark:bg-cafe-accent'
                  : 'text-cafe-muted hover:text-cafe-primary dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-cafe-border dark:border-cafe-border-dark bg-white dark:bg-stone-800 hover:bg-cafe-light text-cafe-muted transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cafe-accent' : ''}`} />
          </button>

          {/* Export CSV Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-4 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark rounded-2xl shadow-warm-lg p-2 z-30 animate-in zoom-in-95 duration-100">
                <button
                  onClick={handleExportSummary}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-cafe-primary dark:text-cafe-cream hover:bg-cafe-light dark:hover:bg-stone-800 rounded-xl flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Financial Sales Summary</span>
                </button>
                <button
                  onClick={handleExportOrders}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-cafe-primary dark:text-cafe-cream hover:bg-cafe-light dark:hover:bg-stone-800 rounded-xl flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span>Orders Transaction Ledger</span>
                </button>
                <button
                  onClick={handleExportProducts}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-cafe-primary dark:text-cafe-cream hover:bg-cafe-light dark:hover:bg-stone-800 rounded-xl flex items-center gap-2"
                >
                  <Utensils className="w-4 h-4 text-blue-600" />
                  <span>Product Sales & Velocity</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Bar */}
      {isCustomOpen && (
        <div className="bg-white dark:bg-cafe-surface-dark p-4 rounded-2xl border border-cafe-border dark:border-cafe-border-dark shadow-warm flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cafe-muted">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cafe-muted">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
            />
          </div>

          <button
            onClick={() => {
              if (!customStart || !customEnd) {
                addToast('Date Error', 'Please select both start and end dates', 'warning');
                return;
              }
              setPreset('custom');
              loadAnalytics();
            }}
            className="px-4 py-1.5 rounded-xl bg-cafe-primary text-white text-xs font-bold shadow-warm"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* FINANCIAL KPI HIGHLIGHTS */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Revenue (Net + Tax) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
                Total Gross Revenue
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-cafe-primary dark:text-cafe-cream mt-2">
              {formatCurrency(report.summary.totalRevenue, restaurant.currencySymbol)}
            </h3>
            <p className="text-xs mt-1.5 flex items-center gap-1 font-semibold">
              {report.summary.growthRevenuePct >= 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{report.summary.growthRevenuePct}% vs prior period
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {report.summary.growthRevenuePct}% vs prior period
                </span>
              )}
            </p>
          </div>

          {/* Card 2: Net Sales vs Discounts */}
          <div className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
                Net Food Sales (Excl. Tax)
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-cafe-primary dark:text-cafe-cream mt-2">
              {formatCurrency(report.summary.netSales, restaurant.currencySymbol)}
            </h3>
            <p className="text-[11px] text-cafe-muted font-medium mt-1.5 flex items-center gap-1">
              <span>Gross: {formatCurrency(report.summary.grossSales, restaurant.currencySymbol)}</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">
                Disc: -{formatCurrency(report.summary.discounts, restaurant.currencySymbol)}
              </span>
            </p>
          </div>

          {/* Card 3: Average Order Value (AOV) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
                Avg. Ticket Size (AOV)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-cafe-accent flex items-center justify-center font-bold">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-cafe-primary dark:text-cafe-cream mt-2">
              {formatCurrency(report.summary.averageOrderValue, restaurant.currencySymbol)}
            </h3>
            <p className="text-xs text-cafe-muted font-medium mt-1.5">
              Avg. {report.summary.itemsPerOrder} dishes per order ticket
            </p>
          </div>

          {/* Card 4: Orders Volume & Cancellations */}
          <div className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
                Orders & Fulfillment
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="font-display text-2xl font-bold tracking-tight text-cafe-primary dark:text-cafe-cream">
                {report.summary.completedOrders}{' '}
                <span className="text-xs text-cafe-muted font-semibold">/ {report.summary.totalOrders} total</span>
              </h3>
              <span className="text-xs font-bold text-emerald-600">
                {report.summary.totalOrders > 0
                  ? Math.round((report.summary.completedOrders / report.summary.totalOrders) * 100)
                  : 0}% Success
              </span>
            </div>
            <p className="text-[11px] text-cafe-muted font-medium mt-1.5 flex items-center gap-1">
              {report.summary.cancelledOrders > 0 ? (
                <span className="text-rose-600 font-semibold">
                  {report.summary.cancelledOrders} cancelled (-{formatCurrency(report.summary.cancelledRevenue, restaurant.currencySymbol)})
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold">0 cancellations recorded</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* CHARTS SECTION 1: Revenue Over Time & Dining Channel Split */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Time-Series Area Chart (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-extrabold text-cafe-primary dark:text-cafe-cream">
                  Revenue & Sales Momentum
                </h2>
                <p className="text-xs text-cafe-muted">
                  Daily earnings and ticket volume across selected period
                </p>
              </div>

              <div className="flex items-center gap-1 bg-cafe-light dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setTrendMetric('revenue')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    trendMetric === 'revenue' ? 'bg-cafe-accent text-white shadow-sm' : 'text-cafe-muted'
                  }`}
                >
                  Revenue (₹)
                </button>
                <button
                  onClick={() => setTrendMetric('orders')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    trendMetric === 'orders' ? 'bg-cafe-accent text-white shadow-sm' : 'text-cafe-muted'
                  }`}
                >
                  Orders Count
                </button>
              </div>
            </div>

            {report.dailyTrends.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-cafe-muted">
                <AlertCircle className="w-8 h-8 stroke-1 text-cafe-muted/60 mb-2" />
                <p className="text-xs font-bold">No orders recorded in this period</p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.dailyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D97736" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D97736" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D7" opacity={0.6} />
                    <XAxis dataKey="day" stroke="#817970" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#817970"
                      fontSize={10}
                      tickLine={false}
                      domain={[
                        0,
                        (dataMax: number) => {
                          const fallback = trendMetric === 'revenue' ? 5000 : 10;
                          const max = typeof dataMax === 'number' && !isNaN(dataMax) && dataMax > 0 ? dataMax : fallback;
                          const step = trendMetric === 'revenue' ? 1000 : 5;
                          return Math.ceil((max * 1.15) / step) * step;
                        }
                      ]}
                      tickFormatter={(v) => {
                        if (v === 0) return trendMetric === 'revenue' ? '₹0' : '0';
                        if (trendMetric === 'revenue') {
                          const inK = v / 1000;
                          return Number.isInteger(inK) ? `₹${inK}k` : `₹${inK.toFixed(1)}k`;
                        }
                        return `${v}`;
                      }}
                    />
                    <Tooltip
                      formatter={(v: number) =>
                        trendMetric === 'revenue'
                          ? [formatCurrency(v, restaurant.currencySymbol), 'Total Revenue']
                          : [`${v} tickets`, 'Orders Count']
                      }
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E8E1D7',
                        boxShadow: '0 4px 12px rgba(48,32,25,0.08)',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={trendMetric === 'revenue' ? 'revenue' : 'orders'}
                      stroke="#D97736"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#analyticsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Dining Channel Split Donut (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-extrabold text-cafe-primary dark:text-cafe-cream">
                Dining Channel Preference
              </h2>
              <p className="text-xs text-cafe-muted">Dine-in vs takeaway vs home delivery ratio</p>
            </div>

            <div className="h-52 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.channelSplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="orders"
                  >
                    {report.channelSplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name: string) => [`${v} orders`, name]}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 border-t border-cafe-border/60 dark:border-cafe-border-dark pt-3">
              {report.channelSplit.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-semibold text-cafe-primary dark:text-stone-300">{c.name}</span>
                  </span>
                  <span className="font-bold text-cafe-primary dark:text-cafe-cream">
                    {c.orders} ({c.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CHARTS SECTION 2: Hourly Traffic & Rush Hours */}
      {report && (
        <div className="bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cafe-accent" />
                <h2 className="text-base font-extrabold text-cafe-primary dark:text-cafe-cream">
                  Peak Business Hours & Rush Velocity
                </h2>
              </div>
              <p className="text-xs text-cafe-muted mt-0.5">
                Hourly order concentration to optimize kitchen prep and staff scheduling
              </p>
            </div>

            <span className="text-xs font-bold text-cafe-accent bg-cafe-accent/10 px-3 py-1 rounded-full self-start sm:self-auto">
              Busiest Hour: {report.peakHour.hour} ({report.peakHour.traffic} orders • {formatCurrency(report.peakHour.sales, restaurant.currencySymbol)})
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.hourlyTraffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D7" opacity={0.6} />
                <XAxis dataKey="hour" stroke="#817970" fontSize={10} tickLine={false} />
                <YAxis stroke="#817970" fontSize={10} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v} orders`, 'Order Volume']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E8E1D7',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="traffic" fill="#D97736" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* PRODUCT PERFORMANCE & CATEGORY ANALYTICS */}
      {report && (
        <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm overflow-hidden">
          <div className="p-6 border-b border-cafe-border dark:border-cafe-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-cafe-primary dark:text-cafe-cream">
                Culinary Performance & Product Velocity
              </h2>
              <p className="text-xs text-cafe-muted">
                Analyze individual dish popularity, sales contribution, and category performance
              </p>
            </div>

            <div className="flex items-center gap-1 bg-cafe-light dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setProductTab('bestsellers')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  productTab === 'bestsellers'
                    ? 'bg-cafe-primary text-white shadow-sm dark:bg-cafe-accent'
                    : 'text-cafe-muted'
                }`}
              >
                Top Bestsellers
              </button>
              <button
                onClick={() => setProductTab('least_selling')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  productTab === 'least_selling'
                    ? 'bg-cafe-primary text-white shadow-sm dark:bg-cafe-accent'
                    : 'text-cafe-muted'
                }`}
              >
                Least-Selling Items
              </button>
              <button
                onClick={() => setProductTab('categories')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  productTab === 'categories'
                    ? 'bg-cafe-primary text-white shadow-sm dark:bg-cafe-accent'
                    : 'text-cafe-muted'
                }`}
              >
                Sales by Category
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {productTab === 'categories' ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-cafe-light/70 dark:bg-stone-900/60 border-b border-cafe-border/80 dark:border-cafe-border-dark text-[11px] font-extrabold uppercase tracking-wider text-cafe-muted">
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-4">Units Sold</th>
                    <th className="py-3.5 px-4">Orders Share</th>
                    <th className="py-3.5 px-4">Total Revenue</th>
                    <th className="py-3.5 px-6 text-right">Revenue Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cafe-border/60 dark:divide-cafe-border-dark">
                  {report.categories.map((cat) => (
                    <tr key={cat.category} className="hover:bg-cafe-sand/20 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-4 px-6 font-black text-cafe-primary dark:text-cafe-cream">
                        {cat.category}
                      </td>
                      <td className="py-4 px-4 font-bold text-cafe-primary dark:text-cafe-cream">
                        {cat.unitsSold} units
                      </td>
                      <td className="py-4 px-4 text-cafe-muted">
                        In {cat.orderCount} tickets
                      </td>
                      <td className="py-4 px-4 font-black text-cafe-primary dark:text-cafe-cream">
                        {formatCurrency(cat.revenue, restaurant.currencySymbol)}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-cafe-accent">
                        {cat.sharePct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-cafe-light/70 dark:bg-stone-900/60 border-b border-cafe-border/80 dark:border-cafe-border-dark text-[11px] font-extrabold uppercase tracking-wider text-cafe-muted">
                    <th className="py-3.5 px-6">Rank & Dish</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Units Sold</th>
                    <th className="py-3.5 px-4">Avg. Price</th>
                    <th className="py-3.5 px-4">Gross Revenue</th>
                    <th className="py-3.5 px-6 text-right">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cafe-border/60 dark:divide-cafe-border-dark">
                  {(productTab === 'bestsellers' ? report.bestsellers : report.leastSelling).map((prod, idx) => (
                    <tr key={prod.name} className="hover:bg-cafe-sand/20 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-cafe-primary dark:text-cafe-cream">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 text-center text-xs font-black text-cafe-muted">
                            #{idx + 1}
                          </span>
                          <span
                            className={`w-2.5 h-2.5 rounded-sm border ${
                              prod.isVeg ? 'border-emerald-600 bg-emerald-500' : 'border-rose-600 bg-rose-500'
                            }`}
                            title={prod.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                          />
                          <span>{prod.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-cafe-muted font-medium">
                        {prod.category}
                      </td>
                      <td className="py-4 px-4 font-black text-cafe-primary dark:text-cafe-cream">
                        {prod.unitsSold}
                      </td>
                      <td className="py-4 px-4 text-cafe-muted">
                        {formatCurrency(prod.unitPrice, restaurant.currencySymbol)}
                      </td>
                      <td className="py-4 px-4 font-black text-cafe-primary dark:text-cafe-cream">
                        {formatCurrency(prod.revenue, restaurant.currencySymbol)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-cafe-light dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-cafe-accent h-full rounded-full"
                              style={{ width: `${Math.min(100, prod.revenueSharePct * 3)}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-cafe-accent">
                            {prod.revenueSharePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT & FINANCIAL COMPOSITION */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Method Distribution */}
          <div className="bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm">
            <h3 className="font-black text-sm text-cafe-primary dark:text-cafe-cream">
              Payment Method Breakdown
            </h3>
            <p className="text-xs text-cafe-muted mt-0.5">
              UPI, Card and Counter settlements in the selected window
            </p>

            <div className="mt-4 space-y-3">
              {report.paymentSplit.map((p) => (
                <div key={p.method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-cafe-primary dark:text-cafe-cream">{p.label}</span>
                    <span className="font-black text-cafe-primary dark:text-cafe-cream">
                      {formatCurrency(p.revenue, restaurant.currencySymbol)} ({p.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-cafe-light dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Reconciliation Summary */}
          <div className="bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm flex flex-col justify-between">
            <div>
              <h3 className="font-black text-sm text-cafe-primary dark:text-cafe-cream">
                GST Tax & Discount Reconciliation
              </h3>
              <p className="text-xs text-cafe-muted mt-0.5">
                Indian Goods & Services Tax (2.5% CGST + 2.5% SGST)
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-cafe-border/50">
                  <span className="text-cafe-muted">Gross Bill Subtotal:</span>
                  <span className="font-bold text-cafe-primary dark:text-cafe-cream">
                    {formatCurrency(report.summary.grossSales, restaurant.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-cafe-border/50">
                  <span className="text-cafe-muted">Less Discounts & Promos:</span>
                  <span className="font-bold text-amber-600">
                    -{formatCurrency(report.summary.discounts, restaurant.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-cafe-border/50">
                  <span className="text-cafe-muted">Net Food & Beverage Value:</span>
                  <span className="font-bold text-cafe-primary dark:text-cafe-cream">
                    {formatCurrency(report.summary.netSales, restaurant.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-cafe-border/50">
                  <span className="text-cafe-muted">Total GST Collected (5%):</span>
                  <span className="font-bold text-emerald-600">
                    +{formatCurrency(report.summary.taxes, restaurant.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-cafe-border dark:border-cafe-border-dark flex items-center justify-between">
              <span className="text-xs font-black uppercase text-cafe-muted">Net Settled Revenue</span>
              <span className="text-lg font-black text-cafe-primary dark:text-cafe-cream">
                {formatCurrency(report.summary.totalRevenue, restaurant.currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
