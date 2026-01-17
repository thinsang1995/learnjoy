import { Navbar, Footer } from '@/components/layout';
import { AudioListSkeleton, Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Title Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Filters Skeleton */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>

          {/* Audio List Skeleton */}
          <AudioListSkeleton count={6} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
