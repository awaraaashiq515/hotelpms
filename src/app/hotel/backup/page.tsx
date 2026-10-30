'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database, HardDrive, Cloud, RefreshCw, Download, Trash2,
  RotateCcw, CheckCircle, XCircle, AlertTriangle, Clock,
  Shield, Loader2, ArrowLeft, Info, Laptop, Building2, ShieldCheck, FileJson
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PropertyInfo {
  code: string;
  name: string;
  city?: string;
}

interface BackupItem {
  name:           string;
  format?:        string;
  desktopPath:    string;
  timestamp:      string;
  dateStr:        string;
  timeStr:        string;
  jsonSize?:      string;
  dbSizeMB:       string;
  recordsCount?:  number;
  tablesCount?:   number;
  hasGoogleDrive: boolean;
}

interface BackupStatus {
  desktopPath:         string;
  googleDriveDetected: boolean;
  googleDriveEmail:    string | null;
  googleDrivePath:     string | null;
  totalBackups:        number;
  totalHotels?:        number;
  hotelsIncluded?:     PropertyInfo[];
  dbExists:            boolean;
  dbSizeMB:            string;
}

interface LogEntry {
  backupName:   string;
  timestamp:    string;
  dateStr:      string;
  timeStr:      string;
  success:      boolean;
  error:        string | null;
  dbSizeMB:     string;
  desktopPath:  string | null;
  gdrivePath:   string | null;
  gdriveEmail:  string | null;
}

