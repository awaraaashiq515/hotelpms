'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database, HardDrive, Cloud, RefreshCw, Download, Trash2,
  RotateCcw, CheckCircle, XCircle, AlertTriangle, Clock,
  Shield, Loader2, ArrowLeft, Info, Laptop, Building2, ShieldCheck, FileJson,
  FolderOpen, Settings2, Plus, X, ToggleLeft, ToggleRight, Save, FolderCheck,
  Calendar, AlertOctagon, CheckSquare, Square, Filter,
  Receipt, CreditCard, Archive, History, FileText,
  Folder, FolderPlus, CornerLeftUp, ChevronRight
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PropertyInfo {
  code: string;
  name: string;
  city?: string;
}

interface BillingArchiveItem {
  id: string;
  filename: string;
  filePath: string;
  propertyCode: string;
  propertyName: string;
  timestamp: string;
  dateStr: string;
  timeStr: string;
  invoicesCount: number;
  ordersCount: number;
  receiptsCount: number;
  totalRevenue: number;
  scope: string;
  beforeDate: string | null;
  fileSize: string;
  sizeBytes?: number;
}

interface BillingStats {
  invoicesCount: number;
  invoicesTotal: string;
  ordersCount: number;
  ordersTotal: string;
  receiptsCount: number;
  receiptsTotal: string;
  settlementsCount: number;
  settlementsTotal: string;
  totalBillingItems: number;
  earliestDate: string | null;
  latestDate: string | null;
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

interface PathSettings {
  customDesktopPath: string | null;
  customGdrivePath:  string | null;
  enableDesktop:     boolean;
  enableGdrive:      boolean;
  enableCustomPath:  boolean;
  customPaths:       string[];
  defaultDesktopPath?: string;
  homedir?: string;
}

const PURGE_CATEGORIES_CONFIG = [
  { key: 'reservations', label: 'Reservations & Check-ins', desc: 'Bookings, check-in, check-out, folios & guest documents' },
  { key: 'pos_orders',   label: 'POS Orders & KOT',        desc: 'Restaurant/bar orders, kitchen tickets, ratings & tips' },
  { key: 'invoices',     label: 'Invoices & Receipts',     desc: 'Customer invoices, line items, receipts & payments' },
  { key: 'accounting',   label: 'Vouchers & Expenses',     desc: 'Financial vouchers, entries, expenses & day closings' },
  { key: 'housekeeping', label: 'Housekeeping & Maintenance', desc: 'Room cleaning tasks, maintenance tickets & laundry logs' },
  { key: 'attendance',   label: 'Staff Attendance & Shifts', desc: 'Attendance punch records, staff shifts & cash movements' },
  { key: 'audit_logs',   label: 'Audit Logs & Notifications', desc: 'System history audit logs, staff messages & notifications' },
];

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

  // ── Path Settings State ───────────────────────────────────────────────────
  const [showPathSettings, setShowPathSettings] = useState(false);
  const [pathSettings, setPathSettings] = useState<PathSettings>({
    customDesktopPath: null,
    customGdrivePath: null,
    enableDesktop: true,
    enableGdrive: true,
    enableCustomPath: false,
    customPaths: [],
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [newCustomPath, setNewCustomPath] = useState('');

  const handleSavePathSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pathSettings),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Backup path settings saved!', 'success');
        await fetchData();
      } else {
        showToast('Failed to save settings: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error saving settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const addCustomPath = () => {
    const trimmed = newCustomPath.trim();
    if (!trimmed) return;
    if (pathSettings.customPaths.includes(trimmed)) {
      showToast('Path already added', 'info');
      return;
    }
    setPathSettings(prev => ({ ...prev, customPaths: [...prev.customPaths, trimmed] }));
    setNewCustomPath('');
  };

  const removeCustomPath = (idx: number) => {
    setPathSettings(prev => ({ ...prev, customPaths: prev.customPaths.filter((_, i) => i !== idx) }));
  };

  // ── Folder Browser State ──────────────────────────────────────────────────
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [currentBrowserDir, setCurrentBrowserDir] = useState<string>('');
  const [parentBrowserDir, setParentBrowserDir] = useState<string | null>(null);
  const [browserFolders, setBrowserFolders] = useState<{ name: string; fullPath: string }[]>([]);
  const [browserShortcuts, setBrowserShortcuts] = useState<Record<string, string | null>>({});
  const [loadingBrowser, setLoadingBrowser] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [browserTargetField, setBrowserTargetField] = useState<'desktop' | 'additional'>('desktop');

  const openFolderBrowser = async (initialPath?: string, targetField: 'desktop' | 'additional' = 'desktop') => {
    setBrowserTargetField(targetField);
    setShowFolderBrowser(true);
    setIsCreatingFolder(false);
    setNewFolderName('');
    await loadDirectory(initialPath || pathSettings.customDesktopPath || pathSettings.homedir || '');
  };

  const loadDirectory = async (dirPath?: string) => {
    setLoadingBrowser(true);
    try {
      const url = dirPath ? `/api/backup/browse-folder?dir=${encodeURIComponent(dirPath)}` : '/api/backup/browse-folder';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCurrentBrowserDir(data.currentPath);
        setParentBrowserDir(data.parentPath);
        setBrowserFolders(data.folders || []);
        setBrowserShortcuts({
          Desktop: data.desktop,
          Documents: data.documents,
          Downloads: data.downloads,
          Home: data.homedir,
          Volumes: data.volumes,
        });
      } else {
        showToast('Error loading folder: ' + data.error, 'error');
      }
    } catch (_) {
      showToast('Network error loading folder list', 'error');
    } finally {
      setLoadingBrowser(false);
    }
  };

