import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://fsdcbcizoxnbuqvtwcim.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZGNiY2l6b3huYnVxdnR3Y2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNjQ2ODIsImV4cCI6MjEwOTg0MDY4Mn0.u7JMySjObjnurdftwhYSlUwkJ1CREKL4h7j_gKFUfZc'
);

const REST_ID = '22222222-2222-2222-2222-222222222201';

async function check() {
  const { data: prods } = await s
    .from('products')
    .select('id, name, price, is_veg, category:categories(id, name, slug)')
    .eq('restaurant_id', REST_ID);

  console.log('Total Products:', prods ? prods.length : 0);
  if (prods) {
    prods.forEach((p) => {
      console.log(`- ${p.name} | ₹${p.price} | Category: ${p.category?.name || 'N/A'}`);
    });
  }
}
check();

