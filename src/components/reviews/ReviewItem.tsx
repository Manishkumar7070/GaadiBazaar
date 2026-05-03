import React from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ReviewItemProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    profiles: {
      full_name: string;
      role: string;
    };
  };
}

export const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-6 border-b border-slate-100 last:border-0"
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-10 h-10 border border-slate-100">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
            {review.profiles.full_name?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{review.profiles.full_name}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{review.profiles.role}</p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
              <Calendar size={12} />
              <span>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg 
                key={i}
                className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
          </div>
          
          <p className="text-sm text-slate-600 leading-relaxed italic">
            "{review.comment}"
          </p>
        </div>
      </div>
    </motion.div>
  );
};
