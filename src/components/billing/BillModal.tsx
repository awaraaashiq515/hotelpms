'use client';

import React, { useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { 
  X, Search, User, ReceiptText, 
  Printer, CreditCard, CheckCircle2,
  Banknote, QrCode, Smartphone
} from 'lucide-react';
import { format } from 'date-fns';

export interface BillData {
  orderNo: string;
  tableNo?: string;
  roomId?: string;
  tableId?: string;
  orderId?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    hsnCode?: string;
  }[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  createdAt: string;
}

interface BillModalProps {
  bill: BillData | null;
  onClose: () => void;
  onSettle?: (paymentModeId: string, guestId?: string, driverId?: string) => Promise<void>;
  paymentModes?: any[];
  customers?: any[];
  onAddCustomer?: (data: { firstName: string; lastName: string; mobile: string }) => Promise<any>;
  isProforma?: boolean;
  autoPrint?: boolean;
}

export const BillModal: React.FC<BillModalProps> = ({ bill, onClose, isProforma = true, onSettle, paymentModes, customers = [], onAddCustomer, autoPrint = false }) => {
  const [isSettling, setIsSettling] = React.useState(false);
  const [selectedModeId, setSelectedModeId] = React.useState<string | null>(null);
  // Search and Select Customer State
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [showAddCustomer, setShowAddCustomer] = React.useState(false);
  const [selectedGuestId, setSelectedGuestId] = React.useState<string>('');
  
  // Quick Add Customer State
  const [newCustFirst, setNewCustFirst] = React.useState('');
  const [newCustLast, setNewCustLast] = React.useState('');
  const [newCustMobile, setNewCustMobile] = React.useState('');
  const [isAddingCustomer, setIsAddingCustomer] = React.useState(false);

  // Property Branding State
  const [property, setProperty] = React.useState<any>(null);

  React.useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProperty(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch property branding:', err));
  }, []);

  // Auto-print logic
  React.useEffect(() => {
    if (autoPrint && property && bill) {
      handlePrint();
      onClose();
    }
  }, [autoPrint, property, bill]);

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch) return customers.slice(0, 5);
    const s = customerSearch.toLowerCase();
    return customers.filter(c => 
        (c.firstName + ' ' + c.lastName).toLowerCase().includes(s) || 
        c.mobile?.includes(s)
    ).slice(0, 10);
  }, [customers, customerSearch]);

  if (!bill) return null;

  const handleSettle = async () => {
    if (!onSettle || !selectedModeId) return;
    setIsSettling(true);
    try {
      await onSettle(selectedModeId, selectedGuestId || undefined, (bill as any).driverId || undefined);
      // Brief delay for the UI to update to the "Final Invoice" view before printing
      setTimeout(() => {
        handlePrint();
        onClose();
      }, 150);
    } catch (err) {
      console.error('Settlement failed', err);
    } finally {
      setIsSettling(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) return;

    const subtotalAmt = bill.subtotal || 0;
    const taxAmt = bill.tax || (subtotalAmt * 0.05);
    const grandTotalAmt = bill.grandTotal || (subtotalAmt + taxAmt);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${bill.orderNo}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              width: 80mm; 
              padding: 8mm 4mm; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 11px; 
              color: #000; 
              line-height: 1.1; 
              background: #fff;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .dashed-line { border-top: 1.5px dashed #000; margin: 2mm 0; width: 100%; height: 0; }
            .double-line { border-top: 2.5px solid #000; margin: 3mm 0; }
            table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
            th { text-align: left; border-bottom: 1.5px dashed #000; padding: 1mm 0; font-weight: 900; font-size: 10px; }
            td { vertical-align: top; padding: 1.5mm 0; font-weight: 900; }
            .item-name { display: block; font-size: 10px; margin-bottom: 0.5mm; }
            .hsn { font-size: 8px; font-weight: normal; opacity: 0.8; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 1mm; font-weight: 900; font-size: 11px; }
            .grand-total { font-size: 16px; font-weight: 900; margin-top: 2mm; }
            .footer { margin-top: 10mm; font-size: 9px; opacity: 0.8; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 1000);">
          <div class="text-center font-bold">
            <h1 style="font-size: 20px; margin-bottom: 1mm;">${property?.name || 'POS RESTAURANT'}</h1>
            ${property?.address ? `<p style="font-size: 9px; font-weight: normal; margin-bottom: 0.5mm;">${property.address}</p>` : ''}
            ${property?.phone ? `<p style="font-size: 9px; font-weight: normal; margin-bottom: 0.5mm;">PH: ${property.phone}</p>` : ''}
            ${property?.taxDetails ? `<p style="font-size: 9px; font-weight: 900; margin-bottom: 1mm;">GSTIN: ${property.taxDetails}</p>` : ''}
            <p style="font-size: 10px; margin-top: 1mm;">${format(new Date(bill.createdAt), 'dd/MM/yyyy HH:mm')}</p>
          </div>

          <div class="double-line" style="margin-top: 4mm;"></div>
          <div class="text-center font-bold" style="font-size: 13px; letter-spacing: 2px;">${isProforma ? 'PROFORMA INVOICE' : 'TAX INVOICE'}</div>
          <div class="double-line" style="margin-bottom: 4mm;"></div>

          <div class="font-bold uppercase" style="font-size: 10px;">
            <div class="total-row"><span>BILL NO:</span> <span>${bill.orderNo}</span></div>
            <div class="total-row"><span>TABLE:</span> <span style="font-size: 14px;">${bill.tableNo || 'WALK-IN'}</span></div>
          </div>

          <div class="dashed-line" style="margin: 3mm 0;"></div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">QTY</th>
                <th style="width: 55%;">DESCRIPTION</th>
                <th style="width: 30%; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => `
                <tr>
                  <td>${item.quantity}</td>
                  <td class="uppercase">
                    ${item.name}
                    ${item.hsnCode ? `<br/><span class="hsn">HSN: ${item.hsnCode}</span>` : ''}
                  </td>
                  <td class="text-right">₹${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="dashed-line" style="margin: 3mm 0;"></div>

          <div class="font-bold uppercase" style="font-size: 10px;">
            <div class="total-row"><span>SUB-TOTAL:</span> <span>₹${subtotalAmt.toFixed(2)}</span></div>
            <div class="total-row"><span>TAX (5%):</span> <span>₹${taxAmt.toFixed(2)}</span></div>
            <div class="total-row" style="font-size: 8px; opacity: 0.6;"><span>(CGST 2.5% + SGST 2.5%)</span></div>
          </div>

          <div class="double-line"></div>
          <div class="grand-total font-bold" style="display: flex; justify-content: space-between;">
            <span>TOTAL PAYABLE:</span>
            <span>₹${grandTotalAmt.toFixed(2)}</span>
          </div>
          <div class="double-line"></div>

          <div class="text-center font-bold footer">
            <p style="font-size: 13px; margin-bottom: 2mm;">THANK YOU!</p>
            <p uppercase>VISIT AGAIN • HAVE A NICE DAY</p>
            <div style="border-top: 1px dotted #000; margin-top: 4mm; padding-top: 2mm; opacity: 0.5;">
               <p style="font-size: 8px;">POWERED BY ANTIGRAVITY POS</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAddCustomer = async () => {
    if (!onAddCustomer) return;
    if (!newCustFirst || !newCustMobile) {
        alert('Please fill First Name and Mobile');
        return;
    }
    setIsAddingCustomer(true);
    try {
        const newGuest = await onAddCustomer({
            firstName: newCustFirst,
            lastName: newCustLast,
            mobile: newCustMobile
        });
        setSelectedGuestId(newGuest.id);
        setCustomerSearch(`${newGuest.firstName} ${newGuest.lastName || ''}`);
        setShowAddCustomer(false);
        // Reset form
        setNewCustFirst('');
        setNewCustLast('');
        setNewCustMobile('');
    } catch (err: any) {
        alert(err.message);
    } finally {
        setIsAddingCustomer(false);
    }
  };

  return (
    <Modal isOpen={!!bill} onClose={onClose} title={isProforma ? "Order Settlement" : "Bill Details"} maxWidth="4xl">
      <div className="mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* LEFT: THE BILL (Visual) - 4 Cols */}
          <div className="lg:col-span-12 xl:col-span-5 bg-white p-6 border border-gray-100 shadow-xl rounded-[2rem] overflow-hidden relative flex flex-col" id="printable-bill">
            <button 
              onClick={() => handlePrint()} 
              className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900 print:hidden z-20"
              title="Print Bill"
            >
              <Printer size={16} />
            </button>
            {/* Header */}
            <div className="text-center mb-10 relative z-10">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-none">
                {property?.name || 'POS RESTAURANT'}
              </h2>
              {property?.address && (
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mt-2 max-w-[200px] mx-auto">
                    {property.address}
                </p>
              )}
              <div className="w-12 h-1 bg-indigo-600 mx-auto mt-6 rounded-full opacity-20"></div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-4 mb-10 relative z-10">
              <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                <span className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Order ID</span>
                <span className="font-black text-gray-900 text-xs">{bill.orderNo}</span>
              </div>
              <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                <span className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Table Name</span>
                <span className="font-black text-indigo-600 text-xs">Table {bill.tableNo}</span>
              </div>
              <div className="flex justify-between items-end border-b border-gray-50 pb-2">
                <span className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Timestamp</span>
                <span className="font-black text-gray-900 text-[10px]">{format(new Date(bill.createdAt), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>

            {/* Items Table - Strict Column Alignment */}
            <div className="mb-4 relative z-10 flex-1 flex flex-col min-h-[220px]">
              <div className="grid grid-cols-[1fr_75px_65px] gap-2 text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 border-b-2 border-gray-100 pb-2 px-1">
                <span>Description</span>
                <span className="text-center">Qty × Price</span>
                <span className="text-right">Total</span>
              </div>
              <div className="space-y-3 overflow-y-auto no-scrollbar max-h-[350px] px-1">
                {bill.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_75px_65px] gap-2 items-start py-0.5 group">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-gray-900 leading-tight uppercase group-hover:text-indigo-600 transition-colors">{item.name}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-bold text-gray-400 tabular-nums">{item.quantity} × {item.price.toFixed(0)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] font-black text-gray-900 tabular-nums tracking-tighter">₹{(item.quantity * item.price).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Section */}
            <div className="border-t border-dashed border-gray-200 pt-4 space-y-1 relative z-10 mt-auto">
              <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-gray-900 font-bold">₹{bill.subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest pb-2 border-b border-gray-50">
                <span>Tax (5%)</span>
                <span className="text-gray-900 font-bold">₹{bill.tax.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-xl mt-3 shadow-lg print:border-t-2 print:border-black print:bg-white print:text-black print:rounded-none">
                <div>
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] opacity-40 block mb-0.5 print:text-[8px] print:font-bold">Payable</span>
                    <span className="text-2xl font-black text-white leading-none print:text-black">₹{bill.grandTotal.toFixed(0)}</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/5 print:hidden">
                    <ReceiptText size={18} className="text-indigo-400" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: SETTLEMENT CONTROLS - 7 Cols */}
          <div className="lg:col-span-7 flex flex-col gap-5 print:hidden">
            
            {/* Customer Management */}
            {isProforma && onSettle && (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col">
                <div className="p-4 bg-gray-50/50 border-b border-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">Guest</h4>
                      <p className="text-[12px] font-black text-gray-900 uppercase">Select Customer</p>
                    </div>
                  </div>
                  {!showAddCustomer && (
                    <button 
                      type="button" 
                      onClick={() => setShowAddCustomer(true)}
                      className="px-3 py-1.5 bg-white text-[9px] font-black uppercase text-indigo-600 rounded-lg border border-indigo-50 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      + New
                    </button>
                  )}
                </div>

                <div className="p-6">
                  {showAddCustomer ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">New Guest Profile</span>
                        <button type="button" onClick={() => setShowAddCustomer(false)} className="text-gray-300 hover:text-red-500">
                          <X size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <input 
                          placeholder="First Name" 
                          value={newCustFirst} 
                          onChange={e => setNewCustFirst(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase"
                        />
                        <input 
                          placeholder="Last Name" 
                          value={newCustLast} 
                          onChange={e => setNewCustLast(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase"
                        />
                      </div>
                      <input 
                        placeholder="Mobile Contact" 
                        value={newCustMobile} 
                        onChange={e => setNewCustMobile(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-indigo-500 focus:bg-white transition-all mb-4"
                      />
                      <Button 
                        loading={isAddingCustomer}
                        onClick={handleAddCustomer}
                        className="w-full h-12 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-indigo-50"
                      >
                        Create Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative group">
                        <input 
                          type="text"
                          placeholder="Find customer..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-black outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto no-scrollbar">
                        {filteredCustomers.map(c => (
                          <button 
                            key={c.id} 
                            type="button"
                            onClick={() => {
                              setSelectedGuestId(selectedGuestId === c.id ? '' : c.id);
                              setCustomerSearch(selectedGuestId === c.id ? '' : `${c.firstName} ${c.lastName || ''}`);
                            }}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                              selectedGuestId === c.id 
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                              : 'border-transparent bg-gray-50 group hover:border-indigo-100'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${
                              selectedGuestId === c.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 border border-gray-100'
                            }`}>
                              {c.firstName[0]}{c.lastName?.[0]}
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[12px] font-black truncate uppercase text-gray-900 leading-none mb-1">{c.firstName} {c.lastName}</p>
                                <p className="text-[10px] font-bold text-gray-400 opacity-60">+{c.mobile}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment & Checkout */}
            {isProforma && onSettle && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">Checkout</h4>
                    <p className="text-[12px] font-black text-gray-900 uppercase">Payment Method</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {paymentModes?.map(mode => {
                    const isSelected = selectedModeId === mode.id;
                    let Icon = Banknote;
                    if (mode.name.toLowerCase().includes('card')) Icon = CreditCard;
                    if (mode.name.toLowerCase().includes('upi') || mode.name.toLowerCase().includes('qr')) Icon = QrCode;
                    if (mode.name.toLowerCase().includes('wallet')) Icon = Smartphone;

                    return (
                      <button 
                        key={mode.id} 
                        type="button"
                        onClick={() => setSelectedModeId(isSelected ? null : mode.id)}
                        className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 active:scale-95 ${
                          isSelected 
                          ? 'border-indigo-600 bg-white shadow-lg ring-2 ring-indigo-50' 
                          : 'border-transparent bg-gray-50 hover:bg-white hover:border-indigo-100 text-gray-400'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-gray-300 border border-gray-100'}`}>
                          <Icon size={20} />
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest text-center leading-none ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                          {mode.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-auto">
                  <Button 
                    loading={isSettling}
                    disabled={!selectedModeId}
                    onClick={handleSettle}
                    className={`w-full h-16 text-white font-black uppercase rounded-2xl transition-all flex items-center justify-between overflow-hidden shadow-xl active:scale-[0.98] ${
                      selectedModeId 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' 
                      : 'bg-gray-50 border border-gray-100 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 pl-6">
                       <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedModeId ? 'bg-white/20' : 'bg-gray-200'}`}>
                         <Printer size={18} className={selectedModeId ? 'text-white' : 'text-gray-400'} />
                       </div>
                       <div className="text-left">
                         <p className="text-[7px] uppercase tracking-[0.2em] opacity-60">Complete</p>
                         <p className="text-sm font-black tracking-tight">Save & Print</p>
                       </div>
                    </div>
                    <div className={`h-full flex flex-col justify-center items-end px-6 border-l transition-colors ${selectedModeId ? 'bg-black/10 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                       <span className={`text-[7px] uppercase tracking-widest ${selectedModeId ? 'text-white/40' : 'text-gray-400'}`}>Payable</span>
                       <span className={`text-xl font-black ${selectedModeId ? 'text-white' : 'text-gray-300'}`}>₹{bill.grandTotal.toFixed(0)}</span>
                    </div>
                  </Button>
                  
                  <div className="flex justify-center mt-3">
                    <button onClick={onClose} className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-red-500 transition-colors py-1 px-4">
                        Cancel & Return
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
