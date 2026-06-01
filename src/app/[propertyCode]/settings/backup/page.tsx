'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Mail, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  History,
  FileJson,
  CheckCircle2,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/layout/PageHeader';

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedBackupProp, setSelectedBackupProp] = useState('all');
  const [selectedRestoreProp, setSelectedRestoreProp] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedResetProp, setSelectedResetProp] = useState('');

  useEffect(() => {
    fetch('/api/admin/properties?global=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProperties(data.data);
          if (data.data.length > 0) {
            setSelectedRestoreProp(data.data[0].id);
            setSelectedResetProp(data.data[0].id);
          }
        }
      });
  }, []);

  const handleBackup = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/backup?propertyId=${selectedBackupProp}`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to generate backup');
      }
    } catch (err) {
      setError('An error occurred while starting the backup');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    window.location.href = `/api/admin/backup/download?propertyId=${selectedBackupProp}`;
  };

  const handleRestore = async () => {
    if (!restoreFile || !selectedRestoreProp) {
      alert('Please select a property and a backup file.');
      return;
    }

    setRestoring(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          const res = await fetch('/api/admin/backup/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupData, targetPropertyId: selectedRestoreProp })
          });
          const data = await res.json();
          if (data.success) {
            alert('Restore successful!');
          } else {
            alert('Restore failed: ' + data.message);
          }
        } catch (err) {
          alert('Invalid backup file');
        } finally {
          setRestoring(false);
        }
      };
      reader.readAsText(restoreFile);
    } catch (err) {
      setRestoring(false);
    }
  };

  const handleReset = async () => {
    if (!selectedResetProp) {
      alert('Please select a property to reset.');
      return;
    }

    const confirmReset = confirm('CRITICAL WARNING: This will PERMANENTLY DELETE all orders, products, inventory, and accounting data for the selected property. This action cannot be undone. Are you sure?');
    if (!confirmReset) return;

    const secondConfirm = confirm('Are you REALLY sure? All your restaurant data for this property will be gone.');
    if (!secondConfirm) return;

    setResetting(true);
    try {
      const res = await fetch('/api/admin/backup/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedResetProp })
      });
      const data = await res.json();
      if (data.success) {
        alert('Property data has been completely reset.');
      } else {
        alert('Reset failed: ' + data.message);
      }
    } catch (err) {
      alert('An error occurred during reset.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Data Backup & Safety" 
        description="Protect your business data with regular backups and easy restoration."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Backup Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden group backdrop-blur-sm"
        >
          <div className="absolute top-0 right-0 p-12 bg-pos-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-pos-primary/10 transition-colors" />
          
          <div className="relative">
            <div className="w-16 h-16 bg-pos-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Database className="text-pos-primary" size={32} />
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Secure Backup</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Export your data to a secure JSON file.</p>
            
            <div className="mb-6 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Select Property to Backup</label>
              <select 
                value={selectedBackupProp}
                onChange={(e) => setSelectedBackupProp(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-pos-primary/20 transition-all outline-none"
              >
                <option value="all">All Properties (Full Backup)</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                <CheckCircle2 size={18} className="text-green-500" />
                <span>Full Menu & Inventory Data</span>
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                <CheckCircle2 size={18} className="text-green-500" />
                <span>Customer Profiles & Loyalty Points</span>
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                <CheckCircle2 size={18} className="text-green-500" />
                <span>Sales History & Financial Records</span>
              </li>
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleBackup}
                disabled={loading}
                className={`
                  w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all
                  ${success 
                    ? 'bg-green-500 text-white' 
                    : 'bg-pos-primary text-white hover:bg-pos-primary-hover shadow-lg shadow-pos-primary/25'}
                  disabled:opacity-70
                `}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : success ? <CheckCircle2 size={20} /> : <Mail size={20} />}
                {loading ? '...' : success ? 'Sent!' : 'Email Backup'}
              </button>

              <button
                onClick={handleDownload}
                disabled={loading}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Download size={20} />
                {loading ? '...' : 'Download JSON'}
              </button>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-4 rounded-xl flex items-start gap-2 border border-red-100 dark:border-red-900/30">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                {error}
              </p>
            )}
            
            {success && (
              <p className="mt-4 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-4 rounded-xl">
                Backup file has been dispatched. Please check your inbox in a few moments.
              </p>
            )}
          </div>
        </motion.div>

        {/* Restore Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 backdrop-blur-sm"
        >
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
            <History className="text-slate-500 dark:text-slate-400" size={32} />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Data Restore</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Restore your business data from a backup file.</p>
          
          <div className="mb-6 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Target Property for Restore</label>
            <select 
              value={selectedRestoreProp}
              onChange={(e) => setSelectedRestoreProp(e.target.value)}
              className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-pos-primary/20 transition-all outline-none"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold mb-2">
              <AlertTriangle size={18} />
              <span className="text-sm">Restore Notice</span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-500/70 leading-relaxed font-medium">
              Restoring will update categories, products, and outlets for the selected property. Existing IDs will be updated, and new ones will be created.
            </p>
          </div>

          <div className="relative group mb-6">
            <input 
              type="file" 
              accept=".json"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
            />
            <div className={`py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${restoreFile ? 'border-pos-primary bg-pos-primary/5 dark:bg-pos-primary/10' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/30'}`}>
              <Upload className={restoreFile ? 'text-pos-primary' : 'text-slate-400'} size={32} />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center px-4">
                {restoreFile ? restoreFile.name : 'Drag & drop backup file or click to upload'}
              </span>
            </div>
          </div>

          <button
            onClick={handleRestore}
            disabled={restoring || !restoreFile}
            className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white disabled:opacity-50"
          >
            {restoring ? <Loader2 className="animate-spin" size={20} /> : <History size={20} />}
            {restoring ? 'Restoring Data...' : 'Start Restoration'}
          </button>
        </motion.div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <ShieldCheck className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security & Privacy</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your data is safe with us</p>
            </div>
          </div>
          <div className="grid gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">End-to-End Safety</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Backup files are generated on-the-fly and never stored on our temporary servers after the email is sent.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Self-Managed</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">You own your data. Our backup system puts you in control of your digital records.</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-50/50 dark:bg-rose-950/10 rounded-3xl p-8 border border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
              <AlertTriangle className="text-rose-600 dark:text-rose-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-900 dark:text-white">Danger Zone</h3>
              <p className="text-sm text-rose-500 dark:text-rose-400">Irreversible actions</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 dark:text-rose-500">Select Property to RESET</label>
              <select 
                value={selectedResetProp}
                onChange={(e) => setSelectedResetProp(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/50 border border-rose-200 dark:border-rose-800/50 rounded-xl px-4 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500/20 transition-all outline-none"
              >
                <option value="">Choose Property...</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-rose-600/70 dark:text-rose-400/60 leading-relaxed italic font-medium">
              Resetting will delete ALL data for this property. This is useful for testing or starting fresh.
            </p>

            <button
              onClick={handleReset}
              disabled={resetting || !selectedResetProp}
              className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {resetting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
              {resetting ? 'Resetting...' : 'Reset Property Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
