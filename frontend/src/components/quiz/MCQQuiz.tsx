'use client';

import { useState } from 'react';
import { Quiz, MCQData, submitQuizAnswer } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ClayButton } from '@/components/ui';

interface MCQQuizProps {
  quiz: Quiz;
  onComplete?: (correct: boolean) => void;
}

export function MCQQuiz({ quiz, onComplete }: MCQQuizProps) {
  const data = quiz.dataJson as MCQData;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (index: number) => {
    if (result) return; // Already submitted
    setSelectedIndex(index);
  };

  const handleSubmit = async () => {
    if (selectedIndex === null) return;

    setIsSubmitting(true);
    try {
      const res = await submitQuizAnswer(quiz.id, selectedIndex);
      setResult(res);
      onComplete?.(res.correct);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="clay-card">
      <h3 className="font-fredoka text-xl font-semibold mb-6">
        {data.question || quiz.question || 'この会話の内容について正しいものはどれですか？'}
      </h3>

      <div className="space-y-3 mb-6">
        {data.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={result !== null}
            className={cn(
              'clay-option w-full text-left',
              selectedIndex === index && 'selected',
              result !== null && index === data.correctIndex && 'correct',
              result !== null && selectedIndex === index && !result.correct && 'incorrect'
            )}
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/50 mr-3 font-semibold">
              {String.fromCharCode(65 + index)}
            </span>
            {option}
          </button>
        ))}
      </div>

      {!result ? (
        <ClayButton
          variant="cta"
          onClick={handleSubmit}
          disabled={selectedIndex === null || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? '確認中...' : '回答する'}
        </ClayButton>
      ) : (
        <div className={cn(
          'p-4 rounded-xl',
          result.correct ? 'bg-mint/30' : 'bg-soft-peach/30'
        )}>
          <div className="flex items-center gap-2 font-semibold mb-2">
            {result.correct ? (
              <>✅ 正解！</>
            ) : (
              <>❌ 不正解</>
            )}
          </div>
          {result.explanation && (
            <p className="text-sm text-text/70">{result.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
