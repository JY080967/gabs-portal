import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Check the portal_users table for a match
    const { data: user, error } = await supabase
      .from('portal_users')
      .select('full_name, linked_ga_card')
      .eq('email', email)
      .eq('password_hash', password) // In a real production app, we would hash this first!
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 2. Return the user's specific linked Gold Card
    return NextResponse.json({
      message: 'Authentication successful',
      full_name: user.full_name,
      linked_ga_card: user.linked_ga_card
    }, { status: 200 });

  } catch (err) {
    console.error("Auth Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}