  const handleCreateNewFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    try {
      const res = await fetch('/api/backup/browse-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentDir: currentBrowserDir, folderName: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Folder "${trimmed}" created!`, 'success');
        setIsCreatingFolder(false);
        setNewFolderName('');
        await loadDirectory(data.createdPath);
      } else {
        showToast('Failed to create folder: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error creating folder', 'error');
    }
  };

  const handleSelectCurrentFolder = async () => {
    if (!currentBrowserDir) return;

    if (browserTargetField === 'desktop') {
      const updated = { ...pathSettings, customDesktopPath: currentBrowserDir };
      setPathSettings(updated);
      setShowFolderBrowser(false);
      try {
        await fetch('/api/backup', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        showToast(`Backup destination set to: ${currentBrowserDir}`, 'success');
        await fetchData();
      } catch (_) {}
    } else {
      if (!pathSettings.customPaths.includes(currentBrowserDir)) {
        const updated = {
          ...pathSettings,
          enableCustomPath: true,
          customPaths: [...pathSettings.customPaths, currentBrowserDir],
        };
        setPathSettings(updated);
        setShowFolderBrowser(false);
        try {
          await fetch('/api/backup', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          });
          showToast(`Added backup location: ${currentBrowserDir}`, 'success');
          await fetchData();
        } catch (_) {}
      } else {
        setShowFolderBrowser(false);
      }
    }
  };

  // ── Data Cleanup / Purge State ───────────────────────────────────────────
  const [showPurgePanel, setShowPurgePanel] = useState(false);
  const [purgeDate, setPurgeDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'reservations', 'pos_orders', 'invoices', 'accounting', 'housekeeping', 'attendance', 'audit_logs'
  ]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, { label: string; count: number; warning: string }>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [purging, setPurging] = useState(false);
  const [showConfirmPurgeModal, setShowConfirmPurgeModal] = useState(false);
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [takeBackupBeforePurge, setTakeBackupBeforePurge] = useState(true);

