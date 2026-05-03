import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MonoText } from './MonoText';

export interface CrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface CrumbProps {
  items: CrumbItem[];
  className?: string;
}

export function Crumb({ items, className }: CrumbProps) {
  return (
    <nav className={cn('flex items-center gap-2', className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <MonoText className="text-[11px] text-fg-4">/</MonoText>
          )}
          {item.href && !item.active ? (
            <Link
              to={item.href}
              className="font-mono text-[11px] uppercase tracking-[0.10em] text-fg-3 hover:text-fg-1 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <MonoText
              className={cn(
                'text-[11px] uppercase tracking-[0.10em]',
                item.active ? 'text-accent font-bold' : 'text-fg-3'
              )}
            >
              {item.label}
            </MonoText>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

import * as React from 'react';
