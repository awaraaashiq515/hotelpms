import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { driversApi, DriverGiftRule } from '@/lib/api/drivers';
import { Trash2, Edit, Plus, Gift, Users, Trophy } from 'lucide-react';

interface GiftSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesChanged: () => void;
}

export const GiftSettingsModal = ({ isOpen, onClose, onRulesChanged }: GiftSettingsModalProps) => {
  const [rules, setRules] = useState<DriverGiftRule[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [editingRule, setEditingRule] = useState<Partial<DriverGiftRule> | null>(null);
  const [customersRequired, setCustomersRequired] = useState('');
  const [giftName, setGiftName] = useState('');

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await driversApi.listGiftRules();
      setRules(data || []);
    } catch (error) {
      console.error('Failed to fetch gift rules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRules();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!customersRequired || !giftName) return;
    try {
      await driversApi.saveGiftRule({
         id: editingRule?.id,
         customersRequired: Number(customersRequired),
         giftName,
         isActive: true
      });
      setEditingRule(null);
      setCustomersRequired('');
      setGiftName('');
      fetchRules();
      onRulesChanged();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
     try {
       await driversApi.deleteGiftRule(id);
       fetchRules();
       onRulesChanged();
     } catch (error) {
       console.error('Delete failed:', error);
     }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gift Settings for Drivers">
      <div className="space-y-6">
         {/* Minimal Top Dashboard */}
         <div className="grid grid-cols-2 gap-4">
             <div className="bg-gradient-to-br from-orange-500 to-red-600 p-5 rounded-2xl text-white shadow-lg shadow-orange-100 relative overflow-hidden group">
                 <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <Gift size={100} strokeWidth={1} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-wider opacity-80">Total Configurations</p>
                 <p className="text-3xl font-black mt-1 leading-none">{rules.length}</p>
             </div>
             <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">System Reward</p>
                    <p className="text-xl font-black text-gray-900 mt-1">Automatic</p>
                 </div>
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                      <Trophy size={24} strokeWidth={2.5} />
                 </div>
             </div>
         </div>

         {/* Form Section */}
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.06)]">
             <h3 className="text-xs font-black text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                 <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                 {editingRule ? 'Edit Driver Reward Rule' : 'Create New Reward Rule'}
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wide">Customers Needed</label>
                    <div className="relative">
                        <input 
                           type="number"
                           value={customersRequired}
                           onChange={(e) => setCustomersRequired(e.target.value)}
                           placeholder="e.g. 5"
                           className="w-full h-11 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100/50 rounded-xl text-sm font-bold text-gray-900 transition-all outline-none"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">Users</div>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wide">Gift Description / Reward</label>
                    <input 
                       type="text"
                       value={giftName}
                       onChange={(e) => setGiftName(e.target.value)}
                       placeholder="e.g. ₹500 Petrol Reward"
                       className="w-full h-11 px-4 bg-gray-50 border border-gray-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100/50 rounded-xl text-sm font-bold text-gray-900 transition-all outline-none"
                    />
                 </div>
             </div>
             <div className="flex justify-end gap-2 mt-4">
                 {editingRule && (
                    <Button variant="secondary" className="font-bold text-xs px-4" onClick={() => {
                        setEditingRule(null);
                        setCustomersRequired('');
                        setGiftName('');
                    }}>Cancel</Button>
                 )}
                 <Button onClick={handleSave} className="bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-orange-100 flex items-center gap-1 tracking-wider">
                     <Plus size={16} strokeWidth={2.5} />
                     {editingRule ? 'UPDATE RULE' : 'ADD NEW RULE'}
                 </Button>
             </div>
         </div>

         {/* Grid Logs */}
         <div className="space-y-3">
             <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Active Rules List</h4>
             {loading ? (
                <p className="text-xs text-center text-gray-400 py-6">Loading active rules...</p>
             ) : rules.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Gift size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-400">No active rules defined.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 gap-2.5">
                    {rules.map((rule) => (
                       <div key={rule.id} className="group bg-white p-4 rounded-xl border border-gray-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all flex items-center justify-between hover:-translate-y-0.5">
                           <div className="flex items-center gap-3">
                               <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                    <Gift size={20} className="group-hover:animate-bounce" />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-gray-900 capitalize tracking-tight">{rule.giftName}</p>
                                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5 tracking-wide">
                                     <Users size={12} strokeWidth={2.5} />
                                     Triggers on {rule.customersRequired} referrals
                                  </p>
                               </div>
                           </div>
                           <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => {
                                     setEditingRule(rule);
                                     setCustomersRequired(String(rule.customersRequired));
                                     setGiftName(rule.giftName);
                                 }}
                                 className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors"
                               >
                                   <Edit size={16} />
                               </button>
                               <button 
                                 onClick={() => handleDelete(rule.id)}
                                 className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                               >
                                   <Trash2 size={16} />
                               </button>
                           </div>
                       </div>
                    ))}
                </div>
             )}
         </div>
      </div>
    </Modal>
  );
};
