import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fsdcbcizoxnbuqvtwcim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZGNiY2l6b3huYnVxdnR3Y2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNjQ2ODIsImV4cCI6MjEwOTg0MDY4Mn0.u7JMySjObjnurdftwhYSlUwkJ1CREKL4h7j_gKFUfZc';

const s = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const REST_ID = '22222222-2222-2222-2222-222222222201';

async function seedOperations() {
  console.log('🇮🇳 Configuring Phase 8 Restaurant Operations (Settings & Staff)...');

  // 1. Authenticate as Restaurant Owner
  const { data: auth, error: authErr } = await s.auth.signInWithPassword({
    email: 'rahul.sharma5054@gmail.com',
    password: 'SecurePassword@2026',
  });

  if (authErr || !auth.user) {
    console.error('❌ Auth error:', authErr);
    return;
  }
  console.log('✅ Authenticated as Owner:', auth.user.email);

  // 2. Update Restaurant Settings to Indian GST & Zaika Heritage branding
  const { data: existingSettings } = await s
    .from('restaurant_settings')
    .select('id')
    .eq('restaurant_id', REST_ID)
    .maybeSingle();

  if (existingSettings) {
    const { error: updErr } = await s
      .from('restaurant_settings')
      .update({
        receipt_header: 'Zaika Heritage – Royal Indian Kitchen & Chai Bar\nPlot 42, 100 Feet Rd, Indiranagar, Bengaluru',
        receipt_footer: 'Thank you for dining with us! Namaste & visit again.\nFSSAI Lic No: 11223344556677',
        tax_id_number: '29AAAAA0000A1Z5', // Karnataka GSTIN
        kds_chime_enabled: true,
        sound_volume: 90,
        low_stock_threshold_alert: true,
        auto_accept_orders: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSettings.id);

    if (updErr) console.error('Error updating settings:', updErr);
    else console.log('✅ Updated restaurant_settings to Karnataka GSTIN (29AAAAA0000A1Z5) & Zaika receipt headers.');
  }

  // 3. Update restaurants table (tagline, address, city, currency, tax)
  const { error: restErr } = await s
    .from('restaurants')
    .update({
      currency: 'INR',
      currency_symbol: '₹',
      tax_percentage: 5.0,
      cuisine: 'Royal Indian, Mughlai & Tandoor',
      tagline: 'Authentic Indian Flavours, Dum Biryanis & Handcrafted Chai',
      address: 'Plot 42, 100 Feet Road, Indiranagar, HAL 2nd Stage',
      city: 'Bengaluru, Karnataka 560038',
      contact_email: 'namaste@zaikaheritage.in',
      contact_phone: '+91 98450 23419',
      updated_at: new Date().toISOString(),
    })
    .eq('id', REST_ID);

  if (restErr) console.error('Error updating restaurant profile:', restErr);
  else console.log('✅ Confirmed restaurant profile: INR (₹), 5% GST, Indiranagar Bengaluru.');

  // 4. Seed Staff Members
  const STAFF = [
    {
      email: 'sunita.nambiar@zaikaheritage.in',
      fullName: 'Sunita Nambiar',
      phone: '+91 98452 11928',
      role: 'manager',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    {
      email: 'amit.verma@zaikaheritage.in',
      fullName: 'Amit Verma',
      phone: '+91 98201 44819',
      role: 'cashier',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    {
      email: 'chef.tariq@zaikaheritage.in',
      fullName: 'Ustad Mohammed Tariq',
      phone: '+91 98459 88123',
      role: 'kitchen',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80',
    },
    {
      email: 'ravi.kumar@zaikaheritage.in',
      fullName: 'Ravi Kumar',
      phone: '+91 98455 77210',
      role: 'server',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
  ];

  for (const staff of STAFF) {
    // Check or create profile
    let { data: prof } = await s
      .from('profiles')
      .select('id')
      .eq('email', staff.email)
      .maybeSingle();

    let userId = prof?.id;
    if (!userId) {
      const tempId = crypto.randomUUID();
      const { data: newProf, error: pErr } = await s
        .from('profiles')
        .insert({
          id: tempId,
          email: staff.email,
          full_name: staff.fullName,
          phone: staff.phone,
          avatar_url: staff.avatarUrl,
        })
        .select()
        .single();

      if (!pErr && newProf) {
        userId = newProf.id;
      }
    }

    if (userId) {
      // Check existing membership
      const { data: existingMem } = await s
        .from('restaurant_members')
        .select('id')
        .eq('restaurant_id', REST_ID)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingMem) {
        const { error: mErr } = await s
          .from('restaurant_members')
          .insert({
            restaurant_id: REST_ID,
            user_id: userId,
            role: staff.role,
            status: staff.status,
          });

        if (mErr) console.error(`Error adding member ${staff.fullName}:`, mErr.message);
        else console.log(`✅ Registered staff member: ${staff.fullName} as ${staff.role}`);
      } else {
        console.log(`ℹ️ Member ${staff.fullName} already registered.`);
      }
    }
  }

  console.log('✨ Phase 8 Operations Seeding Complete.');
}

seedOperations();

