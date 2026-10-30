'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Database, HardDrive, Cloud, RefreshCw, Download, Trash2,
  RotateCcw, CheckCircle, XCircle, AlertTriangle, Clock,
  Shield, Loader2, ChevronLeft, Info, Play, Laptop, Building2, FileJson
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BackupPage() {
  const params = useParams();
  const router = useRouter();
  const propertyCode = params?.propertyCode as string;

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
      const res  = await fetch('/api/backup?propertyCode=' + encodeURIComponent(propertyCode));
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
  }, [propertyCode]);

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
        body: JSON.stringify({ propertyCode })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Backup created successfully for ' + (property?.name || propertyCode) + '!' + (data.gdrivePath ? ' (Desktop + Google Drive)' : ' (Desktop only)'), 'success');
        await fetchData();
      } else {
        showToast('Backup failed: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setBacking(false);
    }
  };

  const handleRestore = async (backupName: string) => {
    if (!confirm(`Are you sure you want to restore "${backupName}" for ${property?.name || propertyCode}? Current data will be replaced with this backup.`)) return;
    setRestoring(backupName);
    try {
      const res  = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', backupName, propertyCode }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'info');
        await fetchData();
      } else {
        showToast('Restore failed: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (backupName: string) => {
    if (!confirm(`Permanently delete backup "${backupName}"?`)) return;
    setDeleting(backupName);
    try {
      const res = await fetch(`/api/backup?name=${encodeURIComponent(backupName)}&propertyCode=${encodeURIComponent(propertyCode)}`, { method: 'DELETE' });
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

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="backup-loading">
        <Loader2 size={32} className="spin" />
        <p>Loading backup system...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* ── Base ── */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .backup-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%);
          color: #e2e8f0;
          font-family: 'Inter', system-ui, sans-serif;
          padding: 0 0 60px;
        }

        /* ── Header ── */
        .bk-header {
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,.08);
          padding: 20px 32px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .bk-back-btn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 8px;
          padding: 8px 14px;
          color: #94a3b8;
          cursor: pointer;
          font-size: 13px;
          transition: all .2s;
          text-decoration: none;
        }
        .bk-back-btn:hover { background: rgba(255,255,255,.14); color: #e2e8f0; }
        .bk-title { display: flex; align-items: center; gap: 12px; flex: 1; }
        .bk-title-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .bk-title h1 { font-size: 22px; font-weight: 700; }
        .bk-title p  { font-size: 13px; color: #94a3b8; margin-top: 2px; }

        /* ── Main ── */
        .bk-main { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }

        /* ── Status cards ── */
        .bk-status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .bk-stat-card {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 16px;
          padding: 20px;
          display: flex; align-items: center; gap: 16px;
          transition: transform .2s;
        }
        .bk-stat-card:hover { transform: translateY(-2px); }
        .bk-stat-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bk-stat-icon.purple { background: linear-gradient(135deg,#6366f1,#8b5cf6); }
        .bk-stat-icon.green  { background: linear-gradient(135deg,#10b981,#059669); }
        .bk-stat-icon.blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); }
        .bk-stat-icon.orange { background: linear-gradient(135deg,#f59e0b,#d97706); }
        .bk-stat-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
        .bk-stat-value { font-size: 18px; font-weight: 700; }
        .bk-stat-sub   { font-size: 11px; color: #94a3b8; margin-top: 3px; word-break: break-all; }

        /* ── Action buttons ── */
        .bk-actions { display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; }
        .bk-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 22px; border-radius: 10px; border: none;
          cursor: pointer; font-size: 14px; font-weight: 600;
          transition: all .2s;
        }
        .bk-btn-primary {
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          color: white;
          box-shadow: 0 4px 20px rgba(99,102,241,.4);
        }
        .bk-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(99,102,241,.5); }
        .bk-btn-primary:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .bk-btn-ghost {
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
        }
        .bk-btn-ghost:hover { background: rgba(255,255,255,.12); color: #e2e8f0; }

        /* ── Google Drive notice ── */
        .bk-gdrive-notice {
          background: rgba(251,191,36,.08);
          border: 1px solid rgba(251,191,36,.25);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex; align-items: flex-start; gap: 12px;
          margin-bottom: 20px;
        }
        .bk-gdrive-success {
          background: rgba(16,185,129,.08);
          border-color: rgba(16,185,129,.25);
        }
        .bk-gdrive-notice-text h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        .bk-gdrive-notice-text p  { font-size: 12px; color: #94a3b8; line-height: 1.5; }
        .bk-gdrive-notice-text a  { color: #60a5fa; text-decoration: underline; }

        /* ── Isolated Property Card & Laptop Banner ── */
        .bk-property-card {
          background: rgba(99,102,241,.1);
          border: 1px solid rgba(99,102,241,.3);
          border-radius: 14px;
          padding: 18px 24px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .bk-prop-left { display: flex; align-items: center; gap: 16px; }
        .bk-prop-icon {
          width: 46px; height: 46px; border-radius: 12px;
          background: rgba(99,102,241,.2); border: 1px solid rgba(99,102,241,.4);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .bk-prop-badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          color: #a5b4fc; text-transform: uppercase;
        }
        .bk-prop-title {
          font-size: 17px; font-weight: 800; color: #ffffff;
          margin: 2px 0 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .bk-prop-code {
          font-size: 11px; font-family: monospace; font-weight: 700;
          background: rgba(99,102,241,.25); border: 1px solid rgba(99,102,241,.4);
          color: #c7d2fe; padding: 2px 8px; border-radius: 6px;
        }
        .bk-prop-city { font-size: 12px; color: #94a3b8; font-weight: normal; }
        .bk-prop-desc { font-size: 12px; color: #94a3b8; margin: 0; }
        .bk-prop-tag {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 9999px;
          background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.3);
          color: #34d399; font-size: 12px; font-weight: 600;
        }
        .bk-dot-pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: #34d399; box-shadow: 0 0 8px rgba(52,211,153,.8);
        }

        .bk-laptop-card {
          background: rgba(30,41,59,.6);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
        }
        .bk-laptop-left { display: flex; align-items: flex-start; gap: 12px; max-width: 700px; }
        .bk-laptop-left h4 { font-size: 14px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
        .bk-laptop-left p { font-size: 12px; color: #94a3b8; line-height: 1.5; }

        /* ── Section ── */
        .bk-section { margin-bottom: 32px; }
        .bk-section-title {
          font-size: 16px; font-weight: 700; margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,.08);
          padding-bottom: 12px;
        }

        /* ── Backup list ── */
        .bk-list { display: flex; flex-direction: column; gap: 10px; }
        .bk-item {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex; align-items: center; gap: 16px;
          transition: all .2s;
        }
        .bk-item:hover { background: rgba(255,255,255,.07); border-color: rgba(99,102,241,.3); }
        .bk-item-idx {
          width: 28px; height: 28px;
          background: rgba(99,102,241,.2);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #818cf8;
          flex-shrink: 0;
        }
        .bk-item-info { flex: 1; min-width: 0; }
        .bk-item-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #e2e8f0; }
        .bk-item-meta { font-size: 11px; color: #64748b; display: flex; gap: 12px; flex-wrap: wrap; }
        .bk-item-badges { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
        .bk-badge {
          padding: 3px 8px; border-radius: 20px;
          font-size: 11px; font-weight: 600;
          display: flex; align-items: center; gap: 4px;
        }
        .bk-badge-json    { background: rgba(16,185,129,.2);  color: #34d399; }
        .bk-badge-desktop { background: rgba(99,102,241,.2);  color: #818cf8; }
        .bk-badge-drive   { background: rgba(56,189,248,.2);  color: #38bdf8; }
        .bk-item-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .bk-icon-btn {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,.1);
          background: transparent;
          cursor: pointer; color: #94a3b8;
          transition: all .2s;
        }
        .bk-icon-btn:hover { background: rgba(255,255,255,.1); color: #e2e8f0; }
        .bk-icon-btn.danger:hover { background: rgba(239,68,68,.2); color: #f87171; border-color: rgba(239,68,68,.3); }
        .bk-icon-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* ── Log list ── */
        .bk-log-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 16px;
          border-radius: 8px;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.05);
          margin-bottom: 6px;
          font-size: 12px;
        }
        .bk-log-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .bk-log-dot.ok  { background: #10b981; }
        .bk-log-dot.err { background: #ef4444; }
        .bk-log-text { flex: 1; color: #94a3b8; }
        .bk-log-time { color: #475569; flex-shrink: 0; }

        /* ── Toast ── */
        .bk-toast {
          position: fixed; bottom: 24px; right: 24px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 14px; font-weight: 500;
          display: flex; align-items: center; gap: 10px;
          z-index: 9999;
          animation: slideIn .3s ease;
          max-width: 380px;
          box-shadow: 0 8px 32px rgba(0,0,0,.4);
        }
        .bk-toast.success { background: rgba(16,185,129,.9);  color: white; }
        .bk-toast.error   { background: rgba(239,68,68,.9);   color: white; }
        .bk-toast.info    { background: rgba(59,130,246,.9);  color: white; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        /* ── Loading ── */
        .backup-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 100vh; gap: 16px; color: #94a3b8;
          background: linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%);
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Empty ── */
        .bk-empty { text-align: center; padding: 40px; color: #475569; }
        .bk-empty svg { margin: 0 auto 12px; display: block; opacity: .4; }
      `}</style>

      <div className="backup-root">
        {/* Header */}
        <div className="bk-header">
          <button className="bk-back-btn" onClick={() => router.push(`/${propertyCode}/hoteladmin`)}>
            <ChevronLeft size={16} /> Back to Admin
          </button>
          <div className="bk-title">
            <div className="bk-title-icon"><Shield size={22} color="white" /></div>
            <div>
              <h1>Data Backup & Restore</h1>
              <p>Automatically save your hotel data to Desktop and Google Drive</p>
            </div>
          </div>
          <button className="bk-btn bk-btn-ghost" onClick={fetchData}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <div className="bk-main">

          {/* Status Cards */}
          {status && (
            <div className="bk-status-grid">
              <div className="bk-stat-card">
                <div className="bk-stat-icon purple"><Database size={22} color="white" /></div>
                <div>
                  <div className="bk-stat-label">Database Size</div>
                  <div className="bk-stat-value">{status.dbSizeMB}</div>
                  <div className="bk-stat-sub">{status.dbExists ? '✅ Database found' : '❌ Database missing'}</div>
                </div>
              </div>
              <div className="bk-stat-card">
                <div className="bk-stat-icon orange"><HardDrive size={22} color="white" /></div>
                <div>
                  <div className="bk-stat-label">Total Backups</div>
                  <div className="bk-stat-value">{status.totalBackups}</div>
                  <div className="bk-stat-sub">Saved on Desktop</div>
                </div>
              </div>
              <div className="bk-stat-card">
                <div className={`bk-stat-icon ${status.googleDriveDetected ? 'green' : 'orange'}`}>
                  <Cloud size={22} color="white" />
                </div>
                <div>
                  <div className="bk-stat-label">Google Drive</div>
                  <div className="bk-stat-value">{status.googleDriveDetected ? '✅ Connected' : '❌ Not Found'}</div>
                  <div className="bk-stat-sub">{status.googleDriveEmail || 'Install Google Drive Desktop'}</div>
                </div>
              </div>
              <div className="bk-stat-card">
                <div className="bk-stat-icon blue"><Clock size={22} color="white" /></div>
                <div>
                  <div className="bk-stat-label">Last Backup</div>
                  <div className="bk-stat-value" style={{ fontSize: 14 }}>
                    {backups[0] ? backups[0].dateStr : 'Never'}
                  </div>
                  <div className="bk-stat-sub">{backups[0]?.timeStr || 'No backups yet'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Google Drive notice */}
          {status && !status.googleDriveDetected && (
            <div className="bk-gdrive-notice">
              <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="bk-gdrive-notice-text">
                <h4>⚠️ Google Drive Desktop Not Detected</h4>
                <p>
                  Google Drive for Desktop app is not installed. Backups are currently saved locally on Desktop.<br />
                  To enable cloud sync, install Google Drive for Desktop:{' '}
                  <a href="https://www.google.com/drive/download/" target="_blank" rel="noreferrer">
                    google.com/drive/download
                  </a>
                  {' '}— after signing in, all backups will automatically sync to Google Drive cloud!
                </p>
              </div>
            </div>
          )}

          {status && status.googleDriveDetected && (
            <div className="bk-gdrive-notice bk-gdrive-success">
              <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="bk-gdrive-notice-text">
                <h4>☁️ Google Drive Connected: {status.googleDriveEmail}</h4>
                <p>
                  Backup Folder: <strong>{status.googleDrivePath}</strong><br />
                  Every backup is safely stored on both Desktop and Google Drive cloud!
                </p>
              </div>
            </div>
          )}

          {/* Active Hotel Property Card (Strict Tenant Isolation) */}
          <div className="bk-property-card">
            <div className="bk-prop-left">
              <div className="bk-prop-icon">
                <Building2 size={24} color="#818cf8" />
              </div>
              <div>
                <span className="bk-prop-badge">Active Hotel Property</span>
                <h3 className="bk-prop-title">
                  {property?.name || propertyCode}
                  <span className="bk-prop-code">{property?.code || propertyCode}</span>
                  {property?.city && <span className="bk-prop-city">({property.city})</span>}
                </h3>
                <p className="bk-prop-desc">
                  Private, isolated backup workspace dedicated strictly to {property?.name || propertyCode}.
                </p>
              </div>
            </div>
            <div className="bk-prop-tag">
              <span className="bk-dot-pulse" />
              Isolated Property Storage
            </div>
          </div>

          {/* Client Laptop / System Direct Download Card */}
          <div className="bk-laptop-card">
            <div className="bk-laptop-left">
              <Laptop size={28} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4>Save JSON Backup Directly to This Computer / Laptop</h4>
                <p>
                  • <strong>Host System:</strong> Automated service exports structured JSON snapshots every 10 minutes in <code>~/Desktop/Hotel-PMS-Backups/{property?.code || propertyCode}</code>.<br />
                  • <strong>Client Workstations / Laptops:</strong> Click below to download the latest master property database as a pure <strong>JSON (.json)</strong> file.
                </p>
              </div>
            </div>
            {backups[0] && (
              <a
                href={`/api/backup/download?name=${encodeURIComponent(backups[0].name)}&propertyCode=${encodeURIComponent(property?.code || propertyCode)}&format=json`}
                className="bk-btn bk-btn-primary"
                style={{ textDecoration: 'none', flexShrink: 0 }}
                download={`${property?.code || propertyCode}-${backups[0].name}.json`}
              >
                <Download size={16} /> Download JSON to This Laptop
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bk-actions">
            <button className="bk-btn bk-btn-primary" onClick={handleBackupNow} disabled={backing}>
              {backing
                ? <><Loader2 size={16} className="spin" /> Creating JSON Backup...</>
                : <><Download size={16} /> Backup Now (JSON)</>
              }
            </button>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={14} />
              Auto-backup: Run <code style={{ background: 'rgba(0,0,0,.3)', padding: '2px 6px', borderRadius: 4, color: '#818cf8' }}>npm run backup:start</code> in terminal for hourly auto-backup
            </div>
          </div>

          {/* Backup List */}
          <div className="bk-section">
            <div className="bk-section-title">
              <HardDrive size={18} />
              Available JSON Backups ({backups.length})
            </div>
            {backups.length === 0 ? (
              <div className="bk-empty">
                <Database size={48} />
                <p>No backups yet. Click "Backup Now (JSON)" to create your first backup!</p>
              </div>
            ) : (
              <div className="bk-list">
                {backups.map((bk, i) => (
                  <div key={bk.name} className="bk-item">
                    <div className="bk-item-idx">{i + 1}</div>
                    <div className="bk-item-info">
                      <div className="bk-item-name">{bk.name}</div>
                      <div className="bk-item-meta">
                        <span>📅 {bk.dateStr}</span>
                        <span>🕐 {bk.timeStr}</span>
                        <span>💾 {bk.jsonSize || bk.dbSizeMB}</span>
                        {bk.recordsCount && <span>📋 {bk.recordsCount} records</span>}
                      </div>
                    </div>
                    <div className="bk-item-badges">
                      <span className="bk-badge bk-badge-json">
                        <FileJson size={10} /> JSON
                      </span>
                      <span className="bk-badge bk-badge-desktop">
                        <HardDrive size={10} /> Desktop
                      </span>
                      {bk.hasGoogleDrive && (
                        <span className="bk-badge bk-badge-drive">
                          <Cloud size={10} /> Google Drive
                        </span>
                      )}
                    </div>
                    <div className="bk-item-actions">
                      <a
                        href={`/api/backup/download?name=${encodeURIComponent(bk.name)}&propertyCode=${encodeURIComponent(property?.code || propertyCode)}&format=json`}
                        className="bk-icon-btn"
                        title="Download JSON (.json) file to your computer"
                        download={`${property?.code || propertyCode}-${bk.name}.json`}
                      >
                        <Download size={14} />
                      </a>
                      <button
                        className="bk-icon-btn"
                        title="Restore this JSON backup"
                        disabled={!!restoring}
                        onClick={() => handleRestore(bk.name)}
                      >
                        {restoring === bk.name
                          ? <Loader2 size={14} className="spin" />
                          : <RotateCcw size={14} />
                        }
                      </button>
                      <button
                        className="bk-icon-btn danger"
                        title="Delete this backup"
                        disabled={!!deleting || i === 0}
                        onClick={() => handleDelete(bk.name)}
                      >
                        {deleting === bk.name
                          ? <Loader2 size={14} className="spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Logs */}
          {logs.length > 0 && (
            <div className="bk-section">
              <div className="bk-section-title">
                <Clock size={18} />
                Recent Backup History
              </div>
              {logs.map((log, i) => (
                <div key={i} className="bk-log-item">
                  <div className={`bk-log-dot ${log.success ? 'ok' : 'err'}`} />
                  <div className="bk-log-text">
                    {log.success
                      ? `✅ Backup created — ${log.dbSizeMB}${log.gdrivePath ? ' (Desktop + Google Drive)' : ' (Desktop only)'}`
                      : `❌ Backup failed — ${log.error}`
                    }
                  </div>
                  <div className="bk-log-time">{log.dateStr} {log.timeStr}</div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="bk-section">
            <div className="bk-section-title">
              <Info size={18} />
              Auto-Backup Setup Instructions
            </div>
            <div style={{ background: 'rgba(0,0,0,.3)', borderRadius: 12, padding: 20, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8, color: '#94a3b8', border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ color: '#818cf8', marginBottom: 8 }}># Terminal mein run karo:</div>
              <div>
                <span style={{ color: '#10b981' }}>npm run backup</span>
                <span style={{ color: '#475569' }}>              # Abhi ek baar backup lo</span>
              </div>
              <div>
                <span style={{ color: '#10b981' }}>npm run backup:start</span>
                <span style={{ color: '#475569' }}>         # Har 60 min me auto-backup</span>
              </div>
              <div>
                <span style={{ color: '#10b981' }}>npm run backup:list</span>
                <span style={{ color: '#475569' }}>          # Saare backups dekho</span>
              </div>
              <div style={{ marginTop: 12, color: '#818cf8' }}># Custom interval (e.g. 30 minutes):</div>
              <div>
                <span style={{ color: '#10b981' }}>node scripts/backup-manager.js start 30</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`bk-toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error'   && <XCircle size={18} />}
          {toast.type === 'info'    && <Info size={18} />}
          {toast.msg}
        </div>
      )}
    </>
  );
}
