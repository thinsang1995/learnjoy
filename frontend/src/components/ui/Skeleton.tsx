export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 
        bg-[length:200%_100%] rounded-xl ${className}`}
      style={{ animationDuration: '1.5s' }}
    />
  );
}

export function AudioCardSkeleton() {
  return (
    <div className="clay-card p-4 space-y-3">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function AudioListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AudioCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AudioDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-2/3" />
      </div>
      
      {/* Player */}
      <div className="clay-player p-6 space-y-4">
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      
      {/* Transcript */}
      <div className="clay-card p-6 space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

export function QuizSkeleton() {
  return (
    <div className="clay-card p-6 space-y-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-5 w-full" />
      <div className="space-y-3 pt-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
