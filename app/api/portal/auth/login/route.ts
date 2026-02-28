import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs'; // 1. Import Bcrypt

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 2. Fetch the user by Email ONLY
    const { data: user, error } = await supabase
      .from('portal_users')
      .select('full_name, linked_ga_card, password_hash')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 3. SECURE CHECK: Compare the plain-text password to the DB hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 4. Success!
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