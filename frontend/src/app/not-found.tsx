import Link from 'next/link';
import { ClayCard } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <ClayCard className="text-center max-w-md">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="font-fredoka text-2xl font-bold mb-4">
          ページが見つかりません
        </h1>
        <p className="text-text/60 mb-6">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link href="/" className="clay-btn-cta inline-block">
          ホームに戻る
        </Link>
      </ClayCard>
    </main>
  );
}
