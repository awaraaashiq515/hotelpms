'use client';

import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Edit, 
  Trash2, 
  Plus, 
  CarFront, 
  BusFront, 
  Bike, 
  Truck, 
  Users,
  Search,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DriverForm } from '@/components/forms/driver-form';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';
import { useToast } from '@/components/ui/Toast';
import { driversApi, Driver } from '@/lib/api/drivers';
import { useSearchParams } from 'next/navigation';

export default function DriversListingPage() {
  const searchParams = useSearchParams();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(searchParams.get('action') === 'new');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const { showToast } = useToast();

  const fetchDrivers = async (pid?: string) => {
    const activePid = pid || propertyId;
    setLoading(true);
    try {
      const data = await driversApi.list(activePid || undefined); 
      setDrivers(data || []);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const sessionResponse = await fetch('/api/auth/session').then(res => res.json());
      const role = sessionResponse.user?.role;
      const orgId = sessionResponse.user?.organizationId;
      let currentPid = sessionResponse.user?.propertyId;

      if (!currentPid && (role === 'RESTAURANTS_ADMIN' || role === 'SUPER_ADMIN') && orgId) {
        const propResp = await fetch(`/api/setup/properties?organizationId=${orgId}`).then(res => res.json());
        if (propResp.success && propResp.data.length > 0) {
          currentPid = propResp.data[0].id;
        }
      }

      if (currentPid) {
        setPropertyId(currentPid);
        fetchDrivers(currentPid);
      } else {
        fetchDrivers();
      }
    };
    init();
  }, []);

  const handleCreateOrUpdate = async (data: Partial<Driver>) => {
    setMutationLoading(true);
    try {
      if (selectedDriver) {
        await driversApi.update(selectedDriver.id, data);
        showToast('Driver updated successfully', 'success');
      } else {
        let createPid = propertyId;
        if (!createPid) {
           const propResp = await fetch('/api/setup/properties').then(res => res.json());
           if (propResp.success && propResp.data.length > 0) {
             createPid = propResp.data[0].id;
           }
        }
        if (!createPid) throw new Error('Please select a branch first.');
        await driversApi.create({ ...data, propertyId: createPid });
        showToast('New driver added successfully', 'success');
      }
      setIsFormOpen(false);
      fetchDrivers();
    } catch (error: any) {
      showToast(error.message || 'Operation failed', 'error');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDriver) return;
    setMutationLoading(true);
    try {
      await driversApi.delete(selectedDriver.id);
      setIsDeleteOpen(false);
      fetchDrivers();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const getVehicleIcon = (type?: string) => {
    switch(type) {
      case 'BUS': return <BusFront size={16} />;
      case 'BIKE': return <Bike size={16} />;
      case 'VAN': return <Truck size={16} />;
      default: return <CarFront size={16} />;
    }
  };

  const columns = [
    { 
      header: 'Driver Identity', 
      cell: (row: Driver) => (
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
             {getVehicleIcon(row.vehicleType)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{row.name}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest">{row.phone || 'No phone'}</span>
          </div>
        </div>
      ),
      width: '280px'
    },
    { 
      header: 'Vehicle Asset', 
      cell: (row: Driver) => (
        <div className="flex flex-col items-start gap-1">
          <span className="font-mono font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-[11px] border border-slate-200 dark:border-slate-700">
            {row.vehicleNumber || 'UNREGISTERED'}
          </span>
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
            {row.vehicleType || 'CAR'}
          </span>
        </div>
      ),
      width: '180px'
    },
    { 
      header: 'Community Stats', 
      cell: (row: Driver) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md tracking-tighter w-fit">
            {row.referralCount || 0} REFERENCES
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 ml-1 uppercase tracking-widest">
            ₹{(row.totalRevenue || 0).toFixed(0)} GEN.
          </span>
        </div>
      ),
      width: '180px'
    },
    { 
      header: 'Registry Status', 
      cell: (row: Driver) => (
        <span className={`text-[10px] font-black px-2 py-1 rounded-md tracking-tighter ${row.isActive ? 'text-green-600 dark:text-emerald-400 bg-green-50 dark:bg-emerald-900/20' : 'text-red-600 dark:text-rose-400 bg-red-50 dark:bg-rose-900/20'}`}>
          {row.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      ),
      width: '120px'
    },
    { 
      header: 'Actions', 
      cell: (row: Driver) => (
        <div className="flex items-center gap-1">
           <button 
             onClick={() => { setSelectedDriver(row); setIsFormOpen(true); }}
             className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
           >
             <Edit size={16} />
           </button>
           <button 
             onClick={() => { setSelectedDriver(row); setIsDeleteOpen(true); }}
             className="p-2 hover:bg-red-50 dark:hover:bg-rose-900/20 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-rose-400 transition-colors"
           >
             <Trash2 size={16} />
           </button>
        </div>
      ),
      width: '120px'
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Driver Directory" 
        subtitle="Manage registry of verified drivers and vehicle assets"
        showBack
        actions={
          <Button 
            onClick={() => { setSelectedDriver(null); setIsFormOpen(true); }}
            className="bg-pos-primary hover:bg-pos-primary-dark text-white font-black text-[10px] tracking-widest h-11 px-8 rounded-2xl shadow-xl shadow-pos-primary/10 transition-all uppercase"
          >
             Register New Driver
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl shadow-sm border border-slate-100/60 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-inner"><Users size={24} /></div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-tight">Total Registry</p>
               <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mt-1">{drivers.length}</p>
            </div>
         </div>
      </div>

      <SearchToolbar  
        value={search}
        onChange={setSearch}
        placeholder="Search registry by name, phone or vehicle id..."
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <DataTable 
          columns={columns} 
          data={drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || (d.phone || '').includes(search))} 
          loading={loading}
        />
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedDriver ? 'Modify Registry' : 'New Driver Registration'}>
        <div className="p-1">
          <DriverForm initialData={selectedDriver || undefined} onSubmit={handleCreateOrUpdate} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />
        </div>
      </Modal>

      {isDeleteOpen && (
        <ConfirmDeleteModal 
          title="Remove from Registry"
          message={`Are you sure you want to remove driver "${selectedDriver?.name}"? This action is permanent.`}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
          loading={mutationLoading}
        />
      )}
    </div>
  );
}
