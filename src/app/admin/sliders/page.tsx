'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';

export default function SlidersPage() {
  const [sliders, setSliders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<any>({
    section: 'HERO',
    type: 'IMAGE',
    url: '',
    title: '',
    subtitle: '',
    order: 0,
    isActive: true
  });

  const fetchSliders = async () => {
    try {
      const res = await fetch('/api/website/slider');
      const json = await res.json();
      if (json.success) setSliders(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleSave = async () => {
    const method = currentSlide.id ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/website/slider', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSlide),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchSliders();
        alert('Slide saved successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    try {
      const res = await fetch(`/api/website/slider?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchSliders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sliders Management</h1>
          <p className="text-slate-500">Add or edit hero banners and gallery sliders.</p>
        </div>
        <button
          onClick={() => {
            setCurrentSlide({ section: 'HERO', type: 'IMAGE', url: '', title: '', subtitle: '', order: 0, isActive: true });
            setShowModal(true);
          }}
          className="bg-pos-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Slide
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Preview</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Section</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Title & Subtitle</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sliders.map((slider) => (
              <tr key={slider.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6">
                  <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                    {slider.type === 'VIDEO' || slider.url?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      <video src={slider.url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={slider.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-tighter text-slate-600">
                    {slider.section}
                  </span>
                </td>
                <td className="p-6">
                  <p className="text-sm font-bold text-slate-900">{slider.title || 'No Title'}</p>
                  <p className="text-[10px] text-slate-400 font-medium italic">{slider.subtitle || 'No Subtitle'}</p>
                </td>
                <td className="p-6">
                  {slider.isActive ? (
                    <span className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase">
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                      <XCircle size={14} /> Inactive
                    </span>
                  )}
                </td>
                <td className="p-6 text-right space-x-2">
                  <button onClick={() => { setCurrentSlide(slider); setShowModal(true); }} className="p-2 hover:bg-rose-50 rounded-lg transition-all" style={{color:'#e8a0a0'}}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(slider.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-10 animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold mb-8 uppercase tracking-tighter">Edit Slide</h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Image/Video URL</label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={currentSlide.url}
                    onChange={e => setCurrentSlide({ ...currentSlide, url: e.target.value })}
                    className="flex-grow p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none"
                    placeholder="Enter URL or upload file"
                  />
                  <input
                    type="file"
                    id="slide-upload"
                    className="hidden"
                    accept="image/*,video/mp4,video/x-m4v,video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      // 1000MB limit
                      if (file.size > 1000 * 1024 * 1024) { 
                        alert('File is too large. Please upload an image or video smaller than 1000MB.');
                        return;
                      }

                      const formData = new FormData();
                      formData.append('file', file);
                      
                      const uploadLabel = document.getElementById('slide-upload-label');
                      if (uploadLabel) uploadLabel.innerText = 'Uploading...';
                      
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const json = await res.json();
                        if (json.success) {
                          const fileType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
                          setCurrentSlide({ ...currentSlide, url: json.url, type: fileType });
                        } else {
                          alert('Upload failed: ' + (json.error || 'Unknown error'));
                        }
                      } catch (err) {
                        console.error('Upload failed:', err);
                        alert('File upload failed');
                      } finally {
                        if (uploadLabel) uploadLabel.innerText = 'Upload File';
                      }
                    }}
                  />
                  <label
                    htmlFor="slide-upload"
                    id="slide-upload-label"
                    className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-900 hover:text-white transition-all flex items-center shrink-0 min-w[120px] justify-center"
                  >
                    Upload File
                  </label>
                </div>
                <p className="mt-2 text-[10px] text-slate-400 font-medium ml-2 italic">Support images and videos up to 1000MB.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Section</label>
                <select
                  value={currentSlide.section}
                  onChange={e => setCurrentSlide({ ...currentSlide, section: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none"
                >
                  <option value="HERO">Hero Banner</option>
                  <option value="GALLERY1">Gallery 1</option>
                  <option value="GALLERY2">Gallery 2</option>
                  <option value="GALLERY3">Gallery 3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Order</label>
                <input
                  type="number"
                  value={currentSlide.order}
                  onChange={e => setCurrentSlide({ ...currentSlide, order: parseInt(e.target.value) })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                <input
                  type="text"
                  value={currentSlide.title || ''}
                  onChange={e => setCurrentSlide({ ...currentSlide, title: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none"
                  placeholder="Enter title (e.g. Experience Luxury)"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subtitle</label>
                <input
                  type="text"
                  value={currentSlide.subtitle || ''}
                  onChange={e => setCurrentSlide({ ...currentSlide, subtitle: e.target.value })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none"
                  placeholder="Enter subtitle (e.g. Redefining elegance in every stay)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowModal(false)} className="px-8 py-3 rounded-full font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleSave} className="px-8 py-3 rounded-full bg-pos-primary text-white font-bold uppercase tracking-widest hover:bg-black transition-all">Save Slide</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
