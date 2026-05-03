import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface StepDotProps {
  state: 'done' | 'current' | 'pending';
  number?: number;
  className?: string;
}

export function StepDot({ state, number, className }: StepDotProps) {
  return (
    <div
      className={cn(
        'relative flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition-all duration-320',
        state === 'done' && 'border-success bg-success text-white',
        state === 'current' && 'border-accent bg-accent-soft text-accent pulse-dot',
        state === 'pending' && 'border-line-3 bg-bg-3 text-fg-3',
        className
      )}
    >
      {state === 'done' ? (
        <Check size={14} strokeWidth={3} />
      ) : (
        <span>{number}</span>
      )}
    </div>
  );
}
