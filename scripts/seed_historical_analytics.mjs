// scripts/seed_historical_analytics.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fsdcbcizoxnbuqvtwcim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZGNiY2l6b3huYnVxdnR3Y2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNjQ2ODIsImV4cCI6MjEwOTg0MDY4Mn0.u7JMySjObjnurdftwhYSlUwkJ1CREKL4h7j_gKFUfZc';

const s = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const REST_ID = '22222222-2222-2222-2222-222222222201';

const CUSTOMERS = [
  { name: 'Vikram Malhotra', phone: '+91 98451 34911' },
  { name: 'Priya Sharma', phone: '+91 98822 99014' },
  { name: 'Rohan Mehta', phone: '+91 97731 19942' },
  { name: 'Ananya Roy', phone: '+91 96628 41920' },
  { name: 'Aditya Kulkarni', phone: '+91 98220 54192' },
  { name: 'Meera Nambiar', phone: '+91 98470 33819' },
  { name: 'Siddharth Sen', phone: '+91 98300 22718' },
  { name: 'Kavita Chawla', phone: '+91 98100 44920' },
  { name: 'Gaurav Deshmukh', phone: '+91 98900 66219' },
  { name: 'Deepika Rao', phone: '+91 98450 77192' },
  { name: 'Arjun Singhania', phone: '+91 98200 99401' },
  { name: 'Tanvi Joshi', phone: '+91 98230 11842' },
];

const TABLES = ['Table 01', 'Table 02', 'Table 03', 'Table 04', 'Table 05', 'Table 06', 'Table 07', 'Table 08'];

