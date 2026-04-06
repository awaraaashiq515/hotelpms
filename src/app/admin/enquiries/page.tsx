'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Search, Eye, CheckCircle, Trash2, Clock, Inbox, Phone } from 'lucide-react';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  const fetchEnquiries = async () => {
    try {
      const res = await fetch('/api/website/enquiry');
      const json = await res.json();
      if (json.success) {
        setEnquiries(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/website/enquiry/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchEnquiries();
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const deleteEnquiry = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await fetch(`/api/website/enquiry/${id}`, { method: 'DELETE' });
      fetchEnquiries();
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
    } catch (err) {
      console.error('Failed to delete enquiry:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> New</span>;
      case 'READ':
        return <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Eye size={10} /> Read</span>;
      case 'RESPONDED':
        return <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle size={10} /> Responded</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <span className="text-pos-primary font-bold tracking-[0.3em] uppercase text-[10px] block mb-2">Guest Relations</span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
            <Mail className="text-pos-primary" size={32} />
            Contact Enquiries
          </h1>
          <p className="text-gray-400 font-medium text-sm mt-2 max-w-xl">
            Manage messages submitted through the website contact form.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-gray-50 rounded-2xl flex items-center px-4 py-2 border border-gray-100 focus-within:ring-2 focus-within:ring-pos-primary/20 transition-all">
            <Search className="text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="bg-transparent border-none focus:outline-none text-sm font-semibold ml-3 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Enquiry List */}
        <div className="lg:col-span-1 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Inbox size={16} className="text-pos-primary" /> Inbox
              <span className="ml-auto bg-pos-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                {enquiries.filter(e => e.status === 'NEW').length}
              </span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">Loading...</div>
            ) : enquiries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">No enquiries found</div>
            ) : (
              enquiries.map((enq) => (
                <div 
                  key={enq.id} 
                  onClick={() => {
                    setSelectedEnquiry(enq);
                    if (enq.status === 'NEW') updateStatus(enq.id, 'READ');
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                    selectedEnquiry?.id === enq.id 
                      ? 'bg-pos-primary/5 border-pos-primary shadow-sm' 
                      : enq.status === 'NEW'
                        ? 'bg-white border-blue-100 hover:border-blue-300 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-gray-300 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`font-bold capitalize ${selectedEnquiry?.id === enq.id ? 'text-pos-primary' : 'text-gray-900'}`}>
                      {enq.name}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {new Date(enq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-500 mb-3 truncate">{enq.subject}</div>
                  <div className="flex justify-between items-center">
                    {getStatusBadge(enq.status)}
                    <button 
                      onClick={(e) => deleteEnquiry(enq.id, e)}
                      className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Enquiry Details */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[700px]">
          {selectedEnquiry ? (
            <>
              <div className="p-8 border-b border-gray-100">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight capitalize mb-2">{selectedEnquiry.subject}</h2>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <span>{new Date(selectedEnquiry.createdAt).toLocaleString()}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>From: {selectedEnquiry.name}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button
                        onClick={() => updateStatus(selectedEnquiry.id, 'READ')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${selectedEnquiry.status === 'READ' ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}
                        disabled={selectedEnquiry.status === 'READ'}
                      >
                        Mark Read
                      </button>
                      <button
                        onClick={() => updateStatus(selectedEnquiry.id, 'RESPONDED')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${selectedEnquiry.status === 'RESPONDED' ? 'bg-green-100 text-green-600' : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-500 hover:text-white'}`}
                        disabled={selectedEnquiry.status === 'RESPONDED'}
                      >
                        Mark Responded
                      </button>
                  </div>
                </div>
                
                <div className="flex gap-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl w-full">
                    <Mail size={16} className="text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</span>
                      <a href={`mailto:${selectedEnquiry.email}`} className="text-sm font-bold text-pos-primary">{selectedEnquiry.email}</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl w-full">
                    <Phone size={16} className="text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</span>
                      <a href={`tel:${selectedEnquiry.phone}`} className="text-sm font-bold text-pos-primary">{selectedEnquiry.phone}</a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30">
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">Message Content</span>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700 leading-relaxed font-medium">
                      {selectedEnquiry.message}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Mail size={48} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight mb-2">Select an Enquiry</h3>
              <p className="text-sm font-medium text-gray-400 max-w-sm">
                Choose a message from the inbox on the left to read its full contents and reply to the guest.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
