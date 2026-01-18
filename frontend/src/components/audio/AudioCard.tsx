import Link from 'next/link';
import { Audio, formatDuration, getTopicInfo, getCardColorClass } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AudioCardProps {
  audio: Audio;
  className?: string;
}

export function AudioCard({ audio, className }: AudioCardProps) {
  const topicInfo = getTopicInfo(audio.topic);
  const cardClass = getCardColorClass(audio.thumbnailColor);

  return (
    <Link href={`/audio/${audio.id}`}>
      <article className={cn(cardClass, 'group cursor-pointer clay-card-mobile', className)}>
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl md:text-3xl">{topicInfo.icon}</span>
          <span className="text-xs font-medium bg-white/60 px-2 py-1 rounded-full">
            {audio.jlptLevel}
          </span>
        </div>
        
        <h3 className="font-fredoka text-base md:text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {audio.title}
        </h3>
        
        {audio.description && (
          <p className="text-xs md:text-sm text-text/60 mb-3 md:mb-4 line-clamp-2">
            {audio.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs md:text-sm text-text/50">
          <span className="flex items-center gap-1">
            🕐 {formatDuration(audio.duration)}
          </span>
          {audio._count && (
            <span className="flex items-center gap-1">
              📝 {audio._count.quizzes} クイズ
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
