'use client';

import { useState } from 'react';
import { Quiz, FillBlankData, submitQuizAnswer } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ClayButton } from '@/components/ui';

interface FillBlankQuizProps {
  quiz: Quiz;
  onComplete?: (correct: boolean) => void;
}

export function FillBlankQuiz({ quiz, onComplete }: FillBlankQuizProps) {
  const data = quiz.dataJson as FillBlankData;
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Split sentence at blank marker
  const parts = data.sentence.split('＿＿＿');
  const beforeBlank = parts[0] || '';
  const afterBlank = parts[1] || '';

  const handleSubmit = async () => {
    if (!selectedAnswer) return;

    setIsSubmitting(true);
    try {
      const res = await submitQuizAnswer(quiz.id, selectedAnswer);
      setResult(res);
      onComplete?.(res.correct);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="clay-card clay-card-mobile">
      <h3 className="font-fredoka text-base md:text-lg font-semibold mb-3 md:mb-4">
        空欄に入る言葉を選んでください
      </h3>

      {/* Sentence with blank */}
      <div className="clay-card bg-white/50 mb-4 md:mb-6 text-base md:text-lg p-3 md:p-6">
        <span>{beforeBlank}</span>
        <span className={cn(
          'inline-block min-w-[60px] md:min-w-[80px] px-2 md:px-3 py-1 mx-1 rounded-lg border-2 border-dashed text-sm md:text-base',
          selectedAnswer 
            ? 'bg-primary/10 border-primary' 
            : 'bg-white/50 border-text/30',
          result?.correct && 'bg-mint/30 border-green-500',
          result && !result.correct && 'bg-soft-peach/30 border-red-500'
        )}>
          {selectedAnswer || '　　　'}
        </span>
        <span>{afterBlank}</span>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-6">
        {data.options.map((option) => (
          <button
            key={option}
            onClick={() => !result && setSelectedAnswer(option)}
            disabled={result !== null}
            className={cn(
              'px-3 md:px-4 py-2 rounded-xl transition-all text-sm md:text-base touch-target',
              selectedAnswer === option
                ? 'clay-btn-primary text-white'
                : 'clay-btn',
              result && option === data.blankWord && 'bg-mint/50',
              result && selectedAnswer === option && !result.correct && 'bg-soft-peach/50'
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Hint */}
      {data.hint && !result && (
        <p className="text-xs md:text-sm text-text/50 mb-3 md:mb-4">💡 ヒント: {data.hint}</p>
      )}

      {!result ? (
        <ClayButton
          variant="cta"
          onClick={handleSubmit}
          disabled={!selectedAnswer || isSubmitting}
          className="w-full quiz-btn-mobile"
        >
          {isSubmitting ? '確認中...' : '回答する'}
        </ClayButton>
      ) : (
        <div className={cn(
          'p-3 md:p-4 rounded-xl',
          result.correct ? 'bg-mint/30' : 'bg-soft-peach/30'
        )}>
          <div className="flex items-center gap-2 font-semibold mb-2 text-sm md:text-base">
            {result.correct ? (
              <>✅ 正解！</>
            ) : (
              <>❌ 不正解 - 正解は「{data.blankWord}」</>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
