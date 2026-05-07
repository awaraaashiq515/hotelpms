'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Lock, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Copy, 
  Loader2, 
  X 
} from 'lucide-react';

export const TwoFactorSection = () => {
  const [status, setStatus] = useState<{ enabled: boolean; configured: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'done'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/2fa/verify')
      .then(r => r.json())
      .then(d => {
        if (d.success) setStatus({ enabled: d.enabled, configured: d.configured });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSetup = async () => {
    setStep('setup');
    setError('');
    const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
    } else {
      setError(data.error || 'Setup failed');
      setStep('idle');
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError('');
    const res = await fetch('/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setVerifying(false);
    if (data.success) {
      setStep('done');
      setStatus({ enabled: true, configured: true });
    } else {
      setError(data.error || 'Invalid OTP');
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure? This will remove 2FA from your account.')) return;
    setDisabling(true);
    await fetch('/api/auth/2fa/setup', { method: 'DELETE' });
    setDisabling(false);
    setStatus({ enabled: false, configured: false });
    setStep('idle');
    setQrCode('');
    setSecret('');
    setBackupCodes([]);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse" />;

  return (
    <Card className="p-8 border-l-4 border-l-emerald-500 overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Lock size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Two-Factor Authentication</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-tight mt-0.5">
              Google Authenticator compatible — extra layer of security
            </p>
          </div>
        </div>
        {status?.enabled && (
          <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-700">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      {/* State: IDLE — not enabled */}
      {step === 'idle' && !status?.enabled && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Enable 2FA to require a 6-digit code from the Google Authenticator app every time you log in.
            This protects your account even if your password is stolen.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Step 1: Scan QR Code', 'Step 2: Enter 6-digit OTP', 'Step 3: Protected!'].map((s, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs mb-3">{i + 1}</div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{s}</p>
              </div>
            ))}
          </div>
          <Button onClick={handleSetup} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-widest px-8 py-4 rounded-xl shadow-lg">
            <Lock size={16} className="mr-2" /> Enable 2FA Now
          </Button>
        </div>
      )}

      {/* State: SETUP — show QR */}
      {step === 'setup' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">1. Scan with Google Authenticator</p>
              {qrCode ? (
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-2xl border-4 border-slate-100 dark:border-slate-700 shadow-xl" />
              ) : (
                <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Can't scan? Enter manually:</p>
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <code className={`flex-1 text-xs font-mono tracking-widest text-slate-700 dark:text-slate-300 ${!showSecret ? 'blur-sm select-none' : ''}`}>
                    {secret}
                  </code>
                  <button onClick={() => setShowSecret(!showSecret)} className="text-slate-400 hover:text-slate-600 p-1">
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={copySecret} className="text-slate-400 hover:text-emerald-600 p-1">
                    <Copy size={14} />
                  </button>
                  {copied && <span className="text-[9px] text-emerald-600 font-bold">Copied!</span>}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">2. Enter the 6-digit code from the app:</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-36 text-center text-2xl font-black tracking-[0.6em] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-all"
                  />
                  <Button
                    onClick={handleVerify}
                    disabled={token.length < 6 || verifying}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 rounded-xl"
                  >
                    {verifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify & Enable'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {backupCodes.length > 0 && (
            <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-3">
                ⚠️ Save these backup codes — shown only once!
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {backupCodes.map((code, i) => (
                  <code key={i} className="text-center text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* State: DONE — already enabled */}
      {(step === 'done' || status?.enabled) && step !== 'setup' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-700 rounded-2xl">
            <CheckCircle className="text-emerald-600" size={32} />
            <div>
              <p className="font-black text-emerald-700 dark:text-emerald-400 text-sm">2FA is Active</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-500 font-medium mt-0.5">
                Your account is protected with Google Authenticator.
              </p>
            </div>
          </div>
          <Button
            onClick={handleDisable}
            disabled={disabling}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
          >
            {disabling ? <Loader2 size={14} className="animate-spin mr-2" /> : <X size={14} className="mr-2" />}
            Disable 2FA
          </Button>
        </div>
      )}
    </Card>
  );
};