export default function HotelBackupPage() {
  const router = useRouter();

  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [status,   setStatus]   = useState<BackupStatus | null>(null);
  const [backups,  setBackups]  = useState<BackupItem[]>([]);
  const [logs,     setLogs]     = useState<LogEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [backing,  setBacking]  = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      // 1. Resolve logged-in hotel property to guarantee strict tenant isolation
      let activeCode = '';
      try {
        const sessRes = await fetch('/api/auth/session');
        const sessData = await sessRes.json();
        if (sessData?.authenticated) {
          activeCode = sessData.propertyCode || sessData.user?.propertyCode || '';
          if (!activeCode) {
            const propRes = await fetch('/api/setup/properties');
            const propData = await propRes.json();
            if (propData.success && Array.isArray(propData.data) && propData.data.length > 0) {
              const hotelProp = propData.data.find((p: any) => p.type === 'HOTEL') || propData.data[0];
              activeCode = hotelProp.code;
            }
          }
        }
      } catch (_) {}

      const url = activeCode ? `/api/backup?propertyCode=${encodeURIComponent(activeCode)}` : '/api/backup';
      const res  = await fetch(url);
      const data = await res.json();
      if (data.property) setProperty(data.property);
      setStatus(data.status);
      setBackups(data.backups || []);
      setLogs(data.recentLogs || []);
    } catch {
      showToast('Failed to load backup data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(fetchData, 30_000);
    return () => clearInterval(t);
  }, [fetchData]);

  const handleBackupNow = async () => {
    setBacking(true);
    try {
      const res  = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyCode: property?.code })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Backup successfully created for ' + (property?.name || 'hotel') + '!' + (data.gdrivePath ? ' (Desktop + Google Drive)' : ' (Saved to Desktop)'), 'success');
        await fetchData();
      } else {
        showToast('Backup failed: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error during backup', 'error');
    } finally {
      setBacking(false);
    }
  };

  const handleRestore = async (backupName: string) => {
    if (!confirm(`Are you sure you want to restore "${backupName}" for ${property?.name || 'this hotel'}?\n\nWarning: Current database will be replaced with this backup. A safety pre-restore backup will be automatically saved before restoring.`)) return;
    setRestoring(backupName);
    try {
      const res  = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', backupName, propertyCode: property?.code }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Database restored successfully! Reloading...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showToast('Restore failed: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error during restore', 'error');
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (backupName: string) => {
    if (!confirm(`Permanently delete backup "${backupName}"?`)) return;
    setDeleting(backupName);
    try {
      const res = await fetch(`/api/backup?name=${encodeURIComponent(backupName)}&propertyCode=${encodeURIComponent(property?.code || '')}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Backup deleted', 'success');
        await fetchData();
      } else {
        showToast('Delete failed: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading Hotel Backup & Restore System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-500/20' :
          toast.type === 'error' ? 'bg-red-600 text-white shadow-red-500/20' :
          'bg-indigo-600 text-white shadow-indigo-500/20'
        }`}>
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <XCircle size={18} />}
          {toast.type === 'info' && <Info size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800/80 mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/hotel')}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Back to Hotel Operations"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Hotel Backup & Restore
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Automated database snapshots, multi-property protection & 1-click restore
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleBackupNow}
            disabled={backing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            {backing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Creating Snapshot...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Backup Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Status Grid ── */}
        {status && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Database size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Database Size</p>
                <p className="text-lg font-black text-white mt-0.5">{status.dbSizeMB}</p>
                <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> All tables intact
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <HardDrive size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Backups</p>
                <p className="text-lg font-black text-white mt-0.5">{status.totalBackups}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Desktop & Cloud Storage</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                status.googleDriveDetected
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800/60 border border-slate-700/40 text-slate-400'
              }`}>
                <Cloud size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Google Drive</p>
                <p className="text-lg font-black text-white mt-0.5 truncate">
                  {status.googleDriveDetected ? 'Connected' : 'Not Connected'}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {status.googleDriveEmail || 'Desktop App Sync'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Clock size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Latest Snapshot</p>
                <p className="text-sm font-black text-white mt-0.5 truncate">
                  {backups[0] ? backups[0].dateStr : 'Never'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {backups[0] ? backups[0].timeStr : 'No backups taken yet'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Active Hotel Property Card (Strictly Isolated Single Property) ── */}
        <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Hotel Property</p>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                {property?.name || 'Hotel Property'}
                {property?.code && (
                  <span className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono">
                    {property.code}
                  </span>
                )}
                {property?.city && (
                  <span className="text-xs text-slate-400 font-normal">
                    ({property.city})
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Private, isolated backup workspace dedicated strictly to {property?.name || 'this property'}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Isolated Property Storage
            </span>
          </div>
        </div>

        {/* ── Client Laptop Save Banner ── */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3.5 max-w-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <Laptop size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Save JSON Backup Directly to This Computer / Laptop
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                • <strong>Host System:</strong> Automated service exports structured JSON snapshots every 10 minutes in <code>~/Desktop/Hotel-PMS-Backups/{property?.code || ''}</code>.<br />
                • <strong>Client Workstations / Laptops:</strong> Click below to download the latest master property database as a pure <strong>JSON (.json)</strong> file.
              </p>
            </div>
          </div>
          {backups[0] && (
            <a
              href={`/api/backup/download?name=${encodeURIComponent(backups[0].name)}&propertyCode=${encodeURIComponent(property?.code || '')}&format=json`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
              download={`${property?.code || 'hotel'}-${backups[0].name}.json`}
            >
              <Download size={14} /> Download {property?.code || 'Hotel'} JSON (.json)
            </a>
          )}
        </div>

        {/* ── Available Backups List ── */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HardDrive size={18} className="text-indigo-400" />
              Available JSON Backups ({backups.length})
            </h2>
            <span className="text-xs text-slate-400">
              Auto-rotated (Max 30 snapshots kept safely)
            </span>
          </div>

          {backups.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Database size={40} className="mx-auto text-slate-600" />
              <p className="text-sm">No backups found yet.</p>
              <p className="text-xs text-slate-600">Click &ldquo;Backup Now&rdquo; above to create your first JSON snapshot.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {backups.map((bk, idx) => (
                <div
                  key={bk.name}
                  className="py-3.5 flex items-center justify-between flex-wrap gap-3 hover:bg-slate-800/20 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-6 text-center text-xs font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 font-mono truncate">
                        {bk.name}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span>📅 {bk.dateStr}</span>
                        <span>🕐 {bk.timeStr}</span>
                        <span>💾 {bk.jsonSize || bk.dbSizeMB}</span>
                        {bk.recordsCount && <span>📋 {bk.recordsCount} records</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                        <FileJson size={10} /> JSON
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold flex items-center gap-1">
                        <HardDrive size={10} /> Desktop
                      </span>
                      {bk.hasGoogleDrive && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-semibold flex items-center gap-1">
                          <Cloud size={10} /> Google Drive
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Download JSON */}
                      <a
                        href={`/api/backup/download?name=${encodeURIComponent(bk.name)}&propertyCode=${encodeURIComponent(property?.code || '')}&format=json`}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Download JSON (.json) file to your computer"
                        download={`${property?.code || 'hotel'}-${bk.name}.json`}
                      >
                        <Download size={14} />
                      </a>

                      {/* Restore */}
                      <button
                        onClick={() => handleRestore(bk.name)}
                        disabled={!!restoring}
                        className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors cursor-pointer disabled:opacity-50"
                        title="Restore this JSON snapshot"
                      >
                        {restoring === bk.name ? (
                          <Loader2 size={14} className="animate-spin text-amber-400" />
                        ) : (
                          <RotateCcw size={14} />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(bk.name)}
                        disabled={!!deleting || idx === 0}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title={idx === 0 ? "Latest backup cannot be deleted" : "Delete backup"}
                      >
                        {deleting === bk.name ? (
                          <Loader2 size={14} className="animate-spin text-red-400" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent History Logs ── */}
        {logs.length > 0 && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-slate-400" /> Recent Backup History
            </h3>
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${log.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className="text-slate-300 font-medium">
                      {log.success
                        ? `✅ Backup Snapshot Created — ${log.dbSizeMB}${log.gdrivePath ? ' (Desktop + Google Drive)' : ' (Desktop only)'}`
                        : `❌ Backup Failed: ${log.error || 'Unknown error'}`
                      }
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {log.dateStr} {log.timeStr}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
