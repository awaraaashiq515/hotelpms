import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Send, X } from 'lucide-react';

interface FeedbackModalProps {
  show: boolean;
  rating: number;
  setRating: (rating: number) => void;
  comments: string;
  setComments: (comments: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  show, rating, setRating, comments, setComments, onSubmit, onSkip 
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl overflow-hidden"
          >
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-pos-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            
            <div className="text-center space-y-3 mb-8 relative">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Star size={32} fill="currentColor" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">How was your meal?</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Share your experience with us</p>
            </div>

            <div className="space-y-8 relative">
              {/* Stars */}
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-4xl transition-all hover:scale-110 active:scale-90 ${star <= rating ? 'text-amber-400 drop-shadow-lg' : 'text-slate-100 dark:text-slate-800'}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="relative">
                <div className="absolute left-5 top-5 text-slate-400">
                  <MessageSquare size={18} />
                </div>
                <textarea 
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us what you liked (or what we can improve)..."
                  className="w-full h-32 bg-slate-50 dark:bg-slate-800/50 border-none rounded-[1.5rem] pl-14 pr-6 py-5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-pos-primary/10 transition-all resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-3">
                <button 
                  onClick={onSubmit}
                  className="w-full h-14 bg-pos-accent text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-pos-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Send size={18} />
                  Submit Feedback
                </button>
                <button 
                  onClick={onSkip}
                  className="w-full h-12 bg-transparent text-slate-400 dark:text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
