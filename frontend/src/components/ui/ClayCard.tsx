import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

export interface ClayCardProps extends HTMLAttributes<HTMLDivElement> {
  color?: 'default' | 'peach' | 'blue' | 'mint' | 'lilac' | 'primary';
  hover?: boolean;
}

export const ClayCard = forwardRef<HTMLDivElement, ClayCardProps>(
  ({ className, color = 'default', hover = true, children, ...props }, ref) => {
    const colorClasses = {
      default: 'clay-card',
      peach: 'clay-card-peach',
      blue: 'clay-card-blue',
      mint: 'clay-card-mint',
      lilac: 'clay-card-lilac',
      primary: 'clay-card-primary',
    };

    return (
      <div
        ref={ref}
        className={cn(
          colorClasses[color],
          !hover && 'hover:transform-none hover:shadow-clay',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ClayCard.displayName = 'ClayCard';
