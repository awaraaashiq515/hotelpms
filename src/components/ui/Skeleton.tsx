import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200/50 rounded-lg ${className}`}
        />
      ))}
    </>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-24 ml-auto" />
      </div>
      <div className="border border-white/40 rounded-2xl overflow-hidden bg-white/30">
        <div className="bg-gray-50/50 p-4 border-b border-white/40">
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-full" count={5} />
        </div>
      </div>
    </div>
  );
};
