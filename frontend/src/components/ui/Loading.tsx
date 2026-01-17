import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function Loading({ size = 'md', text, className }: LoadingProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={cn('relative', sizes[size])}>
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
      </div>
      {text && <p className="text-text/60 animate-pulse-soft">{text}</p>}
    </div>
  );
}

export function LoadingPage({ text = '読み込み中...' }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="clay-card animate-pulse">
      <div className="h-4 bg-text/10 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-text/10 rounded w-full mb-2"></div>
      <div className="h-3 bg-text/10 rounded w-2/3"></div>
    </div>
  );
}
