import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Find the user by email
    const { data: user, error } = await supabase
      .from('portal_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 2. Cryptographic Password Verification
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 3. Enterprise Identity Management: Generate JWT
    // Use the actual Supabase JWT Secret so the database can natively decode it
    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
    const alg = 'HS256';

    const jwt = await new SignJWT({
      user_id: user.user_id,
      linked_ga_card: user.linked_ga_card,
      email: user.email,
      role: 'authenticated' // CRITICAL: Tells Supabase RLS to treat this as a logged-in user
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('2h') 
      .sign(secret);

    // 4. Secure HTTP-Only Cookie Assignment
    const cookieStore = await cookies();
    cookieStore.set('gabs_session', jwt, {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
      sameSite: 'strict', // Prevents Cross-Site Request Forgery (CSRF)
      maxAge: 60 * 60 * 2, // 2 hours in seconds
      path: '/',
    });

    // 5. Success! Return minimal user data to paint the UI
    return NextResponse.json({
      success: true,
      full_name: user.full_name,
      linked_ga_card: user.linked_ga_card
    }, { status: 200 });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}