import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// 1. Strict OWASP Input Validation
const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  full_name: z.string().min(2, "Full name is required"),
  card_number: z.string().min(3, "Invalid Gold Card number"),
  receipt_number: z.string().min(5, "Receipt Number is required for identity verification")
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    
    // 2. Validate Payload
    const validation = RegisterSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        // FIX: Using .issues instead of .errors to satisfy TypeScript
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, password, full_name, card_number, receipt_number } = validation.data;

    // 3. Knowledge-Based Authentication (KBA) Check
    const { data: validProduct, error: productError } = await supabase
      .from('ga_card_products')
      // FIX: Selecting the actual primary key column that exists in your DB
      .select('product_id') 
      .eq('card_number', card_number)
      .eq('product_id', receipt_number)
      .single();

    if (productError || !validProduct) {
      // Enterprise Observability: Log the actual DB error to the server console
      console.error("KBA Lookup Error:", productError); 
      return NextResponse.json(
        { error: 'Identity Verification Failed: Card Number and Receipt Number do not match our records.' },
        { status: 403 }
      );
    }

    // 4. Hardware Availability Check
    const { data: existingLink } = await supabase
      .from('portal_users')
      .select('user_id')
      .eq('linked_ga_card', card_number)
      .single();

    if (existingLink) {
      return NextResponse.json(
        { error: 'This Gold Card is already linked to a digital profile. Please contact support if this card was stolen.' },
        { status: 409 }
      );
    }

    // 5. Cryptographic Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Secure Database Insertion
    const { error: insertError } = await supabase
      .from('portal_users')
      .insert({
        email: email.toLowerCase(), 
        password_hash: hashedPassword,
        full_name: full_name,
        linked_ga_card: card_number
      });

    if (insertError?.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    if (insertError) throw insertError;

    // 7. Successful Registration
    return NextResponse.json({ 
      success: true, 
      message: 'Digital profile created and Gold Card successfully linked.' 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Critical Auth Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}