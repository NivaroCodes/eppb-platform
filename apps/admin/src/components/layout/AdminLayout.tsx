import * as React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Settings, 
  LogOut, 
  LayoutGrid, 
  FileText, 
  Activity,
  Bell,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MonoText } from '@/components/ui/MonoText';
import { Pill } from '@/components/ui/Pill';
import { Crumb } from '@/components/ui/Crumb';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore, type NotificationType } from '@/store/notifications';

const notificationStyles: Record<NotificationType, string> = {
  success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  error: 'text-red-500 bg-red-500/10 border-red-500/20',
  info: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
};

const notificationIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const notifications = useNotificationsStore((state) => state.items);
  const unreadCount = useNotificationsStore((state) => state.unreadCount());
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPos, setNotifPos] = useState<{ top: number; right: number } | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!notifOpen || !notifBtnRef.current) return;
    const rect = notifBtnRef.current.getBoundingClientRect();
    setNotifPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }, [notifOpen, notifications.length]);

  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

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
              {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate group-hover:text-fg-1">{user?.name || 'Administrator'}</p>
              <MonoText className="text-[9px] text-fg-4 uppercase tracking-tighter">
                {user?.role === 'admin' ? 'Root Access' : 'User'}
              </MonoText>
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
            
            <div className="relative" ref={notifRef}>
              <button
                ref={notifBtnRef}
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 text-fg-3 hover:text-white transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && notifPos && createPortal(
                <div 
                  className="fixed w-80 overflow-hidden rounded-r3 border border-line-2 bg-bg-2 shadow-2xl z-[1000]"
                  style={{ top: notifPos.top, right: notifPos.right }}
                >
                  <div className="flex items-center justify-between border-b border-line-2 px-4 py-3 bg-bg-3/50">
                    <MonoText className="text-[10px] font-bold text-fg-1">УВЕДОМЛЕНИЯ</MonoText>
                    {notifications.length > 0 && (
                      <button onClick={markAllRead} className="text-[10px] font-bold text-accent hover:underline">ПРОЧИТАТЬ ВСЕ</button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-fg-4 uppercase tracking-widest">Нет уведомлений</div>
                    ) : (
                      notifications.map((item) => {
                        const Icon = notificationIcons[item.type];
                        return (
                          <button
                            key={item.id}
                            onClick={() => markRead(item.id)}
                            className={cn(
                              'flex w-full items-start gap-3 border-b border-line-1 px-4 py-3 text-left last:border-b-0 hover:bg-bg-3 transition-colors',
                              !item.read && 'bg-accent-soft/5'
                            )}
                          >
                            <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-r1 border', notificationStyles[item.type])}>
                              <Icon size={14} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="block text-xs font-bold text-white truncate">{item.title}</span>
                              <span className="mt-1 block text-[11px] text-fg-3 leading-relaxed">{item.message}</span>
                              <MonoText className="mt-2 block text-[9px] text-fg-5">
                                {item.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </MonoText>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>,
                document.body
              )}
            </div>

            <button onClick={handleLogout} className="text-fg-3 hover:text-danger transition-colors" title="Выйти">
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
