'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  QrCode, CreditCard, Send, RefreshCw, LogOut, 
  AlertCircle, CheckCircle2, Clock, Building2, Copy, Check 
} from 'lucide-react';
import { authApi } from '@/lib/api/auth';

interface PaymentPendingClientProps {
  organization: {
    id: string;
    name: string;
    subscriptionStatus: string;
    paymentReference: string | null;
    paymentAmount: number | null;
  };
  pendingPackage: {
    id: string;
    name: string;
    priceINR: number;
    priceUSD: number;
    description: string | null;
    color: string | null;
  } | null;
  paymentSettings: {
    upiId: string;
    upiName: string;
    bankName: string;
    bankAccount: string;
    bankIfsc: string;
    bankSwift: string;
  };
}

export default function PaymentPendingClient({ organization: initialOrg, pendingPackage, paymentSettings }: PaymentPendingClientProps) {
  const router = useRouter();
  const [org, setOrg] = useState(initialOrg);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form fields
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(
    pendingPackage ? (pendingPackage.priceINR > 0 ? pendingPackage.priceINR : pendingPackage.priceUSD) : 0
  );
  
  // Tab control (UPI vs Bank)
  const [activeTab, setActiveTab] = useState<'upi' | 'bank'>(
    pendingPackage && pendingPackage.priceINR > 0 ? 'upi' : 'bank'
  );

  // Copy states
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // UPI configuration
  const upiId = paymentSettings?.upiId || 'pay@guestflow';
  const upiName = paymentSettings?.upiName || 'GuestFlow';
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(`Sub-${org.name}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  // Auto-refresh status if PENDING_APPROVAL
  useEffect(() => {
    if (org.subscriptionStatus !== 'PENDING_APPROVAL') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/refresh-session', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.data) {
          const newStatus = data.data.subscriptionStatus;
          if (newStatus !== 'PENDING_APPROVAL' && newStatus !== 'PENDING_PAYMENT') {
            clearInterval(interval);
            router.refresh();
            router.push('/dashboard');
          }
        }
      } catch (err) {
        // Silently handle refresh errors during polling
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [org.subscriptionStatus, router]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/refresh-session', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        const newStatus = data.data.subscriptionStatus;
        if (newStatus !== 'PENDING_APPROVAL' && newStatus !== 'PENDING_PAYMENT') {
          router.refresh();
          router.push('/dashboard');
        } else {
          setOrg(prev => ({ ...prev, subscriptionStatus: newStatus }));
          setError('Your subscription is still being reviewed by the admin. Please wait.');
        }
      } else {
        setError(data.error || 'Failed to refresh status.');
      }
    } catch (err) {
      setError('An unexpected error occurred while checking status.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.push('/login');
    } catch (err) {
      router.push('/login');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!paymentReference.trim()) {
      setError('Please provide a valid payment reference or transaction ID.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/billing/submit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentReference: paymentReference.trim(),
          paymentAmount: Number(paymentAmount),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Payment reference submitted successfully under review!');
        setOrg(prev => ({ ...prev, subscriptionStatus: 'PENDING_APPROVAL' }));
        router.refresh();
      } else {
        setError(data.error || 'Failed to submit payment reference.');
      }
    } catch (err) {
      setError('Failed to submit reference due to a network or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 bg-slate-950 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-rose-950/20 via-transparent to-transparent"></div>
        <div className="absolute top-[20%] left-[30%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[30%] w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1000px] flex flex-col rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.15)] border border-white/10 backdrop-blur-xl bg-white/5">
        
        {/* Header Bar */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <span className="text-white font-black text-xl italic">O</span>
            </div>
            <span className="text-white font-black text-2xl tracking-tighter uppercase">GuestFlow</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 transition-all font-semibold text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col md:flex-row min-h-[500px]">
          
          {/* Left Column: Plan Summary and Details */}
          <div className="w-full md:w-[45%] p-8 sm:p-10 border-r border-white/10 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                  Selected Subscription Plan
                </span>
                <h1 className="text-3xl font-black text-white tracking-tight mt-3">
                  {pendingPackage ? pendingPackage.name : 'Premium Plan'}
                </h1>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  {pendingPackage?.description || 'Get full access to GuestFlow’s point-of-sale terminal, invoicing, reports, inventory, and kitchen management suites.'}
                </p>
              </div>

              {/* Package Price Tag */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Billing Frequency</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {pendingPackage ? (
                      pendingPackage.priceINR > 0 
                        ? `₹${pendingPackage.priceINR}` 
                        : `$${pendingPackage.priceUSD}`
                    ) : '---'}
                  </span>
                  <span className="text-slate-400 text-sm font-semibold">/ year</span>
                </div>
                <p className="text-indigo-300 text-xs mt-2 font-medium">Billed annually. Full updates and cloud backups included.</p>
              </div>

              {/* Status Timeline */}
              <div className="space-y-3 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activation Timeline</h3>
                
                <div className="relative pl-6 space-y-4">
                  {/* Line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/10"></div>
                  
                  {/* Step 1 */}
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-7 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center"></div>
                    <div>
                      <h4 className="text-xs font-bold text-white">1. Account Provisioned</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Your account was successfully registered.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start gap-3">
                    <div className={`absolute -left-7 w-3.5 h-3.5 rounded-full border-2 border-slate-950 flex items-center justify-center ${org.subscriptionStatus === 'PENDING_APPROVAL' ? 'bg-indigo-500 animate-pulse' : (org.subscriptionStatus === 'PENDING_PAYMENT' ? 'bg-white/20' : 'bg-emerald-500')}`}></div>
                    <div>
                      <h4 className="text-xs font-bold text-white">2. Submit Reference Details</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Enter the payment receipt ID / transaction ID below.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start gap-3">
                    <div className="absolute -left-7 w-3.5 h-3.5 rounded-full bg-white/10 border-2 border-slate-950 flex items-center justify-center"></div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400">3. Admin Review & Live Activation</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Approval completes instantly. Workspace unlocks.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 text-[10px] text-slate-500 font-medium flex items-center gap-2">
              <AlertCircle size={12} className="text-slate-600" />
              Need billing assistance? Contact billing@guestflow.com
            </div>
          </div>

          {/* Right Column: Dynamic Form / Review States */}
          <div className="w-full md:w-[55%] bg-slate-900/50 p-8 sm:p-10 flex flex-col justify-center">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-sm font-semibold">
                <AlertCircle className="text-rose-400 mt-0.5 flex-shrink-0" size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-300 text-sm font-semibold">
                <CheckCircle2 className="text-emerald-400 mt-0.5 flex-shrink-0" size={18} />
                <span>{success}</span>
              </div>
            )}

            {org.subscriptionStatus === 'PENDING_PAYMENT' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Complete Your Payment</h2>
                  <p className="text-slate-400 text-sm mt-1">Please pay using one of the channels below and provide your receipt reference.</p>
                </div>

                {/* Tabs */}
                {pendingPackage && pendingPackage.priceINR > 0 && (
                  <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab('upi')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'upi' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <QrCode size={14} />
                      UPI Scan (INR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bank')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'bank' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <CreditCard size={14} />
                      Bank Transfer
                    </button>
                  </div>
                )}

                {/* UPI QR TAB */}
                {activeTab === 'upi' && pendingPackage && pendingPackage.priceINR > 0 && (
                  <div className="flex flex-col items-center p-6 rounded-2xl border border-white/10 bg-white/5 text-center">
                    <div className="bg-white p-3 rounded-xl shadow-lg border border-white/10 flex justify-center items-center">
                      {/* Using the simple free high-performance qr server */}
                      <img src={qrCodeUrl} alt="UPI QR Code" className="w-[200px] h-[200px]" />
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">GuestFlow UPI ID</p>
                      <div className="flex items-center gap-2 justify-center mt-1">
                        <span className="text-sm font-bold text-indigo-400">{upiId}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(upiId, 'upi')}
                          className="text-slate-500 hover:text-white transition-colors"
                          title="Copy UPI ID"
                        >
                          {copiedText === 'upi' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                      Scan the QR using BHIM, Paytm, GPay, or PhonePe to pay exactly <span className="font-bold text-slate-300">₹{paymentAmount}</span>.
                    </p>
                  </div>
                )}

                {/* Bank Transfer TAB */}
                {activeTab === 'bank' && (
                  <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4 text-sm font-medium">
                    <div className="flex items-center gap-3 text-indigo-400">
                      <Building2 size={18} />
                      <span className="font-bold">Wire / Bank Deposit Instructions</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs pt-1 border-t border-white/5">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Bank Name</span>
                        <span className="text-slate-300 font-semibold">{paymentSettings?.bankName || 'GuestFlow Global Bank'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Account Number</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-300 font-semibold font-mono">{paymentSettings?.bankAccount || '1200384819283'}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentSettings?.bankAccount || '1200384819283', 'acc')}
                            className="text-slate-500 hover:text-white transition-colors"
                          >
                            {copiedText === 'acc' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide block">IFSC Code</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-300 font-semibold font-mono">{paymentSettings?.bankIfsc || 'ORDM0001092'}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentSettings?.bankIfsc || 'ORDM0001092', 'ifsc')}
                            className="text-slate-500 hover:text-white transition-colors"
                          >
                            {copiedText === 'ifsc' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide block">Swift Code</span>
                        <span className="text-slate-300 font-semibold font-mono">{paymentSettings?.bankSwift || 'ORDMININBB'}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed border-t border-white/5 pt-3">
                      Transfer exactly <span className="font-bold text-slate-300">{pendingPackage ? (pendingPackage.priceINR > 0 ? `₹${pendingPackage.priceINR}` : `$${pendingPackage.priceUSD}`) : '---'}</span> to the account above and enter the transaction reference below.
                    </p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                      Transaction Reference Number / UPI Ref ID
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. UPI 3409182390 or Bank TXN 89271"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-600 rounded-xl text-sm font-semibold text-white outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                        Amount Paid
                      </label>
                      <input
                        type="number"
                        required
                        disabled
                        value={paymentAmount}
                        className="w-full px-4 py-3 bg-white/5 border border-white/5 text-slate-500 rounded-xl text-sm font-bold outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                        Currency
                      </label>
                      <input
                        type="text"
                        required
                        disabled
                        value={pendingPackage && pendingPackage.priceINR > 0 ? 'INR (₹)' : 'USD ($)'}
                        className="w-full px-4 py-3 bg-white/5 border border-white/5 text-slate-500 rounded-xl text-sm font-bold outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !paymentReference.trim()}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Submit Transaction Reference
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* PENDING APPROVAL - PULSING UNDER REVIEW STATE */
              <div className="text-center py-10 space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md animate-ping"></div>
                    <div className="relative w-24 h-24 bg-indigo-500/10 border-2 border-indigo-500/40 rounded-full flex items-center justify-center">
                      <Clock size={40} className="text-indigo-400 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-widest">
                    Verification in Progress
                  </span>
                  <h2 className="text-3xl font-black text-white tracking-tight">Under Admin Review</h2>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                    We are verifying your transaction reference code <span className="font-bold text-white font-mono">"{org.paymentReference || 'N/A'}"</span>. Once confirmed, your POS dashboard will automatically unlock.
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-3 max-w-[280px] mx-auto">
                  <button
                    type="button"
                    onClick={handleRefreshStatus}
                    disabled={refreshing}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Refreshing...' : 'Refresh Status'}
                  </button>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Auto-polling status active.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
