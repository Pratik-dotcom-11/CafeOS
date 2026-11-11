import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Sparkles,
  X,
  BookOpen,
  History,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  ChefHat,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { formatCurrency } from '../../utils/formatters';
import {
  inventoryService,
  IngredientRow,
  SupplierRow,
  StockMovementRow,
  RecipeWithDetails,
  InventoryKPIs
} from '../../services/inventoryService';

type TabType = 'inventory' | 'recipes' | 'suppliers' | 'history';

export const InventoryPage: React.FC = () => {
  const { restaurant, addToast, products } = useCafe();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('inventory');

  // Live Data States
  const [ingredients, setIngredients] = useState<(IngredientRow & { supplier?: SupplierRow })[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [stockMovements, setStockMovements] = useState<(StockMovementRow & { ingredient?: { name: string; unit: string } })[]>([]);
  const [kpis, setKpis] = useState<InventoryKPIs>({
    totalCount: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValuation: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [selectedIngredientForAdjust, setSelectedIngredientForAdjust] = useState<IngredientRow | null>(null);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedRecipeForEdit, setSelectedRecipeForEdit] = useState<RecipeWithDetails | null>(null);

  // Form: Add Ingredient
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    category: 'Grains & Flours',
    supplier_id: '',
    available_stock: 20,
    min_stock: 10,
    unit: 'kg',
    cost_per_unit: 120,
  });

  // Form: Adjust Stock
  const [adjustData, setAdjustData] = useState({
    delta: 5,
    movementType: 'restock' as 'restock' | 'usage' | 'wastage' | 'adjustment',
    reason: 'Routine weekly restock intake',
  });

  // Form: Add Supplier
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
  });

  // Form: Recipe Editor
  const [recipeForm, setRecipeForm] = useState<{
    productId: string;
    instructions: string;
    items: { ingredientId: string; quantity: number; unit: string }[];
  }>({
    productId: '',
    instructions: '',
    items: [],
  });

  const categories = [
    'all',
    'Grains & Flours',
    'Dairy',
    'Produce',
    'Spices & Seasoning',
    'Beverages',
    'Packaging'
  ];

  // Load authoritative data
  const loadInventoryData = useCallback(async () => {
    if (!restaurant.id) return;
    setIsLoading(true);
    try {
      const [ings, sups, recs, movs, kpiData] = await Promise.all([
        inventoryService.getIngredients(restaurant.id),
        inventoryService.getSuppliers(restaurant.id),
        inventoryService.getRecipes(restaurant.id),
        inventoryService.getStockMovements(restaurant.id, 80),
        inventoryService.getInventoryKPIs(restaurant.id),
      ]);
      setIngredients(ings);
      setSuppliers(sups);
      setRecipes(recs);
      setStockMovements(movs);
      setKpis(kpiData);
    } catch (err: any) {
      console.error('Failed to load inventory data:', err);
      addToast('Error', 'Failed to synchronize live inventory', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [restaurant.id, addToast]);

  useEffect(() => {
    loadInventoryData();
  }, [loadInventoryData]);

  // Handlers
  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name.trim()) return;

    try {
      await inventoryService.createIngredient({
        restaurant_id: restaurant.id,
        supplier_id: newIngredient.supplier_id || null,
        name: newIngredient.name.trim(),
        category: newIngredient.category,
        available_stock: Number(newIngredient.available_stock),
        min_stock: Number(newIngredient.min_stock),
        unit: newIngredient.unit.trim().toLowerCase(),
        cost_per_unit: Number(newIngredient.cost_per_unit),
      });

      addToast('Ingredient Registered', `${newIngredient.name} added to inventory.`, 'success');
      setIsAddIngredientOpen(false);
      setNewIngredient({
        name: '',
        category: 'Grains & Flours',
        supplier_id: '',
        available_stock: 20,
        min_stock: 10,
        unit: 'kg',
        cost_per_unit: 120,
      });
      await loadInventoryData();
    } catch (err: any) {
      addToast('Registration Failed', err.message, 'error');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredientForAdjust) return;

    const deltaValue =
      adjustData.movementType === 'restock'
        ? Math.abs(Number(adjustData.delta))
        : -Math.abs(Number(adjustData.delta));

    try {
      await inventoryService.adjustStock({
        ingredientId: selectedIngredientForAdjust.id,
        restaurantId: restaurant.id,
        delta: deltaValue,
        movementType: adjustData.movementType,
        reason: adjustData.reason.trim() || 'Manual stock update',
      });

      addToast(
        deltaValue > 0 ? 'Stock Restocked' : 'Stock Adjusted',
        `${selectedIngredientForAdjust.name}: ${deltaValue > 0 ? '+' : ''}${deltaValue} ${selectedIngredientForAdjust.unit}`,
        'success'
      );
      setIsAdjustStockOpen(false);
      setSelectedIngredientForAdjust(null);
      await loadInventoryData();
    } catch (err: any) {
      addToast('Adjustment Blocked', err.message, 'error');
    }
  };

  const handleQuickRestock = async (ing: IngredientRow, delta: number) => {
    try {
      await inventoryService.adjustStock({
        ingredientId: ing.id,
        restaurantId: restaurant.id,
        delta,
        movementType: 'restock',
        reason: 'One-click quick restock',
      });
      addToast('Stock Restocked', `Added +${delta} ${ing.unit} of ${ing.name}`, 'success');
      await loadInventoryData();
    } catch (err: any) {
      addToast('Restock Failed', err.message, 'error');
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) return;

    try {
      await inventoryService.createSupplier({
        restaurant_id: restaurant.id,
        name: newSupplier.name.trim(),
        contact_name: newSupplier.contact_name.trim() || null,
        phone: newSupplier.phone.trim() || null,
        email: newSupplier.email.trim() || null,
        address: newSupplier.address.trim() || null,
      });

      addToast('Supplier Added', `${newSupplier.name} registered successfully.`, 'success');
      setIsAddSupplierOpen(false);
      setNewSupplier({ name: '', contact_name: '', phone: '', email: '', address: '' });
      await loadInventoryData();
    } catch (err: any) {
      addToast('Supplier Error', err.message, 'error');
    }
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeForm.productId) {
      addToast('Select Product', 'Please choose a dish to associate recipes with.', 'warning');
      return;
    }

    try {
      await inventoryService.saveRecipe({
        restaurantId: restaurant.id,
        productId: recipeForm.productId,
        yieldServings: 1,
        prepInstructions: recipeForm.instructions,
        items: recipeForm.items.map((it) => ({
          ingredientId: it.ingredientId,
          quantityRequired: Number(it.quantity),
          unit: it.unit,
        })),
      });

      addToast('Recipe Saved', 'Product Bill-of-Materials linked successfully.', 'success');
      setIsRecipeModalOpen(false);
      setSelectedRecipeForEdit(null);
      await loadInventoryData();
    } catch (err: any) {
      addToast('Recipe Error', err.message, 'error');
    }
  };

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((ing) => {
    const matchesCat = selectedCategory === 'all' || ing.category === selectedCategory;
    const matchesSearch =
      ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ing.supplier?.name && ing.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const lowStockItems = ingredients.filter((i) => i.status === 'low-stock' || i.status === 'out-of-stock');

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
              Inventory & Kitchen Supply
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
              Auto-Deduct Active
            </span>
          </div>
          <p className="text-xs text-cafe-muted mt-1">
            Real-time stock management, recipe bill-of-materials, auto order deductions, and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadInventoryData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-cafe-border dark:border-cafe-border-dark bg-white dark:bg-stone-800 hover:bg-cafe-light text-cafe-muted transition-colors"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cafe-accent' : ''}`} />
          </button>

          {activeTab === 'inventory' && (
            <button
              onClick={() => setIsAddIngredientOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Ingredient</span>
            </button>
          )}

          {activeTab === 'recipes' && (
            <button
              onClick={() => {
                setRecipeForm({ productId: '', instructions: '', items: [] });
                setSelectedRecipeForEdit(null);
                setIsRecipeModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Recipe BOM</span>
            </button>
          )}

          {activeTab === 'suppliers' && (
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tracked Items */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
            Tracked Ingredients
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-cafe-primary dark:text-cafe-cream">
              {kpis.totalCount}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-cafe-accent flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-cafe-muted mt-1 font-medium">
            {kpis.inStockCount} items at optimal levels
          </p>
        </div>

        {/* Low Stock Thresholds */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Low Stock Alerts
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-amber-600">
              {kpis.lowStockCount}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-amber-700/80 font-semibold mt-1">
            Below safety buffer threshold
          </p>
        </div>

        {/* Out of Stock (86'd) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Out of Stock (Zero)
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-rose-600">
              {kpis.outOfStockCount}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-rose-700/80 font-semibold mt-1">
            Affects active menu availability
          </p>
        </div>

        {/* Total Stock Valuation (INR) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cafe-muted">
            Total Inventory Valuation
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-cafe-primary dark:text-cafe-cream">
              {formatCurrency(kpis.totalValuation, restaurant.currencySymbol)}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Asset value based on cost/unit
          </p>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">
                Action Required: {lowStockItems.length} Ingredients require restocking
              </h4>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                {lowStockItems.map((i) => `${i.name} (${i.available_stock} ${i.unit})`).slice(0, 3).join(', ')}
                {lowStockItems.length > 3 ? ` +${lowStockItems.length - 3} more` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const first = lowStockItems[0];
                setSelectedIngredientForAdjust(first);
                setAdjustData({
                  delta: Number(first.min_stock) * 2,
                  movementType: 'restock',
                  reason: 'Priority restock from low-stock banner',
                });
                setIsAdjustStockOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors whitespace-nowrap"
            >
              Restock {lowStockItems[0]?.name.split(' ')[0]}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-cafe-border dark:border-cafe-border-dark pb-1">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'inventory'
              ? 'bg-cafe-primary text-white shadow-warm'
              : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-light'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Ingredients & Stock</span>
          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
            {ingredients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'recipes'
              ? 'bg-cafe-primary text-white shadow-warm'
              : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-light'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Recipe BOM ({recipes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'suppliers'
              ? 'bg-cafe-primary text-white shadow-warm'
              : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-light'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Suppliers & Mandis ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'history'
              ? 'bg-cafe-primary text-white shadow-warm'
              : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-light'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement Ledger</span>
        </button>
      </div>

      {/* TAB 1: INGREDIENTS LIST */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Category Filter & Search Bar */}
          <div className="bg-white dark:bg-cafe-surface-dark p-4 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-cafe-accent text-white shadow-warm-sm'
                      : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-sand/40'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-cafe-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ingredients, spices or suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-cafe-accent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-cafe-light/70 dark:bg-stone-900/60 border-b border-cafe-border/80 dark:border-cafe-border-dark text-[11px] font-extrabold uppercase tracking-wider text-cafe-muted">
                    <th className="py-3.5 px-6">Ingredient</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Available Stock</th>
                    <th className="py-3.5 px-4">Min. Threshold</th>
                    <th className="py-3.5 px-4">Unit Cost</th>
                    <th className="py-3.5 px-4">Primary Supplier</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cafe-border/60 dark:divide-cafe-border-dark">
                  {filteredIngredients.map((ing) => {
                    const statusStyles = {
                      'in-stock': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      'low-stock': 'bg-amber-50 text-amber-700 border-amber-200',
                      'out-of-stock': 'bg-rose-50 text-rose-700 border-rose-200',
                    }[ing.status || 'in-stock'];

                    return (
                      <tr key={ing.id} className="hover:bg-cafe-sand/20 dark:hover:bg-stone-800/40 transition-colors">
                        <td className="py-4 px-6 font-black text-cafe-primary dark:text-cafe-cream">
                          {ing.name}
                        </td>
                        <td className="py-4 px-4 text-cafe-muted font-medium">
                          {ing.category}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-black text-sm text-cafe-primary dark:text-cafe-cream">
                            {Number(ing.available_stock).toFixed(ing.unit === 'units' ? 0 : 2)}
                          </span>{' '}
                          <span className="text-xs font-semibold text-cafe-muted">{ing.unit}</span>
                        </td>
                        <td className="py-4 px-4 text-cafe-muted">
                          {Number(ing.min_stock).toFixed(ing.unit === 'units' ? 0 : 2)} {ing.unit}
                        </td>
                        <td className="py-4 px-4 font-bold text-cafe-primary dark:text-cafe-cream">
                          {formatCurrency(Number(ing.cost_per_unit), restaurant.currencySymbol)} / {ing.unit}
                        </td>
                        <td className="py-4 px-4 font-semibold text-cafe-muted">
                          {ing.supplier?.name || 'Verified Indian Mandi'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles} capitalize`}>
                            {ing.status?.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleQuickRestock(ing, 10)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition-colors"
                              title="Quick add 10 units"
                            >
                              +10 {ing.unit}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedIngredientForAdjust(ing);
                                setAdjustData({
                                  delta: 5,
                                  movementType: 'restock',
                                  reason: 'Routine restock',
                                });
                                setIsAdjustStockOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cafe-sand/60 dark:bg-stone-800 hover:bg-cafe-accent hover:text-white border border-cafe-border dark:border-stone-700 text-[11px] font-bold text-cafe-primary dark:text-cafe-cream transition-colors"
                            >
                              Adjust Stock
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECIPE BILL OF MATERIALS */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((rec) => {
              // Calculate portion cost
              let portionCost = 0;
              (rec.items || []).forEach((it) => {
                const unitCost = Number(it.ingredient?.cost_per_unit || 0);
                portionCost += unitCost * Number(it.quantity_required);
              });
              const menuPrice = Number(rec.product?.price || 0);
              const marginPct = menuPrice > 0 ? Math.round(((menuPrice - portionCost) / menuPrice) * 100) : 0;

              return (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-5 border border-cafe-border dark:border-cafe-border-dark shadow-warm hover:shadow-warm-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-sm text-cafe-primary dark:text-cafe-cream">
                          {rec.product?.name || 'Recipe'}
                        </h3>
                        <p className="text-[11px] text-cafe-muted mt-0.5">
                          Yield: {rec.yield_servings} portion per order
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-cafe-sand text-cafe-accent text-[10px] font-bold">
                        {rec.items?.length || 0} ingredients
                      </span>
                    </div>

                    {rec.prep_instructions && (
                      <p className="text-[11px] text-cafe-muted italic mt-2.5 bg-cafe-light dark:bg-stone-800 p-2.5 rounded-xl border border-cafe-border/60">
                        "{rec.prep_instructions}"
                      </p>
                    )}

                    {/* Ingredients Breakdown */}
                    <div className="mt-4 space-y-2 border-t border-cafe-border/70 dark:border-cafe-border-dark pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cafe-muted">
                        Ingredient Requirements:
                      </span>
                      {rec.items?.map((it) => (
                        <div key={it.id} className="flex items-center justify-between text-xs">
                          <span className="text-cafe-primary dark:text-cafe-cream font-semibold">
                            {it.ingredient?.name}
                          </span>
                          <span className="text-cafe-muted font-bold">
                            {it.quantity_required} {it.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-cafe-border dark:border-cafe-border-dark flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-cafe-muted">Portion Ingredient Cost</p>
                      <p className="text-xs font-black text-cafe-primary dark:text-cafe-cream">
                        {formatCurrency(portionCost, restaurant.currencySymbol)}
                        <span className="text-[10px] text-emerald-600 font-bold ml-1.5">
                          ({marginPct}% margin)
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedRecipeForEdit(rec);
                        setRecipeForm({
                          productId: rec.product_id,
                          instructions: rec.prep_instructions || '',
                          items: (rec.items || []).map((i) => ({
                            ingredientId: i.ingredient_id,
                            quantity: Number(i.quantity_required),
                            unit: i.unit,
                          })),
                        });
                        setIsRecipeModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cafe-sand/70 dark:bg-stone-800 text-xs font-bold text-cafe-primary dark:text-cafe-cream hover:bg-cafe-accent hover:text-white transition-colors"
                    >
                      Edit Recipe
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-5 border border-cafe-border dark:border-cafe-border-dark shadow-warm hover:shadow-warm-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-cafe-primary dark:text-cafe-cream">
                        {sup.name}
                      </h3>
                      <p className="text-[11px] text-cafe-muted">Verified Commercial Vendor</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-cafe-muted">
                  {sup.contact_name && (
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-3.5 h-3.5 text-cafe-accent shrink-0" />
                      <span className="font-semibold text-cafe-primary dark:text-stone-300">
                        {sup.contact_name}
                      </span>
                    </div>
                  )}

                  {sup.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a href={`tel:${sup.phone}`} className="hover:text-emerald-600 transition-colors">
                        {sup.phone}
                      </a>
                    </div>
                  )}

                  {sup.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <a href={`mailto:${sup.email}`} className="hover:text-blue-600 transition-colors">
                        {sup.email}
                      </a>
                    </div>
                  )}

                  {sup.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{sup.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-cafe-border dark:border-cafe-border-dark flex items-center justify-between">
                <span className="text-[10px] text-cafe-muted font-bold">
                  {ingredients.filter((i) => i.supplier_id === sup.id).length} ingredients linked
                </span>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery(sup.name);
                    setActiveTab('inventory');
                  }}
                  className="text-xs font-bold text-cafe-accent hover:underline flex items-center gap-1"
                >
                  <span>View Items</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: STOCK MOVEMENTS AUDIT LEDGER */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm overflow-hidden">
          <div className="p-4 border-b border-cafe-border dark:border-cafe-border-dark flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-cafe-primary dark:text-cafe-cream">
                Chronological Stock Movement Audit Ledger
              </h3>
              <p className="text-xs text-cafe-muted">
                Immutable record of all restocks, usages, order-driven deductions, and cancellation reversals.
              </p>
            </div>
            <span className="text-xs font-bold text-cafe-muted">
              {stockMovements.length} logged entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-cafe-light/70 dark:bg-stone-900/60 border-b border-cafe-border/80 dark:border-cafe-border-dark text-[11px] font-extrabold uppercase tracking-wider text-cafe-muted">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4">Delta Quantity</th>
                  <th className="py-3 px-4">Stock Ledger (Prev → New)</th>
                  <th className="py-3 px-6">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-border/60 dark:divide-cafe-border-dark">
                {stockMovements.map((mov) => {
                  const isPositive = mov.movement_type === 'restock' || mov.movement_type === 'cancellation_reversal' || mov.movement_type === 'initial_stock';
                  const badgeStyles = {
                    initial_stock: 'bg-purple-50 text-purple-700 border-purple-200',
                    restock: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    order_deduction: 'bg-orange-50 text-orange-700 border-orange-200',
                    cancellation_reversal: 'bg-blue-50 text-blue-700 border-blue-200',
                    usage: 'bg-stone-100 text-stone-700 border-stone-200',
                    wastage: 'bg-rose-50 text-rose-700 border-rose-200',
                    adjustment: 'bg-amber-50 text-amber-700 border-amber-200',
                  }[mov.movement_type] || 'bg-stone-50 text-stone-600 border-stone-200';

                  return (
                    <tr key={mov.id} className="hover:bg-cafe-sand/20 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-[11px] text-cafe-muted">
                        {new Date(mov.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-cafe-primary dark:text-cafe-cream">
                        {mov.ingredient?.name || 'Ingredient'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyles} capitalize`}>
                          {mov.movement_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black">
                        <span className={`flex items-center gap-0.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPositive ? '+' : '-'}{Math.abs(Number(mov.quantity)).toFixed(2)} {mov.ingredient?.unit || ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-cafe-muted">
                        {Number(mov.previous_stock).toFixed(2)} → <span className="font-bold text-cafe-primary dark:text-cafe-cream">{Number(mov.new_stock).toFixed(2)}</span>
                      </td>
                      <td className="py-3.5 px-6 font-medium text-cafe-muted">
                        {mov.reason || 'Manual modification'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD INGREDIENT */}
      {isAddIngredientOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-md w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <h3 className="font-black text-base text-cafe-primary dark:text-cafe-cream">
                Register New Indian Ingredient
              </h3>
              <button onClick={() => setIsAddIngredientOpen(false)} className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddIngredient} className="space-y-3.5 mt-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Ingredient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasuri Methi or Kesar Saffron"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Category</label>
                  <select
                    value={newIngredient.category}
                    onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  >
                    {categories.filter((c) => c !== 'all').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-cafe-muted">Measurement Unit</label>
                  <select
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="liters">liters (L)</option>
                    <option value="ml">ml (Milliliters)</option>
                    <option value="units">units (Pieces)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newIngredient.available_stock}
                    onChange={(e) => setNewIngredient({ ...newIngredient, available_stock: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-cafe-muted">Min Threshold Buffer</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newIngredient.min_stock}
                    onChange={(e) => setNewIngredient({ ...newIngredient, min_stock: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Cost Per Unit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newIngredient.cost_per_unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, cost_per_unit: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-cafe-muted">Primary Supplier</label>
                  <select
                    value={newIngredient.supplier_id}
                    onChange={(e) => setNewIngredient({ ...newIngredient, supplier_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cafe-border dark:border-cafe-border-dark">
                <button
                  type="button"
                  onClick={() => setIsAddIngredientOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-cafe-border text-xs text-cafe-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST STOCK */}
      {isAdjustStockOpen && selectedIngredientForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-md w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <div>
                <h3 className="font-black text-base text-cafe-primary dark:text-cafe-cream">
                  Manual Stock Adjustment
                </h3>
                <p className="text-xs text-cafe-muted mt-0.5">
                  {selectedIngredientForAdjust.name} (Current: {selectedIngredientForAdjust.available_stock} {selectedIngredientForAdjust.unit})
                </p>
              </div>
              <button onClick={() => setIsAdjustStockOpen(false)} className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3.5 mt-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Adjustment Type</label>
                <select
                  value={adjustData.movementType}
                  onChange={(e) => setAdjustData({ ...adjustData, movementType: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                >
                  <option value="restock">Restock / Vendor Purchase (+)</option>
                  <option value="usage">Kitchen Prep Usage (-)</option>
                  <option value="wastage">Spoilage / Wastage (-)</option>
                  <option value="adjustment">Physical Audit Reconciliation (±)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">
                  Quantity ({selectedIngredientForAdjust.unit})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={adjustData.delta}
                  onChange={(e) => setAdjustData({ ...adjustData, delta: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Reason / Audit Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delivery Challan #8821 from Amul"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cafe-border dark:border-cafe-border-dark">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-cafe-border text-xs text-cafe-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
                >
                  Apply Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECIPE BOM EDITOR */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-lg w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <div>
                <h3 className="font-black text-base text-cafe-primary dark:text-cafe-cream">
                  {selectedRecipeForEdit ? 'Edit Recipe Bill-of-Materials' : 'Create Recipe BOM'}
                </h3>
                <p className="text-xs text-cafe-muted mt-0.5">
                  Associate menu items with raw ingredients for auto-deduction.
                </p>
              </div>
              <button onClick={() => setIsRecipeModalOpen(false)} className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Menu Dish</label>
                <select
                  disabled={Boolean(selectedRecipeForEdit)}
                  value={recipeForm.productId}
                  onChange={(e) => setRecipeForm({ ...recipeForm, productId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  required
                >
                  <option value="">Select Menu Dish</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price, restaurant.currencySymbol)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Chef Instructions / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dum-cooked in earthen handi for 25 minutes..."
                  value={recipeForm.instructions}
                  onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cafe-muted">Required Ingredients per Serving</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (ingredients.length === 0) return;
                      const first = ingredients[0];
                      setRecipeForm({
                        ...recipeForm,
                        items: [...recipeForm.items, { ingredientId: first.id, quantity: 0.1, unit: first.unit }],
                      });
                    }}
                    className="text-xs font-bold text-cafe-accent hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                {recipeForm.items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={it.ingredientId}
                      onChange={(e) => {
                        const targetIng = ingredients.find((i) => i.id === e.target.value);
                        const updated = [...recipeForm.items];
                        updated[idx].ingredientId = e.target.value;
                        if (targetIng) updated[idx].unit = targetIng.unit;
                        setRecipeForm({ ...recipeForm, items: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border rounded-xl"
                    >
                      {ingredients.map((i) => (
                        <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={it.quantity}
                      onChange={(e) => {
                        const updated = [...recipeForm.items];
                        updated[idx].quantity = Number(e.target.value);
                        setRecipeForm({ ...recipeForm, items: updated });
                      }}
                      className="w-20 px-2 py-1.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border rounded-xl"
                      placeholder="Qty"
                    />

                    <span className="text-xs font-semibold text-cafe-muted w-10">
                      {it.unit}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setRecipeForm({
                          ...recipeForm,
                          items: recipeForm.items.filter((_, i) => i !== idx),
                        });
                      }}
                      className="p-1 rounded-lg hover:bg-rose-50 text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cafe-border dark:border-cafe-border-dark">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-cafe-border text-xs text-cafe-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
                >
                  Save Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD SUPPLIER */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-md w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <h3 className="font-black text-base text-cafe-primary dark:text-cafe-cream">
                Register Verified Supplier
              </h3>
              <button onClick={() => setIsAddSupplierOpen(false)} className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3.5 mt-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Supplier / Enterprise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amul India Dairy Cooperative"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Harpreet Singh"
                  value={newSupplier.contact_name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contact_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-cafe-muted">Email</label>
                  <input
                    type="email"
                    placeholder="orders@supplier.in"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Mandi / Warehouse Address</label>
                <input
                  type="text"
                  placeholder="e.g. Posta Wholesale Mandi, Burrabazar, Kolkata"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cafe-border dark:border-cafe-border-dark">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-cafe-border text-xs text-cafe-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
