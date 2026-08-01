import React, { useState } from 'react';
import { 
  Rss, Film, Plus, Image as ImageIcon, Loader2, Play, Video, 
  Trash2, Heart, MessageSquare, Music, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import { ReelCard } from './ReelCard';

interface PostItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  tags: string | null;
  createdAt: string;
  likes?: Array<{ id: string; singerId: string | null; guestId: string | null }>;
  comments?: Array<{ id: string; authorName: string; content: string; createdAt: string }>;
}

interface VideoItem {
  id: string;
  title: string;
  videoUrl: string;
  description: string | null;
  createdAt: string;
}

interface MyContentTabProps {
  token: string;
  singer: any;
  setSinger: React.Dispatch<React.SetStateAction<any>>;
  posts: PostItem[];
  videos: VideoItem[];
  fetchPosts: (token: string) => Promise<void>;
  fetchVideos: (token: string) => Promise<void>;
}

export const MyContentTab = ({
  token,
  singer,
  setSinger,
  posts,
  videos,
  fetchPosts,
  fetchVideos
}: MyContentTabProps) => {
  const [contentSegment, setContentSegment] = useState<'all' | 'posts' | 'reels'>('all');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(singer?.coverPhotoUrl || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(singer?.photoUrl || '');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Post forms
  const [showAddPost, setShowAddPost] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', content: '', imageUrl: '', tags: '' });
  const [uploadingPostImage, setUploadingPostImage] = useState(false);

  // Video/Reel forms
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoForm, setVideoForm] = useState({ title: '', videoUrl: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Post interactions
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showPostComments, setShowPostComments] = useState<Record<string, boolean>>({});

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await fetch('/api/singer/posts/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ postId })
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts(token);
      } else {
        toast.error(data.error || 'Failed to toggle like');
      }
    } catch {
      toast.error('Network error occurred.');
    }
  };

  const handlePublishComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      const res = await fetch('/api/singer/posts/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ postId, content })
      });
      const data = await res.json();
      if (data.success) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        fetchPosts(token);
      } else {
        toast.error(data.error || 'Failed to post comment');
      }
    } catch {
      toast.error('Network error occurred.');
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title || !postForm.content) return;
    try {
      const res = await fetch('/api/singer/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(postForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Post published!');
        setPostForm({ title: '', content: '', imageUrl: '', tags: '' });
        setShowAddPost(false);
        fetchPosts(token);
      }
    } catch (err) {
      toast.error('Failed to publish post.');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Delete this post update?')) return;
    try {
      const res = await fetch(`/api/singer/posts?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Post deleted.');
        fetchPosts(token);
      }
    } catch (err) {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds the 50MB limit.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(40);
      const res = await fetch('/api/singer/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      setUploadProgress(80);
      const data = await res.json();
      setUploadProgress(100);

      if (data.success) {
        setVideoForm(prev => ({ ...prev, videoUrl: data.url }));
        toast.success('Performance cover uploaded successfully!');
      } else {
        toast.error(data.message || 'File upload failed.');
      }
    } catch (err) {
      toast.error('Connection error while uploading.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title || !videoForm.videoUrl) return;
    try {
      const res = await fetch('/api/singer/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(videoForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Video link added!');
        setVideoForm({ title: '', videoUrl: '', description: '' });
        setShowAddVideo(false);
        fetchVideos(token);
      }
    } catch (err) {
      toast.error('Failed to add video.');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Delete this video clip?')) return;
    try {
      const res = await fetch(`/api/singer/videos?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Video link deleted.');
        fetchVideos(token);
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-0">
      {/* ── Instagram-style Profile Header ── */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl mb-3">
        {/* Cover Photo */}
        <div className="relative h-36 sm:h-48 bg-gradient-to-br from-indigo-900/60 via-violet-900/40 to-slate-900 overflow-hidden">
          {coverPhotoUrl ? (
            <img src={coverPhotoUrl} alt="cover" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-950/70 to-[#050a14]">
              <div className="absolute top-4 right-8 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl" />
              <div className="absolute bottom-0 left-12 w-32 h-20 rounded-full bg-violet-500/10 blur-2xl" />
            </div>
          )}
          <label className="absolute top-3 right-3 cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              setUploadingCover(true);
              const fd = new FormData(); fd.append('file', file);
              try {
                const res = await fetch('/api/singer/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
                const data = await res.json();
                if (data.url) {
                  setCoverPhotoUrl(data.url);
                  const patchRes = await fetch('/api/singer/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ coverPhotoUrl: data.url })
                  });
                  const patchData = await patchRes.json();
                  if (patchRes.ok) {
                    toast.success('Cover photo saved!');
                    setSinger((prev: any) => {
                      if (!prev) return null;
                      const updated = { ...prev, coverPhotoUrl: data.url };
                      localStorage.setItem('singer_info', JSON.stringify(updated));
                      return updated;
                    });
                  } else {
                    toast.error(`Database save failed: ${patchData.error || patchRes.statusText}`);
                  }
                } else toast.error('Cover upload failed');
              } catch (err: any) { toast.error(`Upload error: ${err.message}`); }
              setUploadingCover(false);
            }} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black text-white hover:bg-black/60 transition-all">
              {uploadingCover ? <Loader2 size={10} className="animate-spin" /> : <ImageIcon size={10} />}
              {uploadingCover ? 'Uploading...' : 'Edit Cover'}
            </div>
          </label>
        </div>

        {/* Avatar + Info row */}
        <div className="px-4 pb-4 bg-[#09101f]">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#09101f] overflow-hidden bg-slate-800 shadow-xl">
                <img
                  src={profilePhotoUrl || singer?.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'}
                  alt={singer?.name} className="w-full h-full object-cover"
                />
              </div>
              <label className="absolute bottom-0 right-0 cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setUploadingAvatar(true);
                  const fd = new FormData(); fd.append('file', file);
                  try {
                    const res = await fetch('/api/singer/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
                    const data = await res.json();
                    if (data.url) {
                      setProfilePhotoUrl(data.url);
                      const patchRes = await fetch('/api/singer/profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ photoUrl: data.url })
                      });
                      const patchData = await patchRes.json();
                      if (patchRes.ok) {
                        toast.success('Photo updated');
                        setSinger((prev: any) => {
                          if (!prev) return null;
                          const updated = { ...prev, photoUrl: data.url };
                          localStorage.setItem('singer_info', JSON.stringify(updated));
                          return updated;
                        });
                      } else {
                        toast.error(`Database save failed: ${patchData.error || patchRes.statusText}`);
                      }
                    } else toast.error('Photo upload failed');
                  } catch (err: any) { toast.error(`Upload error: ${err.message}`); }
                  setUploadingAvatar(false);
                }} />
                <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-[#09101f] flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg">
                  {uploadingAvatar ? <Loader2 size={10} className="animate-spin text-white" /> : <ImageIcon size={10} className="text-white" />}
                </div>
              </label>
            </div>
          </div>
          <div>
            <h2 className="text-base font-black text-white leading-tight">{singer?.name}</h2>
            <p className="text-xs text-indigo-400 font-bold mt-0.5">{singer?.genre || 'Musician'}</p>
            <div className="flex items-center gap-4 mt-2.5">
              <div className="text-center"><p className="text-sm font-black text-white">{posts.length}</p><p className="text-[9px] text-slate-500 uppercase tracking-wider">Posts</p></div>
              <div className="w-px h-6 bg-slate-800" />
              <div className="text-center"><p className="text-sm font-black text-white">{videos.length}</p><p className="text-[9px] text-slate-500 uppercase tracking-wider">Reels</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Segment switcher + Create button */}
      <div className="flex items-center border-b border-slate-800/60">
        <button
          onClick={() => setContentSegment('all')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${
            contentSegment === 'all' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Rss size={13} />
          All
        </button>
        <button
          onClick={() => setContentSegment('posts')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${
            contentSegment === 'posts' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          Posts
        </button>
        <button
          onClick={() => setContentSegment('reels')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${
            contentSegment === 'reels' ? 'border-white text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Film size={13} />
          Reels
        </button>
        {/* Create buttons on right */}
        {contentSegment === 'all' ? (
          <div className="flex gap-1.5 mx-2">
            <button
              onClick={() => setShowAddPost(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-555 text-white text-[10px] font-black transition-all active:scale-95"
            >
              <Plus size={11} /> Post
            </button>
            <button
              onClick={() => setShowAddVideo(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-655 hover:bg-indigo-555 text-white text-[10px] font-black transition-all active:scale-95"
            >
              <Plus size={11} /> Reel
            </button>
          </div>
        ) : (
          <button
            onClick={() => contentSegment === 'posts' ? setShowAddPost(true) : setShowAddVideo(true)}
            className="mx-3 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black transition-all active:scale-95"
          >
            <Plus size={12} />
            {contentSegment === 'posts' ? 'Post' : 'Reel'}
          </button>
        )}
      </div>

      {/* ── ALL segment ── */}
      {contentSegment === 'all' && (
        <div className="pt-4 space-y-4">
          {[
            ...posts.map(p => ({ ...p, feedType: 'post' as const })),
            ...videos.map(v => ({ ...v, feedType: 'reel' as const }))
          ]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800/60 rounded-2xl">
                <Rss size={28} className="mx-auto mb-3 text-slate-700" />
                <p className="text-sm font-bold">No content yet</p>
                <p className="text-xs mt-1">Tap <span className="text-indigo-400 font-black">+ Post</span> or <span className="text-indigo-400 font-black">+ Reel</span> above to start sharing updates</p>
              </div>
            ) : (
              [
                ...posts.map(p => ({ ...p, feedType: 'post' as const })),
                ...videos.map(v => ({ ...v, feedType: 'reel' as const }))
              ]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(item => {
                  if (item.feedType === 'post') {
                    return (
                      <div key={item.id} className="max-w-md mx-auto w-full rounded-3xl border border-slate-800 bg-[#090f1e]/85 overflow-hidden shadow-xl space-y-3 pb-4">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                          <div className="flex items-center gap-3">
                            <img 
                              src={singer?.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                              alt={singer?.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-800"
                            />
                            <div>
                              <h4 className="text-xs font-black text-white">{singer?.name}</h4>
                              <span className="text-[9px] text-slate-500 block mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button onClick={() => handleDeletePost(item.id)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-500 hover:text-rose-455 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        
                        {item.imageUrl ? (
                          <div className="aspect-square bg-slate-950 flex items-center justify-center overflow-hidden border-t border-b border-slate-800/80">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="aspect-square bg-gradient-to-tr from-[#050a14] to-[#090f1e] flex flex-col items-center justify-center p-6 text-center border-t border-b border-slate-800/80">
                            <Music className="text-slate-800 mb-3" size={32} />
                            <h3 className="text-sm font-black text-white/90 max-w-xs leading-normal">"{item.title}"</h3>
                          </div>
                        )}

                        <div className="flex gap-4 px-4 pt-1">
                          <button 
                            onClick={() => handleToggleLike(item.id)}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Heart size={18} className={item.likes?.some(l => l.singerId === singer?.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
                            <span className="text-[11px] font-black text-slate-400">{item.likes?.length || 0}</span>
                          </button>
                          <button 
                            onClick={() => setShowPostComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                          >
                            <MessageSquare size={17} className={showPostComments[item.id] ? 'text-indigo-400' : 'text-slate-400'} />
                            <span className="text-[11px] font-black text-slate-400">{item.comments?.length || 0}</span>
                          </button>
                        </div>

                        <div className="px-4 space-y-1.5">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            <span className="font-black mr-2 text-white">{singer?.name}</span>
                            {item.content}
                          </p>
                          {item.tags && (
                            <div className="flex gap-1.5 flex-wrap pt-0.5">
                              {item.tags.split(',').map((t: string) => t.trim()).filter(Boolean).map((t: string, i: number) => (
                                <span key={i} className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer">#{t}</span>
                              ))}
                            </div>
                          )}

                          <div className="border-t border-slate-800/40 pt-2.5 mt-2.5 space-y-2">
                            {showPostComments[item.id] && (
                              <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1 py-1">
                                {item.comments && item.comments.length > 0 ? (
                                  item.comments.map(c => (
                                    <div key={c.id} className="text-[11px] text-slate-300 leading-normal flex items-start gap-1">
                                      <span className="font-black text-slate-200 whitespace-nowrap">{c.authorName}:</span>
                                      <span>{c.content}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[10px] text-slate-500 italic py-1">No comments yet</p>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1 border-t border-slate-900/40">
                              <input 
                                type="text"
                                placeholder="Add a comment..."
                                className="flex-1 bg-[#050a14] border border-slate-900 rounded-xl px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                                value={commentInputs[item.id] || ''}
                                onChange={e => setCommentInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handlePublishComment(item.id);
                                }}
                              />
                              <button 
                                onClick={() => handlePublishComment(item.id)}
                                className="text-indigo-400 hover:text-indigo-300 text-[11px] font-black uppercase tracking-wider px-1"
                              >
                                Post
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={item.id} className="max-w-md mx-auto w-full rounded-3xl border border-slate-800 bg-[#090f1e]/85 overflow-hidden shadow-xl space-y-3 pb-4">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                          <div className="flex items-center gap-3">
                            <img 
                              src={singer?.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                              alt={singer?.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-800"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-black text-white">{singer?.name}</h4>
                                <span className="text-[8px] font-black uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 py-0.2 rounded-md">Reel</span>
                              </div>
                              <span className="text-[9px] text-slate-500 block mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteVideo(item.id)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-500 hover:text-rose-455 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className="aspect-square bg-slate-950 flex items-center justify-center overflow-hidden border-t border-b border-slate-800/80 relative">
                          <video 
                            src={item.videoUrl} 
                            controls 
                            playsInline 
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="px-4 space-y-1">
                          <h4 className="text-xs font-black text-white">{item.title}</h4>
                          {item.description && (
                            <p className="text-xs text-slate-350 leading-relaxed mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  }
                })
            )}
        </div>
      )}

      {/* ── POSTS segment ── */}
      {contentSegment === 'posts' && (
        <div className="pt-4 space-y-4">
          {showAddPost && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                <h3 className="font-black text-sm uppercase tracking-wider text-white border-b border-slate-800 pb-3 mb-4">Write New Update Post</h3>
                <form onSubmit={handleAddPost} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Post Title *</label>
                    <input 
                      type="text" required
                      placeholder="e.g. Acoustic retro night tonight!"
                      className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700"
                      value={postForm.title}
                      onChange={e => setPostForm({...postForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Upload Photo (Optional)</label>
                    <div className="border border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center transition-colors relative cursor-pointer bg-[#050a14]">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          setUploadingPostImage(true);
                          const fd = new FormData(); fd.append('file', file);
                          try {
                            const res = await fetch('/api/singer/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
                            const data = await res.json();
                            if (data.url) {
                              setPostForm(prev => ({ ...prev, imageUrl: data.url }));
                              toast.success('Post photo uploaded!');
                            } else toast.error('Upload failed');
                          } catch (err: any) { toast.error(`Error: ${err.message}`); }
                          setUploadingPostImage(false);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {uploadingPostImage ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <Loader2 className="animate-spin text-indigo-500" size={20} />
                          <p className="text-[10px] text-indigo-400 font-bold">Uploading Post Image...</p>
                        </div>
                      ) : postForm.imageUrl ? (
                        <div className="flex flex-col items-center gap-1.5 py-1">
                          <CheckCircle2 className="text-emerald-500" size={20} />
                          <p className="text-[10px] text-emerald-400 font-bold">Photo Uploaded</p>
                          <span className="text-[9px] text-slate-500 truncate max-w-[250px]">{postForm.imageUrl}</span>
                        </div>
                      ) : (
                        <div className="space-y-1 py-1">
                          <ImageIcon className="mx-auto text-slate-650" size={20} />
                          <p className="text-[10px] text-slate-400 font-black">Choose a photo file or Drag & Drop here</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Post Description *</label>
                    <textarea 
                      required rows={3}
                      placeholder="Share a story or detail about your performance update..."
                      className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700 resize-none"
                      value={postForm.content}
                      onChange={e => setPostForm({...postForm, content: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Hash Tags (Comma separated, Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. livemusic, retro, acoustics"
                      className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700"
                      value={postForm.tags}
                      onChange={e => setPostForm({...postForm, tags: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-3 justify-end border-t border-slate-800/80 pt-4 mt-2">
                    <button type="button" onClick={() => setShowAddPost(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-black text-slate-400 hover:text-white">Cancel</button>
                    <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-xs font-black text-white shadow-md">Publish</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800/60 rounded-2xl">
              <ImageIcon size={28} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-bold">No posts yet</p>
              <p className="text-xs mt-1">Tap <span className="text-indigo-400 font-black">+ Post</span> above to create your first update</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="max-w-md mx-auto w-full rounded-3xl border border-slate-800 bg-[#090f1e]/85 overflow-hidden shadow-xl space-y-3 pb-4">
                <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <img 
                      src={singer?.photoUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=60'} 
                      alt={singer?.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-800"
                    />
                    <div>
                      <h4 className="text-xs font-black text-white">{singer?.name}</h4>
                      <span className="text-[9px] text-slate-500 block mt-0.5">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeletePost(post.id)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-500 hover:text-rose-455 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
                
                {post.imageUrl ? (
                  <div className="aspect-square bg-slate-950 flex items-center justify-center overflow-hidden border-t border-b border-slate-800/80">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-tr from-[#050a14] to-[#090f1e] flex flex-col items-center justify-center p-6 text-center border-t border-b border-slate-800/80">
                    <Music className="text-slate-850 mb-3" size={32} />
                    <h3 className="text-sm font-black text-white/90 max-w-xs leading-normal">"{post.title}"</h3>
                  </div>
                )}

                <div className="flex gap-4 px-4 pt-1">
                  <button 
                    onClick={() => handleToggleLike(post.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Heart size={18} className={post.likes?.some(l => l.singerId === singer?.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
                    <span className="text-[11px] font-black text-slate-400">{post.likes?.length || 0}</span>
                  </button>
                  <button 
                    onClick={() => setShowPostComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <MessageSquare size={17} className={showPostComments[post.id] ? 'text-indigo-400' : 'text-slate-400'} />
                    <span className="text-[11px] font-black text-slate-400">{post.comments?.length || 0}</span>
                  </button>
                </div>

                <div className="px-4 space-y-1.5">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-black mr-2 text-white">{singer?.name}</span>
                    {post.content}
                  </p>
                  {post.tags && (
                    <div className="flex gap-1.5 flex-wrap pt-0.5">
                      {post.tags.split(',').map((t: string) => t.trim()).filter(Boolean).map((t: string, i: number) => (
                        <span key={i} className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer">#{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Comments list & Add Comment input bar */}
                  <div className="border-t border-slate-800/40 pt-2.5 mt-2.5 space-y-2">
                    {/* Toggleable Comments view */}
                    {showPostComments[post.id] && (
                      <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1 py-1">
                        {post.comments && post.comments.length > 0 ? (
                          post.comments.map(c => (
                            <div key={c.id} className="text-[11px] text-slate-300 leading-normal flex items-start gap-1">
                              <span className="font-black text-slate-200 whitespace-nowrap">{c.authorName}:</span>
                              <span>{c.content}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-500 italic py-1">No comments yet</p>
                        )}
                      </div>
                    )}

                    {/* Comment Input */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-900/40">
                      <input 
                        type="text"
                        placeholder="Add a comment..."
                        className="flex-1 bg-[#050a14] border border-slate-900 rounded-xl px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handlePublishComment(post.id);
                        }}
                      />
                      <button 
                        onClick={() => handlePublishComment(post.id)}
                        className="text-indigo-400 hover:text-indigo-300 text-[11px] font-black uppercase tracking-wider px-1"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── REELS segment ── */}
      {contentSegment === 'reels' && (
        <div className="pt-4 space-y-4">
          {showAddVideo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                <h3 className="font-black text-sm uppercase tracking-wider text-white border-b border-slate-800 pb-3 mb-4">Upload Performance Cover Clip</h3>
                <form onSubmit={handleAddVideo} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Video Title *</label>
                    <input 
                      type="text" required
                      placeholder="e.g. Tum Hi Ho Acoustic Cover"
                      className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700"
                      value={videoForm.title}
                      onChange={e => setVideoForm({...videoForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Performance Video File *</label>
                    <div className="border border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center transition-colors relative cursor-pointer bg-[#050a14]">
                      <input 
                        type="file" 
                        accept="video/*" 
                        required={!videoForm.videoUrl}
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <Loader2 className="animate-spin text-indigo-500" size={20} />
                          <p className="text-[10px] text-indigo-400 font-bold">Uploading Cover Clip ({uploadProgress}%)...</p>
                        </div>
                      ) : videoForm.videoUrl ? (
                        <div className="flex flex-col items-center gap-1.5 py-1">
                          <CheckCircle2 className="text-emerald-500" size={20} />
                          <p className="text-[10px] text-emerald-400 font-bold">File Uploaded Successfully</p>
                          <span className="text-[9px] text-slate-500 truncate max-w-[250px]">{videoForm.videoUrl}</span>
                        </div>
                      ) : (
                        <div className="space-y-1 py-1">
                          <Video className="mx-auto text-slate-600" size={20} />
                          <p className="text-[10px] text-slate-400 font-black">Choose a video file or Drag & Drop here</p>
                          <p className="text-[9px] text-slate-650 font-medium">MP4, WebM or OGG files up to 50MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Description (Optional)</label>
                    <input 
                      type="text"
                      placeholder="A brief caption for this clip..."
                      className="w-full bg-[#050a14] border border-slate-850 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-700"
                      value={videoForm.description}
                      onChange={e => setVideoForm({...videoForm, description: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-3 justify-end border-t border-slate-800/80 pt-4 mt-2">
                    <button type="button" onClick={() => setShowAddVideo(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-black text-slate-400 hover:text-white">Cancel</button>
                    <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-[#4f46e5] text-xs font-black text-white shadow-md">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {videos.length === 0 ? (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800/60 rounded-2xl">
              <Film size={28} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-bold">No reels yet</p>
              <p className="text-xs mt-1">Tap <span className="text-rose-400 font-black">+ Reel</span> above to upload your first cover clip</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {videos.map(vid => (
                <ReelCard 
                  key={vid.id} 
                  vid={vid} 
                  isSingerDashboard={true} 
                  onDelete={() => handleDeleteVideo(vid.id)} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
