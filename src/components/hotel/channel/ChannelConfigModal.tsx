'use client';
import React, { useState } from 'react';
import { X, Globe, Settings, ShieldCheck, Zap, KeyRound, Percent, DollarSign, Wifi } from 'lucide-react';
import type { ChannelItem, ChannelProvider, ChannelStatus } from '@/types/hotel/channel.types';

interface ChannelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChannelItem | null;
  onSave: (data: Partial<ChannelItem> & { id: string }) => Promise<boolean>;
  onConnect?: (data: Partial<ChannelItem>) => Promise<boolean>;
}

export function ChannelConfigModal({
  isOpen,
  onClose,
  channel,
  onSave,
  onConnect,
}: ChannelConfigModalProps) {
  if (!isOpen) return null;

  return (
    <ChannelConfigForm
      key={channel?.id || 'new'}
      channel={channel}
      onClose={onClose}
      onSave={onSave}
      onConnect={onConnect}
    />
  );
}

interface ChannelConfigFormProps {
  channel: ChannelItem | null;
  onClose: () => void;
  onSave: (data: Partial<ChannelItem> & { id: string }) => Promise<boolean>;
  onConnect?: (data: Partial<ChannelItem>) => Promise<boolean>;
}

function ChannelConfigForm({
  channel,
  onClose,
  onSave,
  onConnect,
}: ChannelConfigFormProps) {
  const [name, setName] = useState(channel?.name || '');
  const [channelCode, setChannelCode] = useState(channel?.channelCode || '');
  const [logo, setLogo] = useState(channel?.logo || '🏨');
  const [hotelIdOnChannel, setHotelIdOnChannel] = useState(channel?.hotelIdOnChannel || '');
  const [apiKey, setApiKey] = useState(channel?.apiKey || '');
  const [apiSecret, setApiSecret] = useState(channel?.apiSecret || '');
  const [channelManagerProvider, setChannelManagerProvider] = useState<ChannelProvider>(
    channel?.channelManagerProvider || 'DIRECT_API'
  );
  const [commissionPct, setCommissionPct] = useState<number>(channel?.commissionPct ?? 15);
  const [rateMultiplier, setRateMultiplier] = useState<number>(channel?.rateMultiplier ?? 1.15);
  const [autoSyncRates, setAutoSyncRates] = useState<boolean>(channel?.autoSyncRates ?? true);
  const [autoSyncInventory, setAutoSyncInventory] = useState<boolean>(channel?.autoSyncInventory ?? true);
  const [autoImportBookings, setAutoImportBookings] = useState<boolean>(channel?.autoImportBookings ?? true);
  const [status, setStatus] = useState<ChannelStatus>(channel?.status || 'CONNECTED');
  const [saving, setSaving] = useState(false);

  const markupPct = Math.round((rateMultiplier - 1) * 100);

  const handleMarkupChange = (pct: number) => {
    setRateMultiplier(Number((1 + pct / 100).toFixed(3)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const payload: Partial<ChannelItem> & { id?: string } = {
      name: name.trim(),
      channelCode: channelCode || name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      logo,
      hotelIdOnChannel: hotelIdOnChannel.trim() || null,
      apiKey: apiKey.trim() || null,
      apiSecret: apiSecret.trim() || null,
      channelManagerProvider,
      commissionPct: Number(commissionPct),
      rateMultiplier: Number(rateMultiplier),
      autoSyncRates,
      autoSyncInventory,
      autoImportBookings,
      status,
    };

    let success = false;
    if (channel?.id) {
      payload.id = channel.id;
      success = await onSave(payload as Partial<ChannelItem> & { id: string });
    } else if (onConnect) {
      success = await onConnect(payload);
    }

    setSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl">
              {logo}
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {channel ? `Configure ${channel.name}` : 'Connect New OTA Channel'}
              </h2>
              <p className="text-xs text-slate-400">
                2-way live rate parity, inventory synchronization & credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-5 text-xs">
          {/* Channel Name & Logo */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                Channel Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Booking.com, Expedia, Agoda"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-800/70 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                Icon
              </label>
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="w-full h-10 px-3 text-center rounded-xl bg-slate-800/70 border border-white/10 text-white text-base focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Provider & Hotel ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                Channel Manager Engine
              </label>
              <select
                value={channelManagerProvider}
                onChange={(e) => setChannelManagerProvider(e.target.value as ChannelProvider)}
                className="w-full h-10 px-3 rounded-xl bg-slate-800/70 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="DIRECT_API">Direct OTA API</option>
                <option value="SITEMINDER">SiteMinder Integration</option>
                <option value="STAAH">STAAH Max</option>
                <option value="RATEGAIN">RateGain DHISCO</option>
                <option value="CLOUDBEDS">CloudBeds Channel Manager</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                Hotel ID on OTA
              </label>
              <input
                type="text"
                value={hotelIdOnChannel}
                onChange={(e) => setHotelIdOnChannel(e.target.value)}
                placeholder="e.g. 1049281"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-800/70 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* API Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                API Key / Client ID
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-800/70 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
                API Secret Token
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-800/70 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Pricing & Commission Yield Controls */}
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                Rate Markup & OTA Commission
              </span>
              <span className="text-[9px] text-slate-400">Protects hotel profit margins</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-1 block">
                  OTA Commission (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 pr-7 rounded-xl bg-slate-900 border border-white/10 text-white font-bold"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-1 block">
                  Rate Markup (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={markupPct}
                    onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 pr-7 rounded-xl bg-slate-900 border border-white/10 text-emerald-400 font-bold"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-400">
              💡 Example: If base room is <strong className="text-white">₹5,000</strong>, it will list on {name || 'this OTA'} at <strong className="text-emerald-300">₹{Math.round(5000 * (1 + markupPct / 100)).toLocaleString()}</strong> (+{markupPct}% markup).
            </p>
          </div>

          {/* Automated 2-Way Sync Options */}
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Automated 2-Way Sync Options
            </p>

            <div className="space-y-1.5">
              {[
                {
                  label: 'Auto-Sync Real-Time Rates',
                  desc: 'Pushes PMS rate changes and dynamic pricing adjustments to this OTA',
                  checked: autoSyncRates,
                  toggle: () => setAutoSyncRates(!autoSyncRates),
                },
                {
                  label: 'Auto-Sync Live Inventory',
                  desc: 'Updates available room count and blocks sold rooms automatically',
                  checked: autoSyncInventory,
                  toggle: () => setAutoSyncInventory(!autoSyncInventory),
                },
                {
                  label: 'Auto-Import OTA Bookings',
                  desc: 'Automatically creates reservations in PMS when booked on OTA',
                  checked: autoImportBookings,
                  toggle: () => setAutoImportBookings(!autoImportBookings),
                },
              ].map((opt, idx) => (
                <div
                  key={idx}
                  onClick={opt.toggle}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-white/5 cursor-pointer hover:bg-slate-800/70 transition-colors"
                >
                  <div>
                    <p className="font-bold text-white text-xs">{opt.label}</p>
                    <p className="text-[9px] text-slate-400">{opt.desc}</p>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                      opt.checked ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">
              Connection Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { s: 'CONNECTED', label: 'Connected' },
                { s: 'PAUSED', label: 'Paused' },
                { s: 'DISCONNECTED', label: 'Disconnected' },
              ].map((item) => (
                <button
                  key={item.s}
                  type="button"
                  onClick={() => setStatus(item.s as ChannelStatus)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    status === item.s
                      ? item.s === 'CONNECTED'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : item.s === 'PAUSED'
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : channel ? 'Save Configuration' : 'Connect Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
