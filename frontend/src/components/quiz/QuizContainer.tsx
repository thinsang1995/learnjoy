'use client';

import { useState } from 'react';
import { Quiz } from '@/lib/api';
import { MCQQuiz } from './MCQQuiz';
import { FillBlankQuiz } from './FillBlankQuiz';
import { cn } from '@/lib/utils';
import { ClayButton } from '@/components/ui';

interface QuizContainerProps {
  quizzes: Quiz[];
  onComplete?: (results: { correct: number; total: number }) => void;
}

const quizTypeLabels = {
  mcq: { label: '選択問題', icon: '📝' },
  fill: { label: '穴埋め', icon: '✏️' },
};

export function QuizContainer({ quizzes, onComplete }: QuizContainerProps) {
  // Filter out reorder quizzes - only support mcq and fill
  const supportedQuizzes = quizzes.filter(q => q.type === 'mcq' || q.type === 'fill');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const currentQuiz = supportedQuizzes[currentIndex];
  const progress = supportedQuizzes.length > 0 
    ? ((currentIndex + 1) / supportedQuizzes.length) * 100 
    : 0;

  const handleQuizComplete = (correct: boolean) => {
    const newResults = [...results, correct];
    setResults(newResults);

    // Auto advance after delay
    setTimeout(() => {
      if (currentIndex < supportedQuizzes.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setShowSummary(true);
        const correctCount = newResults.filter(Boolean).length;
        onComplete?.({ correct: correctCount, total: supportedQuizzes.length });
      }
    }, 1500);
  };

  const renderQuiz = (quiz: Quiz) => {
    switch (quiz.type) {
      case 'mcq':
        return <MCQQuiz quiz={quiz} onComplete={handleQuizComplete} />;
      case 'fill':
        return <FillBlankQuiz quiz={quiz} onComplete={handleQuizComplete} />;
      default:
        return <p>Unknown quiz type</p>;
    }
  };

  if (supportedQuizzes.length === 0) {
    return (
      <div className="clay-card text-center py-8">
        <div className="text-5xl mb-4">📝</div>
        <h3 className="font-fredoka text-xl font-semibold mb-2">クイズがありません</h3>
        <p className="text-text/60">この音声にはまだクイズが追加されていません</p>
      </div>
    );
  }

  if (showSummary) {
    const correctCount = results.filter(Boolean).length;
    const percentage = Math.round((correctCount / supportedQuizzes.length) * 100);

    return (
      <div className="clay-card text-center">
        <div className="text-6xl mb-4">
          {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
        </div>
        
        <h3 className="font-fredoka text-2xl font-bold mb-2">
          クイズ完了！
        </h3>
        
        <div className="text-4xl font-bold text-primary mb-4">
          {correctCount} / {supportedQuizzes.length}
        </div>
        
        <p className="text-text/60 mb-6">
          {percentage >= 80 
            ? 'すばらしい！よくできました！' 
            : percentage >= 60 
              ? 'いい調子です！もう少し練習しましょう。'
              : 'もう一度聞いて復習しましょう！'}
        </p>

        <div className="flex gap-4 justify-center">
          <ClayButton
            onClick={() => {
              setCurrentIndex(0);
              setResults([]);
              setShowSummary(false);
            }}
          >
            もう一度挑戦
          </ClayButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text/60">
            {quizTypeLabels[currentQuiz.type as keyof typeof quizTypeLabels]?.icon} {quizTypeLabels[currentQuiz.type as keyof typeof quizTypeLabels]?.label}
          </span>
          <span className="text-sm font-medium text-text/60">
            {currentIndex + 1} / {supportedQuizzes.length}
          </span>
        </div>
        <div className="clay-progress">
          <div 
            className="clay-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quiz */}
      {renderQuiz(currentQuiz)}

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {supportedQuizzes.map((_, index) => (
          <div
            key={index}
            className={cn(
              'w-3 h-3 rounded-full transition-all',
              index === currentIndex 
                ? 'bg-primary scale-125' 
                : index < currentIndex
                  ? results[index] ? 'bg-mint' : 'bg-soft-peach'
                  : 'bg-text/20'
            )}
          />
        ))}
      </div>
    </div>
  );
}
