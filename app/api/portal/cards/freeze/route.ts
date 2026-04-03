import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getSecureClient } from '../../../../../lib/supabase-client';

export async function PATCH() {
  try {
    // 1. Verify Session
    const cookieStore = await cookies();
    const token = cookieStore.get('gabs_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const linkedCard = payload.linked_ga_card as string;

    // 2. Instantiate Secure Client
    const supabase = await getSecureClient();

    // 3. Mutate Hardware State
    const { error: freezeError } = await supabase
      .from('ga_cards')
      .update({ hardware_status: 'FROZEN' })
      .eq('card_number', linkedCard);

    if (freezeError) throw freezeError;

    // 4. STRICT MUTATION: Freeze the actual product/funds
    const { error: productError } = await supabase
      .from('ga_card_products')
      .update({ status: 'FROZEN' })
      .eq('card_number', linkedCard)
      .eq('status', 'ACTIVE');

    if (productError) {
      console.error("Product Update Failed:", productError);
      throw new Error("Card frozen, but failed to freeze funds.");
    }

    return NextResponse.json({ success: true, message: 'Card and funds successfully frozen.' });

  } catch (error: any) {
    console.error("Freeze API Error:", error.message);
    return NextResponse.json({ error: 'Failed to freeze card.' }, { status: 500 });
  }
}