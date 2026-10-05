'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench, Plus, Search, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, User, Bed, Calendar,
  Circle, AlertCircle, Zap, ChevronRight, X,
  ShoppingBag, Truck, FileText, Phone, Mail,
  MapPin, ShieldCheck, ArrowRight, Layers,
  ExternalLink, Printer, Check, Boxes, Cog,
  DollarSign, PackageCheck, AlertOctagon, Sparkles, Building2
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────
interface MaintenanceTicket {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  category: string;
  reportedAt: string;
  resolvedAt?: string;
  room?: { roomNumber: string; floor?: string };
  assignedTo?: string;
}

interface SparePart {
  id: string;
  name: string;
  partNumber?: string;
  category: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  unitCost: number;
  preferredVendor?: string;
  location?: string;
}

interface PartReplacement {
  id: string;
  ticketId?: string;
  ticketTitle: string;
  partName: string;
  category: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  locationFitted: string;
  breakdownReason?: string;
  damageCondition?: string;
  replacedBy?: string;
  poNumber?: string;
  status: string;
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorPhone?: string;
  vendorEmail?: string;
  department: string;
  status: 'DRAFT' | 'ORDERED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  itemsCount: number;
  items: Array<{ name: string; qty: number; unit: string; unitPrice: number; total: number }>;
  deliveryDate?: string;
  notes?: string;
  source?: string;
  linkedTicketNo?: string;
  createdBy?: string;
  createdAt: string;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  paymentTerms?: string;
  rating?: number;
}

