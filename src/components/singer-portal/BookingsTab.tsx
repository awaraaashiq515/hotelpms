import React from 'react';
import { MapPin, Calendar, DollarSign } from 'lucide-react';

interface BookingRequest {
  id: string;
  sender: 'SINGER' | 'HOTEL';
  status: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  proposedFee: number | null;
  notes: string | null;
  property: {
    name: string;
    city: string | null;
  };
}

interface BookingsTabProps {
  bookingRequests: BookingRequest[];
  handleBookingResponse: (bookingId: string, status: 'ACCEPTED' | 'DECLINED') => Promise<void>;
}

export const BookingsTab = ({
  bookingRequests,
  handleBookingResponse
}: BookingsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Hotel Gig Bookings</h3>
      </div>

      {/* Gigs List */}
      <div className="space-y-4">
        {bookingRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-slate-800/80 rounded-2xl">
            No booking proposals or invites found.
          </div>
        ) : (
          bookingRequests.map(req => {
            const isHotelInvite = req.sender === 'HOTEL';
            return (
              <div key={req.id} className="p-5 rounded-2xl bg-[#090f1e]/85 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      isHotelInvite ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isHotelInvite ? 'HOTEL INVITATION' : 'YOUR PROPOSAL'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      req.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                      'bg-rose-500/10 text-rose-455 border border-rose-500/20'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <h4 className="font-black text-sm text-white">{req.property.name}</h4>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-550" /> {req.venueName} {req.property.city && `(${req.property.city})`}</p>
                    <p className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-550" /> {new Date(req.date).toLocaleDateString()} @ {new Date(req.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(req.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    {req.proposedFee && <p className="flex items-center gap-1.5 font-bold text-indigo-400"><DollarSign size={12} /> Fee Proposed: ₹{req.proposedFee}</p>}
                    {req.notes && <p className="text-[11px] text-slate-500 mt-1 italic">"{req.notes}"</p>}
                  </div>
                </div>

                {/* Interactive Action Buttons for Singer on incoming HOTEL invites */}
                {isHotelInvite && req.status === 'PENDING' && (
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleBookingResponse(req.id, 'ACCEPTED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-colors"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleBookingResponse(req.id, 'DECLINED')}
                      className="px-4 py-2 border border-slate-800 text-slate-450 hover:text-white rounded-xl text-xs font-black transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
