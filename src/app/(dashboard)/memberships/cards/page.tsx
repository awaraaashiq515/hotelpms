'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, User, CreditCard, QrCode, Calendar, ShieldCheck, Printer, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/components/providers/ThemeProvider';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

interface MembershipCard {
  id: string;
  cardNumber: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'BLOCKED';
  membershipPlan: { name: string };
  guest: { firstName: string; lastName: string; mobile: string } | null;
  createdAt: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  isActive: boolean;
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
}

export default function MembershipCardsPage() {
  const { theme } = useTheme();
  const { addToast } = useToast();
  const [cards, setCards] = useState<MembershipCard[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MembershipCard | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    membershipPlanId: '',
    guestId: '',
    cardNumber: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cardsRes, plansRes, guestsRes] = await Promise.all([
        fetch('/api/memberships/cards'),
        fetch('/api/memberships/plans'),
        fetch('/api/customers'), // Existing API for guests
      ]);
      const cardsData = await cardsRes.json();
      const plansData = await plansRes.json();
      const guestsData = await guestsRes.json();

      if (cardsData.success) setCards(cardsData.data);
      if (plansData.success) setPlans(plansData.data);
      if (guestsData.success) setGuests(guestsData.data);
    } catch (err) {
      addToast('error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMutationLoading(true);
    try {
      const res = await fetch('/api/memberships/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Membership card issued');
        fetchData();
        setIsModalOpen(false);
      } else {
        addToast('error', data.message || 'Action failed');
      }
    } catch (err) {
      addToast('error', 'An error occurred');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/memberships/cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Status updated');
        fetchData();
      }
    } catch (err) {
      addToast('error', 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanent delete?')) return;
    try {
      const res = await fetch(`/api/memberships/cards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted');
        fetchData();
      }
    } catch (err) {
      addToast('error', 'Delete failed');
    }
  };

  const filteredCards = cards.filter(c => 
    c.cardNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.guest?.firstName.toLowerCase().includes(search.toLowerCase()) ||
    c.guest?.mobile.includes(search)
  );

  return (
    <div className={`p-6 lg:p-10 min-h-screen ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50/50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-all ${theme === 'dark' ? 'bg-amber-500/20 text-amber-400 shadow-amber-500/10' : 'bg-amber-500 text-white shadow-amber-200'}`}>
              <CreditCard size={28} />
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Membership Cards</h1>
              <p className={`text-sm font-bold mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Issue and track unique QR cards for your customers</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-2 font-black uppercase text-[11px] tracking-widest transition-all active:scale-95"
          >
            <Plus size={18} /> Issue New Card
          </Button>
        </div>

        {/* Search & Stats */}
        <div className={`mb-8 p-4 rounded-[2rem] flex flex-col lg:flex-row items-center gap-4 ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-white shadow-sm'}`}>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by card number, guest name, or mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
             <div className={`px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px] ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Cards</span>
                <span className="text-xl font-black text-indigo-500">{cards.length}</span>
             </div>
             <div className={`px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px] ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active</span>
                <span className="text-xl font-black text-emerald-500">{cards.filter(c => c.status === 'ACTIVE').length}</span>
             </div>
          </div>
        </div>

        {/* Cards Table */}
        <div className={`rounded-[2.5rem] overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${theme === 'dark' ? 'bg-slate-950/50' : 'bg-slate-50/50'} border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Card Number</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Guest Details</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Plan Tier</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status / Expiry</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                   [1,2,3,4].map(i => <tr key={i}><td colSpan={5} className="p-8 animate-pulse bg-slate-50/10" /></tr>)
                ) : filteredCards.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">No cards found matching your criteria</td></tr>
                ) : filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                          <QrCode size={18} />
                        </div>
                        <span className="font-black text-sm tracking-tight text-indigo-500">{card.cardNumber}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {card.guest ? (
                        <div>
                          <p className="font-black text-[13px] leading-none mb-1">{card.guest.firstName} {card.guest.lastName}</p>
                          <p className="text-[11px] font-bold text-slate-500">{card.guest.mobile}</p>
                        </div>
                      ) : <span className="text-[11px] font-bold text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        {card.membershipPlan.name}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${card.status === 'ACTIVE' ? 'bg-emerald-500' : card.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                           <span className={`text-[10px] font-black uppercase tracking-widest ${card.status === 'ACTIVE' ? 'text-emerald-500' : card.status === 'BLOCKED' ? 'text-rose-500' : 'text-slate-500'}`}>{card.status}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400">Expires: {format(new Date(card.expiresAt), 'dd MMM yyyy')}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => { setSelectedCard(card); setIsPrintModalOpen(true); }}
                           className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
                           title="Print QR Card"
                         >
                           <Printer size={16} />
                         </button>
                         {card.status === 'ACTIVE' ? (
                            <button onClick={() => handleUpdateStatus(card.id, 'BLOCKED')} className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`} title="Block Card">
                               <ShieldCheck size={16} />
                            </button>
                         ) : (
                            <button onClick={() => handleUpdateStatus(card.id, 'ACTIVE')} className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`} title="Unblock Card">
                               <Plus size={16} />
                            </button>
                         )}
                         <button onClick={() => handleDelete(card.id)} className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-500 hover:text-rose-400' : 'bg-slate-50 text-slate-400 hover:text-rose-600'}`}>
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Issue Card Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Membership Card" maxWidth="md">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
             <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Select Membership Plan</label>
              <select 
                required
                value={formData.membershipPlanId}
                onChange={e => setFormData({ ...formData, membershipPlanId: e.target.value })}
                className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
              >
                <option value="">-- Choose Tier --</option>
                {plans.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Assign to Guest (Optional)</label>
              <select 
                value={formData.guestId}
                onChange={e => setFormData({ ...formData, guestId: e.target.value })}
                className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
              >
                <option value="">-- No Specific Guest --</option>
                {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName} ({g.mobile})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Card Number (Auto-generated if empty)</label>
              <input 
                value={formData.cardNumber}
                onChange={e => setFormData({ ...formData, cardNumber: e.target.value })}
                placeholder="MEM-XXXXXX"
                className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-600 focus:bg-white'}`}
              />
            </div>
          </div>
          <div className="pt-6 flex gap-3">
            <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 bg-slate-100 text-slate-600 hover:bg-slate-200 font-black uppercase text-[11px] tracking-widest rounded-2xl">
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={mutationLoading}
              className="flex-2 h-14 bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              Issue Card
            </Button>
          </div>
        </form>
      </Modal>

      {/* Print / Preview Modal */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Member Card Preview" maxWidth="sm">
        {selectedCard && (
           <div className="p-8 flex flex-col items-center">
              <div className={`w-full aspect-[1.586/1] rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white border-2 border-slate-100 shadow-2xl'}`} id="print-card">
                 {/* Card BG Accent */}
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl" />
                 <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />

                 <div className="flex justify-between items-start z-10">
                    <div>
                       <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Membership Tier</h4>
                       <span className="text-sm font-black text-indigo-600 uppercase italic tracking-tighter">{selectedCard.membershipPlan.name}</span>
                    </div>
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                       <Trophy size={16} />
                    </div>
                 </div>

                 <div className="flex items-center gap-6 z-10">
                    <div className="p-2 bg-white rounded-xl shadow-lg">
                       <QRCodeSVG value={selectedCard.cardNumber} size={80} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Card Number</p>
                       <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{selectedCard.cardNumber}</p>
                       <div className="mt-4">
                          <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">Valid Until</p>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white">{format(new Date(selectedCard.expiresAt), 'dd MMMM yyyy')}</p>
                       </div>
                    </div>
                 </div>

                 {selectedCard.guest && (
                    <div className="z-10 mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                       <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase leading-none">{selectedCard.guest.firstName} {selectedCard.guest.lastName}</p>
                       <p className="text-[9px] font-bold text-slate-500">{selectedCard.guest.mobile}</p>
                    </div>
                 )}
              </div>

              <div className="w-full mt-10 grid grid-cols-2 gap-4">
                 <Button onClick={() => setIsPrintModalOpen(false)} className="h-14 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase text-[11px] tracking-widest">Close</Button>
                 <Button onClick={() => window.print()} className="h-14 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none">Print Card</Button>
              </div>
           </div>
        )}
      </Modal>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-card, #print-card * { visibility: visible; }
          #print-card { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
