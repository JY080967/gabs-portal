import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Data Engineering Trick: Promise.all fetches all 3 views simultaneously in parallel 
    // rather than waiting for one to finish before starting the next.
    const [todayRes, heatmapRes, hourlyRes] = await Promise.all([
      supabase.from('view_taps_today').select('*').single(),
      supabase.from('view_location_heatmap').select('*').limit(5), // Only get the Top 5 busiest routes
      supabase.from('view_hourly_trend').select('*')
    ]);

    // Package the raw SQL data into a clean JSON object for Recharts
    return NextResponse.json({
      todayTaps: todayRes.data?.total_taps || 0,
      heatmap: heatmapRes.data || [],
      hourlyCurve: hourlyRes.data || []
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}