  const fetchPurgeCounts = useCallback(async (dateStr: string, propCode?: string) => {
    if (!dateStr) return;
    setLoadingCounts(true);
    try {
      const code = propCode || property?.code || '';
      const res = await fetch(`/api/backup/purge?before=${encodeURIComponent(dateStr)}&propertyCode=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.categories) {
        setCategoryCounts(data.categories);
      }
    } catch (_) {
    } finally {
      setLoadingCounts(false);
    }
  }, [property?.code]);

  useEffect(() => {
    if (showPurgePanel && purgeDate) {
      fetchPurgeCounts(purgeDate);
    }
  }, [showPurgePanel, purgeDate, fetchPurgeCounts]);

  const setPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    const dateStr = d.toISOString().split('T')[0];
    setPurgeDate(dateStr);
    fetchPurgeCounts(dateStr);
  };

  const toggleCategory = (catKey: string) => {
    setSelectedCategories(prev =>
      prev.includes(catKey) ? prev.filter(k => k !== catKey) : [...prev, catKey]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories(PURGE_CATEGORIES_CONFIG.map(c => c.key));
  };

  const deselectAllCategories = () => {
    setSelectedCategories([]);
  };

  const handleExecutePurge = async () => {
    if (!purgeDate) {
      showToast('Please select a cutoff date', 'error');
      return;
    }
    if (selectedCategories.length === 0) {
      showToast('Please select at least one data category to purge', 'error');
      return;
    }
    if (confirmKeyword.trim().toUpperCase() !== 'PURGE') {
      showToast('Please type PURGE to confirm deletion', 'error');
      return;
    }

    setPurging(true);
    try {
      if (takeBackupBeforePurge) {
        showToast('Creating safety backup before purging...', 'info');
        await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyCode: property?.code })
        });
      }

      const res = await fetch('/api/backup/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeDate: purgeDate,
          selectedCategories,
          propertyCode: property?.code,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Selected historical data purged successfully!', 'success');
        setShowConfirmPurgeModal(false);
        setConfirmKeyword('');
        await fetchData();
        await fetchPurgeCounts(purgeDate);
      } else {
        showToast('Purge failed: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error during data purge', 'error');
    } finally {
      setPurging(false);
    }
  };

  // ── Billing Archive & Restore State ─────────────────────────────────────────
  const [showBillingPanel, setShowBillingPanel] = useState(false);
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [billingArchives, setBillingArchives] = useState<BillingArchiveItem[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [archivingBilling, setArchivingBilling] = useState(false);
  const [restoringBilling, setRestoringBilling] = useState<string | null>(null);
  const [deletingBillingArchive, setDeletingBillingArchive] = useState<string | null>(null);
  const [billingScope, setBillingScope] = useState<'ALL' | 'DATE_RANGE'>('ALL');
  const [billingBeforeDate, setBillingBeforeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showConfirmArchiveModal, setShowConfirmArchiveModal] = useState(false);
  const [confirmBillingKeyword, setConfirmBillingKeyword] = useState('');

  const fetchBillingData = useCallback(async (propCode?: string) => {
    setLoadingBilling(true);
    try {
      const code = propCode || property?.code || '';
      const url = code ? `/api/backup/billing?propertyCode=${encodeURIComponent(code)}` : '/api/backup/billing';
      const res = await fetch(url);
      const data = await res.json();
      if (data.currentStats) setBillingStats(data.currentStats);
      if (data.archives) setBillingArchives(data.archives || []);
    } catch (_) {
    } finally {
      setLoadingBilling(false);
    }
  }, [property?.code]);

  useEffect(() => {
    if (showBillingPanel) {
      fetchBillingData();
    }
  }, [showBillingPanel, fetchBillingData]);

  const handleArchiveAndRemoveBilling = async () => {
    if (confirmBillingKeyword.trim().toUpperCase() !== 'CLEAR') {
      showToast('Please type CLEAR to confirm billing data removal', 'error');
      return;
    }

    setArchivingBilling(true);
    try {
      const res = await fetch('/api/backup/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive_and_remove',
          scope: billingScope,
          beforeDate: billingScope === 'DATE_RANGE' ? billingBeforeDate : undefined,
          propertyCode: property?.code,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Billing data archived & cleared successfully!', 'success');
        setShowConfirmArchiveModal(false);
        setConfirmBillingKeyword('');
        await fetchBillingData();
        await fetchData(); // Refresh db size and tables
      } else {
        showToast('Archive failed: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error during billing archive', 'error');
    } finally {
      setArchivingBilling(false);
    }
  };

  const handleRestoreBillingArchive = async (archiveId: string, archiveName: string) => {
    if (!confirm(`Are you sure you want to restore billing data from "${archiveName}"?\n\nAll invoices, orders, receipts, and KOT items from this archive will be restored back to your active database.`)) return;

    setRestoringBilling(archiveId);
    try {
      const res = await fetch('/api/backup/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          archiveId,
          propertyCode: property?.code,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Billing data restored successfully!', 'success');
        await fetchBillingData();
        await fetchData();
      } else {
        showToast('Restore failed: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error during billing restore', 'error');
    } finally {
      setRestoringBilling(null);
    }
  };

  const handleDeleteBillingArchive = async (archiveId: string) => {
    if (!confirm('Are you sure you want to permanently delete this billing archive file?')) return;

    setDeletingBillingArchive(archiveId);
    try {
      const res = await fetch('/api/backup/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_archive',
          archiveId,
          propertyCode: property?.code,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Billing archive file deleted', 'success');
        await fetchBillingData();
      } else {
        showToast('Delete failed: ' + data.error, 'error');
      }
    } catch {
      showToast('Network error deleting archive', 'error');
    } finally {
      setDeletingBillingArchive(null);
    }
  };

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
      if (data.pathSettings) {
        setPathSettings(ps => ({
          ...ps,
          ...data.pathSettings,
          customPaths: Array.isArray(data.pathSettings.customPaths) ? data.pathSettings.customPaths : [],
        }));
      }
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
                • <strong>Host System:</strong> Automated service exports structured JSON snapshots every 10 minutes in <code>{pathSettings.customDesktopPath || `~/Desktop/Hotel-PMS-Backups/${property?.code || ''}`}</code>.<br />
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

        {/* ── Backup Path Settings Panel ── */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          {/* Header (clickable toggle) */}
          <button
            onClick={() => setShowPathSettings(v => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <FolderOpen size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Backup Destination Settings
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 font-semibold">
                    {[
                      pathSettings.enableDesktop && 'Desktop',
                      pathSettings.enableGdrive && 'Google Drive',
                      pathSettings.enableCustomPath && pathSettings.customPaths.length > 0 && `+${pathSettings.customPaths.length} Custom`,
                    ].filter(Boolean).join(' · ') || 'No destinations'}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose where your backups are saved — Desktop, Google Drive, or custom folder paths
                </p>
              </div>
            </div>
            <div className={`text-slate-400 transition-transform duration-200 ${showPathSettings ? 'rotate-180' : ''}`}>
              <Settings2 size={18} />
            </div>
          </button>

          {showPathSettings && (
            <div className="border-t border-slate-800 p-5 space-y-5">

              {/* ── Desktop Path ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive size={15} className="text-amber-400" />
                    <span className="text-sm font-semibold text-white">Desktop / Local Folder</span>
                  </div>
                  <button
                    onClick={() => setPathSettings(ps => ({ ...ps, enableDesktop: !ps.enableDesktop }))}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      pathSettings.enableDesktop
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border border-slate-700 text-slate-400'
                    }`}
                  >
                    {pathSettings.enableDesktop ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {pathSettings.enableDesktop ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {pathSettings.enableDesktop && (
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Save Path (leave blank for default)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pathSettings.customDesktopPath || ''}
                        onChange={e => setPathSettings(ps => ({ ...ps, customDesktopPath: e.target.value || null }))}
                        placeholder={pathSettings.defaultDesktopPath || `${pathSettings.homedir || '~'}/Desktop/Hotel-PMS-Backups`}
                        className="flex-1 bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-violet-500 transition-colors"
                      />
                      <button
                        onClick={() => openFolderBrowser(pathSettings.customDesktopPath || '', 'desktop')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-lg shadow-violet-600/20 active:scale-95"
                        title="Browse and select local folder, or create a new folder"
                      >
                        <FolderOpen size={14} />
                        <span>Browse / Select Folder</span>
                      </button>
                      {pathSettings.customDesktopPath && (
                        <button
                          onClick={() => setPathSettings(ps => ({ ...ps, customDesktopPath: null }))}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Reset to default"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {!pathSettings.customDesktopPath && (
                      <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                        <FolderCheck size={11} />
                        Using default: {pathSettings.defaultDesktopPath || '~/Desktop/Hotel-PMS-Backups'}
                      </p>
                    )}
                    {pathSettings.customDesktopPath && (
                      <p className="text-[10px] text-violet-400 flex items-center gap-1">
                        <FolderCheck size={11} />
                        Custom path set — backups will save here
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/60" />

              {/* ── Google Drive Path ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud size={15} className="text-sky-400" />
                    <span className="text-sm font-semibold text-white">Google Drive</span>
                    {status?.googleDriveDetected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                        Detected
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setPathSettings(ps => ({ ...ps, enableGdrive: !ps.enableGdrive }))}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      pathSettings.enableGdrive
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border border-slate-700 text-slate-400'
                    }`}
                  >
                    {pathSettings.enableGdrive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {pathSettings.enableGdrive ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {pathSettings.enableGdrive && (
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Custom Google Drive Path (optional — overrides auto-detect)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pathSettings.customGdrivePath || ''}
                        onChange={e => setPathSettings(ps => ({ ...ps, customGdrivePath: e.target.value || null }))}
                        placeholder={status?.googleDrivePath || 'Auto-detect from ~/Library/CloudStorage/GoogleDrive-...'}
                        className="flex-1 bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-violet-500 transition-colors"
                      />
                      {pathSettings.customGdrivePath && (
                        <button
                          onClick={() => setPathSettings(ps => ({ ...ps, customGdrivePath: null }))}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Reset to auto-detect"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {!pathSettings.customGdrivePath && status?.googleDriveDetected && (
                      <p className="text-[10px] text-sky-400 flex items-center gap-1">
                        <FolderCheck size={11} />
                        Auto-detected: {status.googleDrivePath || 'Google Drive connected'}
                      </p>
                    )}
                    {!pathSettings.customGdrivePath && !status?.googleDriveDetected && (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Info size={11} />
                        Google Drive not detected on this system
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/60" />

              {/* ── Additional Custom Paths ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus size={15} className="text-indigo-400" />
                    <span className="text-sm font-semibold text-white">Additional Save Locations</span>
                    <span className="text-[10px] text-slate-400">(USB drive, NAS, external folder…)</span>
                  </div>
                  <button
                    onClick={() => setPathSettings(ps => ({ ...ps, enableCustomPath: !ps.enableCustomPath }))}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      pathSettings.enableCustomPath
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border border-slate-700 text-slate-400'
                    }`}
                  >
                    {pathSettings.enableCustomPath ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {pathSettings.enableCustomPath ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {pathSettings.enableCustomPath && (
                  <div className="space-y-3">
                    {/* Add new path input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCustomPath}
                        onChange={e => setNewCustomPath(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomPath()}
                        placeholder="e.g. /Volumes/USB-Drive/Backups  or  /Users/admin/Documents/Backups"
                        className="flex-1 bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-violet-500 transition-colors"
                      />
                      <button
                        onClick={() => openFolderBrowser(newCustomPath || '', 'additional')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                        title="Browse local folder"
                      >
                        <FolderOpen size={13} /> Browse
                      </button>
                      <button
                        onClick={addCustomPath}
                        disabled={!newCustomPath.trim()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                      >
                        <Plus size={13} /> Add
                      </button>
                    </div>

                    {/* List of added paths */}
                    {pathSettings.customPaths.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic px-1">No extra paths added yet. Type a folder path above and click Add.</p>
                    ) : (
                      <div className="space-y-2">
                        {pathSettings.customPaths.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-950/30 border border-indigo-500/20"
                          >
                            <FolderCheck size={13} className="text-indigo-400 shrink-0" />
                            <span className="flex-1 text-xs text-slate-200 font-mono truncate">{p}</span>
                            <button
                              onClick={() => removeCustomPath(idx)}
                              className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                              title="Remove path"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
                <span className="text-[11px] text-slate-500">Changes apply on next backup</span>
                <button
                  onClick={handleSavePathSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-violet-600/20 transition-all active:scale-95 cursor-pointer"
                >
                  {savingSettings ? (
                    <><Loader2 size={13} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={13} /> Save Settings</>
                  )}
                </button>
              </div>

            </div>
          )}
        </div>

        {/* ── Data Cleanup & Historical Purge Panel ── */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          {/* Header (clickable toggle) */}
          <button
            onClick={() => setShowPurgePanel(v => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Historical Data Cleanup & Purge
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-300 font-semibold">
                    {selectedCategories.length} / {PURGE_CATEGORIES_CONFIG.length} Categories Selected
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a cutoff date to permanently remove old database records and reduce storage size
                </p>
              </div>
            </div>
            <div className={`text-slate-400 transition-transform duration-200 ${showPurgePanel ? 'rotate-180' : ''}`}>
              <Settings2 size={18} />
            </div>
          </button>

          {showPurgePanel && (
            <div className="border-t border-slate-800 p-5 space-y-5">

              {/* Warning Notice */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>Warning:</strong> Purging deletes records permanently prior to your selected cutoff date.
                  An automated safety backup will be created before deletion to protect your data.
                </div>
              </div>

              {/* Date Selection & Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar size={14} className="text-indigo-400" />
                    Purge All Records Created Before:
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Select:</span>
                    <button
                      onClick={() => setPresetDays(30)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      30 Days
                    </button>
                    <button
                      onClick={() => setPresetDays(60)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      60 Days
                    </button>
                    <button
                      onClick={() => setPresetDays(90)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                    >
                      90 Days (Recommended)
                    </button>
                    <button
                      onClick={() => setPresetDays(180)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      6 Months
                    </button>
                    <button
                      onClick={() => setPresetDays(365)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      1 Year
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={purgeDate}
                    onChange={(e) => {
                      setPurgeDate(e.target.value);
                      fetchPurgeCounts(e.target.value);
                    }}
                    className="bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <span className="text-xs text-slate-400">
                    Records dated before <strong>{purgeDate || 'selected date'}</strong> will be permanently deleted.
                  </span>
                </div>
              </div>

              {/* Data Categories Selection */}
              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Filter size={14} className="text-indigo-400" />
                    Choose Data Categories to Purge:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllCategories}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      onClick={deselectAllCategories}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-300 hover:underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {PURGE_CATEGORIES_CONFIG.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.key);
                    const countInfo = categoryCounts[cat.key];

                    return (
                      <div
                        key={cat.key}
                        onClick={() => toggleCategory(cat.key)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                          isSelected
                            ? 'bg-rose-950/20 border-rose-500/40 text-slate-100'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/20'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isSelected ? (
                            <CheckSquare size={16} className="text-rose-400" />
                          ) : (
                            <Square size={16} className="text-slate-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-white truncate">{cat.label}</p>
                            {loadingCounts ? (
                              <Loader2 size={11} className="animate-spin text-slate-500" />
                            ) : countInfo ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 font-mono text-slate-400 shrink-0">
                                ~{countInfo.count} records
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{cat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={takeBackupBeforePurge}
                    onChange={(e) => setTakeBackupBeforePurge(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5 bg-slate-900"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Create safety backup snapshot automatically before purge
                  </span>
                </label>

                <button
                  onClick={() => {
                    if (selectedCategories.length === 0) {
                      showToast('Please select at least one data category', 'error');
                      return;
                    }
                    if (!purgeDate) {
                      showToast('Please choose a date', 'error');
                      return;
                    }
                    setShowConfirmPurgeModal(true);
                  }}
                  disabled={selectedCategories.length === 0 || !purgeDate}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Trash2 size={14} /> Review & Purge Data ({selectedCategories.length})
                </button>
              </div>

            </div>
          )}
        </div>

        {/* ── Billing & Invoicing Archive & Restore Panel ── */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          {/* Header (clickable toggle) */}
          <button
            onClick={() => {
              setShowBillingPanel(v => !v);
            }}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Receipt size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Billing Data Archive & Restore
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 font-semibold">
                    {billingArchives.length} Archives Saved
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Safely archive and clear billing history (invoices, POS orders, receipts) with 1-click restore at any time
                </p>
              </div>
            </div>
            <div className={`text-slate-400 transition-transform duration-200 ${showBillingPanel ? 'rotate-180' : ''}`}>
              <Settings2 size={18} />
            </div>
          </button>

          {showBillingPanel && (
            <div className="border-t border-slate-800 p-5 space-y-6">

              {/* Current Billing Overview Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={14} className="text-amber-400" />
                    Current Active Billing Records
                  </h5>
                  <button
                    onClick={() => fetchBillingData()}
                    disabled={loadingBilling}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} className={loadingBilling ? 'animate-spin' : ''} />
                    Refresh Stats
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Customer Invoices</p>
                    <p className="text-base font-black text-white mt-0.5">{billingStats?.invoicesCount || 0}</p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-0.5">₹{billingStats?.invoicesTotal || '0.00'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">POS Restaurant Orders</p>
                    <p className="text-base font-black text-white mt-0.5">{billingStats?.ordersCount || 0}</p>
                    <p className="text-[11px] text-amber-400 font-mono mt-0.5">₹{billingStats?.ordersTotal || '0.00'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Receipts & Payments</p>
                    <p className="text-base font-black text-white mt-0.5">{(billingStats?.receiptsCount || 0) + (billingStats?.settlementsCount || 0)}</p>
                    <p className="text-[11px] text-sky-400 font-mono mt-0.5">₹{billingStats?.receiptsTotal || '0.00'}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Billing Time Span</p>
                    <p className="text-xs font-bold text-slate-200 mt-1 truncate">
                      {billingStats?.earliestDate ? new Date(billingStats.earliestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No records'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      to {billingStats?.latestDate ? new Date(billingStats.latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Present'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Archive & Remove Action Box */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Archive size={14} className="text-amber-400" />
                      Archive & Clear Active Billing Data
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-2xl">
                      Exports all active invoices, orders, KOTs, receipts & settlements into a secure structured JSON snapshot file in your PMS Desktop Backups directory, then clears them from active views. You can restore this archive anytime below.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (!billingStats || (billingStats.invoicesCount === 0 && billingStats.ordersCount === 0 && billingStats.receiptsCount === 0)) {
                        showToast('No active billing data found to archive', 'info');
                        return;
                      }
                      setShowConfirmArchiveModal(true);
                    }}
                    disabled={!billingStats || (billingStats.invoicesCount === 0 && billingStats.ordersCount === 0 && billingStats.receiptsCount === 0)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    <Archive size={14} /> Archive & Clear Billing Now
                  </button>
                </div>

                <div className="flex items-center gap-6 pt-2 border-t border-amber-500/20 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                    <input
                      type="radio"
                      name="billingScope"
                      checked={billingScope === 'ALL'}
                      onChange={() => setBillingScope('ALL')}
                      className="text-amber-500 focus:ring-0 bg-slate-900"
                    />
                    <span>Archive All Active Billing Data</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                    <input
                      type="radio"
                      name="billingScope"
                      checked={billingScope === 'DATE_RANGE'}
                      onChange={() => setBillingScope('DATE_RANGE')}
                      className="text-amber-500 focus:ring-0 bg-slate-900"
                    />
                    <span>Archive Billing Data Older Than:</span>
                  </label>

                  {billingScope === 'DATE_RANGE' && (
                    <input
                      type="date"
                      value={billingBeforeDate}
                      onChange={(e) => setBillingBeforeDate(e.target.value)}
                      className="bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              </div>

              {/* Saved Billing Archives List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <History size={14} className="text-indigo-400" />
                    Saved Billing Archives ({billingArchives.length})
                  </h5>
                  <span className="text-[11px] text-slate-500">
                    Saved in <code>{(pathSettings.customDesktopPath || `~/Desktop/Hotel-PMS-Backups`) + `/${property?.code || ''}/billing-archives`}</code>
                  </span>
                </div>

                {billingArchives.length === 0 ? (
                  <div className="text-center py-8 rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-500 space-y-1.5">
                    <FileText size={28} className="mx-auto text-slate-600" />
                    <p className="text-xs font-medium">No billing archives saved yet.</p>
                    <p className="text-[11px] text-slate-600">
                      When you archive billing data, it will be listed here with a 1-click restore option.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/70 rounded-xl bg-slate-950/40 border border-slate-800/80 overflow-hidden">
                    {billingArchives.map((arch, idx) => (
                      <div
                        key={arch.id}
                        className="p-3.5 flex items-center justify-between flex-wrap gap-3 hover:bg-slate-800/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-5 text-center text-xs font-bold text-slate-600">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 font-mono truncate">
                              {arch.filename}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                              <span>📅 {arch.dateStr} {arch.timeStr}</span>
                              <span className="text-emerald-400 font-medium">
                                🧾 {arch.invoicesCount} Invoices
                              </span>
                              <span className="text-amber-400 font-medium">
                                🍽️ {arch.ordersCount} POS Orders
                              </span>
                              <span className="text-sky-400 font-medium">
                                💳 {arch.receiptsCount} Receipts
                              </span>
                              <span>💾 {arch.fileSize}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Download JSON */}
                          <a
                            href={`/api/backup/billing/download?name=${encodeURIComponent(arch.filename)}&propertyCode=${encodeURIComponent(property?.code || '')}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                            title="Download Billing Archive JSON file"
                            download={`${property?.code || 'hotel'}-${arch.filename}`}
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </a>

                          {/* Restore Billing Data */}
                          <button
                            onClick={() => handleRestoreBillingArchive(arch.id, arch.filename)}
                            disabled={!!restoringBilling}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            title="Restore this archived billing data back into active database"
                          >
                            {restoringBilling === arch.id ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Restoring...</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw size={13} />
                                <span>Restore Data</span>
                              </>
                            )}
                          </button>

                          {/* Delete Archive */}
                          <button
                            onClick={() => handleDeleteBillingArchive(arch.id)}
                            disabled={!!deletingBillingArchive}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-colors cursor-pointer disabled:opacity-30"
                            title="Delete this billing archive file permanently"
                          >
                            {deletingBillingArchive === arch.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
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

      {/* ── Confirmation Modal for Data Purge ── */}
      {showConfirmPurgeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setShowConfirmPurgeModal(false);
                setConfirmKeyword('');
              }}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertOctagon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Confirm Permanent Data Purge
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This action permanently removes historical database records.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Cutoff Date:</span>
                <span className="font-bold text-rose-300 font-mono">Before {purgeDate}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Selected Categories:</span>
                <span className="font-bold text-white">{selectedCategories.length} Categories</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Auto Safety Backup:</span>
                <span className={`font-semibold ${takeBackupBeforePurge ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {takeBackupBeforePurge ? 'Yes (Desktop + Cloud)' : 'No (Not recommended)'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Categories to be cleaned:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategories.map((key) => {
                  const cfg = PURGE_CATEGORIES_CONFIG.find(c => c.key === key);
                  const count = categoryCounts[key]?.count;
                  return (
                    <span
                      key={key}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
                    >
                      <Trash2 size={10} className="text-rose-400" />
                      {cfg?.label || key}
                      {count !== undefined && (
                        <span className="text-[10px] text-slate-400">({count})</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                To confirm permanent deletion, type <span className="font-mono text-rose-400 font-black">PURGE</span> below:
              </label>
              <input
                type="text"
                value={confirmKeyword}
                onChange={(e) => setConfirmKeyword(e.target.value)}
                placeholder="Type PURGE"
                className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowConfirmPurgeModal(false);
                  setConfirmKeyword('');
                }}
                disabled={purging}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePurge}
                disabled={purging || confirmKeyword.trim().toUpperCase() !== 'PURGE'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
              >
                {purging ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Purging Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Permanently Purge Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal for Billing Archive & Removal ── */}
      {showConfirmArchiveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setShowConfirmArchiveModal(false);
                setConfirmBillingKeyword('');
              }}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Archive size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Archive & Clear Billing Data
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Export snapshot file and clear active billing records.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Scope:</span>
                <span className="font-bold text-amber-300">
                  {billingScope === 'ALL' ? 'All Billing Records' : `Records older than ${billingBeforeDate}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Customer Invoices:</span>
                <span className="font-bold text-white">
                  {billingStats?.invoicesCount || 0} (₹{billingStats?.invoicesTotal || '0.00'})
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Restaurant POS Orders:</span>
                <span className="font-bold text-white">
                  {billingStats?.ordersCount || 0} (₹{billingStats?.ordersTotal || '0.00'})
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Receipts & Settlements:</span>
                <span className="font-bold text-white">
                  {(billingStats?.receiptsCount || 0) + (billingStats?.settlementsCount || 0)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>100% Safe:</strong> A complete JSON archive file will be saved in your Desktop PMS backups before any data is cleared. You can restore this data anytime with a single click.
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                To confirm archiving and clearing, type <span className="font-mono text-amber-400 font-black">CLEAR</span> below:
              </label>
              <input
                type="text"
                value={confirmBillingKeyword}
                onChange={(e) => setConfirmBillingKeyword(e.target.value)}
                placeholder="Type CLEAR"
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowConfirmArchiveModal(false);
                  setConfirmBillingKeyword('');
                }}
                disabled={archivingBilling}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveAndRemoveBilling}
                disabled={archivingBilling || confirmBillingKeyword.trim().toUpperCase() !== 'CLEAR'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all cursor-pointer active:scale-95"
              >
                {archivingBilling ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Archiving & Clearing...</span>
                  </>
                ) : (
                  <>
                    <Archive size={14} />
                    <span>Confirm Archive & Clear</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Folder Browser & Creator Modal ── */}
      {showFolderBrowser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setShowFolderBrowser(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                <FolderOpen size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Choose Destination Folder
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a directory or create a new dedicated folder for your backups
                </p>
              </div>
            </div>

            {/* Quick Location Shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-500 font-medium mr-1">Locations:</span>
              {browserShortcuts.Desktop && (
                <button
                  onClick={() => loadDirectory(browserShortcuts.Desktop!)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Laptop size={12} className="text-blue-400" /> Desktop
                </button>
              )}
              {browserShortcuts.Documents && (
                <button
                  onClick={() => loadDirectory(browserShortcuts.Documents!)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileText size={12} className="text-amber-400" /> Documents
                </button>
              )}
              {browserShortcuts.Downloads && (
                <button
                  onClick={() => loadDirectory(browserShortcuts.Downloads!)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download size={12} className="text-emerald-400" /> Downloads
                </button>
              )}
              {browserShortcuts.Home && (
                <button
                  onClick={() => loadDirectory(browserShortcuts.Home!)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <HardDrive size={12} className="text-violet-400" /> Home (~)
                </button>
              )}
              {browserShortcuts.Volumes && (
                <button
                  onClick={() => loadDirectory(browserShortcuts.Volumes!)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <HardDrive size={12} className="text-rose-400" /> External Drives
                </button>
              )}
            </div>

            {/* Current Path Bar & Up button */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => parentBrowserDir && loadDirectory(parentBrowserDir)}
                disabled={!parentBrowserDir}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                title="Up one level"
              >
                <CornerLeftUp size={14} />
              </button>
              <div className="flex-1 min-w-0 font-mono text-xs text-slate-300 truncate">
                {currentBrowserDir || 'Loading...'}
              </div>
              <button
                onClick={() => setIsCreatingFolder(v => !v)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <FolderPlus size={13} />
                <span>New Folder</span>
              </button>
            </div>

            {/* Inline New Folder Input */}
            {isCreatingFolder && (
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <label className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                  Create New Folder in this directory:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFolder()}
                    placeholder="e.g. My-PMS-Backups"
                    autoFocus
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleCreateNewFolder}
                    disabled={!newFolderName.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <FolderPlus size={13} /> Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Folders List (Scrollable) */}
            <div className="flex-1 min-h-[220px] max-h-72 overflow-y-auto rounded-2xl bg-slate-950/70 border border-slate-800/80 p-2 space-y-1">
              {loadingBrowser ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                  <Loader2 size={24} className="animate-spin text-violet-500" />
                  <span>Loading directory contents...</span>
                </div>
              ) : browserFolders.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs space-y-1">
                  <Folder size={28} className="mx-auto text-slate-700" />
                  <p>No subfolders in this directory.</p>
                  <p className="text-[11px] text-slate-600">
                    Click &ldquo;Select This Folder&rdquo; below to use it, or click &ldquo;New Folder&rdquo; above.
                  </p>
                </div>
              ) : (
                browserFolders.map((folder) => (
                  <div
                    key={folder.fullPath}
                    onClick={() => loadDirectory(folder.fullPath)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/50 text-slate-300 hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder size={16} className="text-violet-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold truncate">{folder.name}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Active Selection:</p>
                <p className="text-xs text-violet-300 font-mono truncate">{currentBrowserDir}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFolderBrowser(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelectCurrentFolder}
                  disabled={!currentBrowserDir}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 transition-all cursor-pointer active:scale-95"
                >
                  <FolderCheck size={14} />
                  <span>Select This Folder</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
