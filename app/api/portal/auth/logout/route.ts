import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  // Securely destroy the session cookie
  cookieStore.delete('gabs_session');
  return NextResponse.json({ success: true });
}