'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Edit, Trash2, CalendarCheck, Clock, Hash, CarFront } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { tableReservationsApi, TableReservation } from '@/lib/api/reservations';
import { Modal } from '@/components/ui/Modal';
import { ReservationForm } from '@/components/forms/reservation-form';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';
import { format } from 'date-fns';

export default function TableReservationsPage() {
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<TableReservation | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  const fetchReservations = async (pid?: string) => {
    const activePid = pid || propertyId;
    setLoading(true);
    try {
      const data = await tableReservationsApi.list(activePid || undefined); 
      setReservations(data || []);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
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
          fetchReservations(currentPid);
        } else {
          fetchReservations();
        }
      } catch (err) {
        console.error('Session init failed:', err);
        fetchReservations();
      }
    };
    init();
  }, []);


  const handleCreateOrUpdate = async (data: Partial<TableReservation>) => {
    setMutationLoading(true);
    try {
      if (selectedReservation) {
        await tableReservationsApi.update(selectedReservation.id, data);
      } else {
        await tableReservationsApi.create(data);
      }
      setIsFormOpen(false);
      fetchReservations();
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReservation) return;
    setMutationLoading(true);
    try {
      await tableReservationsApi.delete(selectedReservation.id);
      setIsDeleteOpen(false);
      fetchReservations();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const filteredReservations = (reservations || []).filter((r: TableReservation) => {
    const searchLower = search.toLowerCase();
    return (
      r.customerName.toLowerCase().includes(searchLower) ||
      (r.customerPhone || '').includes(searchLower) ||
      (r.driver?.name || '').toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-orange-600 bg-orange-50';
      case 'CONFIRMED': return 'text-pos-primary bg-pos-primary/10';
      case 'COMPLETED': return 'text-emerald-600 bg-emerald-50';
      case 'CANCELLED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const columns = [
    { 
      header: 'Reservation Info', 
      cell: (row: TableReservation) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary">
             <CalendarCheck size={16} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">
              {row.customerName}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">{row.customerPhone || 'No phone'}</span>
          </div>
        </div>
      ),
      width: '250px'
    },
    { 
      header: 'Schedule', 
      cell: (row: TableReservation) => {
         const dateObj = new Date(row.date);
         return (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1"><CalendarCheck size={12}/> {format(dateObj, 'MMM dd, yyyy')}</span>
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Clock size={12}/> {row.time}</span>
          </div>
        );
      },
      width: '150px'
    },
    { 
      header: 'Tables / Guests', 
      cell: (row: TableReservation) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
            <Hash size={12} className="text-gray-400"/> {row.table ? `${row.table.name} (${row.table.floor?.name})` : `${row.numberOfTables} Table(s) unassigned`}
          </span>
          <span className="text-[11px] font-bold text-gray-500">
            {row.guestCount || 1} Guest(s)
          </span>
        </div>
      ),
      width: '120px'
    },
    { 
      header: 'Status', 
      cell: (row: TableReservation) => (
        <span className={`text-[11px] font-black px-2 py-1 rounded-md tracking-tighter ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
      width: '100px'
    },
    { 
      header: 'Driver Reference', 
      cell: (row: TableReservation) => (
        row.driver ? (
          <div className="flex items-center gap-1 text-xs font-bold text-pos-primary bg-pos-primary/10 px-2 py-1 rounded-md w-fit">
            <CarFront size={12} />
            <span className="truncate max-w-[120px]">{row.driver.name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-300 italic font-semibold">Self</span>
        )
      ),
      width: '150px'
    },
    { 
      header: 'Actions', 
      cell: (row: TableReservation) => (
        <div className="flex items-center gap-2">
           <button 
             onClick={() => {
               setSelectedReservation(row);
               setIsFormOpen(true);
             }}
             className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-pos-primary transition-colors"
           >
             <Edit size={16} />
           </button>
           <button 
             onClick={() => {
               setSelectedReservation(row);
               setIsDeleteOpen(true);
             }}
             className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
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
        title="Table Bookings" 
        subtitle="Manage upcoming table reservations"
        showBack
        actions={
          <Button 
            onClick={() => {
              setSelectedReservation(null);
              setIsFormOpen(true);
            }}
            className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-200"
          >
             BOOK A TABLE
          </Button>
        }
      />

      <SearchToolbar 
        value={search}
        onChange={setSearch}
        placeholder="Search by customer name or phone..."
        actions={
          <Button variant="secondary" className="font-bold text-xs tracking-widest gap-2 bg-white border border-gray-200 px-4">
            <Filter size={16} />
            FILTERS
          </Button>
        }
      />

      <DataTable 
        columns={columns} 
        data={filteredReservations} 
        loading={loading}
      />

      {/* Forms & Modals */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={selectedReservation ? 'Edit Booking' : 'New Table Booking'}
      >
        <ReservationForm 
          initialData={selectedReservation || undefined}
          propertyId={propertyId || ''}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => setIsFormOpen(false)}
          loading={mutationLoading}
        />
      </Modal>

      {isDeleteOpen && (
        <ConfirmDeleteModal 
          title="Delete Booking"
          message={`Are you sure you want to cancel and remove booking for "${selectedReservation?.customerName}"? Action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
          loading={mutationLoading}
        />
      )}
    </div>
  );
}
