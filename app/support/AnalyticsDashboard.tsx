'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsDashboard() {
  const [data, setData] = useState({ todayTaps: 0, heatmap: [], hourlyCurve: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics(); // Fetch immediately on load
    
    // Set up our 30-second live polling heartbeat
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-emerald-400 font-bold animate-pulse p-6">Loading System Analytics...</div>;
  }

  return (
    <div className="space-y-6 mb-10 w-full max-w-6xl mx-auto">
      {/* 1. TOP ROW: KPI Card */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-2">Total System Taps (Today)</h2>
        <p className="text-5xl font-extrabold text-emerald-400">{data.todayTaps}</p>
      </div>

      {/* 2. BOTTOM ROW: The Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* The Commuter Curve (Line Chart) */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg h-96 flex flex-col">
          <h2 className="text-white font-bold mb-4">Commuter Pulse (Taps by Hour)</h2>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.hourlyCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="hour_of_day" stroke="#94a3b8" tickFormatter={(tick) => `${tick}:00`} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Line type="monotone" dataKey="total_taps" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* The Location Heatmap (Bar Chart) */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg h-96 flex flex-col">
          <h2 className="text-white font-bold mb-4">Busiest Terminals (Top 5)</h2>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.heatmap} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="location" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} cursor={{ fill: '#334155' }} />
                <Bar dataKey="tap_count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}