interface AutoReorderItem {
  id: string;
  itemName: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  suggestedQty: number;
  unit: string;
  unitCost: number;
  estimatedTotal: number;
  vendorName: string;
  reason: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.FC<any> }> = {
  LOW:    { label: 'Low',    color: 'text-slate-400',  bg: 'bg-slate-700/40 border-slate-600/30',   dot: 'bg-slate-500',  icon: Circle },
  MEDIUM: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', dot: 'bg-yellow-400', icon: AlertCircle },
  HIGH:   { label: 'High',   color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', dot: 'bg-orange-400', icon: AlertTriangle },
  URGENT: { label: 'Urgent', color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',       dot: 'bg-red-400 animate-pulse', icon: Zap },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:        { label: 'Open',        color: 'text-sky-400',     bg: 'bg-sky-500/15 border-sky-500/30' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30' },
  RESOLVED:    { label: 'Resolved',    color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  CLOSED:      { label: 'Closed',      color: 'text-slate-500',   bg: 'bg-slate-700/30 border-slate-600/20' },
};

const PO_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:      { label: 'Draft',       color: 'text-slate-400',   bg: 'bg-slate-800 border-slate-700' },
  ORDERED:    { label: 'Ordered',     color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30' },
  IN_TRANSIT: { label: 'In Transit',  color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30' },
  DELIVERED:  { label: 'Delivered',   color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  CANCELLED:  { label: 'Cancelled',   color: 'text-rose-400',    bg: 'bg-rose-500/15 border-rose-500/30' },
};

const CATEGORIES = ['Electrical', 'Plumbing', 'HVAC', 'Furniture', 'Lock/Hardware', 'Bathroom', 'Electronics', 'Other'];

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'parts' | 'purchases'>('tickets');

  // Tickets state
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '', category: 'Electrical', priority: 'MEDIUM', roomNumber: '', description: '',
  });
  const [ticketPartNeeded, setTicketPartNeeded] = useState(false);
  const [ticketPartData, setTicketPartData] = useState({
    partId: '',
    partName: '',
    category: 'HVAC',
    quantity: 1,
    unitCost: 380,
    damageCondition: 'Burnt / Swollen',
    locationFitted: '',
    generatePO: true,
    vendorName: 'CoolAir HVAC Spares & Refrigeration',
  });

  // Spare Parts & Replacements state
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [replacements, setReplacements] = useState<PartReplacement[]>([]);
  const [partsSummary, setPartsSummary] = useState<any>({});
  const [partsLoading, setPartsLoading] = useState(false);
  const [partCategoryFilter, setPartCategoryFilter] = useState<string>('ALL');
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedTicketForPart, setSelectedTicketForPart] = useState<MaintenanceTicket | null>(null);
  const [showAddPartModal, setShowAddPartModal] = useState(false);

  // New Replacement Form state
  const [replaceForm, setReplaceForm] = useState({
    partId: '',
    partName: '',
    category: 'HVAC',
    quantity: 1,
    unitCost: 0,
    locationFitted: '',
    breakdownReason: '',
    damageCondition: 'Burnt / Swollen',
    replacedBy: '',
    generatePO: false,
    vendorName: '',
  });

  // New Part Catalogue Form state
  const [newPartForm, setNewPartForm] = useState({
    name: '',
    partNumber: '',
    category: 'HVAC',
    unit: 'pcs',
    currentStock: 5,
    minThreshold: 2,
    unitCost: 250,
    preferredVendor: '',
    location: 'Rack A-01',
  });

  // Purchases & PO state
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [autoReorders, setAutoReorders] = useState<AutoReorderItem[]>([]);
  const [purchasesSummary, setPurchasesSummary] = useState<any>({});
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [poStatusFilter, setPoStatusFilter] = useState<string>('ALL');
  const [selectedPOForSlip, setSelectedPOForSlip] = useState<PurchaseOrder | null>(null);
  const [showNewPOModal, setShowNewPOModal] = useState(false);

  // New Custom PO Form state
  const [newPOForm, setNewPOForm] = useState({
    vendorName: '',
    vendorPhone: '',
    vendorEmail: '',
    department: 'Maintenance',
    deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    notes: '',
    items: [{ name: '', qty: 1, unit: 'pcs', unitPrice: 0 }],
  });

  // ── Fetch Tickets ────────────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/maintenance');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped = data.data.map((t: any) => ({
          id: t.id,
          title: t.issueType ? `${t.issueType}: ${t.description || 'Reported Issue'}` : (t.title || 'Maintenance Request'),
          description: t.description,
          priority: t.priority || 'MEDIUM',
          status: t.status || 'OPEN',
          category: t.issueType || 'General',
          reportedAt: t.openedAt || t.createdAt || new Date().toISOString(),
          resolvedAt: t.resolvedAt,
          room: t.room ? { roomNumber: t.room.roomNumber, floor: t.room.floor } : undefined,
          assignedTo: t.assignedTo || t.raisedBy,
        }));
        setTickets(mapped);
      } else {
        // Fallback default sample tickets
        setTickets([
          { id: '1', title: 'AC not cooling properly', priority: 'HIGH', status: 'OPEN', category: 'HVAC', reportedAt: new Date().toISOString(), room: { roomNumber: '101', floor: '1' } },
          { id: '2', title: 'Leaking tap in bathroom', priority: 'MEDIUM', status: 'IN_PROGRESS', category: 'Plumbing', reportedAt: new Date(Date.now() - 3600000).toISOString(), assignedTo: 'Raju', room: { roomNumber: '205', floor: '2' } },
          { id: '3', title: 'TV remote not working', priority: 'LOW', status: 'RESOLVED', category: 'Electronics', reportedAt: new Date(Date.now() - 86400000).toISOString(), resolvedAt: new Date().toISOString(), room: { roomNumber: '310', floor: '3' } },
          { id: '4', title: 'Door lock jammed', priority: 'URGENT', status: 'OPEN', category: 'Lock/Hardware', reportedAt: new Date(Date.now() - 1800000).toISOString(), room: { roomNumber: '402', floor: '4' } },
        ]);
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
    }
  }, []);

  // ── Fetch Spare Parts & Replacements ─────────────────────────────────────────
  const fetchParts = useCallback(async () => {
    setPartsLoading(true);
    try {
      const res = await fetch('/api/hotel/maintenance/parts');
      const data = await res.json();
      if (data.success && data.data) {
        setSpareParts(data.data.parts || []);
        setReplacements(data.data.replacements || []);
        setPartsSummary(data.data.summary || {});
      }
    } catch (e) {
      console.error('Error fetching parts:', e);
    } finally {
      setPartsLoading(false);
    }
  }, []);

  // ── Fetch Purchases, POs & Vendors ───────────────────────────────────────────
  const fetchPurchases = useCallback(async () => {
    setPurchasesLoading(true);
    try {
      const res = await fetch('/api/hotel/maintenance/purchases');
      const data = await res.json();
      if (data.success && data.data) {
        setPurchaseOrders(data.data.purchaseOrders || []);
        setVendors(data.data.vendors || []);
        setAutoReorders(data.data.autoReorderSuggestions || []);
        setPurchasesSummary(data.data.summary || {});
      }
    } catch (e) {
      console.error('Error fetching purchases:', e);
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchParts();
    fetchPurchases();
  }, [fetchTickets, fetchParts, fetchPurchases]);

  // ── Ticket Status Handler ────────────────────────────────────────────────────
  const handleTicketStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/hotel/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Ticket marked as ${newStatus}`);
      }
    } catch (e) {
      // client-side update
    }
    setTickets(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, status: newStatus, resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : t.resolvedAt }
          : t
      )
    );
  };

  // ── Open Replace Part Modal for Ticket ────────────────────────────────────────
  const handleOpenReplaceModal = (ticket?: MaintenanceTicket) => {
    setSelectedTicketForPart(ticket || null);
    setReplaceForm({
      partId: '',
      partName: '',
      category: ticket?.category || 'HVAC',
      quantity: 1,
      unitCost: 350,
      locationFitted: ticket?.room ? `Room ${ticket.room.roomNumber} - ${ticket.title}` : 'General Hotel Equipment',
      breakdownReason: ticket ? `Defect found during maintenance: ${ticket.title}` : '',
      damageCondition: 'Worn Out / Broken',
      replacedBy: 'Duty Engineer',
      generatePO: false,
      vendorName: 'CoolAir HVAC Spares & Refrigeration',
    });
    setShowReplaceModal(true);
  };

  // ── Submit Part Replacement ──────────────────────────────────────────────────
  const handleSubmitReplacement = async () => {
    if (!replaceForm.partName || !replaceForm.locationFitted) {
      toast.error('Please specify Part Name and Equipment / Room Location');
      return;
    }

    try {
      const res = await fetch('/api/hotel/maintenance/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPLACE_PART',
          ticketId: selectedTicketForPart?.id || '',
          ticketTitle: selectedTicketForPart?.title || 'General Maintenance',
          ...replaceForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Part replacement logged! ${data.data.poNumber ? `Linked PO: ${data.data.poNumber}` : ''}`);
        setShowReplaceModal(false);
        fetchParts();
        fetchPurchases();
      } else {
        toast.error(data.error || 'Failed to record replacement');
      }
    } catch (e) {
      toast.error('Network error saving replacement');
    }
  };

  // ── Submit New Spare Part to Catalogue ────────────────────────────────────────
  const handleSubmitNewPart = async () => {
    if (!newPartForm.name) {
      toast.error('Please enter part name');
      return;
    }
    try {
      const res = await fetch('/api/hotel/maintenance/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_NEW_PART',
          ...newPartForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Spare part "${newPartForm.name}" added to inventory!`);
        setShowAddPartModal(false);
        fetchParts();
      } else {
        toast.error(data.error || 'Failed to add spare part');
      }
    } catch (e) {
      toast.error('Error adding spare part');
    }
  };

  // ── 1-Click Auto Generate Ready-Made PO from Low Stock ────────────────────────
  const handleAutoGeneratePO = async (item: AutoReorderItem) => {
    try {
      const poItems = [
        {
          name: item.itemName,
          qty: item.suggestedQty,
          unit: item.unit,
          unitPrice: item.unitCost,
          total: item.estimatedTotal,
        }
      ];

      const res = await fetch('/api/hotel/maintenance/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: item.vendorName,
          department: item.category === 'Chemicals' ? 'Housekeeping' : 'Maintenance',
          items: poItems,
          source: 'LOW_STOCK_AUTO',
          notes: `Auto-generated purchase order: ${item.reason}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ready-made PO ${data.data.poNumber} generated successfully!`);
        fetchPurchases();
      } else {
        toast.error(data.error || 'Failed to generate PO');
      }
    } catch (e) {
      toast.error('Network error generating PO');
    }
  };

  // ── Submit Custom Ready-Made PO ──────────────────────────────────────────────
  const handleCreateCustomPO = async () => {
    if (!newPOForm.vendorName) {
      toast.error('Please select or specify a vendor name');
      return;
    }
    const validItems = newPOForm.items.filter(it => it.name.trim() !== '');
    if (validItems.length === 0) {
      toast.error('Please add at least one line item with description');
      return;
    }

    try {
      const itemsWithTotals = validItems.map(it => ({
        ...it,
        total: Number(it.qty || 1) * Number(it.unitPrice || 0),
      }));

      const res = await fetch('/api/hotel/maintenance/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: newPOForm.vendorName,
          vendorPhone: newPOForm.vendorPhone,
          vendorEmail: newPOForm.vendorEmail,
          department: newPOForm.department,
          deliveryDate: newPOForm.deliveryDate,
          notes: newPOForm.notes,
          items: itemsWithTotals,
          source: 'MANUAL',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Purchase Order ${data.data.poNumber} created and ready for vendor!`);
        setShowNewPOModal(false);
        fetchPurchases();
      } else {
        toast.error(data.error || 'Failed to create PO');
      }
    } catch (e) {
      toast.error('Error creating purchase order');
    }
  };

  // ── Update PO Status ─────────────────────────────────────────────────────────
  const handleUpdatePOStatus = async (poId: string, status: string) => {
    try {
      const res = await fetch('/api/hotel/maintenance/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Purchase Order updated to ${status}`);
        fetchPurchases();
      }
    } catch (e) {
      toast.error('Failed to update PO');
    }
  };

  // ── Filtered Tickets ─────────────────────────────────────────────────────────
  const filteredTickets = tickets.filter(t => {
    const q = ticketSearch.toLowerCase();
    const titleMatch = !q || t.title.toLowerCase().includes(q) || t.room?.roomNumber.includes(q);
    const staMatch = statusFilter === 'all' || t.status === statusFilter;
    const priMatch = priorityFilter === 'all' || t.priority === priorityFilter;
    return titleMatch && staMatch && priMatch;
  });

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const urgentCount = tickets.filter(t => t.priority === 'URGENT' && t.status !== 'RESOLVED').length;
  const resolvedToday = tickets.filter(t => {
    if (!t.resolvedAt) return false;
    const d = new Date(t.resolvedAt).toISOString().split('T')[0];
    return d === new Date().toISOString().split('T')[0];
  }).length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5 mb-1">
            <Wrench size={13} /> Engineering & Facility Operations
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            Maintenance, Parts & Hotel Purchases
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Breakdown repair tickets, spare parts replacement register, vendor directory, and automated purchase orders.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start flex-wrap">
          <button
            onClick={() => {
              fetchTickets();
              fetchParts();
              fetchPurchases();
              toast.success('Refreshed maintenance & procurement data');
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh All"
          >
            <RefreshCw size={14} />
          </button>

          {activeTab === 'tickets' && (
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-900/40 active:scale-95"
            >
              <Plus size={14} /> + New Ticket
            </button>
          )}

          {activeTab === 'parts' && (
            <>
              <button
                onClick={() => handleOpenReplaceModal()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition-all shadow-md active:scale-95"
              >
                <Cog size={14} /> + Log Part Replacement
              </button>
              <button
                onClick={() => setShowAddPartModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-md active:scale-95"
              >
                <Plus size={14} /> + Add Spare Part
              </button>
            </>
          )}

          {activeTab === 'purchases' && (
            <button
              onClick={() => setShowNewPOModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-900/40 active:scale-95"
            >
              <ShoppingBag size={14} /> + New Purchase Order (PO)
            </button>
          )}
        </div>
      </div>

      {/* ── Main Tab Navigation ────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-6 overflow-x-auto text-xs font-black">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'tickets'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench size={15} />
          <span>Breakdown & Repair Tickets</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {tickets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('parts')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'parts'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cog size={15} />
          <span>Spare Parts & Breakdown Replacements</span>
          {partsSummary.lowStockCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px]">
              {partsSummary.lowStockCount} Low
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'purchases'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag size={15} />
          <span>Hotel Purchases & Vendor Orders (Auto PO)</span>
          {autoReorders.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
              {autoReorders.length} Auto Reorder
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: MAINTENANCE TICKETS & REPAIRS                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tickets' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Open Tickets', value: openCount, icon: AlertCircle, color: 'text-sky-400', bg: 'bg-sky-600' },
              { label: 'Work In Progress', value: inProgressCount, icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-600' },
              { label: 'Urgent Attention', value: urgentCount, icon: Zap, color: 'text-red-400', bg: 'bg-red-600' },
              { label: 'Resolved Today', value: resolvedToday, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-700' },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon size={16} className="text-white" />
                </div>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs font-bold text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all ${
                    statusFilter === s
                      ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                      : 'bg-slate-800/40 border border-slate-700/30 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s === 'all' ? 'All Status' : (STATUS_CONFIG[s]?.label || s)}
                </button>
              ))}
              {['all', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all ${
                    priorityFilter === p
                      ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                      : 'bg-slate-800/40 border border-slate-700/30 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {p === 'all' ? 'All Priority' : p}
                </button>
              ))}
            </div>

            <div className="relative sm:ml-auto max-w-xs w-full">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={ticketSearch}
                onChange={e => setTicketSearch(e.target.value)}
                placeholder="Search ticket or room…"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>
          </div>

          {/* Ticket Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTickets.map(ticket => {
              const pri = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.LOW;
              const sta = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
              const PriIcon = pri.icon;

              // Find replacements linked to this ticket or room
              const linkedReplacements = replacements.filter(r =>
                r.ticketTitle?.toLowerCase().includes(ticket.title.toLowerCase()) ||
                (ticket.room && r.locationFitted?.includes(ticket.room.roomNumber))
              );

              return (
                <div
                  key={ticket.id}
                  className={`p-4 rounded-2xl border ${
                    ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'opacity-70' : ''
                  } bg-slate-900/60 border-slate-800/60 hover:border-slate-700/60 transition-all duration-200 group flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-xl ${pri.bg} border flex items-center justify-center shrink-0`}>
                        <PriIcon size={14} className={pri.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-tight">{ticket.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${pri.bg} ${pri.color}`}>
                            {pri.label}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${sta.bg} ${sta.color}`}>
                            {sta.label}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">{ticket.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold mb-3 flex-wrap">
                      {ticket.room && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Bed size={10} /> Room {ticket.room.roomNumber}
                          {ticket.room.floor && ` (F${ticket.room.floor})`}
                        </span>
                      )}
                      {ticket.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User size={10} /> {ticket.assignedTo}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(ticket.reportedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Linked Parts & Breakdown Details */}
                    {linkedReplacements.length > 0 && (
                      <div className="mb-3 p-2.5 rounded-xl bg-slate-950/70 border border-amber-500/20 text-[11px] space-y-1">
                        <div className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                          <Cog size={11} /> Parts Replaced / Needed:
                        </div>
                        {linkedReplacements.map(r => (
                          <div key={r.id} className="text-slate-300 flex items-center justify-between text-[10.5px]">
                            <span>• {r.partName} ({r.quantity} pcs)</span>
                            <span className="font-mono text-emerald-400 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">
                              {r.poNumber || 'IN_STOCK'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleOpenReplaceModal(ticket)}
                      className="w-full py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Cog size={12} /> + Add / Replace Part & PO
                    </button>

                    {ticket.status === 'OPEN' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTicketStatusChange(ticket.id, 'IN_PROGRESS')}
                          className="flex-1 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold hover:bg-amber-500/20 transition-all"
                        >
                          Start Work
                        </button>
                        <button
                          onClick={() => handleTicketStatusChange(ticket.id, 'RESOLVED')}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}

                    {ticket.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleTicketStatusChange(ticket.id, 'RESOLVED')}
                        className="w-full py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
                      >
                        ✓ Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: SPARE PARTS CATALOGUE & BREAKDOWN REPLACEMENTS REGISTER        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'parts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Catalogued Spare Parts</span>
              <div className="text-2xl font-black text-white mt-1">{partsSummary.totalPartTypes || spareParts.length} <span className="text-xs text-slate-400">items</span></div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1">
                <AlertTriangle size={11} /> Below Safe Stock
              </span>
              <div className="text-2xl font-black text-rose-400 mt-1">{partsSummary.lowStockCount || 0} <span className="text-xs text-slate-400">urgent</span></div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Replacements Logged</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{partsSummary.totalReplacementsLogged || replacements.length}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Parts Value Used</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">₹{partsSummary.totalPartsCostUsed || 0}</div>
            </div>
          </div>

          {/* Section 1: In-House Spare Parts Stock */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Boxes size={16} className="text-purple-400" /> In-House Spare Parts Inventory
                </h3>
                <p className="text-xs text-slate-400">
                  Parts on shelf in hotel maintenance storage rack ready for quick replacement.
                </p>
              </div>

              <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px]">
                {['ALL', 'HVAC', 'Plumbing', 'Lock/Hardware', 'Electrical', 'Electronics'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setPartCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      partCategoryFilter === cat ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {spareParts
                .filter(p => partCategoryFilter === 'ALL' || p.category === partCategoryFilter)
                .map(part => {
                  const isLow = Number(part.currentStock) <= Number(part.minThreshold);
                  return (
                    <div
                      key={part.id}
                      className={`p-4 rounded-2xl border ${
                        isLow ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-900/60 border-slate-800/80'
                      } flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            {part.partNumber || 'PART-GEN'}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {part.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{part.name}</h4>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <MapPin size={11} className="text-purple-400" /> {part.location || 'Store Rack'}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-black">Stock on Hand</div>
                          <div className={`text-base font-black ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {part.currentStock} {part.unit}{' '}
                            {isLow && <span className="text-[10px] text-rose-400">(Low &lt; {part.minThreshold})</span>}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 uppercase font-black">Unit Cost</div>
                          <div className="text-xs font-bold text-white">₹{part.unitCost}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Section 2: Historical Part Replacement & Breakdown Register */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Cog size={16} className="text-amber-400" /> Breakdown & Parts Replacement Register
                </h3>
                <p className="text-xs text-slate-400">
                  Where each part was installed, what broke down, old part condition, and linked Purchase Order.
                </p>
              </div>

              <button
                onClick={() => handleOpenReplaceModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
              >
                <Plus size={13} /> Record Replacement
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/60 overflow-hidden shadow-xl">
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 w-[15%]">Date & Time</th>
                    <th className="px-4 py-3 w-[22%]">Part Name & Category</th>
                    <th className="px-4 py-3 w-[20%]">Where Fitted / Room</th>
                    <th className="px-4 py-3 w-[23%]">Breakdown / Damage Reason</th>
                    <th className="px-4 py-3 w-[10%]">Cost</th>
                    <th className="px-4 py-3 w-[10%]">Linked PO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {replacements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                        No part replacements logged yet.
                      </td>
                    </tr>
                  ) : (
                    replacements.map(rep => (
                      <tr key={rep.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3 align-top font-mono text-[11px] text-slate-400">
                          {new Date(rep.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          <div className="text-[10px] text-slate-500">
                            {new Date(rep.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-bold text-white">{rep.partName}</div>
                          <div className="text-[10px] text-slate-400">
                            {rep.quantity} pcs · <span className="text-purple-400">{rep.category}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-bold text-amber-300 flex items-center gap-1">
                            <MapPin size={11} /> {rep.locationFitted}
                          </div>
                          {rep.replacedBy && (
                            <div className="text-[10px] text-slate-500 mt-0.5">By {rep.replacedBy}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="text-slate-300 text-[11px]">{rep.breakdownReason}</div>
                          {rep.damageCondition && (
                            <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              {rep.damageCondition}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top font-bold text-emerald-400">
                          ₹{rep.totalCost}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-block font-mono text-[10px] font-black px-2 py-0.5 rounded ${
                              rep.poNumber?.startsWith('PO-')
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {rep.poNumber || 'IN_STOCK'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: HOTEL PURCHASES & VENDOR PROCUREMENT (AUTO PO)                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'purchases' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Financial KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Purchase Volume</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">₹{purchasesSummary.totalPurchasesMonth?.toLocaleString('en-IN') || 0}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Active Pending POs</span>
              <div className="text-2xl font-black text-blue-400 mt-1">{purchasesSummary.pendingOrdersCount || 0}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Delivered This Month</span>
              <div className="text-2xl font-black text-purple-400 mt-1">{purchasesSummary.deliveredCount || 0}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Approved Hotel Vendors</span>
              <div className="text-2xl font-black text-white mt-1">{vendors.length}</div>
            </div>
          </div>

          {/* ── AUTO-REORDER / LOW STOCK INTELLIGENCE ── */}
          {autoReorders.length > 0 && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-emerald-950/40 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-400" /> Automated Low-Stock Purchase Orders
                  </h3>
                  <p className="text-xs text-slate-400">
                    The system scanned your maintenance spares & chemical inventory. Click below to generate a ready-made PO instantly!
                  </p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {autoReorders.length} Suggestions Ready
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {autoReorders.map(item => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Current: {item.currentStock} {item.unit}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">{item.category}</span>
                      </div>
                      <h4 className="text-xs font-black text-white">{item.itemName}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">{item.reason}</p>
                      <div className="text-[10.5px] text-purple-300 font-bold mt-2">
                        Vendor: {item.vendorName}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase font-black">Order Size</div>
                        <div className="text-xs font-black text-emerald-400">
                          {item.suggestedQty} {item.unit} (₹{item.estimatedTotal})
                        </div>
                      </div>

                      <button
                        onClick={() => handleAutoGeneratePO(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[10.5px] transition-all shadow-md active:scale-95"
                      >
                        <Zap size={11} /> 1-Click PO
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── READY-MADE PURCHASE ORDERS (PO) REGISTER ── */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <FileText size={16} className="text-emerald-400" /> Hotel Purchase Orders Register
                </h3>
                <p className="text-xs text-slate-400">
                  Ready-made PO slips generated for vendors with item breakdowns, delivery tracking, and slip printing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px]">
                  {['ALL', 'ORDERED', 'IN_TRANSIT', 'DELIVERED', 'DRAFT'].map(st => (
                    <button
                      key={st}
                      onClick={() => setPoStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        poStatusFilter === st ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowNewPOModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  <Plus size={13} /> + Create PO
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/60 overflow-hidden shadow-xl">
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 w-[15%]">PO Number & Date</th>
                    <th className="px-4 py-3 w-[22%]">Vendor & Dept</th>
                    <th className="px-4 py-3 w-[25%]">Items Ordered</th>
                    <th className="px-4 py-3 w-[13%]">Grand Total</th>
                    <th className="px-4 py-3 w-[12%]">Status</th>
                    <th className="px-4 py-3 w-[13%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                        No purchase orders found.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders
                      .filter(po => poStatusFilter === 'ALL' || po.status === poStatusFilter)
                      .map(po => {
                        const stConfig = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.DRAFT;
                        return (
                          <tr key={po.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="px-4 py-3 align-top">
                              <div className="font-mono font-bold text-emerald-400 text-xs">{po.poNumber}</div>
                              <div className="text-[10px] text-slate-500">
                                {new Date(po.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="font-bold text-white">{po.vendorName}</div>
                              <div className="text-[10px] text-slate-400">Dept: {po.department}</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="text-slate-300 text-[11px] truncate">
                                {po.items?.map(i => `${i.name} (${i.qty} ${i.unit})`).join(', ') || '1 item'}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {po.items?.length || 1} line item(s) · Expected: {po.deliveryDate || 'Standard'}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top font-black text-white text-xs">
                              ₹{po.grandTotal?.toLocaleString('en-IN')}
                              <div className="text-[9px] text-slate-500 font-normal">incl. 18% GST</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${stConfig.bg} ${stConfig.color}`}>
                                {stConfig.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top space-y-1">
                              <button
                                onClick={() => setSelectedPOForSlip(po)}
                                className="w-full flex items-center justify-center gap-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] transition-all"
                              >
                                <FileText size={11} /> View Slip
                              </button>

                              {po.status === 'ORDERED' && (
                                <button
                                  onClick={() => handleUpdatePOStatus(po.id, 'IN_TRANSIT')}
                                  className="w-full py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold"
                                >
                                  Mark In-Transit
                                </button>
                              )}

                              {po.status === 'IN_TRANSIT' && (
                                <button
                                  onClick={() => handleUpdatePOStatus(po.id, 'DELIVERED')}
                                  className="w-full py-0.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[9px] font-bold"
                                >
                                  Mark Received
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── HOTEL VENDORS DIRECTORY ── */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Building2 size={16} className="text-purple-400" /> Approved Hotel Vendors Directory
              </h3>
              <p className="text-xs text-slate-400">
                All registered suppliers for HVAC, plumbing, electrical, door locks, laundry chemicals, and general hardware.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vendors.map(vendor => (
                <div key={vendor.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {vendor.category}
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold">★ {vendor.rating || 4.8}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-tight">{vendor.name}</h4>
                    {vendor.contactPerson && (
                      <p className="text-[11px] text-slate-400 mt-0.5">Contact: {vendor.contactPerson}</p>
                    )}

                    <div className="space-y-1 mt-3 text-[11px] text-slate-400">
                      {vendor.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={11} className="text-slate-500" /> {vendor.phone}
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail size={11} className="text-slate-500" /> {vendor.email}
                        </div>
                      )}
                      {vendor.address && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
                          <MapPin size={11} className="text-slate-500" /> {vendor.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Terms: {vendor.paymentTerms || 'Net 30'}
                    </span>

                    <button
                      onClick={() => {
                        setNewPOForm(f => ({
                          ...f,
                          vendorName: vendor.name,
                          vendorPhone: vendor.phone || '',
                          vendorEmail: vendor.email || '',
                        }));
                        setShowNewPOModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-[10.5px] font-bold transition-all"
                    >
                      + Create PO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: ADD / REPLACE PART MODAL                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0f172a] border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Cog size={16} className="text-amber-400" /> Record Breakdown & Replace Part
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Specify what broke down, where the part goes, and link or generate a Purchase Order.
                </p>
              </div>
              <button onClick={() => setShowReplaceModal(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Select Spare Part or Custom */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Select Part from Shelf OR Enter Custom Part *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={replaceForm.partId}
                    onChange={e => {
                      const found = spareParts.find(p => p.id === e.target.value);
                      if (found) {
                        setReplaceForm(f => ({
                          ...f,
                          partId: found.id,
                          partName: found.name,
                          category: found.category,
                          unitCost: found.unitCost,
                          vendorName: found.preferredVendor || f.vendorName,
                        }));
                      } else {
                        setReplaceForm(f => ({ ...f, partId: '' }));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Pick from In-Stock Shelf --</option>
                    {spareParts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currentStock} {p.unit} in stock)
                      </option>
                    ))}
                  </select>

                  <select
                    value={replaceForm.category}
                    onChange={e => setReplaceForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Part Name (e.g. Split AC Dual Run Capacitor 45+5 uF)"
                  value={replaceForm.partName}
                  onChange={e => setReplaceForm(f => ({ ...f, partName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Where Fitted / Room Number */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Where Will It Be Fitted? (Room No / Equipment Location) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 101 - Outdoor AC Condenser Unit"
                  value={replaceForm.locationFitted}
                  onChange={e => setReplaceForm(f => ({ ...f, locationFitted: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Breakdown Reason & Damage */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    What Broke Down / Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Capacitor burnt out, AC not cooling"
                    value={replaceForm.breakdownReason}
                    onChange={e => setReplaceForm(f => ({ ...f, breakdownReason: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Old Part Condition
                  </label>
                  <select
                    value={replaceForm.damageCondition}
                    onChange={e => setReplaceForm(f => ({ ...f, damageCondition: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Burnt / Swollen">Burnt / Swollen</option>
                    <option value="Broken / Fractured">Broken / Fractured</option>
                    <option value="Leaking / Corroded">Leaking / Corroded</option>
                    <option value="Worn Out / Jammed">Worn Out / Jammed</option>
                    <option value="Missing">Missing</option>
                  </select>
                </div>
              </div>

              {/* Qty & Unit Cost */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={replaceForm.quantity}
                    onChange={e => setReplaceForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={replaceForm.unitCost}
                    onChange={e => setReplaceForm(f => ({ ...f, unitCost: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Technician</label>
                  <input
                    type="text"
                    placeholder="e.g. Raju / Duty Tech"
                    value={replaceForm.replacedBy}
                    onChange={e => setReplaceForm(f => ({ ...f, replacedBy: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Purchase Order Option */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <FileText size={13} className="text-emerald-400" /> Need to order from vendor?
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceForm.generatePO}
                      onChange={e => setReplaceForm(f => ({ ...f, generatePO: e.target.checked }))}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                    />
                    <span className="text-xs font-black text-emerald-400">Generate Purchase Order (PO)</span>
                  </label>
                </div>

                {replaceForm.generatePO ? (
                  <p className="text-[10.5px] text-emerald-300/80">
                    A formal Purchase Order (PO-2026-MNT-XXX) will be created automatically and linked to this ticket.
                  </p>
                ) : (
                  <p className="text-[10.5px] text-slate-400">
                    Part will be marked as fitted from in-house stock and inventory will be auto-deducted.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReplacement}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md"
              >
                ✓ Save Replacement & Log PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: ADD NEW SPARE PART TO CATALOGUE                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showAddPartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus size={16} className="text-purple-400" /> Add Spare Part to Catalogue
              </h3>
              <button onClick={() => setShowAddPartModal(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Part Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Geyser Copper Heating Element 2000W"
                  value={newPartForm.name}
                  onChange={e => setNewPartForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Part / Model Number</label>
                  <input
                    type="text"
                    placeholder="e.g. GYS-ELM-2K"
                    value={newPartForm.partNumber}
                    onChange={e => setNewPartForm(f => ({ ...f, partNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Category</label>
                  <select
                    value={newPartForm.category}
                    onChange={e => setNewPartForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stock on Hand</label>
                  <input
                    type="number"
                    min="0"
                    value={newPartForm.currentStock}
                    onChange={e => setNewPartForm(f => ({ ...f, currentStock: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={newPartForm.minThreshold}
                    onChange={e => setNewPartForm(f => ({ ...f, minThreshold: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPartForm.unitCost}
                    onChange={e => setNewPartForm(f => ({ ...f, unitCost: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Preferred Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Plumbing"
                    value={newPartForm.preferredVendor}
                    onChange={e => setNewPartForm(f => ({ ...f, preferredVendor: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Shelf Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack B-03"
                    value={newPartForm.location}
                    onChange={e => setNewPartForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setShowAddPartModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                Cancel
              </button>
              <button onClick={handleSubmitNewPart} className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md">
                + Save to Catalogue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: READY-MADE PURCHASE ORDER (PO) SLIP VIEWER                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedPOForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0b101b] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            {/* Header / Brand */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Official Hotel Purchase Order
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">OrderMint PMS Hospitality Solutions</h2>
                <p className="text-xs text-slate-400">
                  Engineering & Procurement Division · GSTIN: 07AAACH9988P1Z3
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-base font-black text-emerald-400 block">
                  {selectedPOForSlip.poNumber}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Date: {new Date(selectedPOForSlip.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className="inline-block mt-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  STATUS: {selectedPOForSlip.status}
                </span>
              </div>
            </div>

            {/* Vendor & Delivery Box */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                  Vendor / Supplier Details
                </div>
                <div className="font-bold text-white text-sm">{selectedPOForSlip.vendorName}</div>
                {selectedPOForSlip.vendorPhone && (
                  <div className="text-slate-400 mt-0.5">Phone: {selectedPOForSlip.vendorPhone}</div>
                )}
                {selectedPOForSlip.vendorEmail && (
                  <div className="text-slate-400">Email: {selectedPOForSlip.vendorEmail}</div>
                )}
              </div>

              <div>
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                  Ship-To & Department
                </div>
                <div className="font-bold text-white text-sm">Hotel Central Receiving Store</div>
                <div className="text-slate-400 mt-0.5">Department: {selectedPOForSlip.department}</div>
                <div className="text-slate-400">Expected Delivery: {selectedPOForSlip.deliveryDate || 'Standard 48 Hours'}</div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Item Description</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Rate</th>
                    <th className="px-4 py-2.5 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {selectedPOForSlip.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2.5 font-bold text-white">{it.name}</td>
                      <td className="px-4 py-2.5 text-center">{it.qty} {it.unit}</td>
                      <td className="px-4 py-2.5 text-right">₹{it.unitPrice}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-400">
                        ₹{(it.qty * it.unitPrice).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Total */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
              <div className="text-xs text-slate-400 max-w-sm">
                <span className="font-bold text-white block mb-0.5">Purchase Order Notes:</span>
                {selectedPOForSlip.notes || 'Goods must be packed securely with manufacturer batch code & delivery challan.'}
              </div>

              <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal Amount:</span>
                  <span className="font-bold">₹{selectedPOForSlip.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Standard GST (18%):</span>
                  <span>₹{selectedPOForSlip.taxAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                  <span>Grand Total:</span>
                  <span className="text-emerald-400">₹{selectedPOForSlip.grandTotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Signatures & Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="text-[10px] text-slate-500">
                Created by: <span className="text-slate-300 font-bold">{selectedPOForSlip.createdBy || 'Procurement Mgr'}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  <Printer size={13} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedPOForSlip(null)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Close Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: CREATE READY-MADE PURCHASE ORDER                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showNewPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-[#0f172a] border border-emerald-500/30 rounded-3xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ShoppingBag size={16} className="text-emerald-400" /> Create Ready-Made Purchase Order
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Generate an official purchase order for vendors for maintenance parts, chemical drums, or supplies.
                </p>
              </div>
              <button onClick={() => setShowNewPOModal(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Vendor Selection */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Select Vendor *</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={newPOForm.vendorName}
                    onChange={e => {
                      const v = vendors.find(x => x.name === e.target.value);
                      setNewPOForm(f => ({
                        ...f,
                        vendorName: e.target.value,
                        vendorPhone: v?.phone || f.vendorPhone,
                        vendorEmail: v?.email || f.vendorEmail,
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Hotel Vendor --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.name}>{v.name} ({v.category})</option>
                    ))}
                  </select>

                  <select
                    value={newPOForm.department}
                    onChange={e => setNewPOForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="Maintenance">Maintenance & Engineering</option>
                    <option value="Housekeeping">Housekeeping & Laundry</option>
                    <option value="Front Desk">Front Desk & Security</option>
                    <option value="General">General Hotel Supplies</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Or enter custom Vendor Name"
                  value={newPOForm.vendorName}
                  onChange={e => setNewPOForm(f => ({ ...f, vendorName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Order Line Items *</label>
                  <button
                    onClick={() => setNewPOForm(f => ({ ...f, items: [...f.items, { name: '', qty: 1, unit: 'pcs', unitPrice: 0 }] }))}
                    className="text-[10px] font-black text-emerald-400 hover:text-emerald-300"
                  >
                    + Add Another Item
                  </button>
                </div>

                <div className="space-y-2">
                  {newPOForm.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 items-center">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Item Name (e.g. AC Capacitor / Detergent)"
                          value={item.name}
                          onChange={e => {
                            const updated = [...newPOForm.items];
                            updated[idx].name = e.target.value;
                            setNewPOForm(f => ({ ...f, items: updated }));
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-950 text-white font-bold text-[11px]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={e => {
                            const updated = [...newPOForm.items];
                            updated[idx].qty = Number(e.target.value);
                            setNewPOForm(f => ({ ...f, items: updated }));
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-950 text-white text-center text-[11px]"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          placeholder="Rate ₹"
                          value={item.unitPrice}
                          onChange={e => {
                            const updated = [...newPOForm.items];
                            updated[idx].unitPrice = Number(e.target.value);
                            setNewPOForm(f => ({ ...f, items: updated }));
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-950 text-emerald-400 font-bold text-right text-[11px]"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {newPOForm.items.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = newPOForm.items.filter((_, i) => i !== idx);
                              setNewPOForm(f => ({ ...f, items: updated }));
                            }}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Date & Notes */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={newPOForm.deliveryDate}
                    onChange={e => setNewPOForm(f => ({ ...f, deliveryDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Purchase Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Urgent floor repair requirement"
                    value={newPOForm.notes}
                    onChange={e => setNewPOForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setShowNewPOModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                Cancel
              </button>
              <button onClick={handleCreateCustomPO} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md">
                ✓ Generate Ready-Made PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: NEW MAINTENANCE TICKET MODAL                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0d0d1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 shrink-0">
              <div>
                <p className="text-base font-black text-white flex items-center gap-2">
                  <Wrench size={16} className="text-purple-400" /> New Maintenance Ticket
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Report equipment breakdown, specify broken parts, and generate vendor PO.
                </p>
              </div>
              <button onClick={() => setShowNewTicketModal(false)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">
                <X size={13} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Issue Title *</label>
                <input
                  value={newTicket.title}
                  onChange={e => {
                    const val = e.target.value;
                    setNewTicket(f => ({ ...f, title: val }));
                    if (!ticketPartData.locationFitted && newTicket.roomNumber) {
                      setTicketPartData(p => ({ ...p, locationFitted: `Room ${newTicket.roomNumber} - ${val}` }));
                    }
                  }}
                  placeholder="e.g. AC not cooling in room 101"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={e => {
                      const cat = e.target.value;
                      setNewTicket(f => ({ ...f, category: cat }));
                      setTicketPartData(p => ({ ...p, category: cat }));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={e => setNewTicket(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Room Number</label>
                <input
                  value={newTicket.roomNumber}
                  onChange={e => {
                    const rm = e.target.value;
                    setNewTicket(f => ({ ...f, roomNumber: rm }));
                    setTicketPartData(p => ({
                      ...p,
                      locationFitted: rm ? `Room ${rm} - ${newTicket.title || 'Equipment'}` : p.locationFitted,
                    }));
                  }}
                  placeholder="e.g. 101"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={e => setNewTicket(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Describe what broke down or symptoms observed…"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                />
              </div>

              {/* ── PART REPLACEMENT & PURCHASE ORDER TOGGLE ── */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Cog size={15} className="text-amber-400" /> Part Replacement & Purchase Order
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer bg-purple-900/40 px-2.5 py-1 rounded-lg border border-purple-500/30">
                    <input
                      type="checkbox"
                      checked={ticketPartNeeded}
                      onChange={e => {
                        const checked = e.target.checked;
                        setTicketPartNeeded(checked);
                        if (checked && !ticketPartData.locationFitted) {
                          setTicketPartData(p => ({
                            ...p,
                            locationFitted: newTicket.roomNumber ? `Room ${newTicket.roomNumber} - ${newTicket.title || 'Asset'}` : 'Hotel Facility',
                            category: newTicket.category,
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                    />
                    <span className="text-[11px] font-black text-purple-200">Broken Part / Needs PO</span>
                  </label>
                </div>

                {ticketPartNeeded && (
                  <div className="space-y-3 pt-2.5 border-t border-purple-500/20 animate-in fade-in text-xs">
                    {/* Part Selection */}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Select Part from Shelf OR Type Custom Name *
                      </label>
                      <select
                        value={ticketPartData.partId}
                        onChange={e => {
                          const found = spareParts.find(p => p.id === e.target.value);
                          if (found) {
                            setTicketPartData(f => ({
                              ...f,
                              partId: found.id,
                              partName: found.name,
                              category: found.category,
                              unitCost: found.unitCost,
                              vendorName: found.preferredVendor || f.vendorName,
                            }));
                          } else {
                            setTicketPartData(f => ({ ...f, partId: '' }));
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs mb-2 focus:outline-none focus:border-purple-500"
                      >
                        <option value="">-- Choose from In-House Shelf Stock --</option>
                        {spareParts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.currentStock} {p.unit} on hand - ₹{p.unitCost})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Part Name (e.g. Split AC Dual Run Capacitor 45+5 uF)"
                        value={ticketPartData.partName}
                        onChange={e => setTicketPartData(f => ({ ...f, partName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs"
                      />
                    </div>

                    {/* Where Fitted & Old Part Condition */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Where Will It Fit?</label>
                        <input
                          type="text"
                          placeholder="e.g. Room 101 - Outdoor AC Unit"
                          value={ticketPartData.locationFitted}
                          onChange={e => setTicketPartData(f => ({ ...f, locationFitted: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Breakdown Damage</label>
                        <select
                          value={ticketPartData.damageCondition}
                          onChange={e => setTicketPartData(f => ({ ...f, damageCondition: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                        >
                          <option value="Burnt / Swollen">Burnt / Swollen</option>
                          <option value="Broken / Fractured">Broken / Fractured</option>
                          <option value="Leaking / Corroded">Leaking / Corroded</option>
                          <option value="Worn Out / Jammed">Worn Out / Jammed</option>
                          <option value="Missing">Missing</option>
                        </select>
                      </div>
                    </div>

                    {/* Qty & Unit Cost */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Quantity Needed</label>
                        <input
                          type="number"
                          min="1"
                          value={ticketPartData.quantity}
                          onChange={e => setTicketPartData(f => ({ ...f, quantity: Number(e.target.value) }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Estimated Unit Rate (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={ticketPartData.unitCost}
                          onChange={e => setTicketPartData(f => ({ ...f, unitCost: Number(e.target.value) }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-bold text-xs"
                        />
                      </div>
                    </div>

                    {/* PO Generation Radio / Choice */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white flex items-center gap-1">
                          <FileText size={12} className="text-emerald-400" />
                          Purchase Order (PO):
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ticketPartData.generatePO}
                            onChange={e => setTicketPartData(f => ({ ...f, generatePO: e.target.checked }))}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                          />
                          <span className="text-[11px] font-black text-emerald-400">
                            Auto-Create Vendor PO
                          </span>
                        </label>
                      </div>

                      {ticketPartData.generatePO ? (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[9.5px] font-bold uppercase text-slate-400 block">Select Preferred Vendor</label>
                          <select
                            value={ticketPartData.vendorName}
                            onChange={e => setTicketPartData(f => ({ ...f, vendorName: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-[11px]"
                          >
                            {vendors.map(v => (
                              <option key={v.id} value={v.name}>{v.name} ({v.category})</option>
                            ))}
                            <option value="General Hotel Vendor">General Hotel Vendor</option>
                          </select>
                          <p className="text-[10px] text-emerald-300/80">
                            ✓ System will automatically assign an official PO (e.g. PO-2026-MNT-XXX) and display it on the ticket.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400">
                          ✓ Part will be deducted from existing in-house shelf stock (marked as IN_STOCK).
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 px-6 py-4 border-t border-white/8 shrink-0 bg-[#0d0d1a]">
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newTicket.title.trim()) return;

                  const ticketId = Date.now().toString();
                  const mock: MaintenanceTicket = {
                    id: ticketId,
                    title: newTicket.title,
                    description: newTicket.description,
                    priority: newTicket.priority,
                    status: 'OPEN',
                    category: newTicket.category,
                    reportedAt: new Date().toISOString(),
                    room: newTicket.roomNumber ? { roomNumber: newTicket.roomNumber } : undefined,
                  };

                  // 1. Post ticket to backend
                  try {
                    await fetch('/api/hotel/maintenance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        issueType: newTicket.category,
                        priority: newTicket.priority,
                        description: newTicket.description || newTicket.title,
                        roomId: newTicket.roomNumber || undefined,
                      }),
                    });
                  } catch (e) {
                    // Fallback
                  }

                  setTickets(prev => [mock, ...prev]);

                  // 2. If part replacement was enabled
                  if (ticketPartNeeded && ticketPartData.partName.trim()) {
                    try {
                      let generatedPONumber = ticketPartData.generatePO
                        ? `PO-${new Date().getFullYear()}-MNT-${Math.floor(100 + Math.random() * 900)}`
                        : 'IN_HOUSE_STOCK';

                      // Log Replacement
                      await fetch('/api/hotel/maintenance/parts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'REPLACE_PART',
                          ticketId,
                          ticketTitle: newTicket.title,
                          partId: ticketPartData.partId,
                          partName: ticketPartData.partName,
                          category: ticketPartData.category || newTicket.category,
                          quantity: ticketPartData.quantity,
                          unitCost: ticketPartData.unitCost,
                          locationFitted: ticketPartData.locationFitted || (newTicket.roomNumber ? `Room ${newTicket.roomNumber} - ${newTicket.title}` : 'Facility'),
                          breakdownReason: newTicket.description || `Breakdown: ${newTicket.title}`,
                          damageCondition: ticketPartData.damageCondition,
                          replacedBy: 'Duty Engineer',
                          generatePO: ticketPartData.generatePO,
                          poNumber: generatedPONumber,
                          vendorName: ticketPartData.vendorName,
                        }),
                      });

                      // If PO was generated, also log into Hotel Purchases PO register
                      if (ticketPartData.generatePO) {
                        const poItems = [
                          {
                            name: ticketPartData.partName,
                            qty: ticketPartData.quantity,
                            unit: 'pcs',
                            unitPrice: ticketPartData.unitCost,
                            total: ticketPartData.quantity * ticketPartData.unitCost,
                          }
                        ];

                        await fetch('/api/hotel/maintenance/purchases', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            vendorName: ticketPartData.vendorName,
                            department: 'Maintenance',
                            items: poItems,
                            source: 'BREAKDOWN_TICKET',
                            linkedTicketNo: `MNT-${newTicket.roomNumber || 'TKT'}`,
                            notes: `Repair requirement for: ${newTicket.title} (${newTicket.roomNumber ? `Room ${newTicket.roomNumber}` : 'General'})`,
                          }),
                        });
                      }

                      fetchParts();
                      fetchPurchases();
                      toast.success(`Ticket created & ${ticketPartData.generatePO ? 'Purchase Order (PO) logged!' : 'part logged from shelf stock!'}`);
                    } catch (e) {
                      toast.success('Maintenance ticket created');
                    }
                  } else {
                    toast.success('Maintenance ticket created successfully');
                  }

                  setShowNewTicketModal(false);
                  setNewTicket({ title: '', category: 'Electrical', priority: 'MEDIUM', roomNumber: '', description: '' });
                  setTicketPartNeeded(false);
                }}
                disabled={!newTicket.title.trim()}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md"
              >
                Create Ticket & Log Part
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
