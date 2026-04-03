// seed-factory.mjs
// Enterprise QA Environment Generator

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateEnterpriseData() {
  console.log("=========================================");
  console.log("🏭 Initiating GABS QA Data Factory");
  console.log("=========================================");

  const BATCH_SIZE = 100;
  const generatedCards = [];
  const generatedProducts = [];

  console.log(`⏳ Generating ${BATCH_SIZE} physical Gold Cards...`);

  for (let i = 0; i < BATCH_SIZE; i++) {
    // 1. Generate a realistic, unique card number (e.g., GA-84920)
    const cardNumber = `GA-${faker.string.numeric(5)}`;
    
    // 2. Add the physical card to our array (THIS was the missing piece!)
    generatedCards.push({
      card_number: cardNumber
    });
    
    // 3. Calculate a realistic expiry date (30 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    // 4. Add the product to our array
    generatedProducts.push({
      product_id: faker.string.uuid(), 
      card_number: cardNumber,
      product_type: 'Monthly (Unlimited - Dev Mock)',
      rides_remaining: 500, 
      status: 'ACTIVE',
      expiry_date: futureDate.toISOString() // The Enterprise Fix
    });
  }

  // 5. Insert the Physical Cards FIRST
  const { error: cardError } = await supabase.from('ga_cards').insert(generatedCards);
  if (cardError) return console.error("🚨 Card Generation Failed:", cardError);
  console.log(`✅ Successfully minted ${BATCH_SIZE} new physical cards.`);

  // 6. Insert the Top-Up Products SECOND (Foreign Key relies on the cards existing)
  const { error: productError } = await supabase.from('ga_card_products').insert(generatedProducts);
  if (productError) return console.error("🚨 Product Generation Failed:", productError);
  console.log(`✅ Successfully loaded 500 rides onto all ${BATCH_SIZE} cards.`);

  console.log("🎉 QA Environment successfully seeded. The system is ready for load testing.");
}

generateEnterpriseData();