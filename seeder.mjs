import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import 'dotenv/config'; // Make sure you have dotenv installed or run this with --env-file

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Probabilistic Commuter Archetypes based on Cape Town routes
const ARCHETYPES = [
  { type: 'Corporate', morning: 6.5, evening: 17.5, route: ['Belhar', 'Cape Town CBD'], variance: 0.5, weekend_travel: false },
  { type: 'Student', morning: 8.0, evening: 14.5, route: ['Cape Town CBD', 'Bellville'], variance: 0.75, weekend_travel: false },
  { type: 'ShiftWorker', morning: 13.5, evening: 22.25, route: ['Maitland', 'Woodstock'], variance: 0.25, weekend_travel: true },
  { type: 'Casual', morning: 10.0, evening: 16.0, route: ['Bellville', 'Maitland'], variance: 2.0, weekend_travel: true }
];

console.log('==================================================');
console.log('⏳ INITIATING TIME MACHINE SEEDER...');
console.log('==================================================');

async function runSeeder() {
  console.log('1️⃣ Generating 100 Secure Portal Users...');
  const users = [];
  const salt = await bcrypt.genSalt(10);
  const securePassword = await bcrypt.hash('password123', salt);

  for (let i = 11; i <= 100; i++) {
    const cardNumber = `GA-${String(i).padStart(5, '0')}`;
    users.push({
      full_name: `Virtual Commuter ${i}`,
      email: `user${i}@commuter.co.za`,
      password_hash: securePassword,
      linked_ga_card: cardNumber
    });
  }

  const { error: userErr } = await supabase.from('portal_users').upsert(users, { onConflict: 'email' });
  if (userErr) console.error('User Seed Error:', userErr);

  console.log('2️⃣ Traveling back 60 days to simulate human chaos...');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60);
  const endDate = new Date(); // Today

  let totalTaps = 0;
  const ledgerBatch = [];
  const productBatch = [];

  // Assign a random archetype to cards 11 through 100
  const userProfiles = users.map(u => ({
    card: u.linked_ga_card,
    archetype: ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)],
    ridesLeft: 0,
    currentProductExpiry: null
  }));

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    for (const profile of userProfiles) {
      // 10% chance of calling in sick/staying home
      const isAbsent = Math.random() < 0.10;
      if (isAbsent) continue;
      
      // Skip weekends if the archetype doesn't travel
      if (isWeekend && !profile.archetype.weekend_travel) continue;

      // Simulate Morning and Evening Commute
      const dailyTrips = [
        { timeBase: profile.archetype.morning, loc: profile.archetype.route[0] },
        { timeBase: profile.archetype.evening, loc: profile.archetype.route[1] }
      ];

      for (const trip of dailyTrips) {
        // Apply algorithmic variance (e.g., ± 15 minutes)
        const timeShift = (Math.random() * profile.archetype.variance * 2) - profile.archetype.variance;
        const tapHour = Math.floor(trip.timeBase + timeShift);
        const tapMinute = Math.floor(((trip.timeBase + timeShift) % 1) * 60);
        
        const tapTimestamp = new Date(d);
        tapTimestamp.setHours(tapHour, tapMinute, Math.floor(Math.random() * 60));

        // State Machine Auto-Purchase Logic
        if (profile.ridesLeft <= 0 || (profile.currentProductExpiry && tapTimestamp > profile.currentProductExpiry)) {
          const isMonthly = Math.random() > 0.7; // 30% chance they buy a Monthly
          const addedRides = isMonthly ? 48 : 10;
          const validDays = isMonthly ? 37 : 14;
          
          const expiryDate = new Date(tapTimestamp);
          expiryDate.setDate(expiryDate.getDate() + validDays);

          profile.ridesLeft = addedRides;
          profile.currentProductExpiry = expiryDate;

          productBatch.push({
            card_number: profile.card,
            product_type: isMonthly ? `Monthly (${addedRides} Rides)` : `Weekly (${addedRides} Rides)`,
            rides_remaining: addedRides,
            status: 'EXHAUSTED', // Setting to exhausted historically to keep the current state clean
            purchase_date: tapTimestamp.toISOString(),
            expiry_date: expiryDate.toISOString()
          });
        }

        // Deduct ride and log receipt
        profile.ridesLeft -= 1;
        ledgerBatch.push({
          card_number: profile.card,
          location: trip.loc,
          timestamp: tapTimestamp.toISOString()
        });
        totalTaps++;
      }
    }
  }

  console.log(`3️⃣ Writing ${productBatch.length} historical purchases to the database...`);
  // Insert in chunks of 500 to respect REST API payload limits
  for (let i = 0; i < productBatch.length; i += 500) {
    await supabase.from('ga_card_products').insert(productBatch.slice(i, i + 500));
  }

  console.log(`4️⃣ Writing ${totalTaps} chaotic commuter taps to the ledger...`);
  for (let i = 0; i < ledgerBatch.length; i += 500) {
    await supabase.from('ga_tap_ledger').insert(ledgerBatch.slice(i, i + 500));
  }

  console.log('==================================================');
  console.log('✅ TIME MACHINE SEED COMPLETE. Your ecosystem is now alive.');
  console.log('==================================================');
}

runSeeder();