import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ card_number: string }> }
) {
  const { card_number } = await params;
  
  try {
    const body = await request.json();
    const { location } = body; 

    if (!location) {
      return NextResponse.json({ error: 'Bus location is required' }, { status: 400 });
    }

    // 1. Check if the card hardware is valid
    const { data: card } = await supabase.from('ga_cards').select('status').eq('card_number', card_number).single();
    if (!card || card.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Card Denied: Blocked or Invalid' }, { status: 403 });
    }

    // 2. Try to find an ACTIVE product
    let { data: activeProduct } = await supabase
      .from('ga_card_products')
      .select('*')
      .eq('card_number', card_number)
      .eq('status', 'ACTIVE')
      .maybeSingle(); 

    // 3. THE QUEUE UPGRADE: If no active product, check for a queued one
    if (!activeProduct) {
      const { data: queuedProduct } = await supabase
        .from('ga_card_products')
        .select('*')
        .eq('card_number', card_number)
        .eq('status', 'QUEUED')
        .order('purchase_date', { ascending: true }) // Grabs the oldest queued product
        .limit(1)
        .maybeSingle();

      if (queuedProduct) {
        // Automatically activate the queued product
        await supabase
          .from('ga_card_products')
          .update({ status: 'ACTIVE' })
          .eq('product_id', queuedProduct.product_id);
        
        activeProduct = { ...queuedProduct, status: 'ACTIVE' };
      } else {
        // If there is no active AND no queued product, they are truly out of rides
        return NextResponse.json({ error: 'Card Denied: No active rides or queued products left' }, { status: 402 });
      }
    }

    // 4. Deduct 1 ride from the currently active product
    const newRides = activeProduct.rides_remaining - 1;
    let newStatus = 'ACTIVE';
    
    // If that was their last ride, exhaust the product so the next tap triggers the queue check
    if (newRides === 0) {
      newStatus = 'EXHAUSTED';
    }

    await supabase
      .from('ga_card_products')
      .update({ rides_remaining: newRides, status: newStatus })
      .eq('product_id', activeProduct.product_id);

    // 5. Log the tap in the ledger
    const { data: receipt, error: ledgerError } = await supabase
      .from('ga_tap_ledger')
      .insert([{
        card_number: card_number,
        location: location
      }])
      .select()
      .single();

    if (ledgerError) throw ledgerError;

    return NextResponse.json({
      message: 'Tap successful. Enjoy your ride.',
      rides_remaining: newRides,
      product_status: newStatus,
      receipt: receipt
    }, { status: 200 });

  } catch (err) {
    console.error("Tap Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}