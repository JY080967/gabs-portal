import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. We tell TypeScript that params is now a Promise
export async function POST(
  request: Request,
  { params }: { params: Promise<{ card_number: string }> }
) {
  // 2. We mathematically 'await' the Promise to unwrap the card number
  const { card_number } = await params;
  
  try {
    const body = await request.json();
    const { product_type } = body; 

    // Determine product rules
    let initialRides = 0;
    let daysValid = 0;

    if (product_type === 'Weekly') {
      initialRides = 10;
      daysValid = 14;
    } else if (product_type === 'Monthly') {
      initialRides = 48;
      daysValid = 37;
    } else {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
    }

    // Check current products on the card to see if we need to QUEUE this
    const { data: currentProducts } = await supabase
      .from('ga_card_products')
      .select('status')
      .eq('card_number', card_number)
      .in('status', ['ACTIVE', 'QUEUED']);

    let newStatus = 'ACTIVE';
    
    if (currentProducts && currentProducts.length > 0) {
      const hasQueued = currentProducts.some(p => p.status === 'QUEUED');
      if (hasQueued) {
         return NextResponse.json({ error: 'Card already has a queued product. Limit is 1.' }, { status: 400 });
      }
      newStatus = 'QUEUED';
    }

    // Calculate Expiry Date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysValid);

    // Insert the new product
    const { data: newProduct, error: insertError } = await supabase
      .from('ga_card_products')
      .insert([{
        card_number: card_number, // This will now correctly be 'GA-00001'
        product_type: `${product_type} (${initialRides} Rides)`,
        rides_remaining: initialRides,
        status: newStatus,
        expiry_date: expiryDate.toISOString()
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      message: 'Purchase successful',
      product: newProduct
    }, { status: 201 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}