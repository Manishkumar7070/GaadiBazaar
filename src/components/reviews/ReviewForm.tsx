import React, { useState } from 'react';
import { Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  targetId: string;
  targetType: 'vehicle' | 'shop';
  onSuccess?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ targetId, targetType, onSuccess }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          targetId,
          targetType,
          rating,
          comment
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
        <p className="text-sm text-slate-500 font-bold mb-4">Please log in to leave a review.</p>
        <Button variant="outline" className="rounded-full px-8">Login to Share Experience</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-10 text-center bg-green-50 rounded-[3rem] border border-green-100 space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-green-200">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-green-900 tracking-tight">Review Published!</h3>
          <p className="text-sm text-green-700 font-medium">Thank you for contributing to the community.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-black text-slate-900 tracking-tight tracking-tight">Share Your Opinion</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Rate your overall experience</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="focus:outline-none transition-colors"
            >
              <Star 
                size={40} 
                className={cn(
                  "transition-all duration-300",
                  (hoveredRating || rating) >= star 
                    ? "text-amber-400 fill-amber-400 drop-shadow-sm" 
                    : "text-slate-200 stroke-[1.5]"
                )}
              />
            </motion.button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Written Feedback</label>
          <Textarea 
            placeholder="What was good? What could be improved? Be as detailed as possible..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px] rounded-3xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium p-6"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100 text-center">
            {error}
          </p>
        )}

        <Button 
          type="submit" 
          disabled={loading || rating === 0}
          className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : (
            <>
              <Send size={16} />
              Publish Review
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
