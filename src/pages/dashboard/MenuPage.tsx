import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Star,
  Clock,
  Sparkles,
  Flame,
  X,
  Upload,
  ArrowUpDown,
  Layers,
  Check,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { Product, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { storageService } from '../../services/storageService';
import { SafeImage } from '../../components/common/SafeImage';

interface VariantDraft {
  name: string;
  price_adjustment: number;
  is_default: boolean;
}

interface AddonDraft {
  group_title: string;
  option_name: string;
  price: number;
  required: boolean;
  max_select: number;
}

export const MenuPage: React.FC = () => {
  const {
    restaurant,
    categories,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    addCategory,
    deleteCategory,
    reloadMenu,
    addToast
  } = useCafe();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'veg' | 'non-veg' | 'bestseller'>('all');
  const [sortOrder, setSortOrder] = useState<'name' | 'price-asc' | 'price-desc'>('name');

  // Dialog state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'biryani',
    price: 340,
    originalPrice: 380,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    isVeg: true,
    isAvailable: true,
    isBestseller: false,
    prepTimeMinutes: 15,
    calories: 520,
  });

  // Variants & Add-ons state for modal
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [addons, setAddons] = useState<AddonDraft[]>([]);
  const [showCustomizationTab, setShowCustomizationTab] = useState<'basic' | 'variants' | 'addons'>('basic');

  // Storage Image Upload State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category modal state
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🍛');

  // Filter and sort
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === 'all' ||
      (filterType === 'veg' && p.isVeg) ||
      (filterType === 'non-veg' && !p.isVeg) ||
      (filterType === 'bestseller' && p.isBestseller);

    return matchesCat && matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortOrder === 'price-asc') return a.price - b.price;
    if (sortOrder === 'price-desc') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      description: '',
      category: categories.find((c) => c.slug !== 'all')?.slug || 'biryani',
      price: 340,
      originalPrice: 380,
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80',
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      prepTimeMinutes: 15,
      calories: 520,
    });
    setVariants([
      { name: 'Regular Portion', price_adjustment: 0, is_default: true },
    ]);
    setAddons([]);
    setShowCustomizationTab('basic');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setActiveProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice || p.price,
      image: p.image,
      isVeg: p.isVeg,
      isAvailable: p.isAvailable,
      isBestseller: p.isBestseller || false,
      prepTimeMinutes: p.prepTimeMinutes,
      calories: p.calories || 400,
    });

    // Map existing variants
    if (p.variants && p.variants.length > 0) {
      setVariants(
        p.variants.map((v) => ({
          name: v.name,
          price_adjustment: v.priceAdjustment,
          is_default: v.isDefault,
        }))
      );
    } else {
      setVariants([{ name: 'Regular Portion', price_adjustment: 0, is_default: true }]);
    }

    // Map existing customization groups to flat addons
    if (p.customizationGroups && p.customizationGroups.length > 0) {
      const flatAddons: AddonDraft[] = [];
      p.customizationGroups.forEach((g) => {
        g.options.forEach((opt) => {
          flatAddons.push({
            group_title: g.title,
            option_name: opt.name,
            price: opt.price,
            required: g.required,
            max_select: g.maxSelect || 1,
          });
        });
      });
      setAddons(flatAddons);
    } else {
      setAddons([]);
    }

    setShowCustomizationTab('basic');
    setIsEditModalOpen(true);
  };

  // Image upload handler to Supabase Storage
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const publicUrl = await storageService.uploadProductImage(
        restaurant.id,
        file,
        file.name
      );
      setFormData((prev) => ({ ...prev, image: publicUrl }));
      addToast('Image Uploaded', 'Stored securely in Supabase Storage CDN', 'success');
    } catch (err: any) {
      console.error('Storage upload error:', err);
      addToast('Upload Failed', err.message || 'Could not upload image', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Variants management in modal
  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      { name: 'Full Portion', price_adjustment: 120, is_default: false },
    ]);
  };

  const removeVariantRow = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  // Addons management in modal
  const addAddonRow = () => {
    setAddons((prev) => [
      ...prev,
      {
        group_title: 'Accompaniments',
        option_name: 'Garlic Mint Chutney',
        price: 30,
        required: false,
        max_select: 2,
      },
    ]);
  };

  const removeAddonRow = (idx: number) => {
    setAddons((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await addProduct(
      {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        image: formData.image,
        isVeg: formData.isVeg,
        isAvailable: formData.isAvailable,
        isBestseller: formData.isBestseller,
        prepTimeMinutes: Number(formData.prepTimeMinutes),
        calories: Number(formData.calories),
      },
      addons.filter((a) => a.option_name.trim()),
      variants.filter((v) => v.name.trim())
    );
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !formData.name.trim()) return;

    await updateProduct(
      activeProduct.id,
      {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        image: formData.image,
        isVeg: formData.isVeg,
        isAvailable: formData.isAvailable,
        isBestseller: formData.isBestseller,
        prepTimeMinutes: Number(formData.prepTimeMinutes),
        calories: Number(formData.calories),
      },
      addons.filter((a) => a.option_name.trim()),
      variants.filter((v) => v.name.trim())
    );
    setIsEditModalOpen(false);
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await addCategory(newCatName.trim(), newCatIcon);
    setNewCatName('');
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      await deleteCategory(catId);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
            Menu & Catalog Management
          </h1>
          <p className="text-xs text-cafe-muted mt-1">
            Configure dishes, prices, categories, portion variants, and live cloud assets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-cafe-border dark:border-cafe-border-dark bg-white dark:bg-cafe-surface-dark hover:bg-cafe-cream/50 text-cafe-primary dark:text-cafe-cream text-xs font-bold shadow-warm-sm transition-all btn-press"
          >
            + Manage Categories
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all btn-press"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Category Ribbon */}
      <div className="bg-white dark:bg-cafe-surface-dark p-4 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const active = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-cafe-primary text-white border-cafe-primary shadow-sm dark:bg-cafe-accent dark:border-cafe-accent'
                    : 'bg-cafe-light dark:bg-stone-800 text-cafe-primary/80 dark:text-stone-300 border-cafe-border/80 dark:border-cafe-border-dark hover:bg-cafe-sand/50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {cat.itemCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-cafe-sand text-cafe-muted'
                    }`}
                  >
                    {cat.itemCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search, Tag Filter, and Sort */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3 border-t border-cafe-border/60 dark:border-cafe-border-dark">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-cafe-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, ingredients, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-cafe-accent"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {/* Filter buttons */}
            {(['all', 'veg', 'non-veg', 'bestseller'] as const).map((ft) => (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  filterType === ft
                    ? 'bg-cafe-cream text-cafe-primary border border-cafe-accent/60 dark:bg-stone-700 dark:text-white'
                    : 'text-cafe-muted hover:text-cafe-primary'
                }`}
              >
                {ft === 'all' ? 'All Types' : ft}
              </button>
            ))}

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-medium"
            >
              <option value="name">Sort: Name</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cafe-light/70 dark:bg-stone-900/60 border-b border-cafe-border/80 dark:border-cafe-border-dark text-[11px] font-extrabold uppercase tracking-wider text-cafe-muted">
                <th className="py-3.5 px-6">Dish & Recipe</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Customizations</th>
                <th className="py-3.5 px-4">Dietary</th>
                <th className="py-3.5 px-4">Prep Time</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-border/60 dark:divide-cafe-border-dark text-xs">
              {filteredProducts.map((p) => {
                const variantsCount = p.variants?.length || 0;
                const addonsCount = p.customizationGroups?.reduce((acc, g) => acc + g.options.length, 0) || 0;

                return (
                  <tr key={p.id} className="hover:bg-cafe-sand/20 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <SafeImage
                          src={p.image}
                          alt={p.name}
                          category={p.category}
                          className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-warm-sm ring-1 ring-cafe-border/80"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-cafe-primary dark:text-cafe-cream text-sm">
                              {p.name}
                            </p>
                            {p.isBestseller && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Bestseller
                              </span>
                            )}
                          </div>
                          <p className="text-cafe-muted line-clamp-1 max-w-xs mt-0.5 text-[11px]">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-cafe-primary dark:text-stone-300 capitalize">
                      {p.category}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-display font-extrabold text-cafe-accent text-sm">
                        {formatCurrency(p.price, restaurant.currencySymbol)}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="font-display text-[11px] text-stone-400 line-through ml-1.5">
                          {formatCurrency(p.originalPrice, restaurant.currencySymbol)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        {variantsCount > 0 && (
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full inline-block w-fit">
                            {variantsCount} Portion Sizes
                          </span>
                        )}
                        {addonsCount > 0 && (
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full inline-block w-fit">
                            {addonsCount} Add-on Options
                          </span>
                        )}
                        {variantsCount === 0 && addonsCount === 0 && (
                          <span className="text-cafe-muted text-[11px]">Standard</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.isVeg
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {p.isVeg ? 'Vegetarian' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-cafe-muted font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cafe-accent" />
                        {p.prepTimeMinutes} mins
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => toggleProductAvailability(p.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm ${
                          p.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300 border border-stone-300'
                        }`}
                        title="Click to toggle availability"
                      >
                        {p.isAvailable ? 'In Stock' : 'Sold Out (86)'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg border border-cafe-border dark:border-stone-700 hover:bg-cafe-sand/50 text-cafe-primary dark:text-stone-300 transition-colors"
                          title="Edit product, pricing, or customizations"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${p.name}" from your catalog?`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-xl w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <div>
                <h2 className="text-base font-extrabold text-cafe-primary dark:text-cafe-cream">
                  {isAddModalOpen ? 'Create New Menu Product' : 'Edit Menu Product & Recipe'}
                </h2>
                <p className="text-[11px] text-cafe-muted mt-0.5">
                  Real-time synchronization with Supabase PostgreSQL and Storage CDN.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1.5 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 pt-3 border-b border-cafe-border/60">
              <button
                type="button"
                onClick={() => setShowCustomizationTab('basic')}
                className={`pb-2 px-3 text-xs font-bold transition-colors border-b-2 ${
                  showCustomizationTab === 'basic'
                    ? 'border-cafe-accent text-cafe-accent'
                    : 'border-transparent text-cafe-muted hover:text-cafe-primary'
                }`}
              >
                1. Basic Info & Pricing
              </button>
              <button
                type="button"
                onClick={() => setShowCustomizationTab('variants')}
                className={`pb-2 px-3 text-xs font-bold transition-colors border-b-2 ${
                  showCustomizationTab === 'variants'
                    ? 'border-cafe-accent text-cafe-accent'
                    : 'border-transparent text-cafe-muted hover:text-cafe-primary'
                }`}
              >
                2. Portion Variants ({variants.length})
              </button>
              <button
                type="button"
                onClick={() => setShowCustomizationTab('addons')}
                className={`pb-2 px-3 text-xs font-bold transition-colors border-b-2 ${
                  showCustomizationTab === 'addons'
                    ? 'border-cafe-accent text-cafe-accent'
                    : 'border-transparent text-cafe-muted hover:text-cafe-primary'
                }`}
              >
                3. Custom Add-ons ({addons.length})
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit} className="space-y-4 mt-4">
              {showCustomizationTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div>
                    <label className="text-xs font-bold text-cafe-muted">Product / Dish Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Murgh Malai Tikka"
                      className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-cafe-muted">Description & Flavor Profile</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe marinade, cooking method, spices, serving style..."
                      className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-cafe-muted">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl capitalize"
                      >
                        {categories.filter((c) => c.slug !== 'all').map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-cafe-muted">Prep Time (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.prepTimeMinutes}
                        onChange={(e) => setFormData({ ...formData, prepTimeMinutes: Number(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-cafe-muted">Selling Price ({restaurant.currencySymbol})</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-cafe-muted">Original MRP ({restaurant.currencySymbol})</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Supabase Storage Image Upload */}
                  <div>
                    <label className="text-xs font-bold text-cafe-muted">Dish Image (Supabase Storage CDN)</label>
                    <div className="mt-1 flex items-center gap-3">
                      <SafeImage
                        src={formData.image}
                        alt="Preview"
                        category={formData.category}
                        className="w-14 h-14 rounded-2xl object-cover border border-cafe-border shrink-0"
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageFileChange}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={isUploadingImage}
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl border border-cafe-border dark:border-stone-700 text-xs font-bold flex items-center gap-1.5 hover:bg-cafe-sand/50 transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5 text-cafe-accent" />
                            <span>{isUploadingImage ? 'Uploading...' : 'Upload to Cloud Storage'}</span>
                          </button>
                        </div>
                        <input
                          type="url"
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          placeholder="Or paste external image URL..."
                          className="w-full px-2.5 py-1 text-[11px] bg-cafe-light dark:bg-stone-800 border border-cafe-border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-cafe-primary dark:text-cafe-cream">
                      <input
                        type="checkbox"
                        checked={formData.isVeg}
                        onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Vegetarian</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-cafe-primary dark:text-cafe-cream">
                      <input
                        type="checkbox"
                        checked={formData.isBestseller}
                        onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                        className="rounded text-cafe-accent focus:ring-cafe-accent"
                      />
                      <span>Mark as Bestseller</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Variants Tab */}
              {showCustomizationTab === 'variants' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-extrabold text-cafe-primary dark:text-cafe-cream">
                        Portion Sizes & Variants
                      </h3>
                      <p className="text-[10px] text-cafe-muted">
                        e.g. Regular Portion (+₹0), Family Pack (+₹180)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addVariantRow}
                      className="px-2.5 py-1 rounded-lg bg-cafe-sand text-cafe-primary text-xs font-bold hover:bg-cafe-sand/80"
                    >
                      + Add Variant
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {variants.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-cafe-light dark:bg-stone-800 border border-cafe-border">
                        <input
                          type="text"
                          placeholder="Variant Name"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].name = e.target.value;
                            setVariants(updated);
                          }}
                          className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-stone-700 border border-cafe-border rounded-lg font-medium"
                        />
                        <div className="flex items-center gap-1 w-28">
                          <span className="text-[10px] text-cafe-muted">+₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Price delta"
                            value={v.price_adjustment}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].price_adjustment = Number(e.target.value);
                              setVariants(updated);
                            }}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-stone-700 border border-cafe-border rounded-lg font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons Tab */}
              {showCustomizationTab === 'addons' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-extrabold text-cafe-primary dark:text-cafe-cream">
                        Customization Add-ons & Condiments
                      </h3>
                      <p className="text-[10px] text-cafe-muted">
                        Extra chutneys, accompaniments, bread sides, and spice choices
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addAddonRow}
                      className="px-2.5 py-1 rounded-lg bg-cafe-sand text-cafe-primary text-xs font-bold hover:bg-cafe-sand/80"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {addons.map((a, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-cafe-light dark:bg-stone-800 border border-cafe-border space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Group (e.g. Accompaniments)"
                            value={a.group_title}
                            onChange={(e) => {
                              const updated = [...addons];
                              updated[idx].group_title = e.target.value;
                              setAddons(updated);
                            }}
                            className="w-1/2 px-2.5 py-1 text-xs bg-white dark:bg-stone-700 border border-cafe-border rounded-lg font-medium"
                          />
                          <input
                            type="text"
                            placeholder="Option Name (e.g. Burani Raita)"
                            value={a.option_name}
                            onChange={(e) => {
                              const updated = [...addons];
                              updated[idx].option_name = e.target.value;
                              setAddons(updated);
                            }}
                            className="w-1/2 px-2.5 py-1 text-xs bg-white dark:bg-stone-700 border border-cafe-border rounded-lg font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => removeAddonRow(idx)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-cafe-muted">
                          <div className="flex items-center gap-1 w-28">
                            <span>Price: +₹</span>
                            <input
                              type="number"
                              min="0"
                              value={a.price}
                              onChange={(e) => {
                                const updated = [...addons];
                                updated[idx].price = Number(e.target.value);
                                setAddons(updated);
                              }}
                              className="w-16 px-1.5 py-0.5 text-xs bg-white dark:bg-stone-700 border border-cafe-border rounded font-bold"
                            />
                          </div>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={a.required}
                              onChange={(e) => {
                                const updated = [...addons];
                                updated[idx].required = e.target.checked;
                                setAddons(updated);
                              }}
                              className="rounded text-cafe-accent"
                            />
                            <span>Required</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Controls */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-cafe-border dark:border-cafe-border-dark">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-cafe-border dark:border-stone-700 text-xs font-semibold text-cafe-muted hover:bg-cafe-sand/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAddModalOpen ? 'Save Product' : 'Apply Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-md w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <div>
                <h2 className="text-sm font-extrabold text-cafe-primary dark:text-cafe-cream">
                  Manage Menu Categories
                </h2>
                <p className="text-[10px] text-cafe-muted">Create, inspect, and remove menu sections.</p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List current categories with delete */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.filter((c) => c.slug !== 'all').map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-cafe-light dark:bg-stone-800 border border-cafe-border text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{c.icon}</span>
                    <span className="font-bold text-cafe-primary dark:text-cafe-cream">{c.name}</span>
                    <span className="text-[10px] text-cafe-muted">({c.itemCount} items)</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Create new category form */}
            <form onSubmit={handleAddCategorySubmit} className="space-y-3 pt-3 border-t border-cafe-border">
              <span className="text-xs font-bold text-cafe-primary dark:text-cafe-cream block">
                + Create New Category
              </span>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tandoori Kebabs"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border rounded-xl"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    placeholder="Emoji"
                    className="w-full px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border rounded-xl text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-cafe-border text-xs font-semibold text-cafe-muted"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