async function seedHistoricalAnalytics() {
  console.log('🚀 Seeding 14 days of realistic historical order analytics...');

  const { data: auth, error: errAuth } = await s.auth.signInWithPassword({
    email: 'rahul.sharma5054@gmail.com',
    password: 'SecurePassword@2026',
  });
  if (errAuth) throw new Error('Auth failed: ' + errAuth.message);
  console.log(`✅ Authenticated: ${auth.user.email}`);

  // Fetch products
  const { data: products } = await s
    .from('products')
    .select('id, name, price, is_veg')
    .eq('restaurant_id', REST_ID);

  if (!products || products.length === 0) {
    throw new Error('No products found for restaurant!');
  }
  console.log(`   Found ${products.length} active menu products.`);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  let orderSeq = 1001;

  const ordersToInsert = [];
  const itemsToInsert = [];

  // Generate orders for each of the last 14 days
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const dayDate = new Date(now - dayOffset * dayMs);
    const dayOfWeek = dayDate.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5;
    
    // 6 to 12 orders on weekdays, 12 to 20 on weekends
    const orderCount = isWeekend ? Math.floor(12 + Math.random() * 8) : Math.floor(6 + Math.random() * 6);

    for (let i = 0; i < orderCount; i++) {
      orderSeq++;
      const cust = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
      
      // Rush hour distribution: 40% lunch (12:00 - 15:00), 50% dinner (19:00 - 22:30), 10% teatime (16:00 - 18:00)
      const randType = Math.random();
      let hour, minute;
      if (randType < 0.40) {
        hour = 12 + Math.floor(Math.random() * 3); // 12, 13, 14
        minute = Math.floor(Math.random() * 60);
      } else if (randType < 0.90) {
        hour = 19 + Math.floor(Math.random() * 4); // 19, 20, 21, 22
        minute = Math.floor(Math.random() * 60);
      } else {
        hour = 16 + Math.floor(Math.random() * 3); // 16, 17, 18
        minute = Math.floor(Math.random() * 60);
      }

      const orderTime = new Date(dayDate);
      orderTime.setHours(hour, minute, Math.floor(Math.random() * 60), 0);
      const orderIso = orderTime.toISOString();

      // Channel: 60% dine-in, 25% takeaway, 15% delivery
      const channelRand = Math.random();
      let orderType = 'dine-in';
      let tableNum = TABLES[Math.floor(Math.random() * TABLES.length)];
      let delivAddr = null;
      if (channelRand >= 0.85) {
        orderType = 'delivery';
        tableNum = null;
        delivAddr = 'Indiranagar 100ft Road, Bengaluru';
      } else if (channelRand >= 0.60) {
        orderType = 'takeaway';
        tableNum = null;
      }

      // Status: 92% completed, 5% cancelled, 3% preparing/ready if today
      let status = 'completed';
      let cancelReason = null;
      if (dayOffset === 0 && Math.random() < 0.2) {
        status = 'ready';
      } else if (Math.random() < 0.05) {
        status = 'cancelled';
        cancelReason = 'Guest requested cancellation before cooking';
      }

      // Payment method: 70% upi, 20% card, 10% counter/cash
      const payRand = Math.random();
      const paymentMethod = payRand < 0.70 ? 'upi' : payRand < 0.90 ? 'card' : 'counter';
      const paymentStatus = status === 'cancelled' ? 'refunded' : 'paid';

      // Pick 1 to 4 items
      const numItems = Math.floor(1 + Math.random() * 3);
      const selectedProds = [];
      for (let j = 0; j < numItems; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const qty = Math.random() < 0.3 ? 2 : 1;
        selectedProds.push({ prod, qty });
      }

      const subtotal = selectedProds.reduce((acc, p) => acc + Number(p.prod.price) * p.qty, 0);
      // Occasional promo discount (10% off for bill > 600)
      const discount = subtotal > 600 && Math.random() < 0.35 ? Math.round(subtotal * 0.10) : 0;
      const tax = Math.round((subtotal - discount) * 0.05); // 5% GST
      const total = subtotal - discount + tax;

      const orderId = crypto.randomUUID();

      ordersToInsert.push({
        id: orderId,
        restaurant_id: REST_ID,
        order_number: `#CF-${orderSeq}`,
        customer_name: cust.name,
        customer_phone: cust.phone,
        order_type: orderType,
        table_number_snapshot: tableNum,
        delivery_address: delivAddr,
        status: status,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        cancellation_reason: cancelReason,
        prep_time_minutes: 15,
        created_at: orderIso,
        updated_at: orderIso,
        completed_at: status === 'completed' ? new Date(orderTime.getTime() + 25 * 60 * 1000).toISOString() : null,
      });

      selectedProds.forEach((sp) => {
        itemsToInsert.push({
          id: crypto.randomUUID(),
          order_id: orderId,
          product_id: sp.prod.id,
          product_name_snapshot: sp.prod.name,
          price_snapshot: Number(sp.prod.price),
          quantity: sp.qty,
          is_veg_snapshot: sp.prod.is_veg,
          selected_options_snapshot: [],
          special_instructions: null,
          item_total: Number(sp.prod.price) * sp.qty,
          created_at: orderIso,
        });
      });
    }
  }

  console.log(`\n📦 Prepared ${ordersToInsert.length} orders and ${itemsToInsert.length} line items.`);

  // Insert in chunks of 50 to avoid request size limits
  console.log('⏳ Inserting orders into Supabase...');
  for (let i = 0; i < ordersToInsert.length; i += 50) {
    const chunk = ordersToInsert.slice(i, i + 50);
    const { error: errOrd } = await s.from('orders').insert(chunk);
    if (errOrd) throw new Error('Order chunk insert failed: ' + errOrd.message);
  }
  console.log('   ✅ All orders inserted.');

  console.log('⏳ Inserting order items into Supabase...');
  for (let i = 0; i < itemsToInsert.length; i += 50) {
    const chunk = itemsToInsert.slice(i, i + 50);
    const { error: errIt } = await s.from('order_items').insert(chunk);
    if (errIt) throw new Error('Order items chunk insert failed: ' + errIt.message);
  }
  console.log('   ✅ All order items inserted.');

  console.log(`\n🎉 Successfully seeded ${ordersToInsert.length} historical orders across the past 14 days!`);
}

seedHistoricalAnalytics().catch((err) => {
  console.error('Fatal error in seeding:', err);
  process.exit(1);
});

