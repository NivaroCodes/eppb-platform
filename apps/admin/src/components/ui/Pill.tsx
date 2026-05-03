import { cn } from '@/lib/utils';
import { MonoText } from './MonoText';

export interface PillProps {
  label: string;
  value: string;
  className?: string;
}

export function Pill({ label, value, className }: PillProps) {
  return (
    <div
      className={cn(
        'flex h-6 items-center gap-2 rounded-full border border-line-2 bg-bg-2 px-2.5 py-0.5',
        className
      )}
    >
      <MonoText className="text-[10px] text-fg-3 uppercase tracking-wider">{label}</MonoText>
      <div className="h-3 w-[1px] bg-line-3" />
      <MonoText className="text-[10px] text-fg-1 font-bold">{value}</MonoText>
    </div>
  );
}
