import { Navbar, Footer } from '@/components/layout';
import { AudioDetailSkeleton, QuizSkeleton } from '@/components/ui';

export default function Loading() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Audio */}
            <AudioDetailSkeleton />

            {/* Right Column - Quiz */}
            <div>
              <QuizSkeleton />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
