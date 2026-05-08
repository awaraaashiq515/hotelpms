import { Search, History, UtensilsCrossed, Bell } from 'lucide-react';
import { useState } from 'react';

interface MenuHeaderProps {
  data: any;
  activeTab: 'menu' | 'bar' | 'orders' | 'profile';
  setActiveTab: (tab: 'menu' | 'bar' | 'orders' | 'profile') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ 
  data, 
  activeTab, 
  setActiveTab, 
  searchQuery, 
  setSearchQuery 
}) => {
  const [requesting, setRequesting] = useState(false);

  const callWaiter = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const res = await fetch('/api/public/request-assistance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: data.table.id,
          propertyId: data.property.id,
          type: 'ASSISTANCE'
        })
      });
      if (res.ok) {
        alert('A waiter has been called to your table.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {data.property.logoUrl ? (
            <img src={data.property.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-pos-primary/10 flex items-center justify-center text-pos-primary">
              <UtensilsCrossed size={18} />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{data.property.name}</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[11px] text-slate-400 font-medium">Table: {data.table.name}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={callWaiter}
          disabled={requesting}
          className={`
            flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-95
            ${requesting ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 shadow-sm shadow-amber-500/10'}
          `}
        >
          <Bell size={18} className={requesting ? '' : 'animate-bounce'} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Call Waiter</span>
        </button>
      </div>

      {['menu', 'bar'].includes(activeTab) && (
        <div className="mt-4 relative animate-in slide-in-from-top-1 duration-300">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-slate-100/50 dark:bg-slate-900/50 border-none rounded-xl pl-11 pr-4 text-sm font-medium text-slate-800 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400"
          />
        </div>
      )}
    </header>
  );
};
