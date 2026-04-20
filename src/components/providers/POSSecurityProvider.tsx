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
  const [session, setSession] = useState<any>(null);
  const [settings, setSettings] = useState({
    timeout: 0,
    message: 'Station Locked',
    bgUrl: ''
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
            bgUrl: data.data.posLockScreenBgUrl || ''
          });
        }
      })
      .catch(err => console.error('Failed to fetch POS security settings', err));
  }, []);

  const manuallyLock = () => {
    setTriggerLock(true);
  };

  // Logic: Disable lock if in Admin Hub
  // Admin Hub paths usually don't include POS operations
  const isAdminPage = pathname.startsWith('/settings') || 
                      pathname.startsWith('/reports') || 
                      pathname.startsWith('/role-management') ||
                      pathname.startsWith('/pos-access') ||
                      pathname.startsWith('/manage-users') ||
                      pathname.startsWith('/businesses') ||
                      pathname.startsWith('/accounting') ||
                      pathname.startsWith('/expenses');

  // If role is admin and on admin page, disable auto-lock
  const disableLockForAdmin = (session?.role === 'RESTAURANTS_ADMIN' || session?.role === 'SUPER_ADMIN') && isAdminPage;
  
  // Effective timeout (0 if disabled for admin)
  const effectiveTimeout = disableLockForAdmin ? 0 : settings.timeout;

  return (
    <POSSecurityContext.Provider value={{ ...settings, manuallyLock }}>
      {children}
      <AutoLockOverlay 
        timeoutMinutes={effectiveTimeout} 
        message={settings.message}
        bgUrl={settings.bgUrl}
        forceLock={triggerLock}
        onUnlock={() => setTriggerLock(false)}
      />
    </POSSecurityContext.Provider>
  );
};
