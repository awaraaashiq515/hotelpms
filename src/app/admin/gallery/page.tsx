'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, CheckCircle, XCircle, 
  X, Image as ImageIcon, Save, Loader2,
  Filter, LayoutGrid, List
} from 'lucide-react';

const CATEGORIES = [
  'General', 'Exterior', 'Interior', 'Rooms', 'Restaurant', 'Events', 'Manali Views'
];

export default function GalleryManagementPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentImage, setCurrentImage] = useState<any>({
    url: '',
    category: 'General',
    order: 0,
    isActive: true
  });
  const [heroSettings, setHeroSettings] = useState({
    galleryHeroVideoUrl: '',
    galleryHeroImageUrl: ''
  });
  const [heroLoading, setHeroLoading] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/website/gallery?admin=true');
      const json = await res.json();
      if (json.success) setImages(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setHeroSettings({
            galleryHeroVideoUrl: json.data.galleryHeroVideoUrl || '',
            galleryHeroImageUrl: json.data.galleryHeroImageUrl || ''
          });
        }
      });
  }, []);

  const handleSaveHero = async () => {
    setHeroLoading(true);
    try {
      const res = await fetch('/api/website/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heroSettings),
      });
      const json = await res.json();
      if (json.success) {
        alert('Hero settings updated successfully!');
      } else {
        alert('Failed to update: ' + (json.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update hero settings');
    } finally {
      setHeroLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentImage.url) {
      alert('Please provide an image URL or upload an image');
      return;
    }

    setModalLoading(true);
    const method = currentImage.id ? 'PUT' : 'POST';
    const url = currentImage.id ? `/api/website/gallery/${currentImage.id}` : '/api/website/gallery';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentImage),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchImages();
        alert('Gallery image saved successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save image');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`/api/website/gallery/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setModalLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        setCurrentImage({ ...currentImage, url: json.url });
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Main Gallery</h1>
          <p className="text-slate-500">Manage all professional photos displayed on the website gallery and homepage.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-pos-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-pos-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={20} />
            </button>
          </div>
          <button
            onClick={() => {
              setCurrentImage({ url: '', category: 'General', order: 0, isActive: true });
              setShowModal(true);
            }}
            className="bg-pos-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-pos-primary/20"
          >
            <Plus size={18} />
            Add Image
          </button>
        </div>
      </div>

      {/* Gallery Hero Settings - Integrated */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gallery Hero Background</h2>
          <button
            onClick={handleSaveHero}
            disabled={heroLoading}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-pos-primary transition-all disabled:opacity-50"
          >
            {heroLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Hero Settings
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Hero Video (Drone Shot .mp4)</label>
            <div className="flex gap-4">
              <input
                type="text"
                value={heroSettings.galleryHeroVideoUrl}
                onChange={e => setHeroSettings({ ...heroSettings, galleryHeroVideoUrl: e.target.value })}
                className="flex-grow p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-medium text-slate-900"
                placeholder="https://example.com/video.mp4"
              />
              <input
                type="file"
                id="hero-video-upload"
                className="hidden"
                accept="video/mp4,video/x-m4v,video/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  // Check file size (optional but recommended for videos)
                  if (file.size > 50 * 1024 * 1024) { // 50MB limit
                    alert('Video is too large. Please upload a file smaller than 50MB.');
                    return;
                  }

                  const formData = new FormData();
                  formData.append('file', file);
                  setHeroLoading(true);
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    const json = await res.json();
                    if (json.success) {
                      setHeroSettings({ ...heroSettings, galleryHeroVideoUrl: json.url });
                    }
                  } catch (err) {
                    console.error('Upload failed:', err);
                    alert('Video upload failed');
                  } finally {
                    setHeroLoading(false);
                  }
                }}
              />
              <label
                htmlFor="hero-video-upload"
                className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-900 hover:text-white transition-all flex items-center shrink-0"
              >
                Upload Video
              </label>
            </div>
            <p className="mt-2 text-[10px] text-slate-400 font-medium ml-2 italic">Add a direct link or upload an MP4 drone video for a cinematic effect.</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Fallback Hero Image</label>
            <div className="flex gap-4">
              <input
                type="text"
                value={heroSettings.galleryHeroImageUrl}
                onChange={e => setHeroSettings({ ...heroSettings, galleryHeroImageUrl: e.target.value })}
                className="flex-grow p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-medium text-slate-900"
                placeholder="https://example.com/image.jpg"
              />
              <input
                type="file"
                id="hero-img-upload"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  setHeroLoading(true);
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    const json = await res.json();
                    if (json.success) {
                      setHeroSettings({ ...heroSettings, galleryHeroImageUrl: json.url });
                    }
                  } finally {
                    setHeroLoading(false);
                  }
                }}
              />
              <label
                htmlFor="hero-img-upload"
                className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-900 hover:text-white transition-all flex items-center"
              >
                Upload
              </label>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-pos-primary" size={40} />
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Image Preview</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {images.map((image) => (
                <tr key={image.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={image.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="p-6 text-sm font-bold text-slate-900 uppercase tracking-tight">
                    {image.category}
                  </td>
                  <td className="p-6 text-sm font-bold text-slate-400">
                    {image.order}
                  </td>
                  <td className="p-6">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${image.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {image.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {image.isActive ? 'Active' : 'Hidden'}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setCurrentImage(image); setShowModal(true); }} 
                        className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(image.id)} className="p-2.5 bg-slate-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {images.map((image) => (
            <div key={image.id} className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all p-3 overflow-hidden">
              <div className="aspect-[4/3] rounded-[24px] overflow-hidden bg-slate-100 relative mb-4">
                <img src={image.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[9px] font-bold text-white uppercase tracking-widest">
                  {image.category}
                </div>
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setCurrentImage(image); setShowModal(true); }}
                    className="p-2 bg-white text-slate-900 rounded-full shadow-lg hover:bg-pos-primary hover:text-white transition-all transform hover:scale-110"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(image.id)}
                    className="p-2 bg-white text-red-500 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-2 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order: {image.order}</span>
                <div className={`w-2 h-2 rounded-full ${image.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && images.length === 0 && (
        <div className="py-24 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
          <ImageIcon className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="text-slate-400 font-bold uppercase tracking-widest">Your gallery is empty. Start by uploading some beautiful photos!</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-10 animate-in zoom-in-95 duration-300 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
              <h2 className="text-3xl font-bold uppercase tracking-tighter">{currentImage.id ? 'Edit' : 'Add'} Gallery Image</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-2 bg-slate-50 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="aspect-video rounded-[32px] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 relative group">
                {currentImage.url ? (
                  <>
                    <img src={currentImage.url} alt="Preview" className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-sm">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-xs font-bold uppercase tracking-widest">Change Image</span>
                      <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </label>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition-all">
                    {modalLoading ? <Loader2 className="animate-spin text-pos-primary mb-4" size={40} /> : <Plus size={40} className="mb-4" />}
                    <span className="text-xs font-bold uppercase tracking-widest">Click to Upload Photo</span>
                    <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Category</label>
                  <select
                    value={currentImage.category}
                    onChange={e => setCurrentImage({ ...currentImage, category: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-bold text-slate-900 appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Display Order</label>
                  <input
                    type="number"
                    value={currentImage.order}
                    onChange={e => setCurrentImage({ ...currentImage, order: parseInt(e.target.value) || 0 })}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-bold text-slate-900"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-900 text-white p-6 rounded-[30px]">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={currentImage.isActive}
                  onChange={e => setCurrentImage({ ...currentImage, isActive: e.target.checked })}
                  className="w-6 h-6 rounded-xl accent-pos-primary"
                />
                <div className="flex-1">
                  <label htmlFor="isActive" className="text-xs font-bold uppercase tracking-widest cursor-pointer block">Visible on Website</label>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Toggle this to show or hide the image from the public gallery.</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={modalLoading || !currentImage.url}
                  className="flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl bg-pos-primary text-white font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-pos-primary/20 disabled:opacity-50"
                >
                  {modalLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {currentImage.id ? 'Save Changes' : 'Publish Image'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-10 py-5 rounded-3xl bg-slate-50 text-slate-400 font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
