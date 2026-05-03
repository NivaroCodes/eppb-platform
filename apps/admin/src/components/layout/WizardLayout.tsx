import * as React from 'react';
import { MonoText } from '@/components/ui/MonoText';

interface WizardLayoutProps {
  leftContent: React.ReactNode;
  children: React.ReactNode;
}

export function WizardLayout({ leftContent, children }: WizardLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-1 text-fg-1 font-body flex overflow-hidden">
      {/* LEFT PANE (40%, min 400px, bg-2) */}
      <aside className="w-[40%] min-w-[400px] bg-bg-2 border-r border-line-2 flex flex-col overflow-y-auto">
        <div className="p-10 flex flex-col h-full">
          {/* Brand Mark */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-2 h-2 bg-accent" />
            <span className="font-display font-bold text-lg tracking-tight text-white uppercase">ЕППБ</span>
            <MonoText className="text-[11px] text-fg-3 uppercase tracking-[0.10em]">/ WIZARD</MonoText>
          </div>

          <div className="flex-1">
            {leftContent}
          </div>

          {/* Footer Meta */}
          <div className="mt-12 pt-6 border-t border-line-3">
            <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest">
              Безопасное соединение · v2.0.0
            </MonoText>
          </div>
        </div>
      </aside>

      {/* RIGHT PANE (bg-1) */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-bg-1">
        <div className="max-w-[800px] w-full mx-auto p-12 lg:p-20">
          {children}
        </div>
      </main>
    </div>
  );
}
