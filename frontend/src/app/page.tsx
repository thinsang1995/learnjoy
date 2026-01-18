import { Navbar, Footer } from '@/components/layout';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="font-fredoka text-5xl md:text-6xl font-bold text-text mb-6">
              楽しく学ぶ
              <span className="text-primary"> 日本語リスニング</span>
            </h1>
            <p className="text-xl text-text/70 max-w-2xl mx-auto mb-8">
              N2・N3レベルの音声を聞いて、クイズで理解度をチェック。
              毎日の練習で確実にリスニング力をアップ！
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/audio" className="clay-btn-cta inline-block text-lg">
                📚 レッスン一覧 →
              </Link>
              <Link href="/audio/19979cb6-cc0d-4c2b-b7a5-03d97b5bbf29" className="clay-btn inline-block text-lg">
                🎧 サンプルを見る
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="clay-card-peach text-center">
              <div className="text-4xl mb-4">🎧</div>
              <h3 className="font-fredoka text-xl font-semibold mb-2">日常会話</h3>
              <p className="text-text/70">挨拶から買い物まで、日常生活で使える表現を学習</p>
            </div>

            <div className="clay-card-blue text-center">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="font-fredoka text-xl font-semibold mb-2">ビジネス</h3>
              <p className="text-text/70">会議や電話応対など、仕事で必要な日本語を練習</p>
            </div>

            <div className="clay-card-mint text-center">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="font-fredoka text-xl font-semibold mb-2">旅行</h3>
              <p className="text-text/70">駅や観光地で使える便利なフレーズを習得</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-fredoka text-3xl font-bold text-center mb-12">学習の流れ</h2>
          
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="clay-card-primary w-16 h-16 flex items-center justify-center text-2xl font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-fredoka text-xl font-semibold mb-1">音声を聞く</h3>
                <p className="text-text/70">N2・N3レベルの日本語音声を繰り返し聞いて、内容を理解しましょう</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="clay-card-primary w-16 h-16 flex items-center justify-center text-2xl font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-fredoka text-xl font-semibold mb-1">クイズに挑戦</h3>
                <p className="text-text/70">選択問題、穴埋め、並べ替えの3種類のクイズで理解度をチェック</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="clay-card-primary w-16 h-16 flex items-center justify-center text-2xl font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-fredoka text-xl font-semibold mb-1">復習する</h3>
                <p className="text-text/70">間違えた問題を復習して、確実に知識を定着させましょう</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}