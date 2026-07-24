'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { MapSection } from '@/components/website/MapSection';
import { WebsiteHeader } from '@/components/website/Header';
import { PremiumFooter } from '@/components/website/PremiumFooter';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/website/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      
      if (json.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
      } else {
        setError(json.error || 'Failed to send message');
      }
    } catch (err) {
      setError('An unexpected error occurrred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="bg-slate-50 min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 bg-white overflow-hidden border-b border-slate-100 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#fae5e8]/30 rounded-full blur-[100px] pointer-events-none z-0" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="space-y-6">
            <span className="text-pos-primary font-bold tracking-widest uppercase text-xs block">
              Get in Touch
            </span>
            <h1 className="text-5xl lg:text-7xl font-semibold text-slate-900 tracking-tight leading-tight">
              Let's Talk <span className="text-pos-primary">Scale</span>
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
              Based in Himachal, Serving the World. Our team is ready to help you build a smarter operation with GuestFlow.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          {/* Left Column: Details */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-8">
                Business Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-pos-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-pos-primary shadow-sm mb-6 group-hover:bg-pos-primary group-hover:text-white transition-all">
                    <MapPin size={24} />
                  </div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Headquarters</h4>
                  <p className="text-base font-semibold text-slate-900 leading-relaxed">
                    Mandi, Himachal Pradesh <br />175001, India
                  </p>
                </div>

                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-pos-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-pos-primary shadow-sm mb-6 group-hover:bg-pos-primary group-hover:text-white transition-all">
                    <Phone size={24} />
                  </div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Sales Support</h4>
                  <p className="text-base font-semibold text-slate-900">
                    +91 86798 00074
                  </p>
                </div>

                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-pos-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-pos-primary shadow-sm mb-6 group-hover:bg-pos-primary group-hover:text-white transition-all">
                    <Mail size={24} />
                  </div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Email</h4>
                  <p className="text-base font-semibold text-slate-900">
                    support@guestflow.com
                  </p>
                </div>

                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-pos-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-pos-primary shadow-sm mb-6 group-hover:bg-pos-primary group-hover:text-white transition-all">
                    <Clock size={24} />
                  </div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Support Hours</h4>
                  <p className="text-base font-semibold text-slate-900">
                    24/7 Priority Assistance
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-900 rounded-[40px] text-white">
              <h3 className="text-lg font-bold uppercase tracking-tight mb-4">Request a Personal Demo</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">
                Want to see GuestFlow in action? Schedule a one-on-one session with our product experts to explore how we can optimize your workflow.
              </p>
              <button 
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-4 text-pos-primary font-bold text-xl hover:text-white transition-colors"
              >
                <MessageSquare size={24} /> Schedule Demo
              </button>
            </div>
          </div>

          {/* Right Column: Form */}
          <div id="contact-form" className="bg-white border border-slate-100 rounded-[50px] p-10 lg:p-16 shadow-2xl shadow-slate-200">
            <h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-4 text-center">
              Send a Message
            </h2>
            <p className="text-slate-600 text-sm mb-12 text-center font-medium">
              Fill out the form below and we'll get back to you within 24 business hours.
            </p>
            
            {success ? (
              <div className="bg-green-50 text-green-700 p-8 rounded-3xl flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                <CheckCircle size={48} className="mb-4 text-green-500" />
                <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Enquiry Received!</h3>
                <p className="font-medium text-green-600/80">Thank you for your interest in GuestFlow. Our sales team will contact you shortly.</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="mt-6 px-6 py-2 bg-green-100 font-bold uppercase tracking-widest text-xs rounded-full hover:bg-green-200 transition-colors"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-pos-primary focus:border-pos-primary transition-all outline-none"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-pos-primary focus:border-pos-primary transition-all outline-none"
                      placeholder="e.g. jane@company.com"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">Phone Number</label>
                    <input 
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-pos-primary focus:border-pos-primary transition-all outline-none"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 ml-1">Subject</label>
                  <select 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-base text-slate-900 focus:ring-2 focus:ring-pos-primary focus:border-pos-primary transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option>Get a Personal Demo</option>
                    <option>Sales Enquiry / Pricing</option>
                    <option>Technical Support</option>
                    <option>Business Partnership</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 ml-1">Message</label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-pos-primary focus:border-pos-primary transition-all outline-none resize-none"
                    placeholder="Tell us about your business and needs..."
                  ></textarea>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 rounded-xl bg-pos-primary text-white font-semibold text-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-pos-primary/20"
                >
                  {loading ? 'Sending...' : <><Send size={18} /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <MapSection />
    </main>
  );
}
