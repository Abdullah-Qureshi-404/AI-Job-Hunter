import React from 'react';

export function Skeleton({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse bg-zinc-800/60 rounded ${className}`}
      style={style}
    />
  );
}

export function JobCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4 border border-zinc-800/80 rounded-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="pt-2 flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-6 border border-zinc-800/80 rounded-xl flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="w-12 h-12 rounded-xl" />
    </div>
  );
}

export function JobDetailSkeleton() {
  return (
    <div className="glass-card p-8 border border-zinc-800/80 rounded-xl space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="flex items-center gap-4 pt-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="border-t border-zinc-800/80 pt-6 space-y-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-11/12" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="glass-card p-8 border border-zinc-800/80 rounded-xl space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/80">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
