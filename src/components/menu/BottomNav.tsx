import React from 'react';
import { Utensils, History, User, Wine } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: 'menu' | 'bar' | 'orders' | 'profile';
  setActiveTab: (tab: 'menu' | 'bar' | 'orders' | 'profile') => void;
  orderCount?: number;
  showBar?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, orderCount = 0, showBar = false }) => {
  const tabs = [
    { id: 'menu', label: 'Food', icon: Utensils },
    ...(showBar ? [{ id: 'bar', label: 'Bar', icon: Wine }] : []),
    { id: 'orders', label: 'Orders', icon: History, badge: orderCount > 0 ? orderCount : undefined },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex items-center justify-around h-20 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="relative flex flex-col items-center justify-center min-w-[64px] h-16 group transition-all"
            >
              <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
                isActive 
                ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/20 scale-110 -translate-y-1' 
                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
              }`}>
                <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
                
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 bg-pos-accent text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black border-2 border-white dark:border-slate-950 animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              
              <span className={`text-[8px] font-black uppercase tracking-wider mt-1.5 transition-all ${
                isActive ? 'text-pos-primary opacity-100 scale-100' : 'text-slate-400 opacity-0 scale-90'
              }`}>
                {tab.label}
              </span>

              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -bottom-1 w-1 h-1 bg-pos-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
