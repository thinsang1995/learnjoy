'use client';

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/api';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
}

export function AudioPlayer({ src, title, className, onTimeUpdate }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newRate = speeds[nextIndex];

    audio.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn('clay-player', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {title && (
        <h3 className="font-fredoka font-semibold mb-4 text-lg">{title}</h3>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="clay-progress">
          <div 
            className="clay-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ position: 'relative', marginTop: '-12px', height: '24px' }}
        />
        <div className="flex justify-between text-sm text-text/50 mt-1">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span>{formatDuration(Math.floor(duration))}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Skip Back */}
        <button
          onClick={() => skipTime(-10)}
          className="clay-btn w-12 h-12 flex items-center justify-center text-xl"
          title="10秒戻る"
        >
          ⏪
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="clay-btn-primary w-16 h-16 rounded-full flex items-center justify-center text-3xl"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        {/* Skip Forward */}
        <button
          onClick={() => skipTime(10)}
          className="clay-btn w-12 h-12 flex items-center justify-center text-xl"
          title="10秒進む"
        >
          ⏩
        </button>

        {/* Speed Control */}
        <button
          onClick={handleSpeedChange}
          className="clay-btn px-4 py-2 text-sm font-mono"
          title="再生速度"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
}
