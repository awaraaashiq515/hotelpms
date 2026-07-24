'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Loader2, 
  Search, 
  Receipt, 
  PlusCircle, 
  CreditCard, 
  Printer, 
  User, 
  Bed, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  X,
  FileText,
  DollarSign,
  Wallet,
  CalendarDays,
  ShoppingBag,
  Link,
  UtensilsCrossed
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

function BillingContent() {
  const searchParams = useSearchParams();
  const resId = searchParams.get('resId') || '';
  const router = useRouter();

  const [folios, setFolios] = useState<any[]>([]);
  const [selectedFolio, setSelectedFolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showLinkOrderModal, setShowLinkOrderModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Link Order Modal State
  const [unlinkedOrders, setUnlinkedOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [linkingOrderId, setLinkingOrderId] = useState<string | null>(null);

  // Manual Transaction Form
  const [txnType, setTxnType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [sourceModule, setSourceModule] = useState('HMS');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('0');

  // Checkout Settlement Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');

  // Ref for print area
  const printRef = useRef<HTMLDivElement>(null);

  // Load folios list
  const loadFolios = async (autoSelectResId?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/folios');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFolios(data.data);
        
        // Handle auto-selection of a specific reservation or first folio
        const targetResId = autoSelectResId || resId;
        if (targetResId) {
          const match = data.data.find((f: any) => f.reservationId === targetResId);
          if (match) {
            await handleSelectFolio(match.id);
            setLoading(false);
            return;
          }
        }
        
        if (data.data.length > 0 && !selectedFolio) {
          await handleSelectFolio(data.data[0].id);
        } else if (selectedFolio) {
          // Refresh currently selected folio details
          await handleSelectFolio(selectedFolio.id);
        }
      }
    } catch (err) {
      console.error('Error loading folios:', err);
      toast.error('Failed to load guest billing folios');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single folio details
  const handleSelectFolio = async (id: string) => {
    try {
      const res = await fetch(`/api/hotel/folios?folioId=${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedFolio(data.data);
        // Pre-fill payment amount with current closing balance
        setPaymentAmount(Math.max(0, data.data.closingBalance).toString());
      } else {
        toast.error(data.message || 'Failed to fetch folio details');
      }
    } catch (err) {
      toast.error('Error retrieving folio transaction details');
    }
  };

  useEffect(() => {
    loadFolios();
  }, [resId]);

  // Load unlinked POS orders for this folio's guest
  const loadUnlinkedOrders = async () => {
    if (!selectedFolio?.guestId) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/hotel/folios/link-order?guestId=${selectedFolio.guestId}`);
      const data = await res.json();
      if (data.success) setUnlinkedOrders(data.data || []);
    } catch {}
    finally { setLoadingOrders(false); }
  };

  // Link a POS order to the current folio
  const handleLinkOrder = async (posOrderId: string) => {
    if (!selectedFolio) return;
    setLinkingOrderId(posOrderId);
    try {
      const res = await fetch('/api/hotel/folios/link-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folioId: selectedFolio.id, posOrderId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Order linked to folio!');
        setUnlinkedOrders(prev => prev.filter(o => o.id !== posOrderId));
        await loadFolios();
      } else {
        toast.error(data.message || 'Failed to link order');
      }
    } catch {
      toast.error('Network error linking order');
    } finally {
      setLinkingOrderId(null);
    }
  };

  // Handle posting manual charge/credit
  const handlePostTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || Number(amount) <= 0) {
      toast.error('Please enter a description and a valid positive amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/folios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folioId: selectedFolio.id,
          txnType,
          sourceModule,
          description,
          amount: Number(amount),
          taxAmount: Number(taxAmount || 0),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Transaction posted to folio successfully');
        setShowPostModal(false);
        // Reset form
        setDescription('');
        setAmount('');
        setTaxAmount('0');
        // Reload details
        await loadFolios();
      } else {
        toast.error(data.message || 'Failed to post transaction');
      }
    } catch (err) {
      toast.error('Network error posting transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Checkout & Settle
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const activeCheckIn = selectedFolio?.reservation?.checkIns?.[0];
    if (!activeCheckIn) {
      toast.error('No active check-in record found for this folio. Cannot checkout.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/hotel/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInId: activeCheckIn.id,
          paymentAmount: Number(paymentAmount || 0),
          paymentMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Guest checked out and room released successfully!');
        setShowCheckoutModal(false);
        // Open receipt modal automatically
        setShowInvoiceModal(true);
        // Reload folios (clear selection or select next one)
        setSelectedFolio(null);
        await loadFolios();
      } else {
        toast.error(data.message || 'Checkout settlement failed');
      }
    } catch (err) {
      toast.error('Connection error performing checkout');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger browser print
  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      // Create a style element for clean print layout
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${selectedFolio?.folioNo}</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #1e293b;
                  padding: 40px;
                  background: white;
                }
                .invoice-container {
                  max-width: 800px;
                  margin: 0 auto;
                }
                .header {
                  display: flex;
                  justify-content: space-between;
                  border-bottom: 2px solid #e2e8f0;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .company-title {
                  font-size: 24px;
                  font-weight: 900;
                  text-transform: uppercase;
                  color: #4f46e5;
                }
                .invoice-title {
                  font-size: 28px;
                  font-weight: 900;
                  color: #0f172a;
                }
                .meta-grid {
                  display: grid;
                  grid-template-cols: 1fr 1fr;
                  gap: 40px;
                  margin-bottom: 40px;
                }
                .section-title {
                  font-size: 10px;
                  font-weight: 800;
                  text-transform: uppercase;
                  color: #64748b;
                  letter-spacing: 0.05em;
                  margin-bottom: 8px;
                }
                .details-box {
                  background: #f8fafc;
                  border: 1px solid #e2e8f0;
                  padding: 16px;
                  border-radius: 12px;
                }
                .detail-line {
                  display: flex;
                  justify-content: space-between;
                  font-size: 13px;
                  margin-bottom: 6px;
                }
                .detail-label {
                  color: #64748b;
                  font-weight: 500;
                }
                .detail-val {
                  font-weight: 700;
                  color: #0f172a;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 30px;
                }
                th {
                  border-bottom: 2px solid #e2e8f0;
                  padding: 12px 8px;
                  font-size: 11px;
                  font-weight: 800;
                  text-transform: uppercase;
                  color: #64748b;
                  text-align: left;
                }
                td {
                  border-bottom: 1px solid #f1f5f9;
                  padding: 12px 8px;
                  font-size: 13px;
                  color: #334155;
                }
                .amount-col {
                  text-align: right;
                }
                .totals-section {
                  display: flex;
                  flex-direction: column;
                  align-items: flex-end;
                  gap: 8px;
                  margin-top: 20px;
                }
                .total-line {
                  display: flex;
                  justify-content: space-between;
                  width: 250px;
                  font-size: 13px;
                }
                .total-line.grand-total {
                  font-size: 18px;
                  font-weight: 900;
                  border-top: 2px solid #e2e8f0;
                  padding-top: 8px;
                  color: #4f46e5;
                }
                .footer {
                  margin-top: 60px;
                  text-align: center;
                  font-size: 11px;
                  color: #94a3b8;
                  border-top: 1px solid #e2e8f0;
                  padding-top: 20px;
                }
                @media print {
                  body { padding: 0; }
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="invoice-container">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const filteredFolios = folios.filter((f) => {
    const q = searchQuery.toLowerCase();
    const guestName = `${f.guest.firstName} ${f.guest.lastName || ''}`.toLowerCase();
    const folioNo = f.folioNo.toLowerCase();
    const roomNo = f.reservation?.rooms?.[0]?.room?.roomNumber?.toLowerCase() || '';
    return guestName.includes(q) || folioNo.includes(q) || roomNo.includes(q);
  });

  return (
    <div className="space-y-8 pb-12">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="space-y-1">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
          <Sparkles size={12} /> Billing Desk
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
          Guest Folios & Checkout
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Pane: Folios List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Open Billing Accounts</h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search by Guest, Room, Folio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto no-scrollbar">
              {filteredFolios.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs italic">
                  {folios.length === 0 ? 'No active billing accounts.' : 'No matching folios.'}
                </div>
              ) : (
                filteredFolios.map((f) => {
                  const isSelected = selectedFolio?.id === f.id;
                  const roomNumber = f.reservation?.rooms?.[0]?.room?.roomNumber || 'Unassigned';
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleSelectFolio(f.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/[0.05]'
                          : 'bg-slate-900/50 border-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-indigo-500' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            Room {roomNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{f.folioNo}</span>
                        </div>
                        <p className="text-sm font-bold text-white leading-tight">
                          {f.guest.firstName} {f.guest.lastName || ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400">Balance</p>
                        <p className={`text-sm font-black mt-0.5 ${f.closingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ₹{f.closingBalance}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Pane: Folio Ledger Details (8 cols) */}
        <div className="lg:col-span-8">
          {selectedFolio ? (
            <div className="space-y-6">
              {/* Ledger Summary Header */}
              <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Guest Info</span>
                  <p className="text-base font-black text-white">{selectedFolio.guest.firstName} {selectedFolio.guest.lastName}</p>
                  <p className="text-xs text-slate-400">{selectedFolio.guest.mobile || 'No Mobile Phone'}</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Stay Info</span>
                  <p className="text-base font-black text-indigo-400">
                    Room {selectedFolio.reservation?.rooms?.[0]?.room?.roomNumber || 'Unassigned'}
                  </p>
                  <p className="text-xs text-slate-400">{selectedFolio.reservation?.roomType?.name || 'Category'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Duration</span>
                  <p className="text-xs font-bold text-white mt-1">
                    {new Date(selectedFolio.reservation?.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(selectedFolio.reservation?.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">
                    {Math.max(1, Math.round((new Date(selectedFolio.reservation?.departureDate).getTime() - new Date(selectedFolio.reservation?.arrivalDate).getTime()) / (1000 * 60 * 60 * 24)))} Nights
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ledger Balance</span>
                  <p className={`text-lg font-black ${selectedFolio.closingBalance > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    ₹{selectedFolio.closingBalance}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-wider border border-slate-700">
                    {selectedFolio.status}
                  </span>
                </div>
              </div>

              {/* Transactions Ledger Panel */}
              <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                    <Receipt size={16} className="text-indigo-400" /> Folio Ledger Transactions
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowPostModal(true)}
                      className="px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Post Charge
                    </button>

                    <button
                      onClick={() => { loadUnlinkedOrders(); setShowLinkOrderModal(true); }}
                      className="px-4 py-2.5 rounded-xl border border-amber-700/40 hover:border-amber-600 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                      <Link size={14} /> Link Restaurant Order
                    </button>
                    
                    <button
                      onClick={() => setShowCheckoutModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Settle & Checkout
                    </button>

                    <button
                      onClick={() => setShowInvoiceModal(true)}
                      className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all"
                      title="View Invoice"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="border border-slate-800/80 rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/40 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left">
                        <th className="px-5 py-3.5">Date & Time</th>
                        <th className="px-5 py-3.5">Ref Module</th>
                        <th className="px-5 py-3.5">Description</th>
                        <th className="px-5 py-3.5 text-right">Charges (Debit)</th>
                        <th className="px-5 py-3.5 text-right">Payments (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
                      {selectedFolio.transactions?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                            No transactions posted yet.
                          </td>
                        </tr>
                      ) : (
                        selectedFolio.transactions.map((txn: any) => {
                          const txnDateStr = new Date(txn.txnDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <tr key={txn.id} className="hover:bg-slate-900/10">
                              <td className="px-5 py-3">{txnDateStr}</td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                                  txn.sourceModule === 'POS'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                                    : txn.sourceModule === 'SPA'
                                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                  {txn.sourceModule}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-slate-200">{txn.description}</td>
                              <td className="px-5 py-3 text-right font-bold text-slate-100">
                                {txn.debitAmount > 0 ? `₹${txn.debitAmount}` : '—'}
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-emerald-400">
                                {txn.creditAmount > 0 ? `₹${txn.creditAmount}` : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Ledger Totals Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
                  <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/60 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Total Charges</p>
                      <p className="text-base font-black text-slate-200 mt-0.5">₹{selectedFolio.totalCharges}</p>
                    </div>
                    <TrendingUp className="text-slate-600" size={18} />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/60 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Total Payments</p>
                      <p className="text-base font-black text-emerald-400 mt-0.5">₹{selectedFolio.totalPayments}</p>
                    </div>
                    <TrendingDown className="text-emerald-600" size={18} />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/60 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Balance Due</p>
                      <p className={`text-base font-black mt-0.5 ${selectedFolio.closingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ₹{selectedFolio.closingBalance}
                      </p>
                    </div>
                    <Wallet className={selectedFolio.closingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'} size={18} />
                  </div>
                </div>
              </div>

              {/* Restaurant & POS Orders Section */}
              {selectedFolio.posOrders && selectedFolio.posOrders.length > 0 && (
                <div className="p-6 rounded-3xl bg-[#0f172a] border border-amber-700/20 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                    <UtensilsCrossed size={16} /> Restaurant & Cafe Orders
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      {selectedFolio.posOrders.length} orders
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {selectedFolio.posOrders.map((order: any) => (
                      <div key={order.id} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-amber-400">{order.outlet?.name || 'Restaurant'}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase">{order.outlet?.type || 'F&B'}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">Order #{order.orderNo} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-rose-400">₹{order.grandTotal.toFixed(2)}</p>
                            <p className="text-[9px] text-slate-500">incl. tax ₹{order.taxAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="border-t border-slate-800/60 pt-2 grid grid-cols-1 gap-1">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-[10px] text-slate-400">
                                <span>{item.quantity}× {item.name}</span>
                                <span className="font-semibold text-slate-300">₹{(item.totalPrice || item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-amber-700/20">
                    <span className="text-xs font-bold text-slate-400">Total F&B Charges</span>
                    <span className="text-sm font-black text-amber-400">
                      ₹{selectedFolio.posOrders.reduce((sum: number, o: any) => sum + o.grandTotal, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[40vh] rounded-3xl bg-[#0f172a] border border-slate-800 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Receipt size={32} className="text-slate-600" />
              <p className="text-xs italic">Select a billing account from the list to view its ledger and perform checkout.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Post Transaction Form */}
      {showPostModal && selectedFolio && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handlePostTransaction}
            className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <PlusCircle size={16} /> Post Folio Transaction
              </h3>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxnType('DEBIT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      txnType === 'DEBIT'
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Charge (Debit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnType('CREDIT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      txnType === 'CREDIT'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Payment (Credit)
                  </button>
                </div>
              </div>

              {/* Module selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Source Department</label>
                <select
                  value={sourceModule}
                  onChange={(e) => setSourceModule(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="HMS">HMS Front Office</option>
                  <option value="POS">Restaurant POS</option>
                  <option value="SPA">Spa / Wellness</option>
                  <option value="LAUNDRY">Laundry Services</option>
                  <option value="MINIBAR">Mini Bar</option>
                  <option value="OTHER">Other Charges</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laundry 3 shirts, Extra mineral water"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Amount Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tax Component (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Link Restaurant Order */}
      {showLinkOrderModal && selectedFolio && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/80 backdrop-blur-sm flex items-start justify-center pt-6 px-4 pb-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-[#0f172a] border border-amber-700/30 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <UtensilsCrossed size={16} /> Link Restaurant Order to Folio
              </h3>
              <button type="button" onClick={() => setShowLinkOrderModal(false)} className="text-slate-500 hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              These are completed restaurant orders for <span className="font-bold text-white">{selectedFolio.guest.firstName} {selectedFolio.guest.lastName}</span> that have not yet been added to the hotel bill.
            </p>
            {loadingOrders ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-400" size={24} />
              </div>
            ) : unlinkedOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic space-y-2">
                <ShoppingBag size={28} className="mx-auto text-slate-600" />
                <p>No unlinked restaurant orders found for this guest.</p>
                <p className="text-[10px]">Orders appear here once they are completed/paid in POS.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
                {unlinkedOrders.map((order: any) => (
                  <div key={order.id} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-amber-400">{order.outlet?.name || 'Restaurant'}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase">{order.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Order #{order.orderNo} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      {order.items?.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {order.items.slice(0, 3).map((item: any, idx: number) => (
                            <p key={idx} className="text-[10px] text-slate-500">{item.quantity}× {item.name}</p>
                          ))}
                          {order.items.length > 3 && <p className="text-[10px] text-slate-600">+{order.items.length - 3} more items</p>}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-2">
                      <p className="text-sm font-black text-rose-400">₹{order.grandTotal.toFixed(2)}</p>
                      <button
                        onClick={() => handleLinkOrder(order.id)}
                        disabled={linkingOrderId === order.id}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] font-black transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        {linkingOrderId === order.id ? <Loader2 size={10} className="animate-spin" /> : <Link size={10} />}
                        {linkingOrderId === order.id ? 'Linking...' : 'Add to Bill'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowLinkOrderModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Checkout Settlement Dialog */}
      {showCheckoutModal && selectedFolio && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCheckoutSubmit}
            className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                <CreditCard size={16} /> Guest Checkout & Bill Settlement
              </h3>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Guest Name</p>
                  <p className="font-bold text-white">{selectedFolio.guest.firstName} {selectedFolio.guest.lastName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{selectedFolio.folioNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Room Number</p>
                  <p className="font-bold text-indigo-400">
                    Room {selectedFolio.reservation?.rooms?.[0]?.room?.roomNumber || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Itemized Bill Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Bill Breakdown</p>
                {/* Room charges */}
                {selectedFolio.transactions?.filter((t: any) => t.sourceModule === 'HMS' && t.debitAmount > 0).map((t: any) => (
                  <div key={t.id} className="flex justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1"><Bed size={10} /> {t.description}</span>
                    <span className="font-bold text-slate-200">₹{t.debitAmount.toFixed(2)}</span>
                  </div>
                ))}
                {/* POS / Restaurant charges */}
                {selectedFolio.transactions?.filter((t: any) => t.sourceModule === 'POS').map((t: any) => (
                  <div key={t.id} className="flex justify-between text-xs">
                    <span className="text-amber-400/80 flex items-center gap-1"><UtensilsCrossed size={10} /> {t.description}</span>
                    <span className="font-bold text-amber-300">₹{t.debitAmount.toFixed(2)}</span>
                  </div>
                ))}
                {/* Other charges */}
                {selectedFolio.transactions?.filter((t: any) => t.sourceModule !== 'HMS' && t.sourceModule !== 'POS' && t.debitAmount > 0).map((t: any) => (
                  <div key={t.id} className="flex justify-between text-xs">
                    <span className="text-slate-400">{t.description}</span>
                    <span className="font-bold text-slate-200">₹{t.debitAmount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="h-px bg-slate-800 my-1" />
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Charges</span>
                  <span className="font-bold text-slate-200">₹{selectedFolio.totalCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400/80">Payments / Deposits</span>
                  <span className="font-bold text-emerald-400">- ₹{selectedFolio.totalPayments.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-700 my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-white">Balance Due</span>
                  <span className={`text-base font-black ${selectedFolio.closingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ₹{selectedFolio.closingBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedFolio.closingBalance > 0 ? (
                <>
                  {/* Settlement input */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Settlement Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-indigo-400 font-bold text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[9px] text-slate-500 mt-1">Defaults to the total closing ledger balance.</p>
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Payment Method</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="CASH">Cash Payment</option>
                      <option value="CARD">Debit / Credit Card</option>
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2.5 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/10">
                  <CheckCircle2 size={16} />
                  <span>Ledger fully paid. You can complete the checkout process now.</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {submitting ? 'Checking out...' : selectedFolio.closingBalance > 0 ? 'Settle & Close Folio' : 'Complete Checkout'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Tax Invoice / Receipt Dialog */}
      {showInvoiceModal && selectedFolio && (
        <div className="fixed inset-0 z-50 bg-[#090d16]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Header toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <FileText size={16} className="text-indigo-400" /> Folio Invoice Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Printer size={12} /> Print Invoice
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable invoice container */}
            <div className="flex-1 overflow-y-auto no-scrollbar pr-1 bg-white text-slate-800 rounded-2xl p-6" ref={printRef}>
              <div className="space-y-6">
                
                {/* Brand / Logo */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="company-title">Hotel Hub PMS</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Property Management System</p>
                  </div>
                  <div className="text-right">
                    <h2 className="invoice-title">TAX INVOICE</h2>
                    <p className="text-xs text-slate-500 mt-1">Invoice No: {selectedFolio.folioNo}</p>
                    <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                {/* Meta details grid */}
                <div className="meta-grid">
                  {/* Guest details */}
                  <div>
                    <span className="section-title">Billed To (Guest)</span>
                    <div className="details-box">
                      <p className="font-bold text-sm text-slate-800">
                        {selectedFolio.guest.firstName} {selectedFolio.guest.lastName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Mobile: {selectedFolio.guest.mobile || '—'}</p>
                      <p className="text-xs text-slate-500">Email: {selectedFolio.guest.email || '—'}</p>
                      <p className="text-xs text-slate-500">Nationality: {selectedFolio.guest.nationality || '—'}</p>
                    </div>
                  </div>

                  {/* Stay Details */}
                  <div>
                    <span className="section-title">Reservation details</span>
                    <div className="details-box">
                      <div className="detail-line">
                        <span className="detail-label">Room Number:</span>
                        <span className="detail-val">Room {selectedFolio.reservation?.rooms?.[0]?.room?.roomNumber || 'Unassigned'}</span>
                      </div>
                      <div className="detail-line">
                        <span className="detail-label">Room Category:</span>
                        <span className="detail-val">{selectedFolio.reservation?.roomType?.name}</span>
                      </div>
                      <div className="detail-line">
                        <span className="detail-label">Check-In Date:</span>
                        <span className="detail-val">
                          {new Date(selectedFolio.reservation?.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="detail-line">
                        <span className="detail-label">Check-Out Date:</span>
                        <span className="detail-val">
                          {new Date(selectedFolio.reservation?.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table of Transactions */}
                <div>
                  <span className="section-title">Billing Ledger Ledger</span>
                  <table>
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Ref Code</th>
                        <th>Description</th>
                        <th className="amount-col">Charges (DR)</th>
                        <th className="amount-col">Payments (CR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFolio.transactions?.map((txn: any) => (
                        <tr key={txn.id}>
                          <td>{new Date(txn.txnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={{ fontWeight: 'bold' }}>{txn.sourceModule}</td>
                          <td>{txn.description}</td>
                          <td className="amount-col" style={{ fontWeight: 'bold' }}>
                            {txn.debitAmount > 0 ? `₹${txn.debitAmount.toFixed(2)}` : '—'}
                          </td>
                          <td className="amount-col" style={{ fontWeight: 'bold', color: '#10b981' }}>
                            {txn.creditAmount > 0 ? `₹${txn.creditAmount.toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Grand totals and tax section */}
                <div className="totals-section">
                  <div className="total-line">
                    <span className="detail-label">Total Room Rent & Service Charges:</span>
                    <span className="detail-val">₹{selectedFolio.totalCharges.toFixed(2)}</span>
                  </div>
                  <div className="total-line">
                    <span className="detail-label">CGST (9%):</span>
                    <span className="detail-val">₹{(selectedFolio.totalCharges * 0.09).toFixed(2)}</span>
                  </div>
                  <div className="total-line">
                    <span className="detail-label">SGST (9%):</span>
                    <span className="detail-val">₹{(selectedFolio.totalCharges * 0.09).toFixed(2)}</span>
                  </div>
                  <div className="total-line">
                    <span className="detail-label">Total Payments & Deposits:</span>
                    <span className="detail-val" style={{ color: '#10b981' }}>₹{selectedFolio.totalPayments.toFixed(2)}</span>
                  </div>
                  <div className="total-line grand-total">
                    <span>Balance Due:</span>
                    <span>₹{selectedFolio.closingBalance.toFixed(2)}</span>
                  </div>
                </div>

                {/* Fine print */}
                <div className="footer">
                  <p>Thank you for choosing to stay with us. We look forward to welcoming you again.</p>
                  <p style={{ marginTop: '4px', fontSize: '9px' }}>This is a computer-generated tax invoice and requires no signature.</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    }>
      <BillingContent />
      <Toaster position="top-right" richColors />
    </Suspense>
  );
}
