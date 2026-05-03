import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'rounded-r4 border border-line-2 bg-bg-2 p-6 shadow-sm transition-colors duration-320',
          className
        )}
        {...props}
      />
    );
  }
);
Panel.displayName = 'Panel';

export { Panel };
