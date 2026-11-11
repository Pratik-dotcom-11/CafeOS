import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type { Category, Product, CustomizationGroup, ProductVariant } from '../types';

export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type ProductAddonRow = Database['public']['Tables']['product_addons']['Row'];
export type ProductVariantRow = Database['public']['Tables']['product_variants']['Row'];

export interface ProductWithDetails extends ProductRow {
  addons?: ProductAddonRow[];
  variants?: ProductVariantRow[];
  category?: CategoryRow;
}

/**
 * Helper: Transform database rows into frontend Product format
 */
export function mapDatabaseProductToUI(
  prod: ProductWithDetails,
  categorySlug?: string
): Product {
  // Group flat addon rows by group_title
  const groupMap = new Map<string, { title: string; required: boolean; maxSelect: number; options: any[] }>();

  if (prod.addons && prod.addons.length > 0) {
    for (const addon of prod.addons) {
      if (!groupMap.has(addon.group_title)) {
        groupMap.set(addon.group_title, {
          title: addon.group_title,
          required: addon.required,
          maxSelect: addon.max_select || 1,
          options: [],
        });
      }
      groupMap.get(addon.group_title)!.options.push({
        id: addon.id,
        name: addon.option_name,
        price: Number(addon.price) || 0,
      });
    }
  }

  const customizationGroups: CustomizationGroup[] = Array.from(groupMap.values()).map((g, idx) => ({
    id: `grp-${prod.id}-${idx}`,
    title: g.title,
    required: g.required,
    maxSelect: g.maxSelect,
    options: g.options,
  }));

  const variants: ProductVariant[] = (prod.variants || []).map((v) => ({
    id: v.id,
    name: v.name,
    priceAdjustment: Number(v.price_adjustment) || 0,
    isDefault: v.is_default,
  }));

  return {
    id: prod.id,
    name: prod.name,
    description: prod.description || '',
    category: categorySlug || prod.category?.slug || prod.category_id,
    price: Number(prod.price) || 0,
    originalPrice: prod.original_price ? Number(prod.original_price) : undefined,
    image: prod.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    isVeg: Boolean(prod.is_veg),
    isAvailable: Boolean(prod.is_available),
    isBestseller: Boolean(prod.is_bestseller),
    rating: Number(prod.rating) || 5.0,
    reviewCount: Number(prod.review_count) || 12,
    prepTimeMinutes: Number(prod.prep_time_minutes) || 15,
    calories: prod.calories || undefined,
    customizationGroups: customizationGroups.length > 0 ? customizationGroups : undefined,
    variants: variants.length > 0 ? variants : undefined,
  };
}

