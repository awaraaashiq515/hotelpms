'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AutoLockOverlay } from '../pos/AutoLockOverlay';
import { usePathname } from 'next/navigation';

interface POSSecurityContextType {
  timeout: number;
  message: string;
  bgUrl: string;
  manuallyLock: () => void;
}

const POSSecurityContext = createContext<POSSecurityContextType>({ 
  timeout: 0, 
  message: 'Station Locked',
  bgUrl: '',
  manuallyLock: () => {}
});

export const usePOSSecurity = () => useContext(POSSecurityContext);

export const POSSecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const relativePath = segments.length > 1 ? '/' + segments.slice(1).join('/') : '/';
  const [session, setSession] = useState<any>(null);
  const [settings, setSettings] = useState({
    timeout: -1, // -1 means loading
    message: 'Station Locked',
    bgUrl: '',
    pinLength: 4
  });
  const [triggerLock, setTriggerLock] = useState(false);

  useEffect(() => {
    // Get session to check role
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setSession(data.user);
      });

    // Get security settings
    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings({
            timeout: data.data.posAutoLockTimeout || 0,
            message: data.data.posLockScreenMessage || 'Station Locked',
            bgUrl: data.data.posLockScreenBgUrl || '',
            pinLength: data.data.posTerminalPin ? data.data.posTerminalPin.length : 4
          });
        } else {
          // If fetch fails but we need to stop loading
          setSettings(s => ({ ...s, timeout: 0 }));
        }
      })
      .catch(err => {
        console.error('Failed to fetch POS security settings', err);
        setSettings(s => ({ ...s, timeout: 0 }));
      });
  }, []);

  const manuallyLock = () => {
    setTriggerLock(true);
  };

  // Define Terminal vs Management pages
  // Management pages ("Inside") should not lock for Admin roles
  const managementPaths = [
    '/dashboard',
    '/manage-properties',
    '/manage-users',
    '/manage-roles',
    '/pos-staff',
    '/inventory',
    '/products',
    '/categories',
    '/settings',
    '/reports',
    '/invoices',
    '/payments',
    '/expenses',
    '/accounts',
    '/drivers',
    '/customers',
    '/day-closing',
    '/vouchers',
    '/pos/gst-filing',
    '/pos/gst-settings'
  ];

  const isManagementPage = managementPaths.some(path => relativePath.startsWith(path)) || relativePath === '/operations';
  
  // Pages that should NEVER lock for anyone (e.g. Kitchen Display / Bar Display)
  const isExemptPage = relativePath.startsWith('/kitchen-display') || pathname.includes('/kitchen-display') ||
    relativePath.startsWith('/bar-display') || pathname.includes('/bar-display');

  // Logic: Disable lock for Administrative roles on Management pages
  // Or for everyone on exempt pages like Kitchen Display
  const disableLock = ((session?.role === 'RESTAURANTS_ADMIN' || session?.role === 'SUPER_ADMIN' || session?.role === 'POSSYSTEM') && isManagementPage) || isExemptPage;
  
  // Effective timeout (0 if disabled)
  const effectiveTimeout = disableLock ? 0 : settings.timeout;

  return (
    <POSSecurityContext.Provider value={{ ...settings, manuallyLock }}>
      {children}
      <AutoLockOverlay 
        timeoutMinutes={effectiveTimeout} 
        message={settings.message}
        bgUrl={settings.bgUrl}
        forceLock={triggerLock}
        onUnlock={() => setTriggerLock(false)}
        pinLength={settings.pinLength}
      />
    </POSSecurityContext.Provider>
  );
};
