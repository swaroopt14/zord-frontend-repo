'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-slate-700/70 ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-4">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-8 w-24" />
      <Skeleton className="mt-2 h-3 w-36" />
    </div>
  )
}
