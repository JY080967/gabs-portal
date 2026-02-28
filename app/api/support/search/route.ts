import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    let targetCardNumber = query.trim().toUpperCase();
    let userProfile = null;

    // 1. Determine if they searched by Email or Card Number
    if (query.includes('@')) {
      // It's an email! Let's find the linked card.
      const { data: user, error: userErr } = await supabase
        .from('portal_users')
        .select('full_name, email, linked_ga_card')
        .eq('email', query.trim().toLowerCase())
        .single();

      if (userErr || !user) {
        return NextResponse.json({ error: 'No commuter found with that email.' }, { status: 404 });
      }
      userProfile = user;
      targetCardNumber = user.linked_ga_card;
    } else {
      // They searched by Card Number directly. Let's see if a human is attached.
      const { data: user } = await supabase
        .from('portal_users')
        .select('full_name, email')
        .eq('linked_ga_card', targetCardNumber)
        .maybeSingle();
      
      if (user) userProfile = user;
    }

    // 2. Fetch Hardware Status
    const { data: card, error: cardErr } = await supabase
      .from('ga_cards')
      .select('status')
      .eq('card_number', targetCardNumber)
      .single();

    if (cardErr || !card) {
      return NextResponse.json({ error: 'Hardware card not found in GA Core.' }, { status: 404 });
    }

    // 3. Fetch All Product History (Active, Queued, Exhausted)
    const { data: products } = await supabase
      .from('ga_card_products')
      .select('*')
      .eq('card_number', targetCardNumber)
      .order('purchase_date', { ascending: false });

    // 4. Fetch the 50 most recent taps from the ledger
    const { data: ledger } = await supabase
      .from('ga_tap_ledger')
      .select('*')
      .eq('card_number', targetCardNumber)
      .order('timestamp', { ascending: false })
      .limit(50);

    // Assemble the 360-Degree View Payload
    return NextResponse.json({
      customer: userProfile || { full_name: 'Unregistered Card', email: 'N/A' },
      hardware: {
        card_number: targetCardNumber,
        status: card.status
      },
      products: products || [],
      ledger: ledger || []
    }, { status: 200 });

  } catch (err) {
    console.error("Support API Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}