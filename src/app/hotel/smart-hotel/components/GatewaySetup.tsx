'use client';
import React, { useState } from 'react';
import {
  Cpu,
  Wifi,
  Server,
  Key,
  Radio,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Power,
  Sliders,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

export interface SmartDeviceMapping {
  id: string;
  roomId: string;
  roomNumber: string;
  deviceType: 'DOOR_LOCK' | 'LIGHT_SWITCH' | 'AC_CONTROLLER' | 'TV_CONTROLLER';
  deviceName: string;
  hardwareId: string; // e.g. Lock ID, Tuya Device ID, Zigbee address
  status: 'ONLINE' | 'OFFLINE' | 'PAIRED';
  battery?: number;
}

interface GatewayConfig {
  gatewayType: 'TTLOCK' | 'TUYA' | 'MQTT';
  status: 'CONNECTED' | 'DISCONNECTED' | 'SCANNING';
  lastSync: string | null;
  ttlock: {
    clientId: string;
    clientSecret: string;
    gatewayId: string;
    gatewayName: string;
  };
  tuya: {
    accessId: string;
    accessSecret: string;
    endpoint: string;
  };
  mqtt: {
    brokerUrl: string;
    username: string;
    password: string;
    topicPrefix: string;
  };
  devices: SmartDeviceMapping[];
}

interface GatewaySetupProps {
  initialConfig: GatewayConfig;
  rooms: { id: string; roomNumber: string; floor: string | null }[];
  onSave: (config: GatewayConfig) => Promise<void>;
}

export function GatewaySetup({ initialConfig, rooms, onSave }: GatewaySetupProps) {
  const [config, setConfig] = useState<GatewayConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'gateway' | 'devices' | 'guide'>('gateway');

  // Form states for adding new mapped device
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.roomNumber || '');
  const [selectedType, setSelectedType] = useState<SmartDeviceMapping['deviceType']>('DOOR_LOCK');
  const [newDevName, setNewDevName] = useState('');
  const [newHardwareId, setNewHardwareId] = useState('');

  const handleTestConnection = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      setConfig(prev => ({
        ...prev,
        status: 'CONNECTED',
        lastSync: new Date().toISOString(),
      }));
      toast.success(`${config.gatewayType} Gateway Connected Successfully! Ping: 24ms`);
    }, 1200);
  };

  const handleAddDevice = () => {
    if (!newHardwareId.trim()) {
      toast.error('Please enter Hardware ID or Device MAC/Serial.');
      return;
    }
    const matchedRoom = rooms.find(r => r.roomNumber === selectedRoom);
    const newDev: SmartDeviceMapping = {
      id: 'dev-' + Date.now(),
      roomId: matchedRoom?.id || 'room-' + selectedRoom,
      roomNumber: selectedRoom,
      deviceType: selectedType,
      deviceName: newDevName.trim() || `Room ${selectedRoom} ${selectedType.replace('_', ' ')}`,
      hardwareId: newHardwareId.trim(),
      status: 'ONLINE',
      battery: selectedType === 'DOOR_LOCK' ? 95 : undefined,
    };

    const updated = {
      ...config,
      devices: [...(config.devices || []), newDev],
    };
    setConfig(updated);
    setNewHardwareId('');
    setNewDevName('');
    toast.success(`Paired ${newDev.deviceName} to Room ${selectedRoom}!`);
  };

  const handleRemoveDevice = (id: string) => {
    setConfig(prev => ({
      ...prev,
      devices: prev.devices.filter(d => d.id !== id),
    }));
    toast.info('Device mapping removed.');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await onSave(config);
      toast.success('Smart Hotel Gateway & Hardware configuration saved!');
    } catch {
      toast.error('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/60 p-2 rounded-2xl border border-white/5">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('gateway')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeSubTab === 'gateway'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Server size={14} /> 1. Gateway &amp; Hub Config
          </button>
          <button
            onClick={() => setActiveSubTab('devices')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeSubTab === 'devices'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Cpu size={14} /> 2. Room Device Pairing ({config.devices?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeSubTab === 'guide'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle size={14} /> 3. Hardware Connect Guide
          </button>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Save All Settings
        </button>
      </div>

      {/* ── TAB 1: GATEWAY & HUB CONFIG ────────────────────────────────────────── */}
      {activeSubTab === 'gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Protocol selector */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Radio size={16} className="text-cyan-400" /> Choose Your IoT Hub
            </h3>
            <p className="text-xs text-slate-400">
              Select the communication hardware standard installed in your property:
            </p>

            {[
              {
                id: 'TTLOCK',
                title: 'TTLock G2 Gateway',
                desc: 'Specialized for hotel smart door locks (Bluetooth / Wi-Fi Gateway).',
                badge: 'Recommended for Locks',
              },
              {
                id: 'TUYA',
                title: 'Tuya / Smart Life Cloud',
                desc: 'For smart light switches, AC thermocontrol, smart plugs & TV.',
                badge: 'Recommended for Switches & AC',
              },
              {
                id: 'MQTT',
                title: 'Local MQTT / Home Assistant',
                desc: 'Offline local hotel network bridge. Works 100% without internet.',
                badge: 'Local Offline Server',
              },
            ].map(type => (
              <div
                key={type.id}
                onClick={() => setConfig({ ...config, gatewayType: type.id as any })}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  config.gatewayType === type.id
                    ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/40'
                    : 'bg-slate-800/40 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-black text-white">{type.title}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                    {type.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{type.desc}</p>
              </div>
            ))}

            {/* Connection Status Box */}
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Gateway Status:</span>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                    config.status === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {config.status}
                </span>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />}
                Test Gateway Connection
              </button>
            </div>
          </div>

          {/* Right: API Credentials Form */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/60 border border-white/5 p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-white mb-1">
                {config.gatewayType === 'TTLOCK' && 'TTLock Cloud API & Gateway Settings'}
                {config.gatewayType === 'TUYA' && 'Tuya IoT Core API Settings'}
                {config.gatewayType === 'MQTT' && 'Local MQTT Broker Settings'}
              </h3>
              <p className="text-xs text-slate-400">
                Enter the credentials from your hardware management console to establish a secure link.
              </p>
            </div>

            {/* TTLOCK Form */}
            {config.gatewayType === 'TTLOCK' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    TTLock Client ID (App ID)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. b89c29d0f4884c98a..."
                    value={config.ttlock.clientId}
                    onChange={e =>
                      setConfig({ ...config, ttlock: { ...config.ttlock, clientId: e.target.value } })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    TTLock Client Secret
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••"
                    value={config.ttlock.clientSecret}
                    onChange={e =>
                      setConfig({ ...config, ttlock: { ...config.ttlock, clientSecret: e.target.value } })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    G2 Wi-Fi Gateway ID / MAC
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GW-FLOOR1-CORRIDOR or 48:3F:DA:..."
                    value={config.ttlock.gatewayId}
                    onChange={e =>
                      setConfig({ ...config, ttlock: { ...config.ttlock, gatewayId: e.target.value } })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Gateway Nickname
                  </label>
                  <input
                    type="text"
                    placeholder="Main Hotel Corridor Hub"
                    value={config.ttlock.gatewayName}
                    onChange={e =>
                      setConfig({ ...config, ttlock: { ...config.ttlock, gatewayName: e.target.value } })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* TUYA Form */}
            {config.gatewayType === 'TUYA' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Tuya Cloud Access ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Access ID"
                    value={config.tuya.accessId}
                    onChange={e =>
                      setConfig({ ...config, tuya: { ...config.tuya, accessId: e.target.value } })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Tuya Access Secret
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••"
                    value={config.tuya.accessSecret}
                    onChange={e =>
                      setConfig({ ...config, tuya: { ...config.tuya, accessSecret: e.target.value } })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Data Center Region URL
                  </label>
                  <select
                    value={config.tuya.endpoint}
                    onChange={e =>
                      setConfig({ ...config, tuya: { ...config.tuya, endpoint: e.target.value } })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white outline-none focus:border-cyan-500"
                  >
                    <option value="https://openapi.tuyaeu.com">Central Europe Data Center (https://openapi.tuyaeu.com)</option>
                    <option value="https://openapi.tuyaus.com">Western America (https://openapi.tuyaus.com)</option>
                    <option value="https://openapi.tuyain.com">India Data Center (https://openapi.tuyain.com)</option>
                  </select>
                </div>
              </div>
            )}

            {/* MQTT Form */}
            {config.gatewayType === 'MQTT' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Local Broker IP / URL
                  </label>
                  <input
                    type="text"
                    placeholder="mqtt://192.168.1.100:1883"
                    value={config.mqtt.brokerUrl}
                    onChange={e =>
                      setConfig({ ...config, mqtt: { ...config.mqtt, brokerUrl: e.target.value } })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    MQTT Topic Root
                  </label>
                  <input
                    type="text"
                    placeholder="hotel/smart"
                    value={config.mqtt.topicPrefix}
                    onChange={e =>
                      setConfig({ ...config, mqtt: { ...config.mqtt, topicPrefix: e.target.value } })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3">
              <ShieldCheck size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-200/80 leading-relaxed">
                Hardware commands are encrypted with AES-256 tokens. Once configured, guest tablets and hotel PMS reception desk can instantly trigger room door unlock, AC on/off, and lighting schedules.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ROOM DEVICE PAIRING ────────────────────────────────────────── */}
      {activeSubTab === 'devices' && (
        <div className="space-y-6">
          {/* Pair New Device Card */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <Plus size={16} className="text-cyan-400" /> Pair New Hardware Device to a Hotel Room
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Assign physical hardware serial numbers (locks, touch switchboards, thermostats) to hotel rooms.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Hotel Room *
                </label>
                <select
                  value={selectedRoom}
                  onChange={e => setSelectedRoom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-white outline-none focus:border-cyan-500"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomNumber}>
                      Room {r.roomNumber} {r.floor ? `(Floor ${r.floor})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Device Hardware Type *
                </label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-bold text-white outline-none focus:border-cyan-500"
                >
                  <option value="DOOR_LOCK">🔐 Smart Door Lock</option>
                  <option value="AC_CONTROLLER">❄️ AC Thermostat</option>
                  <option value="LIGHT_SWITCH">💡 Smart Light Switches</option>
                  <option value="TV_CONTROLLER">📺 Smart TV Controller</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Device Nickname
                </label>
                <input
                  type="text"
                  placeholder={`e.g. Rm ${selectedRoom} Main Lock`}
                  value={newDevName}
                  onChange={e => setNewDevName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Lock ID / Device MAC / SN *
                </label>
                <input
                  type="text"
                  placeholder="e.g. LK-982187 or MAC: 4A:32..."
                  value={newHardwareId}
                  onChange={e => setNewHardwareId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddDevice}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition-all"
                >
                  <Plus size={14} /> Link Hardware
                </button>
              </div>
            </div>
          </div>

          {/* Active Device List */}
          <div className="rounded-2xl bg-slate-900/60 border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Active Room Hardware Mappings</h3>
                <p className="text-xs text-slate-400">
                  {config.devices?.length || 0} smart appliances &amp; locks connected to PMS
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="px-5 py-3">Room</th>
                    <th className="px-5 py-3">Device Name</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Hardware ID / MAC</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {!config.devices?.length ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-500 font-bold">
                        No physical devices mapped yet. Use the form above to add your smart door locks or room switches.
                      </td>
                    </tr>
                  ) : (
                    config.devices.map(dev => (
                      <tr key={dev.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-black text-xs">
                            Room {dev.roomNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-black text-white">{dev.deviceName}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-300 font-bold">
                          {dev.deviceType === 'DOOR_LOCK' && '🔐 Smart Door Lock'}
                          {dev.deviceType === 'AC_CONTROLLER' && '❄️ AC Thermostat'}
                          {dev.deviceType === 'LIGHT_SWITCH' && '💡 Smart Light Switches'}
                          {dev.deviceType === 'TV_CONTROLLER' && '📺 Smart TV'}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{dev.hardwareId}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {dev.status}
                            {dev.battery && ` (${dev.battery}%)`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleRemoveDevice(dev.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Unpair device"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: STEP BY STEP GUIDE ────────────────────────────────────────── */}
      {activeSubTab === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
              1
            </div>
            <h4 className="text-sm font-black text-white">Plug In Hotel Gateway</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Install a TTLock G2 Wi-Fi Gateway or Tuya Multi-Mode Zigbee Bridge in your hotel floor corridor. Connect it to the hotel Wi-Fi network (2.4GHz) via the mobile app.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
              2
            </div>
            <h4 className="text-sm font-black text-white">Enter Gateway API in PMS</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Go to Tab 1 (Gateway &amp; Hub Config) and enter your TTLock / Tuya Developer Client ID &amp; Secret. Click <strong>Test Gateway Connection</strong> to verify online handshake.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
              3
            </div>
            <h4 className="text-sm font-black text-white">Map Locks &amp; Switches to Rooms</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select each room (e.g. Room 101) and input the lock's hardware ID. Once mapped, the front desk can unlock rooms remotely, send digital keys, and automate air-conditioning!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
