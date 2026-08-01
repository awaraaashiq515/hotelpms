import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RequestsTab({ token }: { token: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('CLEANING');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(() => {
    fetch('/api/guest-portal/request', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) setRequests(d.data);
      })
      .catch(err => console.error('Fetch requests error:', err))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please enter a description for your request.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/guest-portal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, description: description.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setDescription('');
        fetchRequests();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    'Pending': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'In Progress': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    'Resolved': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div className="space-y-6">
      {/* New Request Form */}
      <div className="bg-[#0f172a]/60 backdrop-blur-sm border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <h3 className="font-black text-sm uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-indigo-400" /> Service Request & Complaints
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Request Category</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'CLEANING', label: '🧹 Clean Room', desc: 'Request room cleaning' },
                { id: 'AMENITIES', label: '🧼 Amenities', desc: 'Need toiletries, towels, water' },
                { id: 'MAINTENANCE', label: '🛠️ Maintenance', desc: 'AC, TV, or plumbing repair' },
                { id: 'OTHER', label: '💬 Other Request', desc: 'Inquiries or help' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    type === opt.id
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[9px] opacity-75 mt-0.5 leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Details / Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you need or what is wrong (e.g. need extra towels, AC is not working)"
              rows={3}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/70 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 resize-none font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="space-y-4">
        <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Clock size={16} /> Request History
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-indigo-500" size={24} />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 rounded-3xl border border-dashed border-slate-800 text-slate-600 text-xs font-bold">
            No active requests. Submit a request above if you need assistance.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="p-4 rounded-2xl bg-[#0f172a]/40 border border-slate-800/60 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{req.type}</span>
                    <span className={`px-2 py-0.5 border text-[9px] font-black uppercase rounded-full ${statusColors[req.status] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal font-medium">{req.description}</p>
                  <p className="text-[9px] text-slate-600 font-bold">
                    Requested: {new Date(req.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
