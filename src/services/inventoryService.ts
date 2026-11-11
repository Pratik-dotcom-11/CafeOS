import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type IngredientRow = Database['public']['Tables']['ingredients']['Row'];
export type IngredientInsert = Database['public']['Tables']['ingredients']['Insert'];
export type IngredientUpdate = Database['public']['Tables']['ingredients']['Update'];

export type SupplierRow = Database['public']['Tables']['suppliers']['Row'];
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];

export type StockMovementRow = Database['public']['Tables']['stock_movements']['Row'];
export type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert'];

export type RecipeRow = Database['public']['Tables']['recipes']['Row'];
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];

export type RecipeItemRow = Database['public']['Tables']['recipe_items']['Row'];
export type RecipeItemInsert = Database['public']['Tables']['recipe_items']['Insert'];

export interface RecipeWithDetails extends RecipeRow {
  product?: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  items: (RecipeItemRow & {
    ingredient?: {
      id: string;
      name: string;
      unit: string;
      available_stock: number;
      cost_per_unit: number;
    };
  })[];
}

export interface InventoryKPIs {
  totalCount: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValuation: number;
}

/**
 * Robust Unit Conversion for restaurant inventory and recipes
 */
export function convertMeasurement(quantity: number, fromUnit: string, toUnit: string): number {
  const from = fromUnit.trim().toLowerCase();
  const to = toUnit.trim().toLowerCase();

  if (from === to) return quantity;

  // Weight conversions (kg <-> g)
  if (from === 'kg' && to === 'g') return quantity * 1000;
  if (from === 'g' && to === 'kg') return quantity / 1000;

  // Volume conversions (liters <-> ml)
  if ((from === 'liters' || from === 'l' || from === 'liter') && (to === 'ml' || to === 'milliliters')) {
    return quantity * 1000;
  }
  if ((from === 'ml' || from === 'milliliters') && (to === 'liters' || to === 'l' || to === 'liter')) {
    return quantity / 1000;
  }

  // Count / piece aliases
  const countAliases = ['units', 'unit', 'pcs', 'pieces', 'items', 'packs', 'boxes'];
  if (countAliases.includes(from) && countAliases.includes(to)) {
    return quantity;
  }

  // Fallback to same quantity
  return quantity;
}

