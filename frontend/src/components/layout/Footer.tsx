import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-12 px-4 bg-white/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-fredoka text-xl font-bold text-primary mb-4">🎧 LearnJoy</h3>
            <p className="text-text/60 text-sm">
              日本語リスニングを楽しく学習。
              N2・N3レベルの音声とクイズで確実にスキルアップ。
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">トピック</h4>
            <ul className="space-y-2 text-sm text-text/60">
              <li><Link href="/audio?topic=daily" className="hover:text-primary">💬 日常会話</Link></li>
              <li><Link href="/audio?topic=business" className="hover:text-primary">💼 ビジネス</Link></li>
              <li><Link href="/audio?topic=travel" className="hover:text-primary">✈️ 旅行</Link></li>
              <li><Link href="/audio?topic=culture" className="hover:text-primary">🏯 文化</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">レベル</h4>
            <ul className="space-y-2 text-sm text-text/60">
              <li><Link href="/audio?jlptLevel=N2" className="hover:text-primary">JLPT N2</Link></li>
              <li><Link href="/audio?jlptLevel=N3" className="hover:text-primary">JLPT N3</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-text/10 pt-8 text-center text-text/40 text-sm">
          <p>© 2026 LearnJoy. 日本語学習を楽しく。</p>
        </div>
      </div>
    </footer>
  );
}
