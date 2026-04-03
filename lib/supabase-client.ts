// lib/supabase-client.ts
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function getSecureClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gabs_session')?.value;

  if (!token) {
    throw new Error('Unauthorized: No active session token found.');
  }

  // ENTERPRISE ARCHITECTURE:
  // We use the restrictive ANON_KEY. We inject the JWT as a Bearer token.
  // PostgreSQL will decode this token, read the `linked_ga_card`, and enforce RLS automatically.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}