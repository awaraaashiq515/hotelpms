'use client';
import { useState, useEffect, useCallback } from 'react';

interface MaintenanceTicket {
  id: string;
  ticketNo: string;
  issueType: string;
  priority: string;
  status: string;
  description?: string;
  raisedBy?: string;
  assignedTo?: string;
  openedAt: string;
  resolvedAt?: string;
  room?: { roomNumber: string };
}

interface UseMaintenanceReturn {
  tickets: MaintenanceTicket[];
  openCount: number;
  urgentCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMaintenance(): UseMaintenanceReturn {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/maintenance');
      const json = await res.json();
      if (json.success) setTickets(json.data ?? []);
      else setError(json.message || 'Failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openCount   = tickets.filter(t => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
  const urgentCount = tickets.filter(t => t.priority === 'URGENT' && !['RESOLVED', 'CLOSED'].includes(t.status)).length;

  return { tickets, openCount, urgentCount, loading, error, refresh };
}
