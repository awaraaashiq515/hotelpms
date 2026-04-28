'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, X, Loader2, Image as ImageIcon, Eye, EyeOff, Sparkles, Globe, FileText } from 'lucide-react';

export default function BlogAdminPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');
  const [apiKey, setApiKey] = useState('');
  const [currentBlog, setCurrentBlog] = useState<any>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    author: 'OrderMint Solutions',
    category: 'Industry Insights',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
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

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/website/settings');
      const json = await res.json();
      if (json.success) setApiKey(json.data.geminiApiKey || '');
    } catch (err) {
      console.error('Fetch settings failed:', err);
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setModalLoading(true);
    try {
      const res = await fetch('/api/website/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: apiKey }),
      });
      const json = await res.json();
      if (json.success) {
        alert('AI API Key saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving settings');
    } finally {
      setModalLoading(true);
      setModalLoading(false);
    }
  };

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

  const handleGenerateAI = async () => {
    if (!currentBlog.title) {
      alert('Please enter a title/topic first to generate content');
      return;
    }

    setModalLoading(true);
    try {
      const res = await fetch('/api/ai/blog-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: currentBlog.title, type: 'blog' }),
      });
      const json = await res.json();
      if (json.success) {
        const { title, excerpt, content, metaTitle, metaDescription, keywords } = json.data;
        setCurrentBlog({
          ...currentBlog,
          title: title || currentBlog.title,
          excerpt,
          content,
          metaTitle,
          metaDescription,
          keywords,
          slug: (title || currentBlog.title).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
        });
      } else {
        alert(json.error || 'AI generation failed. Check if API key is set.');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating content');
    } finally {
      setModalLoading(false);
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
    <div className="space-y-8 pb-24 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">Blog Studio</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Create, SEO-optimize, and publish stories with Gemini AI.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab('settings');
              setShowModal(true);
            }}
            className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-4 rounded-[20px] font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <Sparkles size={20} className="text-pos-primary" />
            AI Settings
          </button>
          <button
            onClick={() => {
              setCurrentBlog({ title: '', slug: '', excerpt: '', content: '', imageUrl: '', author: 'OrderMint Solutions', category: 'Industry Insights', metaTitle: '', metaDescription: '', keywords: '', isActive: true });
              setActiveTab('content');
              setShowModal(true);
            }}
            className="bg-pos-primary text-white px-8 py-4 rounded-[20px] font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-pos-primary/20"
          >
            <Plus size={20} />
            New Story
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-pos-primary" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white dark:bg-slate-900/40 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
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
                <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-50 dark:border-slate-800 gap-3 transition-colors">
                   <div className="flex gap-2">
                     {blog.metaTitle && <div title="SEO Configured" className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center"><Globe size={12} /></div>}
                     {blog.content?.length > 1000 && <div title="Long Read" className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center"><FileText size={12} /></div>}
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => { setCurrentBlog(blog); setActiveTab('content'); setShowModal(true); }} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-900 dark:hover:bg-pos-primary hover:text-white rounded-2xl transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(blog.id)} className="p-3 bg-slate-50 dark:bg-slate-800 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all">
                      <Trash2 size={18} />
                    </button>
                   </div>
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-5xl h-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50 dark:border-slate-800 transition-colors">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{activeTab === 'settings' ? 'AI Configuration' : (currentBlog.id ? 'Edit Story' : 'New Story')}</h2>
                <div className="flex gap-6 mt-4">
                  <button 
                    onClick={() => setActiveTab('content')}
                    className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'content' ? 'text-pos-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Content & Media
                    {activeTab === 'content' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pos-primary rounded-full" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('seo')}
                    className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'seo' ? 'text-pos-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    SEO Optimization
                    {activeTab === 'seo' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pos-primary rounded-full" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'settings' ? 'text-pos-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    AI Configuration
                    {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-pos-primary rounded-full" />}
                  </button>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'content' ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                  {/* Left Column - Main Content */}
                  <div className="md:col-span-8 space-y-6">
                    <div className="relative group">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Story Title</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 5 Hidden Gems in Restaurant Tech"
                          value={currentBlog.title}
                          onChange={e => setCurrentBlog({ ...currentBlog, title: e.target.value })}
                          className="w-full p-5 pr-40 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-bold text-xl text-slate-900 dark:text-white"
                        />
                        <button 
                          onClick={handleGenerateAI}
                          disabled={modalLoading}
                          className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 dark:bg-pos-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-pos-primary transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {modalLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          Generate with AI
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Short Excerpt</label>
                      <textarea
                        placeholder="Provide a brief summary for the listing page..."
                        value={currentBlog.excerpt}
                        onChange={e => setCurrentBlog({ ...currentBlog, excerpt: e.target.value })}
                        className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none h-28 transition-all resize-none font-medium text-sm text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                        Full Content (HTML)
                        <span className="text-slate-300 lowercase italic">Tip: Use h2, p, and strong tags</span>
                      </label>
                      <textarea
                        placeholder="Write your story here..."
                        value={currentBlog.content}
                        onChange={e => setCurrentBlog({ ...currentBlog, content: e.target.value })}
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] border-none focus:ring-2 focus:ring-pos-primary outline-none h-[400px] transition-all font-mono text-sm leading-relaxed text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Right Column - Media & Settings */}
                  <div className="md:col-span-4 space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 text-center">Featured Image</label>
                      <div className="space-y-4">
                        <div className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-[40px] border-4 border-dashed border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center relative group">
                          {currentBlog.imageUrl ? (
                            <img src={currentBlog.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="text-slate-200 dark:text-slate-700 transition-colors flex flex-col items-center gap-2">
                              <ImageIcon size={48} />
                              <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                            </div>
                          )}
                          {modalLoading && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center">
                              <Loader2 className="animate-spin text-pos-primary" size={24} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label htmlFor="blog-img" className="px-6 py-3 bg-white text-slate-900 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-pos-primary hover:text-white transition-all shadow-xl">
                              Change Photo
                            </label>
                          </div>
                        </div>
                        <input type="file" id="blog-img" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Category</label>
                      <select 
                        value={currentBlog.category} 
                        onChange={e => setCurrentBlog({ ...currentBlog, category: e.target.value })}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none text-sm font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat text-slate-900 dark:text-white"
                      >
                        <option value="Product Updates">Product Updates</option>
                        <option value="Industry Insights">Industry Insights</option>
                        <option value="Customer Stories">Customer Stories</option>
                        <option value="Guides">Guides</option>
                      </select>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[32px] space-y-4 transition-colors">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Public Visibility</span>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={currentBlog.isActive} onChange={e => setCurrentBlog({ ...currentBlog, isActive: e.target.checked })} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pos-primary"></div>
                          </label>
                       </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'seo' ? (
                <div className="max-w-3xl mx-auto space-y-8 py-10">
                   <div className="p-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[32px] mb-10 flex items-start gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20"><Globe size={24} /></div>
                      <div>
                        <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">Search Engine Optimization</h4>
                        <p className="text-sm text-blue-700/80 dark:text-blue-300/80 font-medium">Fine-tune how your story appears on Google and social media platforms.</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                        Custom Slug / URL
                        <span className="text-slate-300 font-mono text-[9px]">{`/blog/${currentBlog.slug || '...'}`}</span>
                      </label>
                      <input
                        type="text"
                        placeholder="my-custom-story-url"
                        value={currentBlog.slug}
                        onChange={e => setCurrentBlog({ ...currentBlog, slug: e.target.value })}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none font-mono text-sm text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Meta Title</label>
                      <input
                        type="text"
                        placeholder="SEO friendly title (max 60 chars)"
                        value={currentBlog.metaTitle}
                        onChange={e => setCurrentBlog({ ...currentBlog, metaTitle: e.target.value })}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none font-bold text-slate-900 dark:text-white"
                      />
                      <div className="flex justify-end mt-1"><span className={`text-[9px] font-bold ${currentBlog.metaTitle?.length > 60 ? 'text-red-500' : 'text-slate-300'}`}>{currentBlog.metaTitle?.length || 0}/60</span></div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Meta Description</label>
                      <textarea
                        placeholder="Search engine summary (max 160 chars)"
                        value={currentBlog.metaDescription}
                        onChange={e => setCurrentBlog({ ...currentBlog, metaDescription: e.target.value })}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none h-24 resize-none font-medium text-sm text-slate-900 dark:text-white"
                      />
                      <div className="flex justify-end mt-1"><span className={`text-[9px] font-bold ${currentBlog.metaDescription?.length > 160 ? 'text-red-500' : 'text-slate-300'}`}>{currentBlog.metaDescription?.length || 0}/160</span></div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">SEO Keywords</label>
                      <input
                        type="text"
                        placeholder="POS, Restaurant Management, Inventory (comma separated)"
                        value={currentBlog.keywords}
                        onChange={e => setCurrentBlog({ ...currentBlog, keywords: e.target.value })}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                   </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-8 py-10">
                   <div className="p-8 bg-pos-primary/10 border border-pos-primary/20 rounded-[32px] flex items-start gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-pos-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-pos-primary/20"><Sparkles size={24} /></div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Gemini AI Configuration</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Enter your Google Gemini API Key to enable automatic blog and SEO generation.</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Gemini API Key</label>
                      <div className="relative">
                        <input
                          type="password"
                          placeholder="AIzaSy..."
                          value={apiKey}
                          onChange={e => setApiKey(e.target.value)}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none font-mono text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <p className="mt-2 text-[10px] text-slate-400 font-medium">Your key is stored securely in the database and used only for blog generation.</p>
                    </div>

                    <button 
                      onClick={handleSaveSettings} 
                      disabled={modalLoading}
                      className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:bg-pos-primary dark:hover:bg-pos-primary dark:hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {modalLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save AI Configuration'}
                    </button>
                   </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center transition-colors">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {activeTab === 'settings' ? 'Global System Settings' : `Last modified: ${currentBlog.updatedAt ? new Date(currentBlog.updatedAt).toLocaleTimeString() : 'Draft'}`}
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-8 py-3 rounded-full font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-[10px]"
                >
                  {activeTab === 'settings' ? 'Close' : 'Discard'}
                </button>
                {activeTab !== 'settings' && (
                  <button 
                    onClick={handleSave} 
                    disabled={modalLoading}
                    className="px-12 py-4 rounded-2xl bg-pos-primary text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-pos-primary/20"
                  >
                    {modalLoading ? <Loader2 size={18} className="animate-spin" /> : (currentBlog.id ? 'Update Story' : 'Publish Story')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

