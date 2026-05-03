import * as React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MonoText } from '@/components/ui/MonoText';
import { Pill } from '@/components/ui/Pill';
import { useAuthStore } from '@/store/auth';

interface PortalLayoutProps {
  children?: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="min-h-screen bg-bg-1 text-fg-1 font-body flex flex-col">
      {/* Public Header (60px) */}
      <header className="h-[60px] px-8 border-b border-line-2 flex items-center justify-between bg-bg-2/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <NavLink to="/portal" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent" />
            <span className="font-display font-bold text-lg tracking-tight text-white uppercase">ЕППБ</span>
            <MonoText className="text-[11px] text-fg-3 uppercase tracking-[0.10em]">/ БАЙТЕРЕК</MonoText>
          </NavLink>

          <nav className="flex items-center gap-1">
            <PortalNavItem to="/portal" label="Услуги" end />
            <PortalNavItem to="/portal/submissions" label="Мои заявки" />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <Pill label="БИН" value={user.name} />
          )}
          <div className="h-4 w-[1px] bg-line-3 mx-1" />
          <button className="flex items-center gap-2 px-2 py-1 rounded-r1 hover:bg-bg-3 transition-colors group">
            <MonoText className="text-[10px] text-accent font-bold">RU</MonoText>
            <span className="text-fg-4 text-[10px]">·</span>
            <MonoText className="text-[10px] text-fg-3 group-hover:text-fg-2">KZ</MonoText>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

function PortalNavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'px-4 h-[60px] flex items-center text-sm font-medium transition-colors relative',
          isActive ? 'text-accent' : 'text-fg-2 hover:text-fg-1'
        )
      }
    >
      {({ isActive }) => (
        <>
          {label}
          {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
          )}
        </>
      )}
    </NavLink>
  );
}
