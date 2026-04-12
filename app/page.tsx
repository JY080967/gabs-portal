'use client';

import { useState, useEffect } from 'react';
import { LogOut, AlertTriangle, Ticket, CreditCard, MapPin, ChevronRight, X, Loader2, CheckCircle2 } from 'lucide-react';

export default function CommuterPortal() {
  // --- AUTH & DATA STATE ---
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [cardProduct, setCardProduct] = useState<any>(null);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);

  // --- FREEZE STATE ---
  const [isConfirmingFreeze, setIsConfirmingFreeze] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);

  // --- FORM STATE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCard, setRegCard] = useState('');
  const [regReceipt, setRegReceipt] = useState('');

  // --- UI STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- FINTECH MODAL STATE ---
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPass, setSelectedPass] = useState<'weekly' | 'monthly'>('monthly');

  const PASS_OPTIONS = {
    weekly: { name: 'Weekly Pass', price: 250, trips: 14 },
    monthly: { name: 'Monthly Pass', price: 800, trips: 40 }
  };

  // --- SECURE LIFECYCLE ---
  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async (silent = false) => {
    if (!silent) setIsCheckingAuth(true);
    try {
      const res = await fetch('/api/portal/dashboard', { cache: 'no-store' });
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
        body: JSON.stringify({ full_name: regName, email: regEmail, password: regPassword, card_number: regCard, receipt_number: regReceipt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccessMsg('Profile created! You can now log in.');
      setIsRegistering(false);
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
    setIsLoggedIn(false); setUserProfile(null); setEmail(''); setPassword('');
    setIsLoading(false);
  };
  
  const handleFreezeCard = async () => {
    setIsFreezing(true);
    try {
      const res = await fetch('/api/portal/cards/freeze', { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to freeze card');
      await fetchDashboard(true);
      setIsConfirmingFreeze(false);
    } catch (err) {
      alert("Error freezing card. Please contact support.");
    } finally {
      setIsFreezing(false);
    }
  };

  // --- FINTECH PAYMENT HANDLER ---
  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const activePass = PASS_OPTIONS[selectedPass];
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardNumber: userProfile.linked_ga_card,
          productType: activePass.name,
          ridesToAdd: activePass.trips
        })
      });
      
      if (res.ok) {
        await fetchDashboard(true); // Pull fresh data from Supabase
        setShowTopUpModal(false);
      } else {
        throw new Error("Payment processing failed");
      }
    } catch (error) {
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LOADING UI ---
  if (isCheckingAuth) {
    return <main className="min-h-screen bg-[#0B1120] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></main>;
  }

  // --- UNAUTHENTICATED UI (LOGIN/REGISTER) ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-[#111827] rounded-[2.5rem] shadow-2xl p-8 border border-slate-800">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-[#FF8A00] tracking-wide mb-2">GABS DIGITAL</h1>
            <p className="text-slate-400 text-sm">{isRegistering ? 'Claim your physical Gold Card' : 'Sign in to manage your Gold Card'}</p>
          </div>
          
          {errorMsg && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm text-center">{errorMsg}</div>}
          {successMsg && <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-800 rounded-lg text-emerald-400 text-sm text-center">{successMsg}</div>}

          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div><label className="block text-slate-400 text-xs font-bold uppercase mb-1">Full Name</label><input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-[#1E293B] text-white border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors" required /></div>
              <div><label className="block text-slate-400 text-xs font-bold uppercase mb-1">Email</label><input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-[#1E293B] text-white border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors" required /></div>
              <div><label className="block text-slate-400 text-xs font-bold uppercase mb-1">Create Password</label><input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full bg-[#1E293B] text-white border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors" placeholder="Min 8 chars, 1 uppercase, 1 number" required /></div>
              <div className="pt-4 border-t border-slate-800 mt-6">
                <p className="text-xs text-[#FF8A00] font-bold mb-3 uppercase tracking-wider">Identity Verification</p>
                <div className="space-y-4">
                  <div><label className="block text-slate-400 text-xs font-bold uppercase mb-1">Gold Card Number</label><input type="text" value={regCard} onChange={(e) => setRegCard(e.target.value)} className="w-full bg-[#1E293B] text-white border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors" required /></div>
                  <div><label className="block text-slate-400 text-xs font-bold uppercase mb-1">Recent Receipt Number</label><input type="text" value={regReceipt} onChange={(e) => setRegReceipt(e.target.value)} className="w-full bg-[#1E293B] text-white border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors" required /></div>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#FF8A00] to-[#E55D00] hover:from-[#FF9A22] hover:to-[#F06500] text-white font-bold py-4 rounded-xl mt-6 shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">{isLoading ? <Loader2 className="animate-spin" size={20}/> : 'Claim Card & Register'}</button>
              <p className="text-center text-sm text-slate-500 mt-6">Already have an account? <button type="button" onClick={() => {setIsRegistering(false); setErrorMsg('');}} className="text-[#FF8A00] hover:underline font-bold">Log in</button></p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div><label className="block text-slate-400 text-xs font-bold uppercase mb-2">Email Address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#1E293B] text-white border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors" required /></div>
              <div><label className="block text-slate-400 text-xs font-bold uppercase mb-2">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#1E293B] text-white border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors" required /></div>
              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#FF8A00] to-[#E55D00] hover:from-[#FF9A22] hover:to-[#F06500] text-white font-bold py-4 rounded-xl shadow-lg mt-2 active:scale-95 transition-all flex justify-center items-center gap-2">{isLoading ? <Loader2 className="animate-spin" size={20}/> : 'Log In'}</button>
              <p className="text-center text-sm text-slate-500 mt-6">New to GABS Digital? <button type="button" onClick={() => {setIsRegistering(true); setErrorMsg('');}} className="text-[#FF8A00] hover:underline font-bold">Claim your Gold Card</button></p>
            </form>
          )}
        </div>
      </main>
    );
  }

  // --- AUTHENTICATED UI (FIGMA DASHBOARD) ---
  return (
    <div className="min-h-screen bg-[#0B1120] flex items-start justify-center p-4 md:pt-10 font-sans relative">
      
      {/* FINTECH CHECKOUT MODAL */}
      {showTopUpModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] w-full max-w-sm rounded-[2rem] border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 flex justify-between items-center border-b border-slate-800">
              <h2 className="text-white font-bold">Purchase Pass</h2>
              <button onClick={() => !isProcessing && setShowTopUpModal(false)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              
              {/* Dynamic Product Selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div 
                  onClick={() => setSelectedPass('weekly')}
                  className={`cursor-pointer rounded-xl p-3 border-2 transition-all ${selectedPass === 'weekly' ? 'border-[#FF8A00] bg-[#FF8A00]/10' : 'border-slate-700 bg-[#1E293B] hover:border-slate-500'}`}
                >
                  <p className="text-slate-300 text-xs font-bold uppercase mb-1">Weekly</p>
                  <p className="text-white font-black text-xl">R250</p>
                  <p className="text-emerald-400 text-xs font-medium mt-1">14 Trips</p>
                </div>
                <div 
                  onClick={() => setSelectedPass('monthly')}
                  className={`cursor-pointer rounded-xl p-3 border-2 transition-all ${selectedPass === 'monthly' ? 'border-[#FF8A00] bg-[#FF8A00]/10' : 'border-slate-700 bg-[#1E293B] hover:border-slate-500'}`}
                >
                  <p className="text-slate-300 text-xs font-bold uppercase mb-1">Monthly</p>
                  <p className="text-white font-black text-xl">R800</p>
                  <p className="text-emerald-400 text-xs font-medium mt-1">40 Trips</p>
                </div>
              </div>

              <div className="bg-[#1E293B] rounded-xl p-4 mb-6 border border-slate-700">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Order Summary</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-white font-medium">{PASS_OPTIONS[selectedPass].name}</p>
                  <p className="text-2xl font-black text-white">R{PASS_OPTIONS[selectedPass].price}<span className="text-sm text-slate-500 font-medium">.00</span></p>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-emerald-500/20"
              >
                {isProcessing ? <><Loader2 size={20} className="animate-spin" /> Processing...</> : 'Pay Securely Now'}
              </button>
              <p className="text-center text-slate-500 text-xs mt-4 flex items-center justify-center gap-1">
                🔒 Secured by Mock-Paystack Gateway
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE APP CONTAINER */}
      <div className="w-full max-w-md bg-[#111827] rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800/50 relative">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-[#FF8A00] to-[#E55D00] p-6 pb-16 pt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2 border border-white/10 shadow-inner">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
              <span className="text-white text-xs font-bold tracking-wider uppercase">GABS Gold</span>
            </div>
            <button onClick={handleLogout} disabled={isLoading} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium">
              <LogOut size={16} /> Log Out
            </button>
          </div>
          <p className="text-white font-medium text-sm drop-shadow-sm">{userProfile?.email}</p>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="px-5 pb-8 -mt-10 relative z-10">
          
          {/* THE DIGITAL CARD */}
          <div className="bg-[#1E293B] rounded-3xl p-1 border border-slate-700/50 shadow-2xl mb-6">
            <div className="p-4 flex justify-between items-start mb-2">
              <div>
                <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-1">Linked Card</p>
                <div className="flex items-center gap-2 text-slate-200 font-mono text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <CreditCard size={14} className="text-slate-400" /> {userProfile?.linked_ga_card}
                </div>
              </div>
              
              {/* DYNAMIC FREEZE LOGIC */}
              {cardProduct?.status === 'FROZEN' ? (
                <span className="flex items-center gap-1.5 text-slate-500 border border-slate-700 bg-slate-800 px-3 py-1.5 rounded-full text-xs font-medium cursor-not-allowed">
                  Card Locked
                </span>
              ) : isConfirmingFreeze ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsConfirmingFreeze(false)} className="text-slate-400 text-xs font-medium hover:text-white">Cancel</button>
                  <button onClick={handleFreezeCard} disabled={isFreezing} className="flex items-center gap-1.5 text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-full text-xs font-bold transition-colors animate-pulse shadow-lg shadow-red-900/50">
                    {isFreezing ? 'Freezing...' : 'Confirm'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsConfirmingFreeze(true)} className="flex items-center gap-1.5 text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                  <AlertTriangle size={14} /> Report Lost
                </button>
              )}
            </div>

            {/* PRODUCT STATUS */}
            <div className="bg-[#0F172A] rounded-2xl p-6 m-1 flex flex-col items-center justify-center border border-slate-800 shadow-inner relative overflow-hidden">
              {cardProduct ? (
                <>
                  <p className="text-slate-400 text-sm font-medium mb-1 z-10">{cardProduct.product_type}</p>
                  <div className="flex items-baseline gap-1 mb-3 z-10">
                    <span className={`text-6xl font-black tracking-tighter transition-colors duration-500 ${cardProduct.rides_remaining < 5 ? 'text-red-500' : 'text-white'}`}>
                      {cardProduct.rides_remaining}
                    </span>
                    <span className="text-slate-500 font-medium text-sm">trips</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 uppercase z-10 ${cardProduct.status === 'ACTIVE' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${cardProduct.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`}></div> {cardProduct.status}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-slate-500 text-sm">No active products.</p>
                  <button onClick={() => setShowTopUpModal(true)} className="text-[#FF8A00] text-sm font-bold mt-2 hover:underline">Buy a pass now</button>
                </div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex gap-3 mb-8">
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="flex-1 bg-gradient-to-b from-[#FF8A00] to-[#E55D00] hover:from-[#FF9A22] hover:to-[#F06500] text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Ticket size={18} /> Buy Pass
            </button>
            <button className="flex-1 bg-[#1E293B] hover:bg-[#27354A] border border-slate-700 text-slate-200 py-4 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
              <CreditCard size={18} className="text-slate-400" /> Auto-TopUp
            </button>
          </div>

          {/* TRAVEL HISTORY */}
          <div>
            <div className="flex justify-between items-end mb-4 px-1">
              <h3 className="text-slate-400 text-xs font-bold tracking-widest uppercase">Recent Travel History</h3>
              <button className="text-[#FF8A00] text-xs font-bold hover:text-orange-400 flex items-center transition-colors">
                View All <ChevronRight size={14} />
              </button>
            </div>
            
            {recentTrips.length === 0 ? (
              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 text-center">
                <p className="text-slate-500 text-sm">No recent trips found on this card.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {recentTrips.map((trip: any, index: number) => (
                  <div key={index} className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                        <MapPin size={18} className="text-[#FF8A00]" />
                      </div>
                      <div>
                        <p className="text-slate-200 text-sm font-bold">{trip.location}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{new Date(trip.timestamp).toLocaleDateString('en-ZA', { weekday: 'short', hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <span className="text-slate-300 font-mono text-sm font-medium bg-slate-900 px-2 py-1 rounded border border-slate-800">-1 trip</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}