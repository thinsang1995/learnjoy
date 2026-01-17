import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'cta' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const ClayButton = forwardRef<HTMLButtonElement, ClayButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-2xl transition-all duration-200 active:scale-95';
    
    const variants = {
      default: 'clay-btn',
      primary: 'clay-btn-primary',
      cta: 'clay-btn-cta',
      ghost: 'bg-transparent hover:bg-white/50 px-4 py-2',
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ClayButton.displayName = 'ClayButton';
