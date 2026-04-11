import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const VehicleCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden border-none shadow-sm bg-white rounded-3xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
      </div>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        <Skeleton className="h-12 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
};

export default VehicleCardSkeleton;
