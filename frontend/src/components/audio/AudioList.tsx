'use client';

import { useState } from 'react';
import { Audio, getTopicInfo } from '@/lib/api';
import { AudioCard } from './AudioCard';
import { LoadingCard } from '@/components/ui';
import { cn } from '@/lib/utils';

interface AudioListProps {
  initialAudios: Audio[];
  totalPages: number;
  currentPage: number;
  topic?: string;
  jlptLevel?: string;
}

const topics = [
  { value: '', label: 'すべて', icon: '📚' },
  { value: 'daily', label: '日常会話', icon: '💬' },
  { value: 'business', label: 'ビジネス', icon: '💼' },
  { value: 'travel', label: '旅行', icon: '✈️' },
  { value: 'culture', label: '文化', icon: '🏯' },
];

const levels = [
  { value: '', label: 'すべて' },
  { value: 'N2', label: 'N2' },
  { value: 'N3', label: 'N3' },
];

export function AudioList({ 
  initialAudios, 
  totalPages, 
  currentPage,
  topic: initialTopic = '',
  jlptLevel: initialLevel = '',
}: AudioListProps) {
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [selectedLevel, setSelectedLevel] = useState(initialLevel);
  const [audios, setAudios] = useState(initialAudios);
  const [loading, setLoading] = useState(false);

  const handleTopicChange = async (topic: string) => {
    setSelectedTopic(topic);
    await fetchAudios(topic, selectedLevel);
  };

  const handleLevelChange = async (level: string) => {
    setSelectedLevel(level);
    await fetchAudios(selectedTopic, level);
  };

  const fetchAudios = async (topic: string, level: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (topic) params.set('topic', topic);
      if (level) params.set('jlptLevel', level);
      
      const res = await fetch(`/api/audio?${params.toString()}`);
      const data = await res.json();
      setAudios(data.data || []);
    } catch (error) {
      console.error('Failed to fetch audios:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 mb-6 md:mb-8 filter-container">
        {/* Topic Filter - Horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap filter-buttons">
          {topics.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTopicChange(t.value)}
              className={cn(
                'flex-shrink-0 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all touch-target',
                selectedTopic === t.value
                  ? 'clay-btn-primary text-white'
                  : 'clay-btn'
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Level Filter */}
        <div className="flex gap-2">
          {levels.map((l) => (
            <button
              key={l.value}
              onClick={() => handleLevelChange(l.value)}
              className={cn(
                'px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all touch-target',
                selectedLevel === l.value
                  ? 'bg-primary text-white'
                  : 'bg-white/60 hover:bg-white'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audio Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      ) : audios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {audios.map((audio) => (
            <AudioCard key={audio.id} audio={audio} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 md:py-16">
          <div className="text-5xl md:text-6xl mb-4">🎧</div>
          <h3 className="font-fredoka text-lg md:text-xl font-semibold mb-2">レッスンが見つかりません</h3>
          <p className="text-text/60 text-sm md:text-base">他のトピックやレベルを選んでみてください</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={cn(
                'w-10 h-10 rounded-full font-medium transition-all',
                currentPage === i + 1
                  ? 'clay-btn-primary text-white'
                  : 'clay-btn'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
