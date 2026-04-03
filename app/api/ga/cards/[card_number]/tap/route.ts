import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// 1. Define the Strict Enterprise Contract
const TapPayloadSchema = z.object({
  location: z.string().min(2, "Location name is too short"),
  bus_id: z.string()
    .min(3, "Bus ID must be at least 3 characters")
    .regex(/^[A-Z0-9-]+$/, "Bus ID must only contain uppercase letters, numbers, and hyphens (e.g., GABS-101)")
});

// Bypass RLS for backend physical tap ingestion
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(
  request: Request,
  // 1. Update the TypeScript type to strictly expect a Promise
  { params }: { params: Promise<{ card_number: string }> } 
) {
  try {
    // 2. Await the dynamic routing parameters before accessing them
    const resolvedParams = await params;
    const card_number = resolvedParams.card_number;
    
    const rawBody = await request.json();

    // 2. Execute the Schema Validation
    const validation = TapPayloadSchema.safeParse(rawBody);
    
    // If a malicious actor or broken simulator sends bad data, block it immediately
    if (!validation.success) {
      console.error("API Security Rejection:", validation.error.issues);
      return NextResponse.json(
        { error: 'Invalid telemetry payload structure', details: validation.error.issues },
        { status: 400 }
      );
    }

    // 3. Extract the clean, validated data
    const { location, bus_id } = validation.data;

    // 4. Verify the Card Exists and is Active
    const { data: card, error: cardError } = await supabase
      .from('ga_cards')
      .select('status')
      .eq('card_number', card_number)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: 'Hardware card not found in system' }, { status: 404 });
    }
    
    if (card.status !== 'ACTIVE') {
      return NextResponse.json({ error: `Hardware card is currently ${card.status}` }, { status: 403 });
    }

    // 5. Find an Active Product with Remaining Rides
    const { data: product, error: productError } = await supabase
      .from('ga_card_products')
      .select('product_id, rides_remaining')
      .eq('card_number', card_number)
      .eq('status', 'ACTIVE')
      .gt('rides_remaining', 0)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Insufficient funds or no active product found' }, { status: 402 });
    }

    // 6. Deduct 1 Ride from the Product
    const { error: updateError } = await supabase
      .from('ga_card_products')
      .update({ rides_remaining: product.rides_remaining - 1 })
      .eq('product_id', product.product_id);

    if (updateError) throw updateError;

    // 7. Log the transaction in the Ledger (Now with Fleet Telemetry!)
    const { error: ledgerError } = await supabase
      .from('ga_tap_ledger')
      .insert({
        card_number: card_number,
        location: location,
        bus_id: bus_id // <-- Fleet Management Integration successfully added
      });

    if (ledgerError) throw ledgerError;

    return NextResponse.json({ 
      success: true, 
      message: 'Tap recorded safely',
      rides_remaining: product.rides_remaining - 1
    });

  } catch (error: any) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}