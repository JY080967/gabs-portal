'use client';

import { useState, useEffect } from 'react';

export default function CommuterPortal() {
  // Auth State
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Real Data State (From API)
  const [userProfile, setUserProfile] = useState<any>(null);
  const [cardProduct, setCardProduct] = useState<any>(null);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [isConfirmingFreeze, setIsConfirmingFreeze] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCard, setRegCard] = useState('');
  const [regReceipt, setRegReceipt] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- SECURE LIFECYCLE ---
  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async (silent = false) => {
    if (!silent) setIsCheckingAuth(true); // Only show full-screen loader on initial boot
    try {
      const res = await fetch('/api/portal/dashboard');
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
        setCardProduct(data.product);
        setRecentTrips(data.recent_trips);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard");
      setIsLoggedIn(false);
    } finally {
      if (!silent) setIsCheckingAuth(false);
    }
  };

  // --- AUTH HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setErrorMsg(''); setSuccessMsg('');

    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      // Cookie is set! Fetch the real dashboard data.
      await fetchDashboard(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setErrorMsg(''); setSuccessMsg('');

    try {
      const res = await fetch('/api/portal/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regName, email: regEmail, password: regPassword, card_number: regCard, receipt_number: regReceipt
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setSuccessMsg('Profile created! You can now log in.');
      setIsRegistering(false);
      // Clear forms
      setRegName(''); setRegEmail(''); setRegPassword(''); setRegCard(''); setRegReceipt('');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await fetch('/api/portal/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setUserProfile(null);
    setEmail('');
    setPassword('');
    setIsLoading(false);
  };
  
  const handleFreezeCard = async () => {
    setIsFreezing(true);
    try {
      const res = await fetch('/api/portal/cards/freeze', { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to freeze card');
      
      // Refresh the dashboard to show the new FROZEN status
      await fetchDashboard(true);
      setIsConfirmingFreeze(false);
    } catch (err) {
      alert("Error freezing card. Please contact support.");
    } finally {
      setIsFreezing(false);
    }
  };

  // --- LOADING STATE ---
  if (isCheckingAuth) {
    return <main className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-amber-500 font-bold">Verifying Secure Session...</p></main>;
  }

  // --- UNAUTHENTICATED UI ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-amber-500 tracking-wide mb-2">GABS DIGITAL</h1>
            <p className="text-gray-400 text-sm">
              {isRegistering ? 'Claim your physical Gold Card' : 'Sign in to manage your Gold Card'}
            </p>
          </div>
          
          {errorMsg && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm text-center">{errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-sm text-center">{successMsg}</div>}

          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div><label className="block text-gray-400 text-xs font-bold uppercase mb-1">Full Name</label><input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-2" required /></div>
              <div><label className="block text-gray-400 text-xs font-bold uppercase mb-1">Email</label><input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-2" required /></div>
              <div><label className="block text-gray-400 text-xs font-bold uppercase mb-1">Create Password</label><input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-2" placeholder="Min 8 chars, 1 uppercase, 1 number" required /></div>
              <div className="pt-2 border-t border-gray-800 mt-4">
                <p className="text-xs text-amber-500 font-semibold mb-3 uppercase">Identity Verification</p>
                <div className="space-y-4">
                  <div><label className="block text-gray-400 text-xs font-bold uppercase mb-1">Gold Card Number</label><input type="text" value={regCard} onChange={(e) => setRegCard(e.target.value)} className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-2" required /></div>
                  <div><label className="block text-gray-400 text-xs font-bold uppercase mb-1">Recent Receipt Number</label><input type="text" value={regReceipt} onChange={(e) => setRegReceipt(e.target.value)} className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-2" required /></div>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg mt-4">{isLoading ? 'Verifying...' : 'Claim Card & Register'}</button>
              <p className="text-center text-sm text-gray-500 mt-4">Already have an account? <button type="button" onClick={() => {setIsRegistering(false); setErrorMsg('');}} className="text-amber-500 hover:underline">Log in</button></p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div><label className="block text-gray-400 text-xs font-bold uppercase mb-2">Email Address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-3" required /></div>
              <div><label className="block text-gray-400 text-xs font-bold uppercase mb-2">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-3" required /></div>
              <button type="submit" disabled={isLoading} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg shadow-lg">{isLoading ? 'Logging In...' : 'Log In'}</button>
              <p className="text-center text-sm text-gray-500 mt-4">New to GABS Digital? <button type="button" onClick={() => {setIsRegistering(true); setErrorMsg('');}} className="text-amber-500 hover:underline">Claim your Gold Card</button></p>
            </form>
          )}
        </div>
      </main>
    );
  }

  // --- AUTHENTICATED UI (MVP DASHBOARD) ---
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center py-10 p-6 font-sans text-gray-100">
      <div className="w-full max-w-md bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800">
        
        <div className="bg-amber-600 p-6 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl tracking-wide text-white">GABS GOLD</h1>
            <p className="text-amber-100 text-sm font-medium">{userProfile?.email}</p>
          </div>
          <button onClick={handleLogout} disabled={isLoading} className="bg-black/20 hover:bg-black/40 transition px-3 py-1 rounded-full text-xs font-semibold text-white">
            Log Out
          </button>
        </div>

        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Linked Card</p>
              <p className="text-gray-200 font-mono text-lg">{userProfile?.linked_ga_card}</p>
            </div>
         {/* MVP PHASE 3: SECURE HARDWARE MUTATION */}
            {cardProduct?.status === 'FROZEN' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800/50 text-gray-500 border border-gray-800 cursor-not-allowed">
                Card Locked
              </span>
            ) : isConfirmingFreeze ? (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsConfirmingFreeze(false)}
                  disabled={isFreezing}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFreezeCard}
                  disabled={isFreezing}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition animate-pulse"
                >
                  {isFreezing ? 'Freezing...' : 'Confirm Freeze'}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsConfirmingFreeze(true)}
                className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800 text-red-400 border border-red-900/50 hover:bg-red-900/30 transition"
              >
                Report Lost
              </button>
            )}
          </div>

          <div className="bg-gray-950 rounded-xl p-5 border border-gray-800 mt-4 text-center">
            {cardProduct ? (
              <>
                <p className="text-gray-400 text-sm mb-1">{cardProduct.product_type}</p>
                <h2 className="text-5xl font-extrabold text-white my-2">
                  {cardProduct.rides_remaining} <span className="text-lg font-medium text-gray-500">trips</span>
                </h2>
                <p className={`text-xs font-bold mt-2 ${cardProduct.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`}>
                  STATUS: {cardProduct.status}
                </p>
              </>
            ) : (
              <p className="text-gray-500 text-sm py-4">No active products found on this card.</p>
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-900">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Recent Travel History</p>
          {recentTrips.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No recent trips found.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {recentTrips.map((trip: any, index: number) => (
                <div key={index} className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-800 p-2 rounded-full">🚌</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-200">{trip.location}</p>
                      <p className="text-xs text-gray-500">{new Date(trip.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 font-mono text-xs">{trip.bus_id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}