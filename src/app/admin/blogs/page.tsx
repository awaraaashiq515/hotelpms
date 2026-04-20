'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, X, Loader2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

export default function BlogAdminPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<any>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    author: 'OrderMint Solutions',
    category: 'Local Attractions',
    isActive: true
  });

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/website/blog?admin=true');
      const json = await res.json();
      if (json.success) setBlogs(json.data);
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSave = async () => {
    if (!currentBlog.title || !currentBlog.content) {
      alert('Please provide title and content');
      return;
    }

    setModalLoading(true);
    const method = currentBlog.id ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/website/blog', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentBlog),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchBlogs();
      } else {
        alert(json.error || 'Failed to save blog post');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const res = await fetch(`/api/website/blog?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchBlogs();
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
        setCurrentBlog({ ...currentBlog, imageUrl: json.url });
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
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Blog Management</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Create and manage professional blog posts for your website.</p>
        </div>
        <button
          onClick={() => {
            setCurrentBlog({ title: '', slug: '', excerpt: '', content: '', imageUrl: '', author: 'OrderMint Solutions', category: 'Local Attractions', isActive: true });
            setShowModal(true);
          }}
          className="bg-pos-primary text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-pos-primary/20"
        >
          <Plus size={18} />
          New Blog Post
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-pos-primary" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white dark:bg-slate-900/40 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
              <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-800 transition-colors">
                {blog.imageUrl ? (
                  <img src={blog.imageUrl} alt="" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon size={48} />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md flex items-center gap-1.5 ${blog.isActive ? 'bg-green-500/80 text-white' : 'bg-slate-500/80 text-white'}`}>
                    {blog.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                    {blog.isActive ? 'Published' : 'Hidden'}
                  </div>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                   <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-pos-primary bg-pos-primary/10 px-3 py-1 rounded-full">{blog.category}</span>
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(blog.publishedAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight transition-colors">{blog.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 font-medium opacity-80 transition-colors">{blog.excerpt || 'No excerpt provided...'}</p>
                <div className="mt-auto flex justify-end items-center pt-6 border-t border-slate-50 gap-3">
                   <button onClick={() => { setCurrentBlog(blog); setShowModal(true); }} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-900 dark:hover:bg-pos-primary hover:text-white rounded-2xl transition-all">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(blog.id)} className="p-3 bg-slate-50 dark:bg-slate-800 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-slate-900/40 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest opacity-60">No blogs found. Start writing your first story!</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-4xl p-10 animate-in zoom-in-95 duration-300 shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold dark:text-white">{currentBlog.id ? 'Edit' : 'Create'} Blog Post</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              {/* Left Column - Main Content */}
              <div className="md:col-span-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Post Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Hidden Gems You Must Visit"
                    value={currentBlog.title}
                    onChange={e => setCurrentBlog({ ...currentBlog, title: e.target.value })}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-bold text-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Short Excerpt</label>
                  <textarea
                    placeholder="Provide a brief summary for the listing page..."
                    value={currentBlog.excerpt}
                    onChange={e => setCurrentBlog({ ...currentBlog, excerpt: e.target.value })}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none h-24 transition-all resize-none font-medium text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Full Content (HTML/Rich Text)</label>
                  <textarea
                    placeholder="Write your story here..."
                    value={currentBlog.content}
                    onChange={e => setCurrentBlog({ ...currentBlog, content: e.target.value })}
                    className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] border-none focus:ring-2 focus:ring-pos-primary outline-none h-[400px] transition-all font-mono text-sm leading-relaxed text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Right Column - Meta Data */}
              <div className="md:col-span-4 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Slug</label>
                  <input
                    type="text"
                    placeholder="auto-generated-if-empty"
                    value={currentBlog.slug}
                    onChange={e => setCurrentBlog({ ...currentBlog, slug: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-pos-primary outline-none text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={currentBlog.category} 
                    onChange={e => setCurrentBlog({ ...currentBlog, category: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-pos-primary outline-none text-xs font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_10px_center] bg-no-repeat text-slate-900 dark:text-white"
                  >
                    <option value="Local Attractions">Local Attractions</option>
                    <option value="Resort News">Resort News</option>
                    <option value="Travel Guide">Travel Guide</option>
                    <option value="Events">Events</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Featured Image</label>
                  <div className="space-y-4">
                    <div className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative">
                      {currentBlog.imageUrl ? (
                        <img src={currentBlog.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-slate-300 dark:text-slate-700 transition-colors"><Plus size={32} /></div>
                      )}
                      {modalLoading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <Loader2 className="animate-spin text-pos-primary" size={24} />
                        </div>
                      )}
                    </div>
                    <input type="file" id="blog-img" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <label htmlFor="blog-img" className="w-full block text-center bg-slate-900 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-pos-primary transition-all shadow-sm">
                      Upload Image
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl transition-colors">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={currentBlog.isActive}
                    onChange={e => setCurrentBlog({ ...currentBlog, isActive: e.target.checked })}
                    className="w-5 h-5 rounded-lg text-pos-primary accent-pos-primary cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest cursor-pointer">Published</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-10 border-t border-slate-50 dark:border-slate-800 mt-10 transition-colors">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-8 py-3 rounded-full font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={modalLoading}
                className="px-10 py-3 rounded-full bg-pos-primary text-white font-bold text-sm hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-pos-primary/20"
              >
                {modalLoading ? 'Processing...' : (currentBlog.id ? 'Save Changes' : 'Publish Blog')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
