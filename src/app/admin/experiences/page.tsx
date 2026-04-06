'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CheckCircle, XCircle, X } from 'lucide-react';

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentExp, setCurrentExp] = useState<any>({
    title: '',
    description: '',
    imageUrl: '',
    order: 0,
    isActive: true
  });

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/website/experience?admin=true');
      const json = await res.json();
      if (json.success) {
        setExperiences(json.data);
      }
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const handleSave = async () => {
    if (!currentExp.title || !currentExp.imageUrl) {
      alert('Please provide title and image');
      return;
    }

    setModalLoading(true);
    const method = currentExp.id ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/website/experience', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentExp),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchExperiences();
        alert('Experience saved successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save experience');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;
    try {
      const res = await fetch(`/api/website/experience?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setModalLoading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setCurrentExp({ ...currentExp, imageUrl: json.url });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manali Experiences</h1>
          <p className="text-slate-500">Manage tourist attractions and experiences shown on the website.</p>
        </div>
        <button
          onClick={() => {
            setCurrentExp({ title: '', description: '', imageUrl: '', order: 0, isActive: true });
            setShowModal(true);
          }}
          className="bg-pos-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Add Experience
        </button>
      </div>

      {loading && experiences.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[40px] aspect-[4/5] animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experiences.map((exp) => (
            <div key={exp.id} className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex flex-col group">
              <div className="aspect-video relative overflow-hidden">
                <img src={exp.imageUrl} alt="" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md ${exp.isActive ? 'bg-green-500/80 text-white' : 'bg-slate-500/80 text-white'}`}>
                    {exp.isActive ? 'Active' : 'Hidden'}
                  </div>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tighter">{exp.title}</h3>
                <p className="text-slate-500 text-sm mb-6 line-clamp-3 font-light italic leading-relaxed">{exp.description}</p>
                <div className="mt-auto flex justify-end items-center pt-6 border-t border-slate-50 gap-3">
                   <button onClick={() => { setCurrentExp(exp); setShowModal(true); }} className="p-3 bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white rounded-2xl transition-all">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(exp.id)} className="p-3 bg-slate-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {experiences.length === 0 && (
            <div className="col-span-full py-24 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-bold uppercase tracking-widest">No experiences found. Add your first one!</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-10 animate-in zoom-in-95 duration-300 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold uppercase tracking-tighter">{currentExp.id ? 'Edit' : 'Add'} Experience</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>
            
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Display Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Rohtang Pass"
                    value={currentExp.title}
                    onChange={e => setCurrentExp({ ...currentExp, title: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Display Order</label>
                  <input
                    type="number"
                    value={currentExp.order}
                    onChange={e => setCurrentExp({ ...currentExp, order: parseInt(e.target.value) })}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Detailed Description</label>
                <textarea
                  value={currentExp.description}
                  placeholder="Share a short story about this experience..."
                  onChange={e => setCurrentExp({ ...currentExp, description: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none h-32 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Experience Image</label>
                <div className="flex gap-4 items-start">
                  <div className="w-32 h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex-shrink-0 relative">
                    {currentExp.imageUrl ? (
                      <img src={currentExp.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Plus size={32} /></div>
                    )}
                    {modalLoading && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-[11px] text-slate-400 italic">Pick a high-resolution landscape image (3:4 or 16:9 recommended).</p>
                    <input type="file" id="exp-img" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <label htmlFor="exp-img" className="inline-block bg-slate-900 text-white px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-pos-primary transition-all">
                      Choose Image
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={currentExp.isActive}
                  onChange={e => setCurrentExp({ ...currentExp, isActive: e.target.checked })}
                  className="w-5 h-5 rounded-lg text-pos-primary accent-pos-primary"
                />
                <label htmlFor="isActive" className="text-[10px] font-bold text-slate-700 uppercase tracking-widest cursor-pointer">Published on Website</label>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-8 py-3 rounded-full font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={modalLoading}
                className="px-8 py-3 rounded-full bg-pos-primary text-white font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {modalLoading ? 'Saving...' : (currentExp.id ? 'Update Experience' : 'Create Experience')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
