import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

async function fixHistory() {
  const TARGET_CARD = '1045000011';
  console.log(`\n🧹 1. Wiping test taps for Card: ${TARGET_CARD}...`);

  // Delete all existing taps for this card to clear the "Sunday" spam
  const { error: deleteError } = await supabase
    .from('ga_tap_ledger')
    .delete()
    .eq('card_number', TARGET_CARD);

  if (deleteError) throw deleteError;

  console.log(`✅ Old history cleared. \n🚌 2. Generating fresh 5-day work commute...`);

  // Get an active bus
  const { data: buses, error: busError } = await supabase
    .from('ga_fleet')
    .select('bus_id')
    .eq('status', 'ACTIVE')
    .limit(1);
    
  if (busError || !buses.length) throw new Error("No active buses found.");
  const busId = buses[0].bus_id;

  const now = new Date();
  const createPastDate = (daysAgo, hours, minutes) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const commuteSchedule = [
    { loc: 'Mitchells Plain', time: createPastDate(6, 5, 55) },
    { loc: 'Cape Town CBD',   time: createPastDate(6, 17, 5) },
    { loc: 'Mitchells Plain', time: createPastDate(5, 6, 2) },
    { loc: 'Cape Town CBD',   time: createPastDate(5, 17, 12) },
    { loc: 'Mitchells Plain', time: createPastDate(4, 5, 58) },
    { loc: 'Cape Town CBD',   time: createPastDate(4, 16, 55) },
    { loc: 'Mitchells Plain', time: createPastDate(3, 6, 8) },
    { loc: 'Cape Town CBD',   time: createPastDate(3, 17, 20) },
    { loc: 'Mitchells Plain', time: createPastDate(2, 6, 0) },
    { loc: 'Cape Town CBD',   time: createPastDate(2, 16, 30) },
  ];

  for (const tap of commuteSchedule) {
    await supabase.rpc('process_commuter_tap', {
      p_card_number: TARGET_CARD,
      p_location: tap.loc,
      p_bus_id: busId,
      p_timestamp: tap.time
    });
    process.stdout.write(`\r✅ Logged: ${tap.loc.padEnd(15)}`);
  }

  console.log(`\n\n🎉 Done! Refresh your browser to see the perfect timeline.`);
}

fixHistory().catch(console.error);