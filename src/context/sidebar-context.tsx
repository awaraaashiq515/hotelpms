'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  isHidden: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  setHidden: (hidden: boolean) => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  isHidden: false,
  toggle: () => {},
  setOpen: () => {},
  setHidden: () => {},
  close: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  
  // Handle initial state and resizing
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const setOpen = useCallback((open: boolean) => setIsOpen(open), []);
  const setHidden = useCallback((hidden: boolean) => setIsHidden(hidden), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, isHidden, toggle, setOpen, setHidden, close }), [isOpen, isHidden, toggle, setOpen, setHidden, close]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
