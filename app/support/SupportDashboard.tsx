'use client';

import { useState, useEffect } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';


export default function TechSupportDashboard() {
  // --- Admin Auth State ---
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState('');

  // --- Dashboard State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser === 'JadminVN' && adminPass === 'admin@123') {
      setIsAdminLoggedIn(true);
      setAuthError('');
    } else {
      setAuthError('Unauthorized: Invalid Support Credentials');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setCustomerData(null);

    try {
      // Notice we use a relative path here!
      const res = await fetch('/api/support/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      
      setCustomerData(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isAdminLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Core Ops Portal</h1>
          <p className="text-slate-400 text-sm text-center mb-6">Restricted Access. L1/L2 Tech Support Only.</p>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agent ID</label>
              <input 
                type="text" 
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="w-full mt-1 bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passcode</label>
              <input 
                type="password" 
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="w-full mt-1 bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            {authError && <p className="text-red-400 text-sm font-semibold">{authError}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 transition-colors">
              Authenticate
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- RENDER: MAIN DASHBOARD ---
  return (
    <main className="min-h-screen bg-slate-100 font-sans p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header & Search */}
        <div className="bg-slate-900 rounded-2xl p-8 shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">GABS Core Ops</h1>
            <p className="text-slate-400 text-sm mt-1">L1/L2 Technical Support & Diagnostics</p>
          </div>
          
          <form onSubmit={handleSearch} className="w-full md:w-1/2 flex gap-3">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Email or Card (e.g., GA-00042)"
              className="flex-1 bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-lg disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Scanning...' : 'Investigate'}
            </button>
          </form>
        </div>

        {/* --- MACRO VIEW: SYSTEM ANALYTICS --- */}
        <AnalyticsDashboard />

        {/* --- MICRO VIEW: INDIVIDUAL INVESTIGATION --- */}
        {errorMsg && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-8 shadow-sm">
            <p className="font-bold">Investigation Failed</p>
            <p>{errorMsg}</p>
          </div>
        )}

        {/* The 360-Degree Customer View */}
        {customerData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column: Profile & Hardware */}
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Commuter Profile</h2>
                <p className="text-xl font-bold text-slate-800">{customerData.customer.full_name}</p>
                <p className="text-sm text-slate-500">{customerData.customer.email}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Hardware Status</h2>
                <p className="text-2xl font-mono font-bold text-slate-800 mb-2">{customerData.hardware.card_number}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${customerData.hardware.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {customerData.hardware.status}
                </span>
                
                <div className="mt-6 flex flex-col gap-2">
                  <button className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 py-2 rounded-lg text-sm font-semibold transition">Lock Hardware (Lost/Stolen)</button>
                  <button className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 py-2 rounded-lg text-sm font-semibold transition">Issue Courtesy Trip</button>
                </div>
              </div>
            </div>

            {/* Middle Column: Products */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Product History</h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {customerData.products.length === 0 ? <p className="text-slate-500 text-sm">No products found.</p> : null}
                {customerData.products.map((p: any) => (
                  <div key={p.product_id} className={`p-4 rounded-xl border ${p.status === 'ACTIVE' ? 'border-green-300 bg-green-50' : p.status === 'QUEUED' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-800 text-sm">{p.product_type}</p>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${p.status === 'ACTIVE' ? 'bg-green-200 text-green-800' : p.status === 'QUEUED' ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>{p.status}</span>
                    </div>
                    <p className="text-xs text-slate-500">Purchased: {new Date(p.purchase_date).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500">Rides Left: <span className="font-bold text-slate-700">{p.rides_remaining}</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Tap Ledger */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ledger (Last 50 Taps)</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {customerData.ledger.length === 0 ? <p className="text-slate-500 text-sm">No tap history found.</p> : null}
                {customerData.ledger.map((tap: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">{tap.location}</p>
                      <p className="text-xs text-slate-400">{new Date(tap.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                    <span className="text-red-500 font-bold text-xs">-1</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}