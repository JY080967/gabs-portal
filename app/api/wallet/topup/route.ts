import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
  try {
    const { cardNumber, productType = 'Monthly Pass', ridesToAdd = 40 } = await request.json();

    // 1. Mock Latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 2. Fetch any existing ACTIVE pass for this card
    const { data: existingPasses } = await supabase
      .from('ga_card_products')
      .select('product_id, rides_remaining')
      .eq('card_number', cardNumber)
      .eq('status', 'ACTIVE')
      .order('purchase_date', { ascending: false });

    // 3. The Rollover Logic
    if (existingPasses && existingPasses.length > 0) {
      // If they have an active pass, just ADD the new trips to their current balance
      const currentPass = existingPasses[0];
      const { error } = await supabase
        .from('ga_card_products')
        .update({ rides_remaining: currentPass.rides_remaining + ridesToAdd })
        .eq('product_id', currentPass.product_id);
        
      if (error) throw error;

    } else {
      // If they have no active passes, insert a brand new one
      const receiptNumber = `MOCK-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const { error } = await supabase
        .from('ga_card_products')
        .insert({
          card_number: cardNumber,
          product_type: productType,
          rides_remaining: ridesToAdd,
          status: 'ACTIVE',
          purchase_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), 
          receipt_number: receiptNumber
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true, ridesAdded: ridesToAdd }, { status: 201 });

  } catch (error: any) {
    console.error("Critical Payment Error:", error);
    return NextResponse.json({ error: 'Secure payment processing failed' }, { status: 500 });
  }
}