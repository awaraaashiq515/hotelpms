'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Loader2, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Map,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string;
  clockIn: string;
  clockOut: string | null;
  status: string;
  note: string | null;
  locationIn: string | null;
  locationOut: string | null;
  employeeName: string;
  employeeRole: string;
  isOutOfRangeIn?: boolean;
  isOutOfRangeOut?: boolean;
}

interface StaffAttendancePanelProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    propertyId: string | null;
    property?: {
      name: string;
    } | null;
  };
  wtToken: string;
}

const addressCache: { [coords: string]: string } = {};

const ResolvedAddress = ({ coordinates, isOutOfRange, defaultLabel }: { coordinates: string | null; isOutOfRange: boolean; defaultLabel: string }) => {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coordinates) return;
    
    if (!isOutOfRange) {
      setAddress('Inside Restaurant');
      return;
    }

    if (addressCache[coordinates]) {
      setAddress(addressCache[coordinates]);
      return;
    }

    const fetchAddress = async () => {
      setLoading(true);
      try {
        const [lat, lng] = coordinates.split(',');
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.trim()}&lon=${lng.trim()}&zoom=16`);
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          const clean = parts.slice(0, 3).join(',').trim();
          addressCache[coordinates] = clean;
          setAddress(clean);
        } else {
          setAddress(coordinates);
        }
      } catch (err) {
        console.error(err);
        setAddress(coordinates);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [coordinates, isOutOfRange, defaultLabel]);

  if (loading) {
    return <span style={{ fontSize: 9, color: '#64748b', fontStyle: 'italic' }}>Resolving location...</span>;
  }

  return <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{address || coordinates}</span>;
};

export default function StaffAttendancePanel({ user, wtToken }: StaffAttendancePanelProps) {
  const propertyName = user.property?.name || 'Restaurant';
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'seeking' | 'success' | 'denied' | 'error'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  // Live shift duration
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  // Current time for the big digital clock
  const [currentTime, setCurrentTime] = useState('');

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const clockId = setInterval(updateTime, 1000);
    return () => clearInterval(clockId);
  }, []);

  // Fetch initial status & history
  useEffect(() => {
    if (user?.id) {
      fetchStatus();
      fetchHistory();
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [user?.id]);

  // Handle active shift timer
  useEffect(() => {
    if (activeSession) {
      const start = new Date(activeSession.clockIn).getTime();
      const updateTimer = () => {
        const diff = Math.max(0, Date.now() - start);
        const secs = Math.floor(diff / 1000) % 60;
        const mins = Math.floor(diff / (1000 * 60)) % 60;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        const pad = (num: number) => String(num).padStart(2, '0');
        setElapsedTime(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
      };
      
      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime('00:00:00');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [activeSession]);

  const fetchStatus = async () => {
    setFetchingStatus(true);
    try {
      const res = await fetch(`/api/staff/attendance/status?userId=${user.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setActiveSession(data.data);
      } else {
        setActiveSession(null);
      }
    } catch (error) {
      console.error('Failed to fetch attendance status');
    } finally {
      setFetchingStatus(false);
    }
  };

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const res = await fetch(`/api/staff/attendance/report?userId=${user.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance history');
    } finally {
      setFetchingHistory(false);
    }
  };

  const getCoordinates = (): Promise<string> => {
    setGpsStatus('seeking');
    setGpsError(null);
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setGpsStatus('error');
        setGpsError('Geolocation is not supported by your browser.');
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsStatus('success');
          resolve(`${position.coords.latitude},${position.coords.longitude}`);
        },
        (error) => {
          console.error('[GPS Error]', error);
          let errMsg = 'Unable to retrieve your location.';
          if (error.code === error.PERMISSION_DENIED) {
            setGpsStatus('denied');
            errMsg = 'Location permission was denied. Please enable location services in your browser settings to mark attendance.';
          } else {
            setGpsStatus('error');
          }
          setGpsError(errMsg);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleClockInOut = async (action: 'clock-in' | 'clock-out') => {
    setLoading(true);
    try {
      // 1. Get GPS coordinates
      let coords = '';
      try {
        coords = await getCoordinates();
      } catch (gpsErr: any) {
        toast.error(
          gpsErr.code === 1 
            ? 'GPS Access Denied! Please allow location access to punch attendance.'
            : 'GPS Timeout! Make sure you have a clear GPS signal and try again.'
        );
        setLoading(false);
        return;
      }

      // 2. Make API Request
      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(wtToken ? { 'Authorization': `Bearer ${wtToken}` } : {})
        },
        body: JSON.stringify({
          action,
          userId: user.id,
          location: coords,
          note: `Clocked ${action === 'clock-in' ? 'in' : 'out'} via Staff Portal`
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Clocked ${action === 'clock-in' ? 'in' : 'out'} successfully!`);
        if (action === 'clock-in') {
          setActiveSession(data.data);
        } else {
          setActiveSession(null);
        }
        // Refresh logs
        fetchHistory();
      } else {
        toast.error(data.error || 'Attendance punch failed.');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (inTime: string, outTime: string | null) => {
    if (!outTime) return 'Active';
    const diff = new Date(outTime).getTime() - new Date(inTime).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const getDayName = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getTimeOnly = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* ── CURRENT STATUS & CLOCK PANEL ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        padding: '20px',
        marginBottom: 16,
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }}>
        
        {/* Pulsing Status Orb */}
        <div style={{
          position: 'absolute',
          top: 15,
          right: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: activeSession ? 'rgba(52, 211, 153, 0.1)' : 'rgba(100, 116, 139, 0.1)',
          border: `1px solid ${activeSession ? 'rgba(52, 211, 153, 0.2)' : 'rgba(100, 116, 139, 0.2)'}`,
          padding: '4px 10px',
          borderRadius: 20
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: activeSession ? '#34d399' : '#64748b',
            animation: activeSession ? 'pulse 1.5s infinite' : 'none',
            display: 'inline-block'
          }} />
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            color: activeSession ? '#34d399' : '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            {activeSession ? 'Active' : 'Off Duty'}
          </span>
        </div>

        {/* Digital Clock */}
        <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: 2, margin: '10px 0 2px 0', fontFamily: 'monospace' }}>
          {currentTime || '00:00:00'}
        </div>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        {/* Shift Duration Display if active */}
        {activeSession ? (
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 14,
            padding: '12px',
            maxWidth: 240,
            margin: '0 auto 18px auto'
          }}>
            <div style={{ fontSize: 9, color: '#818cf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Current Shift Duration</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#a5b4fc', fontFamily: 'monospace' }}>{elapsedTime}</div>
            <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>
              Punch In: {getTimeOnly(activeSession.clockIn)}
            </div>
          </div>
        ) : (
          <div style={{ height: 20, marginBottom: 10 }} />
        )}

        {/* Main Punch Button */}
        {fetchingStatus ? (
          <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (
          <button
            onClick={() => handleClockInOut(activeSession ? 'clock-out' : 'clock-in')}
            disabled={loading}
            style={{
              width: '100%',
              maxWidth: 260,
              background: activeSession 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: 16,
              padding: '16px',
              fontSize: 13,
              fontWeight: 900,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: activeSession 
                ? '0 4px 15px rgba(239, 68, 68, 0.3)' 
                : '0 4px 15px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s',
              outline: 'none'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Verifying GPS...</span>
              </>
            ) : activeSession ? (
              <>
                <LogOut size={18} />
                <span>Clock Out (Punch Out)</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Clock In (Punch In)</span>
              </>
            )}
          </button>
        )}

        {/* Location Status Display */}
        <div style={{ 
          marginTop: 14, 
          fontSize: 10, 
          color: gpsStatus === 'denied' ? '#f87171' : '#64748b', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 6,
          padding: '0 10px'
        }}>
          {gpsStatus === 'seeking' && (
            <>
              <Loader2 className="animate-spin text-amber-500" size={12} />
              <span>Fetching secure GPS coordinates...</span>
            </>
          )}
          {gpsStatus === 'success' && (
            <>
              <CheckCircle2 className="text-emerald-500" size={12} />
              <span className="text-emerald-400">GPS location captured successfully</span>
            </>
          )}
          {gpsStatus === 'denied' && (
            <>
              <AlertCircle className="text-red-400" size={12} />
              <span style={{ fontSize: 9 }}>Permission Denied! Enable location services.</span>
            </>
          )}
          {gpsStatus === 'error' && (
            <>
              <AlertCircle className="text-amber-500" size={12} />
              <span>GPS signal weak. Tap button to retry.</span>
            </>
          )}
          {gpsStatus === 'idle' && (
            <>
              <MapPin className="text-indigo-400" size={12} />
              <span>Attendance requires GPS authorization</span>
            </>
          )}
        </div>
        {gpsError && gpsStatus === 'denied' && (
          <div style={{ marginTop: 6, fontSize: 9, color: '#ef4444', lineHeight: 1.3, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8, padding: '8px' }}>
            {gpsError}
          </div>
        )}
      </div>

      {/* ── PAST PUNCHES HISTORY LIST ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        
        {/* Section Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 10,
          padding: '0 4px'
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={12} className="text-indigo-400" />
            <span>Attendance History (Recent)</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#475569', background: 'rgba(255, 255, 255, 0.03)', padding: '2px 8px', borderRadius: 20 }}>
            {history.length} shifts logged
          </div>
        </div>

        {/* Scrollable List */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          background: 'rgba(255,255,255,0.01)', 
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: 16,
          padding: '12px'
        }}>
          {fetchingHistory ? (
            <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 className="animate-spin text-slate-500" size={24} />
              <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Loading logs...</span>
            </div>
          ) : history.length === 0 ? (
            <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#475569' }}>
              <span style={{ fontSize: 24 }}>📅</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>No attendance logged yet</span>
              <span style={{ fontSize: 9, color: '#334155' }}>Your clocked shifts will be listed here.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((record) => (
                <div 
                  key={record.id} 
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1.5px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    transition: 'all 0.15s'
                  }}
                >
                  {/* Top Line: Date & Duration */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9' }}>
                      {getDayName(record.clockIn)}
                    </span>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 800, 
                      color: record.clockOut ? '#34d399' : '#a5b4fc',
                      background: record.clockOut ? 'rgba(52, 211, 153, 0.08)' : 'rgba(165, 180, 252, 0.08)',
                      padding: '2px 8px',
                      borderRadius: 20
                    }}>
                      {record.clockOut ? formatDuration(record.clockIn, record.clockOut) : 'Ongoing'}
                    </span>
                  </div>

                  {/* Middle Line: Times */}
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b' }}>
                    <div>
                      <span style={{ color: '#475569', fontWeight: 600, marginRight: 4 }}>In:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{getTimeOnly(record.clockIn)}</span>
                    </div>
                    {record.clockOut && (
                      <div>
                        <span style={{ color: '#475569', fontWeight: 600, marginRight: 4 }}>Out:</span>
                        <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{getTimeOnly(record.clockOut)}</span>
                      </div>
                    )}
                  </div>

                  {/* Geolocation visual details */}
                  {(record.locationIn || record.locationOut) && (
                    <div style={{ 
                      borderTop: '1px solid rgba(255,255,255,0.04)', 
                      paddingTop: 8, 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 6,
                      marginTop: 4
                    }}>
                      {record.locationIn && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                          <span style={{ color: '#475569', fontWeight: 600 }}>In Location:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#e2e8f0', fontWeight: 700 }}>
                              <ResolvedAddress 
                                coordinates={record.locationIn} 
                                isOutOfRange={!!record.isOutOfRangeIn} 
                                defaultLabel={propertyName} 
                              />
                            </span>
                            <a 
                              href={`https://www.google.com/maps?q=${record.locationIn}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                            >
                              <MapPin size={10} />
                            </a>
                          </div>
                        </div>
                      )}
                      {record.locationOut && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Out Location:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#e2e8f0', fontWeight: 700 }}>
                              <ResolvedAddress 
                                coordinates={record.locationOut} 
                                isOutOfRange={!!record.isOutOfRangeOut} 
                                defaultLabel={propertyName} 
                              />
                            </span>
                            <a 
                              href={`https://www.google.com/maps?q=${record.locationOut}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                            >
                              <MapPin size={10} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* CSS Keyframes for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
