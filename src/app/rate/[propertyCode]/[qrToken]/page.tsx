"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Star, Send, CheckCircle2, Loader2, Utensils, Heart, Smile, ThumbsUp, Coffee, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const PREDEFINED_TAGS = [
  { label: 'Excellent Food', icon: '🍲' },
  { label: 'Great Service', icon: '⚡' },
  { label: 'Friendly Staff', icon: '🤝' },
  { label: 'Clean & Hygienic', icon: '✨' },
  { label: 'Value for Money', icon: '💰' },
  { label: 'Good Ambience', icon: '🎵' },
  { label: 'Quick Delivery', icon: '🚀' },
  { label: 'Delicious Drinks', icon: '🍹' },
];

export default function PublicRatePage() {
  const params = useParams();
  const propertyCode = params.propertyCode as string;
  const qrToken = params.qrToken as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<{ property: any; table: any } | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/public/rate?propertyCode=${propertyCode}&qrToken=${qrToken}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || 'Table not found');
        }
      } catch (err) {
        setError('Failed to load table information');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propertyCode, qrToken]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const finalComments = selectedTags.length > 0 
        ? `[Tags: ${selectedTags.join(', ')}] ${comments}`.trim()
        : comments;

      const res = await fetch('/api/public/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode,
          qrToken,
          rating,
          comments: finalComments
        })
      });
      const result = await res.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        alert(result.message || 'Failed to submit feedback');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Utensils className="w-12 h-12 text-orange-500" />
        </motion.div>
        <p className="mt-6 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Preparing your experience...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 p-6 text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <Utensils className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 italic">Oops!</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6 text-center overflow-hidden">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-8 relative"
        >
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-green-400 rounded-full"
          />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black text-slate-900 dark:text-white mb-4 italic tracking-tight"
        >
          Amazing!
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-lg font-medium leading-relaxed"
        >
          Your feedback is in! We're doing a happy dance right now. 💃
        </motion.p>
        <div className="mt-16 text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.5em]">
          {data?.property?.name}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-orange-500 selection:text-white">
      {/* Dynamic Header */}
      <div className="relative h-64 w-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pt-12 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-4"
          >
            {data?.property?.logoUrl ? (
              <img src={data.property.logoUrl} alt="Logo" className="w-20 h-20 rounded-3xl border-4 border-white dark:border-slate-800 shadow-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-orange-500 flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-800">
                <Utensils className="text-white w-10 h-10" />
              </div>
            )}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic"
          >
            {data?.property?.brandName || data?.property?.name}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 px-4 py-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            Table {data?.table?.name}
          </motion.div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 -mt-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 pt-10"
        >
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Rate Your Visit</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Share your vibe with us</p>
            </div>

            {/* Premium Star Selector */}
            <div className="flex justify-between items-center px-2 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem]">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="relative transition-all duration-300 transform active:scale-75"
                >
                  <Star
                    size={36}
                    className={`transition-all duration-300 ${
                      (hover || rating) >= star 
                        ? 'fill-orange-400 text-orange-400 scale-110' 
                        : 'text-slate-200 dark:text-slate-700'
                    }`}
                  />
                  {(hover || rating) >= star && (
                    <motion.div 
                      layoutId="glow"
                      className="absolute inset-0 blur-xl bg-orange-400/20 -z-10 rounded-full" 
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Quick Feedback Tags */}
            <AnimatePresence>
              {rating > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">What did you like?</label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TAGS.map((tag) => (
                      <button
                        key={tag.label}
                        type="button"
                        onClick={() => toggleTag(tag.label)}
                        className={`px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all duration-300 flex items-center gap-2 border ${
                          selectedTags.includes(tag.label)
                            ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-orange-200'
                        }`}
                      >
                        <span>{tag.icon}</span>
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                Anything else?
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Tell us what's on your mind..."
                className="w-full h-32 px-6 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-transparent focus:border-orange-500/30 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all resize-none text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full h-16 rounded-[2rem] bg-slate-900 dark:bg-orange-500 hover:bg-slate-800 dark:hover:bg-orange-600 text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 dark:shadow-orange-500/20 disabled:opacity-30 transition-all flex items-center justify-center gap-3 active:scale-95 group"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send Review
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Send size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Footer info */}
        <div className="mt-12 text-center pb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
            <Sparkles size={14} className="text-orange-400" />
            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
          </div>
          <p className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em] mb-2">Powered by OrderMint</p>
          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-600 px-8 leading-loose">
            Your feedback is anonymous and helps us improve our service. Thank you for being a valued guest.
          </p>
        </div>
      </div>
    </div>
  );
}
