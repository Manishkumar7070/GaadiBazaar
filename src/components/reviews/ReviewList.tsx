import React, { useEffect, useState } from 'react';
import { ReviewItem } from './ReviewItem';
import { Loader2, MessageSquare, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface ReviewListProps {
  targetId: string;
  targetType: 'vehicle' | 'shop';
  refreshKey?: number;
}

export const ReviewList: React.FC<ReviewListProps> = ({ targetId, targetType, refreshKey = 0 }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reviews/${targetType}/${targetId}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const data = await response.json();
        setReviews(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [targetId, targetType, refreshKey]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest">Loading testimonials...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
          <MessageSquare size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">No Reviews Yet</h3>
          <p className="text-sm text-slate-500 font-medium">Be the first to share your experience.</p>
        </div>
      </div>
    );
  }

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-slate-100">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Customer Feed</h3>
          <p className="text-sm text-slate-500 font-medium">Authentic experiences from our community members.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-[2rem] border border-slate-100">
          <div className="text-center border-r border-slate-200 pr-5">
            <p className="text-3xl font-black text-slate-900">{averageRating.toFixed(1)}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Avg Pulse</p>
          </div>
          <div className="pl-1">
            <div className="flex items-center gap-0.5 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  size={14}
                  className={`${i < Math.round(averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Based on {reviews.length} reviews</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};
