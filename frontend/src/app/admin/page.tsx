'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { ClayButton, ClayCard } from '@/components/ui';
import { uploadAudio } from '@/lib/api';

const TOPICS = ['daily', 'business', 'travel', 'culture', 'news'] as const;
const LEVELS = ['N2', 'N3'] as const;

type Topic = typeof TOPICS[number];
type Level = typeof LEVELS[number];

const topicLabels: Record<Topic, string> = {
  daily: '日常会話',
  business: 'ビジネス',
  travel: '旅行',
  culture: '文化',
  news: 'ニュース',
};

export default function AdminPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState<Topic>('daily');
  const [level, setLevel] = useState<Level>('N3');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    } else {
      setError('音声ファイルをアップロードしてください');
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError('音声ファイルを選択してください');
      return;
    }

    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadAudio(file, title, topic, level);
      setSuccess(`アップロード完了: ${result.title}`);
      setFile(null);
      setTitle('');
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-fredoka text-3xl font-bold text-text mb-2">
            音声アップロード
          </h1>
          <p className="text-text/70 mb-8">
            新しい音声ファイルをアップロードして、クイズを自動生成します
          </p>

          <ClayCard className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Zone */}
              <div
                className={`
                  border-2 border-dashed rounded-2xl p-8 text-center transition-colors
                  ${dragActive 
                    ? 'border-primary bg-primary/10' 
                    : 'border-text/20 hover:border-primary/50'
                  }
                  ${file ? 'bg-mint/20' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div>
                    <div className="text-4xl mb-3">🎵</div>
                    <p className="font-semibold text-text">{file.name}</p>
                    <p className="text-sm text-text/60">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      className="mt-3 text-sm text-primary hover:underline"
                      onClick={() => setFile(null)}
                    >
                      ファイルを変更
                    </button>
                  </div>
                ) : (
                  <label htmlFor="file-input" className="cursor-pointer">
                    <div className="text-4xl mb-3">📁</div>
                    <p className="font-semibold text-text mb-1">
                      ファイルをドラッグ＆ドロップ
                    </p>
                    <p className="text-sm text-text/60">
                      またはクリックしてファイルを選択
                    </p>
                    <p className="text-xs text-text/40 mt-2">
                      対応形式: MP3, WAV, M4A (最大50MB)
                    </p>
                  </label>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  タイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="clay-input w-full"
                  placeholder="レッスンのタイトルを入力..."
                />
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  トピック
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className={`
                        px-4 py-2 rounded-xl text-sm font-medium transition-all
                        ${topic === t
                          ? 'clay-card-primary text-text'
                          : 'bg-white/50 text-text/70 hover:bg-white'
                        }
                      `}
                    >
                      {topicLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  レベル
                </label>
                <div className="flex gap-3">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`
                        px-6 py-2 rounded-xl text-sm font-bold transition-all
                        ${level === l
                          ? 'clay-card-secondary text-text'
                          : 'bg-white/50 text-text/70 hover:bg-white'
                        }
                      `}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-4 rounded-xl bg-red-100 text-red-700 text-sm">
                  ⚠️ {error}
                </div>
              )}
              
              {success && (
                <div className="p-4 rounded-xl bg-green-100 text-green-700 text-sm">
                  ✅ {success}
                </div>
              )}

              {/* Submit Button */}
              <ClayButton
                type="submit"
                disabled={isUploading || !file}
                className="w-full"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    アップロード中...
                  </span>
                ) : (
                  'アップロード'
                )}
              </ClayButton>
            </form>
          </ClayCard>

          {/* Info */}
          <div className="mt-6 text-center text-sm text-text/50">
            <p>アップロード後、自動的に文字起こしとクイズ生成が行われます</p>
            <p>処理には数分かかる場合があります</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
