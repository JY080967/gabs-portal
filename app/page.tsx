'use client';

import { useState, useEffect } from 'react'; // Add useEffect here

export default function CommuterPortal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cardData, setCardData] = useState<any>(null);
  const [userName, setUserName] = useState('');

  // The new Real Authentication Logic
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Call the Portal Auth API
      const authResponse = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.error || 'Login failed');
      }

      // 2. We successfully got the linked card! Now fetch its live GA data.
      setUserName(authData.full_name);
      await fetchCardData(authData.linked_ga_card);

    } catch (err: any) {
      setErrorMsg(err.message);
      setIsLoading(false);
    }
  };

  // System 2 to System 1 Communication
  const fetchCardData = async (cardNumber: string) => {
    try {
      const response = await fetch(`/api/ga/cards/${cardNumber}`);
      if (!response.ok) throw new Error('Failed to reach GA Systems');
      
      const data = await response.json();
      setCardData(data);
      setIsLoggedIn(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not connect to Golden Arrow Core API.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ADD THIS BLOCK HERE ---
  // This is the "Heartbeat" that checks for new bus taps every 10 seconds
  useEffect(() => {
    // Only set up the timer if we are logged in and have a card to track
    if (isLoggedIn && cardData?.card_number) {
      const interval = setInterval(() => {
        console.log("Heartbeat: Checking for new bus taps...");
        fetchCardData(cardData.card_number);
      }, 10000); // 10 seconds

      // This cleans up the timer if you log out or close the page
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, cardData?.card_number]);
  // ---------------------------


  // --- UI: LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-amber-500 tracking-wide mb-2">GABS DIGITAL</h1>
            <p className="text-gray-400 text-sm">Sign in to manage your Gold Card</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                placeholder="test@gabs.co.za"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wide mb-2">
                Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-950 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            
            {errorMsg && <p className="text-red-400 text-sm text-center font-medium">{errorMsg}</p>}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>

          </form>
        </div>
      </main>
    );
  }

  // --- UI: SECURE DASHBOARD ---
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center py-10 p-6 font-sans text-gray-100">
      <div className="w-full max-w-md bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800">
        
        {/* Header */}
        <div className="bg-amber-600 p-6 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl tracking-wide text-white">GABS GOLD</h1>
            <p className="text-amber-100 text-sm font-medium">Welcome, {userName}</p>
          </div>
          <button 
            onClick={() => {
              setIsLoggedIn(false);
              setEmail('');
              setPassword('');
            }}
            className="bg-black/30 hover:bg-black/50 transition px-3 py-1 rounded-full text-xs font-semibold text-amber-50"
          >
            Logout
          </button>
        </div>

        {/* Card Details */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Card Number</p>
              <p className="text-gray-200 font-mono text-lg">{cardData?.card_number}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${cardData?.hardware_status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {cardData?.hardware_status}
            </div>
          </div>

          <div className="bg-gray-950 rounded-xl p-5 border border-gray-800 mt-4 text-center">
            <p className="text-gray-400 text-sm mb-1">{cardData?.active_product}</p>
            <h2 className="text-5xl font-extrabold text-white my-2">
              {cardData?.rides_remaining} <span className="text-lg font-medium text-gray-500">trips</span>
            </h2>
            <p className="text-gray-500 text-xs mt-2">
              {cardData?.product_expiry ? `Expires: ${new Date(cardData?.product_expiry).toLocaleDateString()}` : 'No active expiry'}
            </p>
          </div>
          
          <button className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-red-400 font-bold py-3 rounded-xl transition-colors text-sm border border-gray-700">
            Report Lost Card
          </button>
        </div>

        {/* Transaction Ledger */}
        <div className="p-6 bg-gray-900">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Recent Receipts</p>
          
          {cardData?.recent_trips?.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No recent trips found.</p>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {cardData?.recent_trips?.map((trip: any, index: number) => (
                <div key={index} className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-800 p-2 rounded-full">🚌</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-200">{trip.location}</p>
                      <p className="text-xs text-gray-500">{new Date(trip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <span className="text-red-400 font-bold text-sm">-1 Trip</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}