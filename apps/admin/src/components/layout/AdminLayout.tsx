import * as React from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MonoText } from '@/components/ui/MonoText';
import { Pill } from '@/components/ui/Pill';
import { Crumb } from '@/components/ui/Crumb';
import { Settings, LogOut, LayoutGrid, FileText, Activity } from 'lucide-react';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getCrumbs = () => {
    const path = location.pathname;
    if (path === '/services') return [{ label: 'BUILDER' }, { label: 'КАТАЛОГ УСЛУГ', active: true }];
    if (path.includes('/services/') && path.includes('/edit')) return [{ label: 'BUILDER' }, { label: 'КАТАЛОГ', href: '/services' }, { label: 'РЕДАКТОР', active: true }];
    if (path === '/profile') return [{ label: 'BUILDER' }, { label: 'ПРОФИЛЬ', active: true }];
    return [{ label: 'BUILDER' }];
  };

  return (
    <div className="flex min-h-screen bg-bg-1 text-fg-1 font-body">
      <aside className="w-[240px] flex-shrink-0 border-r border-line-2 bg-bg-2 flex flex-col">
        <div className="h-[52px] px-6 flex items-center gap-2 border-b border-line-2">
          <div className="w-2 h-2 bg-accent" />
          <span className="font-display font-bold text-lg tracking-tight text-white">ЕППБ</span>
          <MonoText className="text-[11px] text-fg-3 uppercase tracking-[0.10em]">/ КОНСТРУКТОР</MonoText>
        </div>

        <div className="px-6 py-4">
          <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest">
            v2.0.0 · BUILDER MODE
          </MonoText>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <div className="px-3 py-2">
            <MonoText className="text-[10px] text-fg-3 font-bold uppercase tracking-[0.15em]">КОНСТРУКТОР</MonoText>
          </div>
          <SidebarItem to="/services" icon={LayoutGrid} label="Услуги" />
          <SidebarItem to="/logs" icon={Activity} label="Логи" />
          
          <div className="px-3 py-2 mt-4">
            <MonoText className="text-[10px] text-fg-3 font-bold uppercase tracking-[0.15em]">ПОРТАЛ</MonoText>
          </div>
          <SidebarItem to="/portal" icon={FileText} label="Превью каталога" />
        </nav>

        <div className="p-4 border-t border-line-2 space-y-2">
          <SidebarItem to="/settings" icon={Settings} label="Настройки" />
          
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 p-2 rounded-r2 hover:bg-bg-3 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-accent-soft border border-accent-line flex items-center justify-center text-accent font-bold text-xs">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate group-hover:text-fg-1">Administrator</p>
              <MonoText className="text-[9px] text-fg-4 uppercase tracking-tighter">Root Access</MonoText>
            </div>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[52px] px-6 border-b border-line-2 flex items-center justify-between bg-bg-1/80 backdrop-blur-md sticky top-0 z-30">
          <Crumb items={getCrumbs()} />
          
          <div className="flex items-center gap-4">
            <Pill label="BACKEND" value="ONLINE" className="border-success-line" />
            <div className="h-4 w-[1px] bg-line-3" />
            <button className="text-fg-3 hover:text-fg-1 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-r2 text-sm font-medium transition-all duration-200 group',
          isActive
            ? 'bg-accent-soft text-accent border border-accent-line/20'
            : 'text-fg-2 hover:bg-bg-3 hover:text-fg-1'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={cn('transition-colors', isActive ? 'text-accent' : 'text-fg-4 group-hover:text-fg-2')} />
          <span className="flex-1">{label}</span>
          {isActive && <div className="w-1 h-1 rounded-full bg-accent pulse-dot" />}
        </>
      )}
    </NavLink>
  );
}
