// scripts/seed_indian_inventory.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fsdcbcizoxnbuqvtwcim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZGNiY2l6b3huYnVxdnR3Y2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNjQ2ODIsImV4cCI6MjEwOTg0MDY4Mn0.u7JMySjObjnurdftwhYSlUwkJ1CREKL4h7j_gKFUfZc';

const s = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const REST_ID = '22222222-2222-2222-2222-222222222201'; // Zaika Heritage Main

async function seedIndianInventory() {
  console.log('🚀 Seeding authentic Indian Suppliers, Ingredients, and Recipes for Zaika Heritage...');

  const { data: auth, error: errAuth } = await s.auth.signInWithPassword({
    email: 'rahul.sharma5054@gmail.com',
    password: 'SecurePassword@2026',
  });
  if (errAuth) throw new Error('Auth failed: ' + errAuth.message);
  console.log('✅ Authenticated as Restaurant Owner:', auth.user.email);

  // 1. Clear out legacy recipe_items, recipes, stock_movements, ingredients, suppliers for this restaurant
  console.log('\n🧹 Clearing legacy western inventory records...');
  // Delete recipe items
  const { data: existingRecs } = await s.from('recipes').select('id').eq('restaurant_id', REST_ID);
  if (existingRecs && existingRecs.length > 0) {
    const recIds = existingRecs.map(r => r.id);
    await s.from('recipe_items').delete().in('recipe_id', recIds);
    await s.from('recipes').delete().eq('restaurant_id', REST_ID);
  }
  await s.from('stock_movements').delete().eq('restaurant_id', REST_ID);
  await s.from('ingredients').delete().eq('restaurant_id', REST_ID);
  await s.from('suppliers').delete().eq('restaurant_id', REST_ID);
  console.log('   Legacy records cleared.');

  // 2. Insert Indian Suppliers
  console.log('\n📦 Inserting Indian Suppliers...');
  const suppliersData = [
    {
      restaurant_id: REST_ID,
      name: 'Amul India Dairy Cooperative',
      contact_name: 'Dr. Ramesh Patel',
      phone: '+91 98250 11928',
      email: 'orders@amuldairy.coop',
      address: 'Anand Dairy Road, Anand, Gujarat'
    },
    {
      restaurant_id: REST_ID,
      name: 'Punjab Royal Grain Mills',
      contact_name: 'Harpreet Singh Dhillon',
      phone: '+91 98140 88219',
      email: 'supply@punjabgrainmills.in',
      address: 'GT Road, Amritsar, Punjab'
    },
    {
      restaurant_id: REST_ID,
      name: "Venky's Farms & Halal Poultry",
      contact_name: 'Sunil Rao',
      phone: '+91 98810 44290',
      email: 'b2b@venkyspoultry.com',
      address: 'Pune-Solapur Highway, Pune, Maharashtra'
    },
    {
      restaurant_id: REST_ID,
      name: 'Khari Baoli Royal Spices & Herbs',
      contact_name: 'Mohd. Zafar Ansari',
      phone: '+91 98110 55321',
      email: 'zafar@kharibaolispices.in',
      address: 'Shop 14, Khari Baoli, Chandni Chowk, Old Delhi'
    },
    {
      restaurant_id: REST_ID,
      name: 'Assam & Nilgiri Tea Planters Guild',
      contact_name: 'Bijoy Sengupta',
      phone: '+91 94350 77102',
      email: 'estates@assamteaguild.in',
      address: 'Tea Board Building, Jorhat, Assam'
    },
    {
      restaurant_id: REST_ID,
      name: 'Heritage Fresh Produce Mandi',
      contact_name: 'K. Venkatesh',
      phone: '+91 98450 33941',
      email: 'fresh@heritagemandi.com',
      address: 'KR Market Wholesale Yard, Bengaluru, Karnataka'
    }
  ];

  const { data: insertedSuppliers, error: errSup } = await s
    .from('suppliers')
    .insert(suppliersData)
    .select();

  if (errSup) throw new Error('Suppliers insert failed: ' + errSup.message);
  console.log(`   Inserted ${insertedSuppliers.length} suppliers.`);

  const supMap = new Map();
  insertedSuppliers.forEach(sup => supMap.set(sup.name, sup.id));

  // 3. Insert Indian Ingredients
  console.log('\n🌿 Inserting Indian Ingredients...');
  const ingredientsData = [
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Punjab Royal Grain Mills'),
      name: 'Daawat Traditional Basmati Rice (Aged 2 Yrs)',
      category: 'Grains & Flours',
      available_stock: 65.00,
      min_stock: 20.00,
      unit: 'kg',
      cost_per_unit: 140.00
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Amul India Dairy Cooperative'),
      name: 'Fresh Malai Paneer (Artisanal Cottage Cheese)',
      category: 'Dairy',
      available_stock: 28.00,
      min_stock: 10.00,
      unit: 'kg',
      cost_per_unit: 360.00
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get("Venky's Farms & Halal Poultry"),
      name: 'Fresh Farm Chicken (Curry Cut & Boneless)',
      category: 'Produce',
      available_stock: 45.00,
      min_stock: 15.00,
      unit: 'kg',
      cost_per_unit: 220.00
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Amul India Dairy Cooperative'),
      name: 'Amul Pure Cow Desi Ghee & Makhan',
      category: 'Dairy',
      available_stock: 30.00,
      min_stock: 8.00,
      unit: 'kg',
      cost_per_unit: 620.00
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Khari Baoli Royal Spices & Herbs'),
      name: 'Kashmiri Saffron (Mogra Kesar)',
      category: 'Spices & Seasoning',
      available_stock: 0.45,
      min_stock: 0.10,
      unit: 'kg',
      cost_per_unit: 280000.00 // ₹280/g
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Assam & Nilgiri Tea Planters Guild'),
      name: 'Assam CTC Premium Black Tea',
      category: 'Beverages',
      available_stock: 25.00,
      min_stock: 6.00,
      unit: 'kg',
      cost_per_unit: 380.00
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Amul India Dairy Cooperative'),
      name: 'Whole Full-Cream Buffalo Milk',
      category: 'Dairy',
      available_stock: 50.00,
      min_stock: 15.00,
      unit: 'liters',
      cost_per_unit: 68.00
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Khari Baoli Royal Spices & Herbs'),
      name: 'Khari Baoli Shahi Garam Masala & Cardamom',
      category: 'Spices & Seasoning',
      available_stock: 14.00,
      min_stock: 4.00,
      unit: 'kg',
      cost_per_unit: 850.00
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Heritage Fresh Produce Mandi'),
      name: 'Desi Tomato & Onion Gravy Base',
      category: 'Produce',
      available_stock: 40.00,
      min_stock: 12.00,
      unit: 'kg',
      cost_per_unit: 95.00
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Khari Baoli Royal Spices & Herbs'),
      name: 'Organic Kasuri Methi (Fenugreek Leaves)',
      category: 'Spices & Seasoning',
      available_stock: 5.00,
      min_stock: 1.50,
      unit: 'kg',
      cost_per_unit: 450.00
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Heritage Fresh Produce Mandi'),
      name: 'Golden Potatoes & Green Peas (Aloo Mattar)',
      category: 'Produce',
      available_stock: 55.00,
      min_stock: 15.00,
      unit: 'kg',
      cost_per_unit: 35.00
    },
    {
      restaurant_id: REST_ID,
      supplier_id: supMap.get('Heritage Fresh Produce Mandi'),
      name: 'Ratnagiri Alphonso Mango Pulp (Canned)',
      category: 'Beverages',
      available_stock: 3.00, // Deliberately low stock for alert testing!
      min_stock: 8.00,
      unit: 'liters',
      cost_per_unit: 240.00
    }
  ];

  const { data: insertedIngredients, error: errIng } = await s
    .from('ingredients')
    .insert(ingredientsData)
    .select();

  if (errIng) throw new Error('Ingredients insert failed: ' + errIng.message);
  console.log(`   Inserted ${insertedIngredients.length} ingredients.`);

  const ingMap = new Map();
  insertedIngredients.forEach(i => ingMap.set(i.name, i));

  // 4. Log initial stock movements
  console.log('\n📋 Logging initial intake stock movements...');
  const movementsData = insertedIngredients.map(ing => ({
    restaurant_id: REST_ID,
    ingredient_id: ing.id,
    movement_type: 'initial_stock',
    quantity: ing.available_stock,
    previous_stock: 0,
    new_stock: ing.available_stock,
    reason: `Initial stock onboarding intake from verified supplier`,
    performed_by: auth.user.id
  }));

  const { error: errMov } = await s.from('stock_movements').insert(movementsData);
  if (errMov) throw new Error('Stock movements insert failed: ' + errMov.message);
  console.log(`   Logged ${movementsData.length} stock movement audit records.`);

  // 5. Build Recipes for Indian Dishes
  console.log('\n📖 Associating Recipes and Recipe Items with Indian Menu dishes...');
  const { data: products } = await s
    .from('products')
    .select('id, name')
    .eq('restaurant_id', REST_ID);

  console.log(`   Found ${products.length} active menu products.`);
  const prodMap = new Map();
  products.forEach(p => prodMap.set(p.name, p.id));

  const recipesToCreate = [
    {
      productName: 'Hyderabadi Chicken Dum Biryani',
      instructions: 'Dum pukht sealed earthen handi over charcoal for 25 minutes with aged basmati, chicken, saffron, and pure ghee.',
      items: [
        { ingName: 'Daawat Traditional Basmati Rice (Aged 2 Yrs)', qty: 0.250, unit: 'kg' },
        { ingName: 'Fresh Farm Chicken (Curry Cut & Boneless)', qty: 0.300, unit: 'kg' },
        { ingName: 'Amul Pure Cow Desi Ghee & Makhan', qty: 0.040, unit: 'kg' },
        { ingName: 'Kashmiri Saffron (Mogra Kesar)', qty: 0.001, unit: 'kg' },
        { ingName: 'Khari Baoli Shahi Garam Masala & Cardamom', qty: 0.015, unit: 'kg' }
      ]
    },
    {
      productName: 'Paneer Butter Masala',
      instructions: 'Toss fresh artisanal paneer cubes in velvety tomato cashew gravy with churned butter and kasuri methi.',
      items: [
        { ingName: 'Fresh Malai Paneer (Artisanal Cottage Cheese)', qty: 0.250, unit: 'kg' },
        { ingName: 'Amul Pure Cow Desi Ghee & Makhan', qty: 0.050, unit: 'kg' },
        { ingName: 'Desi Tomato & Onion Gravy Base', qty: 0.200, unit: 'kg' },
        { ingName: 'Organic Kasuri Methi (Fenugreek Leaves)', qty: 0.005, unit: 'kg' }
      ]
    },
    {
      productName: 'Old Delhi Butter Chicken (Murgh Makhani)',
      instructions: 'Simmer clay oven roasted chicken in rich tomato, cashew nut and butter gravy with clotted cream.',
      items: [
        { ingName: 'Fresh Farm Chicken (Curry Cut & Boneless)', qty: 0.300, unit: 'kg' },
        { ingName: 'Amul Pure Cow Desi Ghee & Makhan', qty: 0.060, unit: 'kg' },
        { ingName: 'Desi Tomato & Onion Gravy Base', qty: 0.200, unit: 'kg' },
        { ingName: 'Organic Kasuri Methi (Fenugreek Leaves)', qty: 0.005, unit: 'kg' }
      ]
    },
    {
      productName: 'Dal Makhani Bukhara',
      instructions: 'Slow charcoal cooked black urad lentils and kidney beans simmered with dairy cream and churned butter.',
      items: [
        { ingName: 'Amul Pure Cow Desi Ghee & Makhan', qty: 0.060, unit: 'kg' },
        { ingName: 'Desi Tomato & Onion Gravy Base', qty: 0.100, unit: 'kg' },
        { ingName: 'Whole Full-Cream Buffalo Milk', qty: 0.050, unit: 'liters' },
        { ingName: 'Khari Baoli Shahi Garam Masala & Cardamom', qty: 0.010, unit: 'kg' }
      ]
    },
    {
      productName: 'Royal Kulhad Masala Chai',
      instructions: 'Slow brew Assam CTC tea with pounded ginger, green cardamom and whole milk into earthen clay kulhads.',
      items: [
        { ingName: 'Assam CTC Premium Black Tea', qty: 0.015, unit: 'kg' },
        { ingName: 'Whole Full-Cream Buffalo Milk', qty: 0.150, unit: 'liters' },
        { ingName: 'Khari Baoli Shahi Garam Masala & Cardamom', qty: 0.003, unit: 'kg' }
      ]
    },
    {
      productName: 'Ratnagiri Alphonso Mango Lassi',
      instructions: 'Blend chilled hand-churned yoghurt with authentic Ratnagiri Alphonso mango pulp and cardamom.',
      items: [
        { ingName: 'Ratnagiri Alphonso Mango Pulp (Canned)', qty: 0.150, unit: 'liters' },
        { ingName: 'Whole Full-Cream Buffalo Milk', qty: 0.150, unit: 'liters' },
        { ingName: 'Khari Baoli Shahi Garam Masala & Cardamom', qty: 0.002, unit: 'kg' }
      ]
    },
    {
      productName: 'Dilli 6 Samosa Chaat with Dahi & Chutneys',
      instructions: 'Crushed flaky samosas smothered with spiced potatoes, chilled dahi, tamarind and mint chutney.',
      items: [
        { ingName: 'Golden Potatoes & Green Peas (Aloo Mattar)', qty: 0.150, unit: 'kg' },
        { ingName: 'Whole Full-Cream Buffalo Milk', qty: 0.080, unit: 'liters' },
        { ingName: 'Khari Baoli Shahi Garam Masala & Cardamom', qty: 0.010, unit: 'kg' }
      ]
    }
  ];

  for (const recDef of recipesToCreate) {
    const prodId = prodMap.get(recDef.productName);
    if (!prodId) {
      console.log(`   ⚠️ Product "${recDef.productName}" not found on menu, skipping recipe.`);
      continue;
    }

    const { data: recRow, error: errR } = await s
      .from('recipes')
      .upsert({
        restaurant_id: REST_ID,
        product_id: prodId,
        yield_servings: 1,
        prep_instructions: recDef.instructions
      }, { onConflict: 'product_id' })
      .select()
      .single();

    if (errR) {
      console.error(`   ❌ Failed recipe for "${recDef.productName}":`, errR.message);
      continue;
    }

    const itemsToInsert = recDef.items
      .map(it => {
        const ing = ingMap.get(it.ingName);
        if (!ing) {
          console.warn(`   ⚠️ Ingredient "${it.ingName}" not mapped!`);
          return null;
        }
        return {
          recipe_id: recRow.id,
          ingredient_id: ing.id,
          quantity_required: it.qty,
          unit: it.unit
        };
      })
      .filter(Boolean);

    if (itemsToInsert.length > 0) {
      const { error: errRI } = await s.from('recipe_items').insert(itemsToInsert);
      if (errRI) {
        console.error(`   ❌ Failed recipe items for "${recDef.productName}":`, errRI.message);
      } else {
        console.log(`   ✅ Recipe created: "${recDef.productName}" with ${itemsToInsert.length} ingredients.`);
      }
    }
  }

  console.log('\n🎉 Phase 6 Indian Inventory & Recipes successfully seeded into Supabase!');
}

seedIndianInventory().catch(err => {
  console.error('Fatal error in seed script:', err);
  process.exit(1);
});

