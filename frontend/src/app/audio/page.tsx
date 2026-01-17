import { Navbar, Footer } from '@/components/layout';
import { AudioList } from '@/components/audio';
import { API_ENDPOINTS, Audio, PaginatedResponse } from '@/lib/api';

async function getAudioList(searchParams: { 
  topic?: string; 
  jlptLevel?: string;
  page?: string;
}): Promise<PaginatedResponse<Audio>> {
  try {
    const params = new URLSearchParams();
    if (searchParams.topic) params.set('topic', searchParams.topic);
    if (searchParams.jlptLevel) params.set('jlptLevel', searchParams.jlptLevel);
    if (searchParams.page) params.set('page', searchParams.page);
    params.set('limit', '12');

    const res = await fetch(`${API_ENDPOINTS.audio}?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch (error) {
    console.error('Failed to fetch audio list:', error);
    return { data: [], total: 0, page: 1, limit: 12, totalPages: 0 };
  }
}

export default async function AudioPage({
  searchParams,
}: {
  searchParams: { topic?: string; jlptLevel?: string; page?: string };
}) {
  const { data, totalPages, page } = await getAudioList(searchParams);

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-fredoka text-4xl font-bold mb-4">
              📚 レッスン一覧
            </h1>
            <p className="text-text/60">
              トピックとレベルを選んで、リスニング練習を始めましょう
            </p>
          </div>

          <AudioList
            initialAudios={data}
            totalPages={totalPages}
            currentPage={page}
            topic={searchParams.topic}
            jlptLevel={searchParams.jlptLevel}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
