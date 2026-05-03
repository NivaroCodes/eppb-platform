import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MonoTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  tabular?: boolean;
}

const MonoText = React.forwardRef<HTMLSpanElement, MonoTextProps>(
  ({ className, tabular = true, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'font-mono',
          tabular && 'tabular-nums',
          className
        )}
        {...props}
      />
    );
  }
);
MonoText.displayName = 'MonoText';

export { MonoText };
