// spoofer.mjs
// Bulk Data Injector for GABS Analytics Testing

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 🚨 CHANGED: We are now using the Admin VIP Key to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables! Make sure SUPABASE_SERVICE_ROLE_KEY is in your .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ... rest of the code stays exactly the same ...

const supabase = createClient(supabaseUrl, supabaseKey);

const locations = ['Cape Town CBD', 'Bellville', 'Belhar', 'Maitland', 'Woodstock', 'Mowbray', 'Khayelitsha'];
const cards = ['GA-00001', 'GA-00002', 'GA-00003', 'GA-00004', 'GA-00005', 'GA-00042'];

async function spoofData() {
  console.log("🚀 Initiating Data Flood for TODAY...");
  const taps = [];
  const now = new Date();

  // Generate 500 random taps for today
  for (let i = 0; i < 500; i++) {
    // Bias the random hours slightly to create "Rush Hours"
    let hour;
    const rand = Math.random();
    if (rand < 0.4) hour = Math.floor(Math.random() * 3) + 6; // 40% chance of 6am-8am
    else if (rand < 0.8) hour = Math.floor(Math.random() * 3) + 15; // 40% chance of 3pm-5pm
    else hour = Math.floor(Math.random() * 24); // 20% chance of any random hour
    
    const minute = Math.floor(Math.random() * 60);
    
    // Create a timestamp for today at the random hour/minute
    const tapTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);

    taps.push({
      card_number: cards[Math.floor(Math.random() * cards.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      timestamp: tapTime.toISOString(),
    });
  }

  // Insert all 500 rows in one massive database hit
const { error } = await supabase.from('ga_tap_ledger').insert(taps);
  
  if (error) {
    console.error("❌ Database Error:", error.message);
  } else {
    console.log("✅ Successfully injected 500 taps for today!");
    console.log("👀 Go check your dashboard!");
  }
}

spoofData();