export const menuService = {
  // ==========================================
  // 1. CATEGORY MANAGEMENT
  // ==========================================

  /**
   * Fetch all categories for a restaurant.
   */
  async getCategories(restaurantId: string, onlyActive = false): Promise<CategoryRow[]> {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new category with slug collision avoidance.
   */
  async createCategory(category: {
    restaurant_id: string;
    name: string;
    slug?: string;
    icon?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<CategoryRow> {
    let cleanSlug = (category.slug || category.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-');

    if (!cleanSlug) cleanSlug = `cat-${Date.now()}`;

    // Verify unique slug in this restaurant
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('restaurant_id', category.restaurant_id)
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (existing) {
      cleanSlug = `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        restaurant_id: category.restaurant_id,
        name: category.name.trim(),
        slug: cleanSlug,
        icon: category.icon || '🍛',
        sort_order: category.sort_order ?? 0,
        is_active: category.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update category properties (name, slug, icon, sort_order, is_active).
   */
  async updateCategory(id: string, updates: Partial<CategoryUpdate>): Promise<CategoryRow> {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Toggle category visibility status.
   */
  async toggleCategoryVisibility(id: string, isActive: boolean): Promise<CategoryRow> {
    return this.updateCategory(id, { is_active: isActive });
  },

  /**
   * Update category ordering in bulk.
   */
  async updateCategoryOrdering(items: { id: string; sort_order: number }[]): Promise<void> {
    for (const item of items) {
      await supabase
        .from('categories')
        .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }
  },

  /**
   * Delete category by UUID.
   */
  async deleteCategory(id: string): Promise<void> {
    // Check if category has associated products
    const { count, error: countErr } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countErr) throw countErr;

    if (count && count > 0) {
      throw new Error(
        `Cannot delete this category because it contains ${count} active product(s). Please reassign or delete dishes first.`
      );
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================================
  // 2. PRODUCT MANAGEMENT & CUSTOMIZATION
  // ==========================================

  /**
   * Fetch all products for a restaurant, with optional category filtering.
   */
  async getProducts(
    restaurantId: string,
    categoryId?: string,
    onlyAvailable = false
  ): Promise<ProductWithDetails[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        addons:product_addons(*),
        variants:product_variants(*),
        category:categories(*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    if (onlyAvailable) {
      query = query.eq('is_available', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as ProductWithDetails[]) || [];
  },

  /**
   * Fetch a single product by UUID with all relations.
   */
  async getProductWithDetails(id: string): Promise<ProductWithDetails | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        addons:product_addons(*),
        variants:product_variants(*),
        category:categories(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as ProductWithDetails) || null;
  },

  /**
   * Create a new product along with optional variants and add-on customization groups.
   */
  async createProduct(
    product: {
      restaurant_id: string;
      category_id: string;
      name: string;
      slug?: string;
      description?: string;
      price: number;
      original_price?: number | null;
      image_url?: string;
      is_veg?: boolean;
      is_available?: boolean;
      is_bestseller?: boolean;
      prep_time_minutes?: number;
      calories?: number | null;
      sort_order?: number;
    },
    addons?: {
      group_title: string;
      required?: boolean;
      max_select?: number;
      option_name: string;
      price: number;
      sort_order?: number;
    }[],
    variants?: {
      name: string;
      price_adjustment: number;
      is_default?: boolean;
      sort_order?: number;
    }[]
  ): Promise<ProductWithDetails> {
    // 1. Validation
    if (product.price < 0) {
      throw new Error('Product price cannot be negative.');
    }
    if (product.original_price != null && product.original_price < product.price) {
      throw new Error('Original price must be greater than or equal to current price.');
    }

    // 2. Ensure unique slug
    let cleanSlug = (product.slug || product.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-');
    if (!cleanSlug) cleanSlug = `prod-${Date.now()}`;

    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('restaurant_id', product.restaurant_id)
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (existing) {
      cleanSlug = `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // 3. Insert Product
    const { data: createdProduct, error: prodErr } = await supabase
      .from('products')
      .insert({
        restaurant_id: product.restaurant_id,
        category_id: product.category_id,
        name: product.name.trim(),
        slug: cleanSlug,
        description: product.description || '',
        price: product.price,
        original_price: product.original_price,
        image_url: product.image_url || '',
        is_veg: product.is_veg ?? false,
        is_available: product.is_available ?? true,
        is_bestseller: product.is_bestseller ?? false,
        prep_time_minutes: product.prep_time_minutes ?? 15,
        calories: product.calories,
        sort_order: product.sort_order ?? 0,
      })
      .select()
      .single();

    if (prodErr) throw prodErr;

    // 4. Insert Addons if any
    if (addons && addons.length > 0) {
      const addonsPayload = addons.map((a, idx) => ({
        product_id: createdProduct.id,
        group_title: a.group_title.trim(),
        required: a.required ?? false,
        max_select: a.max_select ?? 1,
        option_name: a.option_name.trim(),
        price: a.price,
        sort_order: a.sort_order ?? idx,
      }));
      const { error: addonErr } = await supabase.from('product_addons').insert(addonsPayload);
      if (addonErr) console.warn('Could not insert product addons:', addonErr);
    }

    // 5. Insert Variants if any
    if (variants && variants.length > 0) {
      const variantsPayload = variants.map((v, idx) => ({
        product_id: createdProduct.id,
        name: v.name.trim(),
        price_adjustment: v.price_adjustment,
        is_default: v.is_default ?? idx === 0,
        sort_order: v.sort_order ?? idx,
      }));
      const { error: varErr } = await supabase.from('product_variants').insert(variantsPayload);
      if (varErr) console.warn('Could not insert product variants:', varErr);
    }

    const details = await this.getProductWithDetails(createdProduct.id);
    return details || (createdProduct as ProductWithDetails);
  },

  /**
   * Update an existing product and synchronize its variants and customization add-ons.
   */
  async updateProductWithDetails(
    id: string,
    updates: Partial<ProductUpdate>,
    addons?: {
      group_title: string;
      required?: boolean;
      max_select?: number;
      option_name: string;
      price: number;
      sort_order?: number;
    }[],
    variants?: {
      name: string;
      price_adjustment: number;
      is_default?: boolean;
      sort_order?: number;
    }[]
  ): Promise<ProductWithDetails> {
    if (updates.price != null && updates.price < 0) {
      throw new Error('Price cannot be negative.');
    }

    // 1. Update product table
    const { data: updated, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 2. Synchronize addons if supplied
    if (addons !== undefined) {
      await supabase.from('product_addons').delete().eq('product_id', id);
      if (addons.length > 0) {
        const payload = addons.map((a, idx) => ({
          product_id: id,
          group_title: a.group_title.trim(),
          required: a.required ?? false,
          max_select: a.max_select ?? 1,
          option_name: a.option_name.trim(),
          price: a.price,
          sort_order: a.sort_order ?? idx,
        }));
        await supabase.from('product_addons').insert(payload);
      }
    }

    // 3. Synchronize variants if supplied
    if (variants !== undefined) {
      await supabase.from('product_variants').delete().eq('product_id', id);
      if (variants.length > 0) {
        const payload = variants.map((v, idx) => ({
          product_id: id,
          name: v.name.trim(),
          price_adjustment: v.price_adjustment,
          is_default: v.is_default ?? idx === 0,
          sort_order: v.sort_order ?? idx,
        }));
        await supabase.from('product_variants').insert(payload);
      }
    }

    const details = await this.getProductWithDetails(id);
    return details || (updated as ProductWithDetails);
  },

  /**
   * Toggle product availability (In-stock / 86 status).
   */
  async toggleProductAvailability(id: string, isAvailable: boolean): Promise<ProductRow> {
    const { data, error } = await supabase
      .from('products')
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a product by UUID.
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================================
  // 3. PUBLIC CUSTOMER-FACING MENU INTEGRATION
  // ==========================================

  /**
   * Retrieve the complete public digital menu for a restaurant by URL slug.
   * Only returns active categories and in-stock dishes.
   */
  async getPublicMenu(restaurantSlugOrId: string): Promise<{
    restaurant: any;
    categories: Category[];
    products: Product[];
  }> {
    // 1. Fetch public restaurant details by slug or by UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantSlugOrId);

    let restQuery = supabase
      .from('restaurants')
      .select(`
        id,
        name,
        slug,
        tagline,
        description,
        logo_url,
        banner_url,
        cuisine,
        rating,
        address,
        city,
        contact_phone,
        contact_email,
        opening_hours,
        currency,
        currency_symbol,
        tax_percentage,
        delivery_available,
        takeaway_available,
        is_active
      `)
      .eq('is_active', true);

    if (isUuid) {
      restQuery = restQuery.eq('id', restaurantSlugOrId);
    } else {
      restQuery = restQuery.eq('slug', restaurantSlugOrId);
    }

    const { data: restaurant, error: restErr } = await restQuery.maybeSingle();

    if (restErr) throw restErr;
    if (!restaurant) {
      throw new Error(`Restaurant "${restaurantSlugOrId}" was not found or is currently inactive.`);
    }

    // 2. Fetch active categories
    const { data: catRows, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (catErr) throw catErr;

    // 3. Fetch available products with relations
    const { data: prodRows, error: prodErr } = await supabase
      .from('products')
      .select(`
        *,
        addons:product_addons(*),
        variants:product_variants(*)
      `)
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true)
      .order('sort_order', { ascending: true });

    if (prodErr) throw prodErr;

    // Build category map and counts
    const categoryCountMap = new Map<string, number>();
    (prodRows || []).forEach((p) => {
      const cId = p.category_id;
      categoryCountMap.set(cId, (categoryCountMap.get(cId) || 0) + 1);
    });

    const categories: Category[] = (catRows || []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      itemCount: categoryCountMap.get(c.id) || 0,
    }));

    // Map DB products to UI Product format
    const catIdToSlug = new Map<string, string>();
    (catRows || []).forEach((c) => catIdToSlug.set(c.id, c.slug));

    const products: Product[] = (prodRows || []).map((p) =>
      mapDatabaseProductToUI(p as ProductWithDetails, catIdToSlug.get(p.category_id))
    );

    return {
      restaurant,
      categories,
      products,
    };
  },
};

export default menuService;
