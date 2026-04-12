import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function injectSundayTraffic() {
  console.log(`\n🚌 Booting Live Sunday Traffic Injector...`);

  // 1. Grab Active Buses
  const { data: buses, error: busError } = await supabase
    .from('ga_fleet')
    .select('bus_id')
    .eq('status', 'ACTIVE')
    .limit(10);
    
  if (busError || !buses.length) throw new Error("Could not find active buses in ga_fleet");

  // 2. Grab Active Cards with Rides
  const { data: products, error: prodError } = await supabase
    .from('ga_card_products')
    .select('card_number')
    .eq('status', 'ACTIVE')
    .gt('rides_remaining', 0)
    .limit(50);

  if (prodError || !products.length) throw new Error("Could not find active cards with remaining rides");

  // 3. Generate 300 Taps for Today
  const locations = ['Cape Town CBD', 'Bellville', 'Mitchells Plain', 'Khayelitsha', 'Belhar'];
  const tapsToProcess = [];
  
  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(6, 0, 0, 0); // Start the simulation at 6 AM today

  for (let i = 0; i < 300; i++) {
    const randomCard = products[Math.floor(Math.random() * products.length)].card_number;
    const randomBus = buses[Math.floor(Math.random() * buses.length)].bus_id;
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    
    // Spread the taps randomly between 6 AM and the current time
    const randomTime = new Date(startOfDay.getTime() + Math.random() * (now.getTime() - startOfDay.getTime()));

    tapsToProcess.push({
      card: randomCard,
      bus: randomBus,
      loc: randomLocation,
      time: randomTime.toISOString()
    });
  }

  // Sort chronologically so wallets deduct perfectly
  tapsToProcess.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  // 4. Execute via ACID RPC
  console.log(`⏳ Injecting ${tapsToProcess.length} live taps for today...`);
  let successCount = 0;

  for (let i = 0; i < tapsToProcess.length; i += 25) {
    const batch = tapsToProcess.slice(i, i + 25);
    const results = await Promise.all(
      batch.map(tap =>
        supabase.rpc('process_commuter_tap', {
          p_card_number: tap.card,
          p_location: tap.loc,
          p_bus_id: tap.bus,
          p_timestamp: tap.time
        })
      )
    );
    
    successCount += results.filter(res => !res.error).length;
    process.stdout.write(`\r✅ Processed: ${Math.min(i + 25, tapsToProcess.length)} / ${tapsToProcess.length}`);
  }

  console.log(`\n\n🎉 Success! Added ${successCount} validated taps to today's ledger.`);
}

injectSundayTraffic().catch(console.error);