'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface KioskWrapperProps {
  children: React.ReactNode;
  sessionTimeoutMin?: number;
  onTimeout?: () => void;
  exitPin?: string;
  kioskLocked?: boolean;
}

export default function KioskWrapper({
  children,
  sessionTimeoutMin = 30,
  onTimeout,
  exitPin = '1234',
  kioskLocked = false,
}: KioskWrapperProps) {
  const router = useRouter();
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [logoHoldTimer, setLogoHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdInterval = useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- Fullscreen Management ---
  const requestFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    const req = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).mozRequestFullScreen || (el as any).msRequestFullscreen;
    if (req) {
      req
        .call(el)
        .then(() => {
          setIsFullscreen(true);
          // Lock Escape key in Chromium/Chrome Kiosk tablets
          if (typeof navigator !== 'undefined' && 'keyboard' in navigator && (navigator as any).keyboard?.lock) {
            (navigator as any).keyboard.lock(['Escape']).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    const isFull = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    if (!isFull) {
      setIsFullscreen(false);
      return;
    }
    // Release keyboard lock if held
    if (typeof navigator !== 'undefined' && 'keyboard' in navigator && (navigator as any).keyboard?.unlock) {
      try { (navigator as any).keyboard.unlock(); } catch {}
    }
    const exit =
      document.exitFullscreen ||
      (document as any).webkitExitFullscreen ||
      (document as any).mozCancelFullScreen ||
      (document as any).msExitFullscreen;
    if (exit) {
      try {
        exit.call(document)
          .then(() => setIsFullscreen(false))
          .catch(() => setIsFullscreen(false));
      } catch {
        setIsFullscreen(false);
      }
    } else {
      setIsFullscreen(false);
    }
  }, []);

  // --- Prevent fullscreen exit ---
  const handleFullscreenChange = useCallback(() => {
    if (typeof document === 'undefined') return;
    const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    setIsFullscreen(isFull);
  }, []);

  // --- Inactivity Reset ---
  const resetInactivity = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    const timeoutMs = sessionTimeoutMin * 60 * 1000;
    inactivityTimer.current = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      } else {
        const token = localStorage.getItem('room_portal_token');
        if (token) {
          fetch('/api/room-portal/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        localStorage.removeItem('room_portal_token');
        router.replace('/room-portal');
      }
    }, timeoutMs);
  }, [sessionTimeoutMin, onTimeout, router]);

  // --- Block back navigation (only when locked) ---
  const handlePopState = useCallback((e: PopStateEvent) => {
    if (!kioskLocked) return;
    e.preventDefault();
    window.history.pushState(null, '', window.location.href);
  }, [kioskLocked]);

  // --- Block keyboard shortcuts (including Escape) (only when locked) ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!kioskLocked) return;
    const isEscape = e.key === 'Escape' || e.code === 'Escape' || e.keyCode === 27;
    const blocked = [
      isEscape,
      e.altKey && e.key === 'F4',
      e.ctrlKey && (e.key === 'w' || e.key === 'W'),
      e.key === 'F5',
      e.ctrlKey && (e.key === 'r' || e.key === 'R'),
      e.key === 'F11',
    ];
    if (blocked.some(Boolean)) {
      e.preventDefault();
      e.stopPropagation();
      if (isEscape) {
        requestFullscreen();
      }
    }
  }, [requestFullscreen, kioskLocked]);

  // --- Block right click (only when locked) ---
  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (!kioskLocked) return;
    e.preventDefault();
  }, [kioskLocked]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    }

    // When kioskLocked is true (Guest Kiosk Mode):
    // Lock the tablet to ONLY this app! Other apps cannot be opened.
    if (kioskLocked) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

      // Keep tablet screen awake (Screen Wake Lock API)
      let wakeLock: any = null;
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        (navigator as any).wakeLock.request('screen').then((wl: any) => {
          wakeLock = wl;
        }).catch(() => {});
      }

      // Auto-enter fullscreen on user touch or click
      const autoRestoreOnTouch = () => {
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
          requestFullscreen();
        }
      };
      window.addEventListener('click', autoRestoreOnTouch, { capture: true });
      window.addEventListener('touchstart', autoRestoreOnTouch, { capture: true });

      // Immediate attempt on mount
      requestFullscreen();

      return () => {
        window.removeEventListener('popstate', handlePopState);
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        window.removeEventListener('click', autoRestoreOnTouch, { capture: true });
        window.removeEventListener('touchstart', autoRestoreOnTouch, { capture: true });
        if (wakeLock) wakeLock.release().catch(() => {});
      };
    } else {
      // Unlocked by staff: allow staff to exit fullscreen and access tablet OS/apps
      exitFullscreen();
    }
  }, [kioskLocked, requestFullscreen, exitFullscreen, handleFullscreenChange, handlePopState, handleKeyDown, handleContextMenu]);

  useEffect(() => {
    // Inactivity timer across all modes
    const activityEvents = ['mousedown', 'touchstart', 'keydown', 'mousemove', 'scroll'];
    activityEvents.forEach((ev) => document.addEventListener(ev, resetInactivity));
    resetInactivity();

    return () => {
      activityEvents.forEach((ev) => document.removeEventListener(ev, resetInactivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivity]);

  // Logo hold to show exit modal (hold for 5 seconds)
  const startLogoHold = () => {
    setHoldProgress(0);
    const startTime = Date.now();
    holdInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 5000) * 100, 100);
      setHoldProgress(progress);
      if (progress >= 100) {
        if (holdInterval.current) clearInterval(holdInterval.current);
        setShowExitModal(true);
        setHoldProgress(0);
      }
    }, 50);
  };

  const stopLogoHold = () => {
    if (holdInterval.current) clearInterval(holdInterval.current);
    setHoldProgress(0);
  };

  const handlePinSubmit = () => {
    if (pinInput === exitPin) {
      setShowExitModal(false);
      setPinInput('');
      setPinError(false);
      // Exit fullscreen
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      // Logout
      const token = localStorage.getItem('room_portal_token');
      if (token) {
        fetch('/api/room-portal/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      localStorage.removeItem('room_portal_token');
      router.replace('/room-portal');
    } else {
      setPinError(true);
      setPinInput('');
      setTimeout(() => setPinError(false), 2000);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden">

      {/* Main content */}
      <div
        data-kiosk-logo
        onMouseDown={startLogoHold}
        onMouseUp={stopLogoHold}
        onTouchStart={startLogoHold}
        onTouchEnd={stopLogoHold}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
      />
      {children}

      {/* Hold progress indicator */}
      {holdProgress > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '3px',
            width: `${holdProgress}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            zIndex: 9999,
            transition: 'width 0.05s linear',
          }}
        />
      )}

      {/* Exit PIN Modal */}
      {showExitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '24px',
              padding: '40px',
              width: '320px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔐</div>
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: '20px', marginBottom: '6px' }}>
              Admin Exit
            </h2>
            <p style={{ color: 'rgb(148,163,184)', fontSize: '13px', marginBottom: '24px' }}>
              Enter the admin PIN to exit kiosk mode
            </p>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              maxLength={6}
              autoFocus
              placeholder="Enter PIN"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: pinError
                  ? '2px solid rgb(239,68,68)'
                  : '1px solid rgba(99,102,241,0.4)',
                background: 'rgba(15,23,42,0.8)',
                color: 'white',
                fontSize: '18px',
                textAlign: 'center',
                letterSpacing: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />
            {pinError && (
              <p style={{ color: 'rgb(239,68,68)', fontSize: '12px', marginTop: '8px' }}>
                Incorrect PIN. Try again.
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => { setShowExitModal(false); setPinInput(''); setPinError(false); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(100,116,139,0.4)',
                  background: 'transparent',
                  color: 'rgb(148,163,184)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Exit Kiosk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Fullscreen Lock Overlay if exited (ONLY WHEN KIOSK IS LOCKED) */}
      {!isFullscreen && kioskLocked && (
        <div
          onClick={requestFullscreen}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.92)',
            backdropFilter: 'blur(16px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.96)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '24px',
              padding: '36px 32px',
              textAlign: 'center',
              maxWidth: '380px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🔒</div>
            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 900, margin: '0 0 8px 0' }}>
              Tablet Kiosk Active
            </h3>
            <p style={{ color: 'rgb(148, 163, 184)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              This tablet is locked in Kiosk Mode. Tap anywhere to resume fullscreen.
            </p>
            <button
              onClick={requestFullscreen}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
              }}
            >
              Tap to Resume Fullscreen 📱
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
