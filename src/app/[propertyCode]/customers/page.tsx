'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Filter, Edit, Trash2, User, Wallet, CheckCircle2,
  RefreshCcw, Search, Receipt, DollarSign, Truck, Phone, 
  Navigation, Clock, ArrowRight, X, AlertCircle 
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { customersApi, Customer } from '@/lib/api/customers';
import { paymentModesApi } from '@/lib/api/payment-modes';
import { Modal } from '@/components/ui/Modal';
import { CustomerForm } from '@/components/forms/customer-form';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';
import { useToast } from '@/components/ui/Toast';
import { useRouter, useParams } from 'next/navigation';

const STATUS_STEPS = [
  { key: 'PLACED',           label: 'Placed',          color: 'bg-blue-500',    text: 'text-blue-300',    bg: 'bg-blue-400/20 border-blue-400/30' },
  { key: 'ACCEPTED',         label: 'Accepted',         color: 'bg-indigo-500',  text: 'text-indigo-300',  bg: 'bg-indigo-400/20 border-indigo-400/30' },
  { key: 'IN_KITCHEN',       label: 'In Kitchen',       color: 'bg-amber-500',   text: 'text-amber-300',   bg: 'bg-amber-400/20 border-amber-400/30' },
  { key: 'READY',            label: 'Ready',            color: 'bg-teal-500',    text: 'text-teal-300',    bg: 'bg-teal-400/20 border-teal-400/30' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'bg-purple-500',  text: 'text-purple-300',  bg: 'bg-purple-400/20 border-purple-400/30' },
  { key: 'SETTLED',          label: 'Delivered',        color: 'bg-emerald-500', text: 'text-emerald-300', bg: 'bg-emerald-400/20 border-emerald-400/30' },
];

function getStatusConfig(status: string) {
  return STATUS_STEPS.find(s => s.key === status) || { key: status, label: status, color: 'bg-slate-500', text: 'text-slate-350', bg: 'bg-slate-400/20 border-slate-400/30' };
}

function getElapsedMinutes(dateStr: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch { return dateStr; }
}

