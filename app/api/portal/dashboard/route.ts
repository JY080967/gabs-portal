import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getSecureClient } from '../../../../lib/supabase-client';

export async function GET() {
  try {
    // 1. Verify the HTTP-Only Session
    const cookieStore = await cookies();
    const token = cookieStore.get('gabs_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Decode the token server-side to get the user's profile info
    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // 2. Instantiate the Least Privilege Database Client
    const supabase = await getSecureClient();

    // 3. Fetch MVP Data concurrently
    const [productRes, tapsRes] = await Promise.all([
      supabase
        .from('ga_card_products')
        .select('product_type, rides_remaining, status')
        .order('purchase_date', { ascending: false }) // <-- FIX: Sort by newest
        .limit(1)                                     // <-- FIX: Grab only the top one
        .single(), 
        
      supabase
        .from('ga_tap_ledger')
        .select('location, timestamp, bus_id')
        .order('timestamp', { ascending: false })
        .limit(10) 
    ]);

    // Handle the edge case where a user has no active product
    if (productRes.error && productRes.error.code !== 'PGRST116') {
      console.error("Dashboard Product Error:", productRes.error);
    }

    // 4. Return the assembled payload to the frontend
    return NextResponse.json({
      success: true,
      user: {
        email: payload.email,
        linked_ga_card: payload.linked_ga_card
      },
      product: productRes.data || null,
      recent_trips: tapsRes.data || []
    }, { status: 200 });

  } catch (error: any) {
    console.error("Dashboard API Error:", error.message);
    return NextResponse.json({ error: 'Session invalid or expired' }, { status: 401 });
  }
}