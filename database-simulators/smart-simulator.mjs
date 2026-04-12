// smart-simulator.mjs
// Enterprise Telemetry Generator for GABS Fleet Operations

const API_BASE = 'http://localhost:3000/api/ga/cards';

// 1. System State (The Fleet and the Commuters)
const FLEET = ['GABS-101', 'GABS-102', 'GABS-204', 'GABS-305', 'GABS-409'];
const ACTIVE_CARDS = ['GA-00026', 'GA-00048', 'GA-00019', 'GA-00049', 'GA-00067', 'GA-00051'];

// 2. Geospatial Weighting (More buses go to major hubs)
const LOCATIONS = [
  { name: 'Cape Town CBD', probability: 0.40 },
  { name: 'Bellville', probability: 0.70 }, 
  { name: 'Maitland', probability: 0.85 },  
  { name: 'Belhar', probability: 0.95 },    
  { name: 'Woodstock', probability: 1.00 }  
];

function getRandomLocation() {
  const rand = Math.random();
  return LOCATIONS.find(loc => rand <= loc.probability).name;
}

// 3. The Core API Interaction (Single Tap)
async function triggerTap(busId, location) {
  const card = ACTIVE_CARDS[Math.floor(Math.random() * ACTIVE_CARDS.length)];
  
  try {
    const response = await fetch(`${API_BASE}/${card}/tap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, bus_id: busId })
    });

    const data = await response.json();
    
    if (response.ok) {
      return { status: 'SUCCESS', card, msg: `Remaining rides: ${data.rides_remaining}` };
    } else {
      return { status: 'DECLINED', card, msg: data.error };
    }
  } catch (error) {
    return { status: 'ERROR', card, msg: 'Network Failure' };
  }
}

// 4. The Terminal Surge (Concurrency)
async function simulateBusArrival() {
  const busId = FLEET[Math.floor(Math.random() * FLEET.length)];
  const location = getRandomLocation();
  
  const passengerCount = Math.floor(Math.random() * 10) + 3;
  console.log(`\n🚌 [ARRIVED] ${busId} at ${location}. Boarding ${passengerCount} passengers...`);

  const tapPromises = Array.from({ length: passengerCount }).map(() => triggerTap(busId, location));
  const results = await Promise.allSettled(tapPromises);
  
  // Enterprise Logging: Aggregate the results
  let successCount = 0;
  let declineCount = 0;
  let errorCount = 0;
  
  results.forEach(res => {
    if (res.value.status === 'SUCCESS') successCount++;
    else if (res.value.status === 'DECLINED') declineCount++;
    else {
      errorCount++; 
      console.log(`   🚨 CRASH: ${res.value.card} -> ${res.value.msg}`);
    }
  });

  console.log(`📊 [TELEMETRY] ${busId}: ${successCount} Success | ${declineCount} Declined | ${errorCount} System Errors`);
} // <--- This was the missing brace!

// 5. The Event Loop 
console.log("=========================================");
console.log("🚀 GABS Smart Fleet Simulator Initialized");
console.log("=========================================");

simulateBusArrival();

setInterval(() => {
  simulateBusArrival();
}, Math.floor(Math.random() * 10000) + 10000);