export default function CustomerListingPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';

  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'guests' | 'qr-orders'>('guests');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [selectedModeId, setSelectedModeId] = useState('');

  // Stats and orders states
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBills: 0, totalRevenue: 0, activeBillsCount: 0 });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersApi.list();
      setCustomers(data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsAndOrders = async (silent = false) => {
    if (!silent) setOrdersLoading(true);
    try {
      const res = await fetch(`/api/admin/delivery-flyer/stats?propertyCode=${propertyCode || ''}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.orders);
        setStats(json.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch delivery flyer stats:', err);
    } finally {
      if (!silent) setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    paymentModesApi.list().then(setPaymentModes).catch(console.error);

    // Read tab from query parameters
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search);
      const tab = q.get('tab');
      if (tab === 'qr-orders') {
        setActiveTab('qr-orders');
      } else {
        setActiveTab('guests');
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'qr-orders') {
      fetchStatsAndOrders();
    }
  }, [activeTab]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/pos-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchStatsAndOrders(true);
        showToast('Order status updated successfully', 'success');
      }
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSettle = async () => {
    if (!selectedCustomer || !selectedModeId) return;
    setMutationLoading(true);
    try {
      await customersApi.settleBalance(selectedCustomer.id, {
        paymentModeId: selectedModeId,
        amount: selectedCustomer.pendingBalance || 0
      });
      showToast('Balance settled successfully', 'success');
      setIsSettleOpen(false);
      fetchCustomers();
    } catch (error: any) {
      showToast(error.message || 'Failed to settle balance', 'error');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: Partial<Customer>) => {
    setMutationLoading(true);
    try {
      if (selectedCustomer) {
        await customersApi.update(selectedCustomer.id, data);
        showToast('Customer updated successfully', 'success');
      } else {
        await customersApi.create(data);
        showToast('Customer added successfully', 'success');
      }
      setIsFormOpen(false);
      fetchCustomers();
    } catch (error: any) {
      showToast(error.message || 'Operation failed', 'error');
      console.error('Operation failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setMutationLoading(true);
    try {
      await customersApi.delete(selectedCustomer.id);
      showToast('Customer deleted successfully', 'success');
      setIsDeleteOpen(false);
      fetchCustomers();
    } catch (error: any) {
      showToast(error.message || 'Delete failed', 'error');
      console.error('Delete failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const filteredCustomers = (customers || []).filter((c: Customer) => {
    const searchLower = search.toLowerCase();
    const fullName = `${c.firstName} ${c.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (c.mobile || '').includes(search) ||
      (c.email || '').toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    { 
      header: 'Mobile', 
      cell: (row: Customer) => (
        <span className="font-mono font-bold text-gray-900 dark:text-slate-100">{row.mobile || 'N/A'}</span>
      ),
      width: '150px'
    },
    { 
      header: 'Guest Detail', 
      cell: (row: Customer) => (
        <Link href={`/customers/${row.id}`} className="flex items-center gap-3 hover:text-pos-primary transition-all">
          <div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary shrink-0">
             <User size={14} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight truncate hover:underline">
              {row.firstName} {row.lastName || ''}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-slate-400 font-medium truncate">{row.email || 'No email'}</span>
          </div>
        </Link>
      ),
      width: '300px'
    },
    { 
      header: 'Loyalty Points', 
      cell: (row: Customer) => (
        <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md tracking-tighter">
          {row.loyaltyPoints} PTS
        </span>
      ),
      width: '120px'
    },
    { 
      header: 'Pending Balance', 
      cell: (row: Customer) => (
        <div className="flex flex-col">
          <span className={`text-xs font-black px-2 py-1 rounded-md tracking-tighter w-fit ${
            (row.pendingBalance || 0) > 0 
            ? 'text-red-600 bg-red-50 dark:bg-red-500/10' 
            : 'text-gray-400 bg-gray-50 dark:bg-slate-800'
          }`}>
            ₹{(row.pendingBalance || 0).toLocaleString()}
          </span>
          {(row.pendingBalance || 0) > 0 && (
            <button 
              onClick={() => {
                setSelectedCustomer(row);
                setIsSettleOpen(true);
              }}
              className="text-[10px] font-black text-pos-primary hover:underline mt-1 flex items-center gap-1 uppercase"
            >
              <CheckCircle2 size={10} />
              Settle Now
            </button>
          )}
        </div>
      ),
      width: '150px'
    },
    { 
      header: 'Recent Address', 
      cell: (row: Customer) => (
        <span className="text-[11px] text-gray-400 dark:text-slate-400 truncate max-w-[200px] block italic line-clamp-1">
          {row.address || 'No address provided'}
        </span>
      )
    },
    { 
      header: 'Actions', 
      cell: (row: Customer) => (
        <div className="flex items-center gap-2">
           <button 
             onClick={() => {
                setSelectedCustomer(row);
                setIsFormOpen(true);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 hover:text-pos-primary transition-colors"
            >
             <Edit size={16} />
           </button>
           <button 
             onClick={() => {
                setSelectedCustomer(row);
                setIsDeleteOpen(true);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-600 transition-colors"
            >
             <Trash2 size={16} />
           </button>
        </div>
      ),
      width: '100px'
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title={activeTab === 'qr-orders' ? "Home Delivery QR Tracker" : "Customer Listing"} 
        subtitle={activeTab === 'qr-orders' ? "Track and manage bills placed from the QR flyer" : "Guest Relationship Management"}
        showBack
        backUrl={`${p}/operations`}
        actions={
          activeTab === 'qr-orders' ? (
            <Button 
              onClick={() => fetchStatsAndOrders()}
              className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-200 flex items-center gap-1.5"
            >
               <RefreshCcw size={14} className={ordersLoading ? 'animate-spin' : ''} />
               REFRESH ORDERS
            </Button>
          ) : (
            <Button 
              onClick={() => {
                setSelectedCustomer(null);
                setIsFormOpen(true);
              }}
              className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-200"
            >
               ADD NEW GUEST
            </Button>
          )
        }
      />

      {/* CRM Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
        <button
          onClick={() => {
            setActiveTab('guests');
            window.history.pushState({}, '', `${p}/customers?tab=guests`);
          }}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
            activeTab === 'guests'
              ? 'bg-pos-primary text-white shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Guests List
        </button>

        <button
          onClick={() => {
            setActiveTab('qr-orders');
            window.history.pushState({}, '', `${p}/customers?tab=qr-orders`);
          }}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
            activeTab === 'qr-orders'
              ? 'bg-pos-primary text-white shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Home Delivery QR
        </button>

        <Link
          href="/customers/campaigns"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Marketing Campaigns
        </Link>
        <Link
          href="/customers/coupons"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Smart Coupons
        </Link>
        <Link
          href="/customers/loyalty-settings"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Loyalty Rules
        </Link>
      </div>

      {activeTab === 'guests' && (
        <>
          <SearchToolbar 
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone or email..."
            actions={
              <Button variant="secondary" className="font-bold text-xs tracking-widest gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 dark:text-white px-4">
                <Filter size={16} />
                FILTERS
              </Button>
            }
          />

          <DataTable 
            columns={columns} 
            data={filteredCustomers} 
            loading={loading}
          />
        </>
      )}

      {activeTab === 'qr-orders' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Bills Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Bills Placed</p>
                <p className="text-3xl font-black text-slate-850 dark:text-white">{stats.totalBills}</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold">Orders from Home Delivery QR</p>
              </div>
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-650 dark:text-indigo-400">
                <Receipt size={24} />
              </div>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total QR Revenue</p>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{Math.round(stats.totalRevenue)}</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold">Settled QR order payments</p>
              </div>
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-650 dark:text-emerald-400">
                <DollarSign size={24} />
              </div>
            </div>

            {/* Active Orders Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active QR Orders</p>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.activeBillsCount}</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold">Orders currently in-flight</p>
              </div>
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center justify-center text-amber-650 dark:text-amber-400">
                <Truck size={24} />
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by order no, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655">
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex gap-1.5 flex-wrap overflow-x-auto no-scrollbar">
              {[{ key: 'ALL', label: 'All' }, ...STATUS_STEPS].map((f) => {
                const count = f.key === 'ALL' 
                  ? orders.length 
                  : orders.filter((o: any) => o.status === f.key).length;
                return (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${
                      statusFilter === f.key 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {f.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Grid */}
          {ordersLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <RefreshCcw className="animate-spin text-indigo-500 mb-2" size={24} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading order statistics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders
                .filter((order: any) => {
                  const matchesSearch = 
                    order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (order.deliveryCustomerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (order.deliveryPhone || '').includes(searchQuery);
                  
                  const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((order: any) => {
                  const cfg = getStatusConfig(order.status);
                  const elapsed = getElapsedMinutes(order.createdAt);
                  const isDelivered = order.status === 'SETTLED' || order.status === 'COMPLETED';

                  return (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-5 flex flex-col justify-between gap-4 shadow-sm hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden"
                    >
                      {/* Top Row with ID & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                            #{order.orderNo.slice(-6)} • {formatDate(order.createdAt)}
                          </span>
                          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tight block">
                            {order.orderType === 'TAKEAWAY' ? '🏪 Pickup Order' : '🏠 Direct Delivery'}
                          </span>
                        </div>
                        <Badge className={`rounded-xl border px-2.5 py-0.5 text-[8px] font-black tracking-widest shrink-0 ${cfg.bg} ${cfg.text} border-transparent`}>
                          {cfg.label}
                        </Badge>
                      </div>

                      {/* Customer Details */}
                      <div className="space-y-2 text-[11px] font-semibold text-slate-650 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            👤
                          </div>
                          <span className="text-slate-850 dark:text-white font-extrabold">{order.deliveryCustomerName || 'Guest Customer'}</span>
                        </div>
                        {order.deliveryPhone && (
                          <div className="flex items-center gap-2">
                            <Phone size={10} className="text-indigo-400 shrink-0" />
                            <span>{order.deliveryPhone}</span>
                          </div>
                        )}
                        {order.deliveryAddress && (
                          <div className="flex items-start gap-2">
                            <Navigation size={10} className="text-red-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{order.deliveryAddress}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock size={10} className="text-amber-500 shrink-0" />
                          <span>{isDelivered ? 'Completed' : `${elapsed}m ago`}</span>
                        </div>
                      </div>

                      {/* Ordered Items list */}
                      {order.items?.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-1.5">
                          {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                              <span className="truncate max-w-[170px]">{item.product?.name || item.name}</span>
                              <span className="text-indigo-500 font-black">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Divider */}
                      <div className="h-px bg-slate-100 dark:bg-slate-800/60 w-full" />

                      {/* Bottom row with pricing and primary actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Bill</span>
                          <span className="text-sm font-black text-indigo-650 dark:text-indigo-400">₹{Math.round(order.grandTotal || 0)}</span>
                        </div>

                        {/* Interactive operations actions */}
                        <div className="flex items-center gap-1.5">
                          {(order.status === 'OPEN' || order.status === 'PENDING' || order.status === 'PLACED') && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                              disabled={updatingOrderId === order.id}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-1 cursor-pointer animate-pulse"
                            >
                              Accept
                            </button>
                          )}
                          {!isDelivered && (
                            <button
                              onClick={() => router.push(`${p}/operations/delivery`)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-white font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Dispatch <ArrowRight size={9} />
                            </button>
                          )}
                          {isDelivered && (
                            <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                              <CheckCircle2 size={10} /> Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {orders.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                  <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    <AlertCircle size={20} className="text-slate-400" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No QR orders recorded yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Forms & Modals */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={selectedCustomer ? 'Edit Guest' : 'New Guest'}
      >
        <CustomerForm 
          initialData={selectedCustomer || undefined}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => setIsFormOpen(false)}
          loading={mutationLoading}
        />
      </Modal>

      {isDeleteOpen && (
        <ConfirmDeleteModal 
          title="Delete Guest"
          message={`Are you sure you want to delete profile of "${selectedCustomer?.firstName} ${selectedCustomer?.lastName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
          loading={mutationLoading}
        />
      )}

      {/* Settle Balance Modal */}
      <Modal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        title="Settle Pending Balance"
      >
        <div className="space-y-6 p-4">
          <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Outstanding</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">₹{selectedCustomer?.pendingBalance?.toLocaleString()}</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Payment Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {paymentModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedModeId(mode.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedModeId === mode.id
                    ? 'border-pos-primary bg-pos-primary/5 ring-4 ring-pos-primary/10'
                    : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-400'
                  }`}
                >
                  <p className={`text-xs font-black uppercase tracking-widest ${selectedModeId === mode.id ? 'text-pos-primary' : ''}`}>
                    {mode.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="secondary" 
              className="flex-1 font-bold py-6 rounded-xl"
              onClick={() => setIsSettleOpen(false)}
            >
              CANCEL
            </Button>
            <Button 
              className="flex-1 bg-pos-primary hover:bg-red-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-red-200 dark:shadow-none disabled:opacity-50"
              onClick={handleSettle}
              disabled={!selectedModeId || mutationLoading}
            >
              {mutationLoading ? 'SETTLING...' : 'CONFIRM PAYMENT'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
