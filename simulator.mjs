// simulator.mjs
// Real-Time Cron-based Golden Arrow Simulator

const API_BASE = 'http://localhost:3000/api/ga/cards';

// The 10 Real-World Commuter Personas
const COMMUTERS = [
  // Profile 1: The Corporate Commuter (Your exact schedule)
  { card: 'GA-00001', morning: '06:20', morningLoc: 'Belhar', evening: '18:30', eveningLoc: 'Cape Town CBD' },
  // Profile 2: The University Student
  { card: 'GA-00002', morning: '07:15', morningLoc: 'Cape Town CBD', evening: '15:00', eveningLoc: 'Bellville' },
  // Profile 3: The Early Shift Worker
  { card: 'GA-00003', morning: '05:30', morningLoc: 'Maitland', evening: '14:30', eveningLoc: 'Woodstock' },
  // Profile 4: The Late Shift Worker
  { card: 'GA-00004', morning: '13:30', morningLoc: 'Bellville', evening: '22:15', eveningLoc: 'Maitland' },
  // Profile 5: The Standard 9-to-5
  { card: 'GA-00005', morning: '08:00', morningLoc: 'Belhar', evening: '17:00', eveningLoc: 'Cape Town CBD' },
  // Profile 6: The Retail Worker
  { card: 'GA-00006', morning: '08:30', morningLoc: 'Woodstock', evening: '17:30', eveningLoc: 'Cape Town CBD' },
  // Profile 7: The Hybrid Worker
  { card: 'GA-00007', morning: '09:00', morningLoc: 'Bellville', evening: '16:00', eveningLoc: 'Belhar' },
  // Profile 8: The Clinic Nurse
  { card: 'GA-00008', morning: '06:45', morningLoc: 'Maitland', evening: '19:00', eveningLoc: 'Cape Town CBD' },
  // Profile 9: The Security Guard
  { card: 'GA-00009', morning: '17:45', morningLoc: 'Cape Town CBD', evening: '06:15', eveningLoc: 'Belhar' },
  // Profile 10: The Chef
  { card: 'GA-00010', morning: '11:05', morningLoc: 'Woodstock', evening: '23:30', eveningLoc: 'Cape Town CBD' }
];

// Flatten the personas into a single timeline array
const masterSchedule = [];
COMMUTERS.forEach(c => {
  masterSchedule.push({ time: c.morning, card: c.card, location: c.morningLoc });
  masterSchedule.push({ time: c.evening, card: c.card, location: c.eveningLoc });
});

console.log('==================================================');
console.log('🌍 Real-Time GABS Cron Simulator Started');
console.log(`📊 Loaded ${masterSchedule.length} daily commuter trips.`);
console.log('⏳ Waiting for scheduled bus times...');
console.log('==================================================');

async function simulateTap(cardNumber, location) {
  console.log(`\n🚏 [${new Date().toLocaleTimeString()}] Bus arriving at ${location}...`);
  console.log(`💳 Commuter tapping card: ${cardNumber}`);

  try {
    const response = await fetch(`${API_BASE}/${cardNumber}/tap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: location })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log(`✅ SUCCESS: ${data.rides_remaining} trips remaining. (${data.product_status})`);
    } else {
      console.log(`❌ DENIED: ${data.error}`);
    }
  } catch (err) {
    console.error('⚠️ Connection error. Is Next.js running?', err.message);
  }
}

// The State Machine Time Loop
// Runs every 1 second, but only triggers events when the minute rolls over exactly
setInterval(() => {
  const now = new Date();
  
  // We only want to execute exactly at the 00 second mark of a minute so we don't spam the API 60 times
  if (now.getSeconds() === 0) {
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeString = `${currentHours}:${currentMinutes}`; // Format: "06:20"

    // Find all commuters scheduled for this exact minute
    const dueTaps = masterSchedule.filter(trip => trip.time === currentTimeString);
    
    if (dueTaps.length > 0) {
      dueTaps.forEach(trip => simulateTap(trip.card, trip.location));
    }
  }
}, 1000);