'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, FileText, Package, User, Users, MapPin, Command, X, ArrowRight, Loader2, 
  CreditCard, Clock, Calendar, Bed, TrendingDown, Truck, Navigation, IdCard, 
  Ticket, BookOpen, Receipt as ReceiptIcon, Wrench 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'Order' | 'Invoice' | 'Product' | 'Table' | 'Customer' | 'Staff' | 'KOT' | 
        'Reservation' | 'Room' | 'Expense' | 'Vendor' | 'Driver' | 'Membership' | 
        'Voucher' | 'Folio' | 'Receipt' | 'Maintenance';
  title: string;
  subtitle?: string;
  status?: string;
  url: string;
}

export const GlobalSearch = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        setSelectedIndex(data.data.length > 0 ? 0 : -1);
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (query.trim()) {
         // Fallback if nothing selected but enter pressed
         router.push(`/operations?search=${encodeURIComponent(query)}`);
         setIsOpen(false);
      }
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Order': return <FileText size={16} />;
      case 'Invoice': return <CreditCard size={16} />;
      case 'Product': return <Package size={16} />;
      case 'Table': return <MapPin size={16} />;
      case 'Customer': return <Users size={16} />;
      case 'Staff': return <User size={16} />;
      case 'KOT': return <Clock size={16} />;
      case 'Reservation': return <Calendar size={16} />;
      case 'Room': return <Bed size={16} />;
      case 'Expense': return <TrendingDown size={16} />;
      case 'Vendor': return <Truck size={16} />;
      case 'Driver': return <Navigation size={16} />;
      case 'Membership': return <IdCard size={16} />;
      case 'Voucher': return <Ticket size={16} />;
      case 'Folio': return <BookOpen size={16} />;
      case 'Receipt': return <ReceiptIcon size={16} />;
      case 'Maintenance': return <Wrench size={16} />;
      default: return <Search size={16} />;
    }
  };

  return (
    <div className="relative w-full max-w-[220px]" ref={containerRef}>
      <div 
        className={cn(
          "relative group transition-all duration-300",
          isOpen ? "scale-105" : "scale-100"
        )}
      >
        <Search 
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200",
            isOpen ? "text-pos-primary" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300"
          )} 
          size={16} 
        />
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Search Bill, Table, Customer..." 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full pl-10 pr-12 py-2.5 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:bg-white dark:focus:bg-slate-800 focus:border-pos-primary",
            "placeholder:text-gray-400 dark:placeholder:text-slate-500"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading ? (
            <Loader2 size={14} className="animate-spin text-pos-primary" />
          ) : (
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] text-gray-400 font-bold">
              <Command size={10} />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (query.length >= 2 || results.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-[100] backdrop-blur-xl"
          >
            <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
              {results.length > 0 ? (
                results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group",
                      selectedIndex === index 
                        ? "bg-pos-primary text-white shadow-lg shadow-pos-primary/20" 
                        : "hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                      selectedIndex === index 
                        ? "bg-white/20 text-white" 
                        : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-pos-primary/10 group-hover:text-pos-primary"
                    )}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider opacity-60 mb-0.5 block">
                          {result.type}
                        </span>
                        {result.status && (
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase",
                            selectedIndex === index 
                              ? "bg-white/20 text-white" 
                              : "bg-pos-primary/10 text-pos-primary"
                          )}>
                            {result.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className={cn(
                          "text-[11px] truncate",
                          selectedIndex === index ? "text-white/70" : "text-gray-500 dark:text-slate-400"
                        )}>
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <ArrowRight 
                      size={14} 
                      className={cn(
                        "transition-transform",
                        selectedIndex === index ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                      )} 
                    />
                  </button>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Search className="text-gray-300 dark:text-slate-600" size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">No results found</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Try searching for something else</p>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <div className="flex gap-3">
                <span className="flex items-center gap-1"><Command size={10} /> + K to search</span>
                <span className="flex items-center gap-1">↑↓ to navigate</span>
              </div>
              <span className="flex items-center gap-1">Enter to select</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
