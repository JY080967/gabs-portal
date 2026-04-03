'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsDashboard() {
  const [data, setData] = useState({ todayTaps: 0, heatmap: [], hourlyCurve: [] });
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) throw new Error('Analytics API failed');
        const json = await res.json();
        setData(json);
        setLastRefreshed(new Date());
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000); // Increased polling frequency to 15s for the Fleet test
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-900 rounded-2xl border border-gray-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium text-sm tracking-widest uppercase">Initializing Telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-10 w-full">
      {/* 1. TOP ROW: Header & KPI Widget */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* KPI Card */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl flex-1 relative overflow-hidden">
          {/* Live Indicator */}
          <div className="absolute top-6 right-6 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Live System</span>
          </div>

          <h2 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">System Throughput</h2>
          <p className="text-gray-500 text-sm mb-4">Total Validated Taps (Today)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-6xl font-black text-amber-500 tracking-tighter">{data.todayTaps.toLocaleString()}</p>
            <p className="text-gray-500 text-sm font-medium">transactions</p>
          </div>
          {lastRefreshed && (
            <p className="text-gray-600 text-xs mt-4">Last synced: {lastRefreshed.toLocaleTimeString()}</p>
          )}
        </div>
      </div>

      {/* 2. BOTTOM ROW: The Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* The Commuter Curve */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl h-[400px] flex flex-col">
          <div className="mb-6">
            <h2 className="text-gray-100 font-bold text-lg">Commuter Pulse</h2>
            <p className="text-gray-500 text-xs tracking-wide uppercase">Taps by Hour</p>
          </div>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.hourlyCurve} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="hour_of_day" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(tick) => `${tick}:00`} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#f3f4f6' }}
                  itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="total_taps" name="Taps" stroke="#f59e0b" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#111827', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* The Location Heatmap */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl h-[400px] flex flex-col">
          <div className="mb-6">
            <h2 className="text-gray-100 font-bold text-lg">Terminal Heatmap</h2>
            <p className="text-gray-500 text-xs tracking-wide uppercase">Top 5 Busiest Nodes</p>
          </div>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.heatmap} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="location" type="category" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#f3f4f6' }}
                  cursor={{ fill: '#1f2937' }}
                />
                <Bar dataKey="tap_count" name="Taps" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}