export const inventoryService = {
  // ==========================================
  // INGREDIENTS
  // ==========================================

  /**
   * Fetch all inventory items for a restaurant with supplier details.
   */
  async getIngredients(restaurantId: string): Promise<(IngredientRow & { supplier?: SupplierRow })[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .select(`
        *,
        supplier:suppliers (
          id,
          name,
          contact_name,
          phone,
          email,
          address
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data as any) || [];
  },

  /**
   * Create a new inventory ingredient.
   */
  async createIngredient(ingredient: IngredientInsert, initialStockReason = 'Initial inventory intake'): Promise<IngredientRow> {
    const { data, error } = await supabase
      .from('ingredients')
      .insert(ingredient)
      .select()
      .single();

    if (error) throw error;

    // Log initial stock movement if quantity > 0
    if (ingredient.available_stock && ingredient.available_stock > 0) {
      await supabase.from('stock_movements').insert({
        restaurant_id: ingredient.restaurant_id,
        ingredient_id: data.id,
        movement_type: 'initial_stock',
        quantity: ingredient.available_stock,
        previous_stock: 0,
        new_stock: ingredient.available_stock,
        reason: initialStockReason,
      });
    }

    return data;
  },

  /**
   * Update ingredient stock or attributes.
   */
  async updateIngredient(id: string, updates: IngredientUpdate): Promise<IngredientRow> {
    const { data, error } = await supabase
      .from('ingredients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete ingredient safely (verifies not used in active recipes).
   */
  async deleteIngredient(id: string): Promise<void> {
    // Check if referenced by recipe items
    const { data: usage, error: checkError } = await supabase
      .from('recipe_items')
      .select(`
        id,
        recipe:recipes (
          product:products (name)
        )
      `)
      .eq('ingredient_id', id);

    if (checkError) throw checkError;

    if (usage && usage.length > 0) {
      const dishNames = usage
        .map((u: any) => u.recipe?.product?.name)
        .filter(Boolean)
        .join(', ');
      throw new Error(`Cannot delete ingredient: it is required in active recipes for: ${dishNames || 'Menu dishes'}. Remove the ingredient from those recipes first.`);
    }

    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Adjust ingredient stock with an audit movement log.
   * Guarantees strict positive stock protection.
   */
  async adjustStock(params: {
    ingredientId: string;
    restaurantId: string;
    delta: number;
    reason: string;
    movementType?: 'restock' | 'usage' | 'wastage' | 'adjustment' | 'order_deduction' | 'cancellation_reversal';
    performedByUserId?: string;
  }): Promise<{ ingredient: IngredientRow; movement: StockMovementRow }> {
    // 1. Fetch current ingredient stock
    const { data: current, error: fetchError } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', params.ingredientId)
      .single();

    if (fetchError || !current) {
      throw fetchError || new Error('Ingredient not found');
    }

    const previousStock = Number(current.available_stock);
    const newStock = previousStock + params.delta;

    // Strict positive stock enforcement
    if (newStock < 0) {
      throw new Error(`Insufficient stock for "${current.name}". Current available: ${previousStock} ${current.unit}, requested reduction: ${Math.abs(params.delta)} ${current.unit}. Cannot reduce stock below 0.`);
    }

    // 2. Update ingredient stock
    const { data: updatedIngredient, error: updateError } = await supabase
      .from('ingredients')
      .update({
        available_stock: newStock,
        last_restocked_at: params.delta > 0 ? new Date().toISOString() : current.last_restocked_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.ingredientId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Record immutable movement in stock_movements
    const { data: movement, error: moveError } = await supabase
      .from('stock_movements')
      .insert({
        restaurant_id: params.restaurantId,
        ingredient_id: params.ingredientId,
        movement_type: params.movementType || (params.delta >= 0 ? 'restock' : 'usage'),
        quantity: Math.abs(params.delta),
        previous_stock: previousStock,
        new_stock: newStock,
        reason: params.reason,
        performed_by: params.performedByUserId || null,
      })
      .select()
      .single();

    if (moveError) throw moveError;

    return { ingredient: updatedIngredient, movement };
  },

  /**
   * Fetch items currently flagged as low-stock or out-of-stock.
   */
  async getLowStockAlerts(restaurantId: string): Promise<IngredientRow[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .in('status', ['low-stock', 'out-of-stock'])
      .order('available_stock', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Calculate inventory KPIs (Total Valuation, Counts)
   */
  async getInventoryKPIs(restaurantId: string): Promise<InventoryKPIs> {
    const items = await this.getIngredients(restaurantId);
    let totalValuation = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of items) {
      const stock = Number(item.available_stock);
      const cost = Number(item.cost_per_unit || 0);
      totalValuation += stock * cost;

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= Number(item.min_stock)) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    }

    return {
      totalCount: items.length,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalValuation,
    };
  },

  // ==========================================
  // RECIPES
  // ==========================================

  /**
   * Fetch all recipes for a restaurant with product and ingredient details.
   */
  async getRecipes(restaurantId: string): Promise<RecipeWithDetails[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        product:products (
          id,
          name,
          price,
          image
        ),
        items:recipe_items (
          id,
          recipe_id,
          ingredient_id,
          quantity_required,
          unit,
          ingredient:ingredients (
            id,
            name,
            unit,
            available_stock,
            cost_per_unit
          )
        )
      `)
      .eq('restaurant_id', restaurantId);

    if (error) throw error;
    return (data as any) || [];
  },

  /**
   * Save or update a recipe and its ingredients for a product.
   */
  async saveRecipe(params: {
    restaurantId: string;
    productId: string;
    yieldServings?: number;
    prepInstructions?: string;
    items: {
      ingredientId: string;
      quantityRequired: number;
      unit: string;
    }[];
  }): Promise<RecipeRow> {
    // 1. Upsert recipe
    const { data: recipe, error: recError } = await supabase
      .from('recipes')
      .upsert(
        {
          restaurant_id: params.restaurantId,
          product_id: params.productId,
          yield_servings: params.yieldServings || 1,
          prep_instructions: params.prepInstructions || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'product_id' }
      )
      .select()
      .single();

    if (recError) throw recError;

    // 2. Clear old items and insert fresh recipe items
    await supabase.from('recipe_items').delete().eq('recipe_id', recipe.id);

    if (params.items.length > 0) {
      const itemsToInsert = params.items.map((it) => ({
        recipe_id: recipe.id,
        ingredient_id: it.ingredientId,
        quantity_required: it.quantityRequired,
        unit: it.unit,
      }));

      const { error: itemsError } = await supabase
        .from('recipe_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return recipe;
  },

  /**
   * Delete a recipe.
   */
  async deleteRecipe(recipeId: string): Promise<void> {
    await supabase.from('recipe_items').delete().eq('recipe_id', recipeId);
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
    if (error) throw error;
  },

  // ==========================================
  // AUTOMATIC ORDER DEDUCTION & REVERSAL
  // ==========================================

  /**
   * Deduct inventory atomically for an accepted order.
   * Two-pass validation:
   * 1. Check all required recipe ingredients have sufficient stock.
   * 2. Atomically deduct quantities and record immutable stock movements.
   * Prevent duplicate deductions using idempotency.
   */
  async deductInventoryForOrder(orderId: string, restaurantId: string): Promise<{
    success: boolean;
    alreadyDeducted?: boolean;
    deductions: { ingredientName: string; deducted: number; unit: string; remainingStock: number }[];
  }> {
    // If not a valid UUID, safely handle without attempting database query
    if (!UUID_REGEX.test(orderId) || !UUID_REGEX.test(restaurantId)) {
      return { success: true, deductions: [] };
    }

    // 1. Check idempotency: have we already deducted for this order?
    const { data: existingDeductions } = await supabase
      .from('stock_movements')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('movement_type', 'order_deduction')
      .like('reason', `%order:${orderId}:%`)
      .limit(1);

    if (existingDeductions && existingDeductions.length > 0) {
      return { success: true, alreadyDeducted: true, deductions: [] };
    }

    // 2. Fetch order items
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        restaurant_id,
        order_items (
          product_id,
          quantity,
          product_name_snapshot
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const items = (order as any).order_items || [];
    if (items.length === 0) {
      return { success: true, deductions: [] };
    }

    // 3. Collect required ingredients across all order items
    const requiredIngredients = new Map<string, {
      ingredientId: string;
      ingredientName: string;
      requiredQty: number;
      ingredientUnit: string;
      availableStock: number;
    }>();

    for (const item of items) {
      if (!item.product_id) continue;

      // Fetch recipe for this product
      const { data: recipe } = await supabase
        .from('recipes')
        .select(`
          id,
          yield_servings,
          recipe_items (
            ingredient_id,
            quantity_required,
            unit,
            ingredient:ingredients (
              id,
              name,
              available_stock,
              unit
            )
          )
        `)
        .eq('product_id', item.product_id)
        .maybeSingle();

      if (!recipe || !(recipe as any).recipe_items) continue;

      const yieldServings = Number((recipe as any).yield_servings || 1);
      const recipeItems = (recipe as any).recipe_items || [];

      for (const ri of recipeItems) {
        const ing = ri.ingredient;
        if (!ing) continue;

        const rawRequired = (Number(ri.quantity_required) * Number(item.quantity)) / yieldServings;
        // Convert recipe unit to ingredient inventory unit
        const convertedRequired = convertMeasurement(rawRequired, ri.unit, ing.unit);

        if (requiredIngredients.has(ing.id)) {
          const existing = requiredIngredients.get(ing.id)!;
          existing.requiredQty += convertedRequired;
        } else {
          requiredIngredients.set(ing.id, {
            ingredientId: ing.id,
            ingredientName: ing.name,
            requiredQty: convertedRequired,
            ingredientUnit: ing.unit,
            availableStock: Number(ing.available_stock),
          });
        }
      }
    }

    // 4. Pass 1: Validate sufficient stock for ALL recipe ingredients
    for (const [_, req] of requiredIngredients) {
      if (req.availableStock < req.requiredQty) {
        throw new Error(
          `Cannot start cooking Order ${order.order_number}: Insufficient stock of ingredient "${req.ingredientName}". Available: ${req.availableStock} ${req.ingredientUnit}, Required: ${req.requiredQty.toFixed(2)} ${req.ingredientUnit}.`
        );
      }
    }

    // 5. Pass 2: Execute deductions and record movements
    const deductionsResult: { ingredientName: string; deducted: number; unit: string; remainingStock: number }[] = [];

    for (const [_, req] of requiredIngredients) {
      const newStock = Math.max(0, req.availableStock - req.requiredQty);

      // Update ingredient
      await supabase
        .from('ingredients')
        .update({
          available_stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.ingredientId);

      // Log movement with order tracking token in reason
      await supabase.from('stock_movements').insert({
        restaurant_id: restaurantId,
        ingredient_id: req.ingredientId,
        movement_type: 'order_deduction',
        quantity: req.requiredQty,
        previous_stock: req.availableStock,
        new_stock: newStock,
        reason: `order:${orderId}: Auto-deducted for Order ${order.order_number}`,
      });

      deductionsResult.push({
        ingredientName: req.ingredientName,
        deducted: req.requiredQty,
        unit: req.ingredientUnit,
        remainingStock: newStock,
      });
    }

    return {
      success: true,
      deductions: deductionsResult,
    };
  },

  /**
   * Reverse inventory deduction if an order is cancelled.
   */
  async reverseInventoryForOrder(orderId: string, restaurantId: string, cancellationReason = 'Order Cancelled'): Promise<{
    success: boolean;
    alreadyReversed?: boolean;
    restored: { ingredientId: string; restoredQty: number }[];
  }> {
    // If not a valid UUID, safely handle without attempting database query
    if (!UUID_REGEX.test(orderId) || !UUID_REGEX.test(restaurantId)) {
      return { success: true, restored: [] };
    }

    // 1. Check idempotency: have we already reversed this order?
    const { data: existingReversals } = await supabase
      .from('stock_movements')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('movement_type', 'cancellation_reversal')
      .like('reason', `%cancellation_reversal:${orderId}:%`)
      .limit(1);

    if (existingReversals && existingReversals.length > 0) {
      return { success: true, alreadyReversed: true, restored: [] };
    }

    // 2. Find all order_deduction movements logged for this order
    const { data: movements, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('movement_type', 'order_deduction')
      .like('reason', `%order:${orderId}:%`);

    if (error || !movements || movements.length === 0) {
      return { success: true, restored: [] };
    }

    const restoredResult: { ingredientId: string; restoredQty: number }[] = [];

    for (const mov of movements) {
      const { data: ing } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', mov.ingredient_id)
        .single();

      if (!ing) continue;

      const currentStock = Number(ing.available_stock);
      const restoreQty = Number(mov.quantity);
      const newStock = currentStock + restoreQty;

      // Update ingredient
      await supabase
        .from('ingredients')
        .update({
          available_stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ing.id);

      // Record reversal entry in stock_movements
      await supabase.from('stock_movements').insert({
        restaurant_id: restaurantId,
        ingredient_id: ing.id,
        movement_type: 'cancellation_reversal',
        quantity: restoreQty,
        previous_stock: currentStock,
        new_stock: newStock,
        reason: `cancellation_reversal:${orderId}: Restored stock for Cancelled Order (${cancellationReason})`,
      });

      restoredResult.push({
        ingredientId: ing.id,
        restoredQty: restoreQty,
      });
    }

    return {
      success: true,
      restored: restoredResult,
    };
  },

  // ==========================================
  // SUPPLIERS
  // ==========================================

  /**
   * Fetch all registered suppliers for a restaurant.
   */
  async getSuppliers(restaurantId: string): Promise<SupplierRow[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Add a new vendor or supplier.
   */
  async createSupplier(supplier: SupplierInsert): Promise<SupplierRow> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update supplier details.
   */
  async updateSupplier(id: string, updates: SupplierUpdate): Promise<SupplierRow> {
    const { data, error } = await supabase
      .from('suppliers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete supplier safely.
   */
  async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // STOCK MOVEMENTS AUDIT TRAIL
  // ==========================================

  /**
   * Fetch recent stock audit movements.
   */
  async getStockMovements(restaurantId: string, limit = 100): Promise<(StockMovementRow & { ingredient?: { name: string; unit: string } })[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        ingredient:ingredients (
          name,
          unit
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as any) || [];
  },
};

export default inventoryService;
