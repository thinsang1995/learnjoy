import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { AudioPlayer } from '@/components/audio';
import { QuizContainer } from '@/components/quiz';
import { ClayCard } from '@/components/ui';
import { API_ENDPOINTS, Audio, getTopicInfo, formatDuration } from '@/lib/api';

async function getAudio(id: string): Promise<Audio | null> {
  try {
    const res = await fetch(API_ENDPOINTS.audioById(id), {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch audio:', error);
    return null;
  }
}

export default async function AudioDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const audio = await getAudio(params.id);

  if (!audio) {
    notFound();
  }

  const topicInfo = getTopicInfo(audio.topic);

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link 
            href="/audio" 
            className="inline-flex items-center gap-2 text-text/60 hover:text-primary mb-6 transition-colors"
          >
            ← レッスン一覧に戻る
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{topicInfo.icon}</span>
              <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                {topicInfo.name}
              </span>
              <span className="text-sm font-medium bg-white/60 px-3 py-1 rounded-full">
                {audio.jlptLevel}
              </span>
              <span className="text-sm text-text/50">
                🕐 {formatDuration(audio.duration)}
              </span>
            </div>
            
            <h1 className="font-fredoka text-3xl md:text-4xl font-bold mb-4">
              {audio.title}
            </h1>
            
            {audio.description && (
              <p className="text-text/60 text-lg">{audio.description}</p>
            )}
          </div>

          {/* Audio Player */}
          <div className="mb-8">
            <AudioPlayer 
              src={audio.audioUrl} 
              title="🎧 音声を聞く"
            />
          </div>

          {/* Transcript (if available) */}
          {audio.transcript && (
            <ClayCard className="mb-8">
              <h2 className="font-fredoka text-xl font-semibold mb-4">
                📝 トランスクリプト
              </h2>
              <p className="text-text/80 leading-relaxed whitespace-pre-wrap">
                {audio.transcript}
              </p>
            </ClayCard>
          )}

          {/* Quiz Section */}
          <div>
            <h2 className="font-fredoka text-2xl font-bold mb-6">
              📚 理解度チェック
            </h2>
            
            {audio.quizzes && audio.quizzes.length > 0 ? (
              <QuizContainer quizzes={audio.quizzes} />
            ) : (
              <ClayCard className="text-center py-8">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="font-fredoka text-xl font-semibold mb-2">
                  クイズ準備中
                </h3>
                <p className="text-text/60">
                  この音声のクイズはまだ作成されていません
                </p>
              </ClayCard>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
