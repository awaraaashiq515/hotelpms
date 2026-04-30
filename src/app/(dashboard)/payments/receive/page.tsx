'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customersApi, Customer } from '@/lib/api/customers';
import { invoicesApi, Invoice } from '@/lib/api/invoices';
import { paymentsApi } from '@/lib/api/payments';
import { paymentModesApi, PaymentMode } from '@/lib/api/payment-modes';
import { accountsApi, Account } from '@/lib/api/accounts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';

export default function ReceivePaymentPage() {
  const router = useRouter();
  const { addToast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Selection State
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  
  // Payment Form State
  const [amount, setAmount] = useState('');
  const [paymentModeId, setPaymentModeId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  
  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedGuestId) {
      fetchGuestInvoices(selectedGuestId);
    } else {
      setInvoices([]);
      setSelectedInvoiceId('');
    }
  }, [selectedGuestId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [cData, mData, aData] = await Promise.all([
        customersApi.list(),
        paymentModesApi.list(),
        accountsApi.list()
      ]);
      setCustomers(cData || []);
      setPaymentModes(mData || []);
      setAccounts(aData || []);
      
      // Auto-select first cash account and mode
      if (mData?.length > 0) setPaymentModeId(mData[0].id);
      if (aData?.length > 0) setAccountId(aData[0].id);
    } catch (err) {
      console.error('Data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestInvoices = async (guestId: string) => {
    try {
      // Fetch all invoices for guest, we'll filter for non-PAID here
      const data = await invoicesApi.list({ guestId });
      const pendingInvoices = data.filter(inv => inv.paymentStatus !== 'PAID' && inv.invoiceStatus !== 'CANCELLED');
      setInvoices(pendingInvoices);
      if (pendingInvoices.length > 0) {
        setSelectedInvoiceId(pendingInvoices[0].id);
        setAmount((pendingInvoices[0].dueAmount ?? 0).toString());
      }
    } catch (err) {
      console.error('Invoice fetch failed:', err);
    }
  };

  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = invoices.find(i => i.id === id);
    if (inv) setAmount((inv.dueAmount ?? 0).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !amount || !paymentModeId || !accountId) {
      addToast('error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await paymentsApi.create({
        sourceId: selectedInvoiceId,
        sourceType: 'INVOICE',
        paidAmount: parseFloat(amount),
        paymentModeId,
        accountId,
        referenceNo
      });
      addToast('success', 'Payment received and invoice updated!');
      router.push('/payments');
    } catch (err: any) {
      addToast('error', err.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading Form...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Receive Payment"
        subtitle="Settle outstanding balances manually"
        showBack
        backUrl="/payments"
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Settlement Details</h3>
            
            <div className="space-y-4">
              <Select
                label="Customer / Guest"
                value={selectedGuestId}
                onChange={(e) => setSelectedGuestId(e.target.value)}
                options={[
                  { label: 'Select a Customer', value: '' },
                  ...customers.map(c => ({ label: `${c.firstName} ${c.lastName || ''} (${c.mobile || 'No Mobile'})`, value: c.id }))
                ]}
              />

              {selectedGuestId && (
                <Select
                  label="Select Invoice"
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  options={invoices.length > 0 
                    ? invoices.map((inv: any) => ({ label: `${inv.invoiceNo} (Due: ₹${inv.dueAmount})`, value: inv.id }))
                    : [{ label: 'No pending invoices found', value: '' }]
                  }
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Amount to Receive"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter Amount"
                  required
                />
                <Input
                  label="Reference No (Optional)"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="UPI Ref / Check No"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Payment Mode & Account</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Payment Mode"
                value={paymentModeId}
                onChange={(e) => setPaymentModeId(e.target.value)}
                options={paymentModes.map(m => ({ label: m.name, value: m.id }))}
              />
              <Select
                label="Receiving Account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                options={accounts.map(a => ({ label: a.name, value: a.id }))}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-pos-sidebar text-white border-transparent">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-4">Invoice Information</h3>
            {selectedInvoice ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Invoce No</p>
                    <p className="text-lg font-black">{selectedInvoice.invoiceNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total</p>
                    <p className="text-lg font-black italic">₹{selectedInvoice.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60 font-medium">Already Paid</span>
                    <span className="font-bold">₹{(selectedInvoice.paidAmount ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60 font-medium">Current Balance</span>
                    <span className="font-black text-orange-400">₹{(selectedInvoice.dueAmount ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Closing Balance</span>
                    <span className="text-xl font-black text-emerald-400">
                      ₹{((selectedInvoice.dueAmount ?? 0) - (parseFloat(amount) || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest py-8 text-center">Select an invoice to see details</p>
            )}
          </Card>

          <Button 
            onClick={handleSubmit}
            disabled={submitting || !selectedInvoiceId}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-4 flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
          >
            {submitting ? 'Processing...' : (
              <>
                <Save size={20} />
                <span className="font-bold uppercase tracking-widest text-sm">Post Payment</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
