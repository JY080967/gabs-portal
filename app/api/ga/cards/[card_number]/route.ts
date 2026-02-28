import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use the Service Role Key for backend system-to-system communication
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ card_number: string }> }
) {
  try {
    // 1. Unwrap the dynamic route parameter (Next.js 15 requirement)
    const { card_number } = await params;

    // 2. Fetch the base card hardware status
    const { data: cardData, error: cardError } = await supabase
      .from('ga_cards')
      .select('status')
      .eq('card_number', card_number)
      .single();

    if (cardError || !cardData) {
      return NextResponse.json({ error: 'Card not found in GA Core System' }, { status: 404 });
    }

    // 3. Fetch the CURRENTLY ACTIVE product (ignoring queued or expired ones)
    const { data: productData } = await supabase
      .from('ga_card_products')
      .select('product_type, rides_remaining, expiry_date')
      .eq('card_number', card_number)
      .eq('status', 'ACTIVE')
      .maybeSingle(); // maybeSingle because a card might have 0 active products

    // 4. Fetch the receipt ledger (Last 10 trips)
    const { data: tapData } = await supabase
      .from('ga_tap_ledger')
      .select('location, timestamp')
      .eq('card_number', card_number)
      .order('timestamp', { ascending: false })
      .limit(10);

    // 5. Assemble the final Master JSON Payload
    const responsePayload = {
      card_number: card_number,
      hardware_status: cardData.status,
      active_product: productData ? productData.product_type : 'No Active Product',
      rides_remaining: productData ? productData.rides_remaining : 0,
      product_expiry: productData ? productData.expiry_date : null,
      recent_trips: tapData || [] // Return empty array if no trips exist yet
    };

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (err) {
    console.error("GET Card Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}