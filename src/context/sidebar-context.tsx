'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
  setOpen: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const setOpen = useCallback((open: boolean) => setIsOpen(open), []);

  const value = useMemo(() => ({ isOpen, toggle, setOpen }), [isOpen, toggle, setOpen]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
