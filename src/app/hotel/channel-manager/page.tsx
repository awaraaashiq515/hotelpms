'use client';
import React, { useState } from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  Link2,
  Wifi,
  WifiOff,
  Settings,
  ShieldCheck,
  TrendingUp,
  IndianRupee,
  Layers,
  CheckCircle2,
  AlertCircle,
  AlertOctagon,
  ArrowUpRight,
  Clock,
  Sliders,
  Sparkles,
  Zap,
  Play,
  Pause,
  ExternalLink,
  History,
  Building2,
} from 'lucide-react';
import { useChannelManager } from '@/hooks/hotel/useChannelManager';
import { ChannelConfigModal } from '@/components/hotel/channel/ChannelConfigModal';
import { ChannelMappingModal } from '@/components/hotel/channel/ChannelMappingModal';
import type { ChannelItem, ChannelStatus } from '@/types/hotel/channel.types';
import { toast } from 'sonner';

function fmt(n: number) {
  return '₹' + Math.round(n || 0).toLocaleString('en-IN');
}

function timeAgo(dateStr?: string | null) {
  if (!dateStr) return 'Never';
  const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function ChannelManagerPage() {
  const {
    summary,
    channels,
    roomTypes,
    parityMatrix,
    syncLogs,
    loading,
    syncingChannelId,
    refresh,
    syncChannel,
    updateChannel,
    connectChannel,
    disconnectChannel,
    saveRoomMapping,
    toggleStopSell,
  } = useChannelManager();

  const [activeTab, setActiveTab] = useState<'channels' | 'parity' | 'mapping' | 'logs'>('channels');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(null);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredChannels = channels.filter((c) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CONNECTED') return c.status === 'CONNECTED';
    if (statusFilter === 'PAUSED') return c.status === 'PAUSED';
    if (statusFilter === 'DISCONNECTED') return c.status === 'DISCONNECTED';
    return true;
  });

  const isGlobalSyncing = syncingChannelId === 'all';

  return (
    <div className="space-y-6 pb-12 max-w-[1500px] mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <Globe size={14} className="text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Distribution & 2-Way OTA Channel Manager
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Channel Manager
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {summary?.connectedChannels ?? 0} connected OTAs · {summary?.totalOtaBookings ?? 0} bookings · Real-time rate & inventory parity
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sync All Button */}
          <button
            onClick={() => syncChannel()}
            disabled={isGlobalSyncing}
            className={`flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 ${
              isGlobalSyncing ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            <RefreshCw size={13} className={isGlobalSyncing ? 'animate-spin text-blue-400' : ''} />
            <span>{isGlobalSyncing ? 'Syncing All OTAs…' : 'Sync All Channels'}</span>
          </button>

          {/* Add Channel Button */}
          <button
            onClick={() => {
              setSelectedChannel(null);
              setConfigModalOpen(true);
            }}
            className="flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus size={14} />
            <span>Connect Channel</span>
          </button>

          {/* Refresh Page */}
          <button
            onClick={refresh}
            title="Refresh Data"
            className={`w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all ${
              loading ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Connected Channels',
            value: `${summary?.connectedChannels ?? 0} / ${summary?.totalChannels ?? 9}`,
            subtext: `${summary?.pausedChannels ?? 0} paused · ${summary?.disconnectedChannels ?? 0} disconnected`,
            icon: Wifi,
            color: 'from-emerald-500/20 via-emerald-900/10 to-slate-900/40',
            border: 'border-emerald-500/20',
            accent: 'text-emerald-400',
          },
          {
            label: 'Total OTA Bookings',
            value: (summary?.totalOtaBookings ?? 0).toLocaleString(),
            subtext: 'Auto-imported into PMS',
            icon: Globe,
            color: 'from-blue-500/20 via-blue-900/10 to-slate-900/40',
            border: 'border-blue-500/20',
            accent: 'text-blue-400',
          },
          {
            label: 'Gross OTA Revenue',
            value: fmt(summary?.totalOtaRevenue ?? 0),
            subtext: `Net Yield: ${fmt(summary?.netOtaYield ?? 0)}`,
            icon: IndianRupee,
            color: 'from-indigo-500/20 via-indigo-900/10 to-slate-900/40',
            border: 'border-indigo-500/20',
            accent: 'text-indigo-400',
          },
          {
            label: 'Avg Rate & Parity Score',
            value: fmt(summary?.avgOtaRate ?? 6400),
            subtext: `Avg Commission: ${summary?.avgCommissionPct ?? 15}%`,
            icon: ShieldCheck,
            color: 'from-amber-500/20 via-amber-900/10 to-slate-900/40',
            border: 'border-amber-500/20',
            accent: 'text-amber-400',
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-3xl bg-gradient-to-br ${s.color} border ${s.border} p-4 backdrop-blur-md shadow-lg`}
          >
            <div className="flex items-center justify-between mb-2">
              <s.icon size={15} className={s.accent} />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Sync</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight">{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{s.label}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{s.subtext}</p>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center bg-slate-900/80 p-1 rounded-2xl border border-white/10">
          {[
            { id: 'channels' as const, label: 'OTA Channels', count: channels.length },
            { id: 'parity' as const, label: 'Rate & Inventory Parity', count: parityMatrix.length },
            { id: 'mapping' as const, label: 'Room Mappings', count: roomTypes.length },
            { id: 'logs' as const, label: '2-Way Sync Logs', count: syncLogs.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter Pills (when in channels tab) */}
        {activeTab === 'channels' && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <span>Filter:</span>
            {['ALL', 'CONNECTED', 'PAUSED', 'DISCONNECTED'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === f
                    ? 'bg-slate-800 text-white border border-white/10'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tab 1: Channels Grid ── */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredChannels.map((c) => {
            const isSyncing = syncingChannelId === c.id || isGlobalSyncing;
            const isConnected = c.status === 'CONNECTED';
            const isPaused = c.status === 'PAUSED';
            const isDisconnected = c.status === 'DISCONNECTED';

            const markupPct = Math.round((c.rateMultiplier - 1) * 100);

            return (
              <div
                key={c.id}
                className={`rounded-3xl border p-5 transition-all backdrop-blur-md shadow-xl flex flex-col justify-between ${
                  isConnected
                    ? 'bg-slate-900/60 border-white/10 hover:border-blue-500/40 hover:shadow-blue-500/5'
                    : isPaused
                    ? 'bg-amber-950/10 border-amber-500/20'
                    : 'bg-slate-900/30 border-white/5 opacity-60'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{c.logo}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white">{c.name}</h3>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isConnected
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isPaused
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isConnected ? 'bg-emerald-400 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-slate-500'
                              }`}
                            />
                            {c.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Provider: <span className="text-slate-300">{c.channelManagerProvider}</span> · Sync: {timeAgo(c.lastSyncAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isConnected && <Wifi size={14} className="text-emerald-400" />}
                      {isPaused && <Pause size={14} className="text-amber-400" />}
                      {isDisconnected && <WifiOff size={14} className="text-slate-600" />}
                    </div>
                  </div>

                  {/* Channel Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-800/40 border border-white/5 mb-4">
                    <div>
                      <p className="text-xs font-black text-white">
                        {c.roomMappings?.length || roomTypes.length || 5} Types
                      </p>
                      <p className="text-[8px] uppercase font-bold text-slate-500 mt-0.5">Mapped Rooms</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-400">
                        {markupPct > 0 ? `+${markupPct}%` : 'Parity'}
                      </p>
                      <p className="text-[8px] uppercase font-bold text-slate-500 mt-0.5">Markup Rate</p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{c.totalBookingsReceived || 0}</p>
                      <p className="text-[8px] uppercase font-bold text-slate-500 mt-0.5">Bookings</p>
                    </div>
                  </div>

                  {/* Revenue pill */}
                  <div className="flex items-center justify-between text-xs px-1 mb-4">
                    <span className="text-slate-400">Revenue Generated:</span>
                    <span className="font-black text-white">{fmt(c.totalRevenueGenerated || 0)}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Sync Button */}
                    <button
                      onClick={() => syncChannel(c.id)}
                      disabled={isSyncing || isDisconnected}
                      className="h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
                    >
                      <RefreshCw size={11} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
                      <span>{isSyncing ? 'Syncing…' : 'Sync Now'}</span>
                    </button>

                    {/* Room Mapping Button */}
                    <button
                      onClick={() => {
                        setSelectedChannel(c);
                        setMappingModalOpen(true);
                      }}
                      disabled={isDisconnected}
                      className="h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
                    >
                      <Layers size={11} />
                      <span>Room Map</span>
                    </button>
                  </div>

                  {/* Configure / Connect Button */}
                  <button
                    onClick={() => {
                      setSelectedChannel(c);
                      setConfigModalOpen(true);
                    }}
                    className={`w-full h-8 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                      isDisconnected
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Settings size={11} />
                    <span>{isDisconnected ? 'Connect & Authenticate' : 'Configure Channel'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab 2: Rate & Inventory Parity Matrix ── */}
      {activeTab === 'parity' && (
        <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden backdrop-blur-md shadow-xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-emerald-400" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Live Rate & Inventory Parity Matrix
                </h3>
                <p className="text-[10px] text-slate-400">
                  Compare PMS base rates against OTA channel prices and toggle instant stop-sells
                </p>
              </div>
            </div>
            <button
              onClick={() => syncChannel()}
              className="px-3.5 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black flex items-center gap-1 shadow-md"
            >
              <RefreshCw size={11} />
              <span>Push All Rates to OTAs</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    PMS Room Type
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    PMS Base Rate
                  </th>
                  {channels
                    .filter((c) => c.status !== 'DISCONNECTED')
                    .map((c) => (
                      <th
                        key={c.id}
                        className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{c.logo}</span>
                          <span>{c.name}</span>
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parityMatrix.map((row) => (
                  <tr key={row.roomTypeId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-black text-white">
                      {row.roomTypeName}
                      <span className="text-[10px] text-slate-500 block font-normal">
                        Total Inv: {row.totalInventory} rooms
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black text-emerald-400">
                      {fmt(row.baseRate)}
                    </td>

                    {channels
                      .filter((c) => c.status !== 'DISCONNECTED')
                      .map((c) => {
                        const col = row.channels.find((ch) => ch.channelCode === c.channelCode);
                        const channelRate = col?.rate || Math.round(row.baseRate * (c.rateMultiplier || 1.15));
                        const isStopSell = col?.stopSell || false;

                        return (
                          <td key={c.id} className="px-4 py-4">
                            {isStopSell ? (
                              <button
                                onClick={() => toggleStopSell(c.id, row.roomTypeId, false)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-rose-500/30"
                              >
                                <AlertOctagon size={11} />
                                <span>Stop-Sell</span>
                              </button>
                            ) : (
                              <div>
                                <span className="font-black text-white block">
                                  {fmt(channelRate)}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] text-emerald-400 font-bold">
                                    +{col?.markupPct ?? Math.round((c.rateMultiplier - 1) * 100)}%
                                  </span>
                                  <button
                                    onClick={() => toggleStopSell(c.id, row.roomTypeId, true)}
                                    title="Activate Stop-Sell for this room on this OTA"
                                    className="text-[8px] text-slate-500 hover:text-rose-400 uppercase font-bold"
                                  >
                                    [Stop Sell]
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 3: Room Mapping Engine ── */}
      {activeTab === 'mapping' && (
        <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden backdrop-blur-md shadow-xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers size={16} className="text-blue-400" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Room Mapping Engine
                </h3>
                <p className="text-[10px] text-slate-400">
                  Manage mapping between local PMS room types and OTA external inventory IDs
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels
              .filter((c) => c.status !== 'DISCONNECTED')
              .map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{c.logo}</span>
                        <h4 className="font-black text-white text-sm">{c.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {c.roomMappings?.length || roomTypes.length} Mappings
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {roomTypes.slice(0, 3).map((rt) => (
                        <div key={rt.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/50 border border-white/5">
                          <span className="text-slate-300 font-bold">{rt.name}</span>
                          <span className="text-emerald-400 font-mono text-[10px]">
                            {fmt(Math.round(rt.baseRate * (c.rateMultiplier || 1.15)))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedChannel(c);
                      setMappingModalOpen(true);
                    }}
                    className="w-full h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shadow-md"
                  >
                    <Sliders size={12} />
                    <span>Manage Room Mappings</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Tab 4: 2-Way Sync Logs ── */}
      {activeTab === 'logs' && (
        <div className="rounded-3xl bg-slate-900/60 border border-white/10 overflow-hidden backdrop-blur-md shadow-xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History size={16} className="text-indigo-400" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  2-Way Synchronization Audit Logs
                </h3>
                <p className="text-[10px] text-slate-400">
                  Real-time audit history of rates pushed, inventory allocations & OTA reservation imports
                </p>
              </div>
            </div>
            <button onClick={refresh} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">
              Refresh Logs
            </button>
          </div>

          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {syncLogs.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-xs">
                No sync logs recorded yet. Click &quot;Sync All Channels&quot; to trigger initial synchronization.
              </p>
            ) : (
              syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-800/40 border border-white/5 flex items-center justify-between gap-3 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-base">
                      {log.channelLogo || '⚡'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{log.channelName}</span>
                        <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-slate-800 text-slate-300">
                          {log.actionType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{log.message}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">
                      {log.status}
                    </span>
                    <span className="text-[9px] text-slate-500">{timeAgo(log.syncedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <ChannelConfigModal
        isOpen={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          setSelectedChannel(null);
        }}
        channel={selectedChannel}
        onSave={updateChannel}
        onConnect={connectChannel}
      />

      <ChannelMappingModal
        isOpen={mappingModalOpen}
        onClose={() => {
          setMappingModalOpen(false);
          setSelectedChannel(null);
        }}
        channel={selectedChannel}
        roomTypes={roomTypes}
        onSaveMapping={saveRoomMapping}
      />
    </div>
  );
}
