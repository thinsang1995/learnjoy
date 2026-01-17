'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Quiz, ReorderData, submitQuizAnswer } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ClayButton } from '@/components/ui';

interface ReorderQuizProps {
  quiz: Quiz;
  onComplete?: (correct: boolean) => void;
}

interface SortableItemProps {
  id: string;
  text: string;
  disabled?: boolean;
}

function SortableItem({ id, text, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'px-4 py-3 rounded-xl cursor-grab active:cursor-grabbing select-none',
        'clay-btn',
        isDragging && 'opacity-50 scale-105 shadow-lg z-10',
        disabled && 'cursor-default'
      )}
    >
      {text}
    </div>
  );
}

export function ReorderQuiz({ quiz, onComplete }: ReorderQuizProps) {
  const data = quiz.dataJson as ReorderData;
  
  // Create initial shuffled order from segments
  const [items, setItems] = useState(() => 
    data.segments.map((text, index) => ({ id: `item-${index}`, text, originalIndex: index }))
  );
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Get current order as indices
      const currentOrder = items.map((item) => item.originalIndex);
      const res = await submitQuizAnswer(quiz.id, currentOrder);
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
      <h3 className="font-fredoka text-lg font-semibold mb-4">
        正しい順番に並べ替えてください
      </h3>

      <p className="text-sm text-text/50 mb-4">
        📱 ドラッグ＆ドロップで並べ替え
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-3 mb-6 min-h-[60px] p-4 rounded-xl bg-white/30">
            {items.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                text={item.text}
                disabled={result !== null}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!result ? (
        <ClayButton
          variant="cta"
          onClick={handleSubmit}
          disabled={isSubmitting}
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
          <p className="text-sm text-text/70">
            正解: {data.originalSentence}
          </p>
        </div>
      )}
    </div>
  );
}
