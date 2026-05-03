import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  Layers,
  LogOut,
  Settings,
  UserCircle,
  XCircle,
  Info,
  Globe2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore, type NotificationType } from '@/store/notifications';

const notificationStyles: Record<NotificationType, string> = {
  success: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  error: 'text-red-700 bg-red-50 border-red-200',
  info: 'text-sky-700 bg-sky-50 border-sky-200',
};

const notificationIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const pageLabels: Record<string, string> = {
  '/services': 'Каталог услуг',
  '/settings': 'Настройки',
  '/profile': 'Профиль',
  '/schema': 'Просмотр схем',
};

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
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

  const currentPage =
    Object.entries(pageLabels).find(([path]) => location.pathname.startsWith(path))?.[1] ??
    'Конструктор';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-6">
          <h1 className="text-xl font-black text-slate-950">EPPB | Байтерек</h1>
          <p className="mt-1 text-xs font-semibold uppercase text-slate-500">Конструктор услуг</p>
        </div>

        <nav className="flex-1 space-y-6 px-4 py-5">
          <div>
            <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Конструктор
            </p>
            <NavItem to="/services" label="Каталог услуг" icon={Layers} />
          </div>

          <div>
            <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Портал
            </p>
            <NavItem to="/portal" label="Предпросмотр портала" icon={Globe2} />
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <NavItem to="/settings" label="Настройки" icon={Settings} compact />
          <button
            onClick={() => navigate('/profile')}
            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            <UserCircle size={20} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{user?.name ?? 'Администратор'}</span>
              <span className="block text-xs text-slate-500">Администратор</span>
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="flex items-center gap-3 text-sm">
            <FolderOpen size={18} className="text-slate-400" />
            <span className="text-slate-500">EPPB</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="font-semibold text-slate-900">{currentPage}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {user?.role === 'admin' ? 'Администратор' : 'Предприниматель'}
            </div>

            <div className="relative" ref={notifRef}>
              <button
                ref={notifBtnRef}
                onClick={() => setNotifOpen((value) => !value)}
                className="relative rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Уведомления"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen &&
                notifPos &&
                createPortal(
                  <div
                    className="fixed w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                    style={{ top: notifPos.top, right: notifPos.right, zIndex: 1000 }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                      <span className="text-sm font-bold text-slate-900">Уведомления</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs font-semibold text-orange-700 hover:text-orange-800"
                        >
                          Прочитать все
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500">
                          Нет новых уведомлений
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const Icon = notificationIcons[item.type];
                          return (
                            <button
                              key={item.id}
                              onClick={() => markRead(item.id)}
                              className={cn(
                                'flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50',
                                !item.read && 'bg-orange-50/40'
                              )}
                            >
                              <span
                                className={cn(
                                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                                  notificationStyles[item.type]
                                )}
                              >
                                <Icon size={17} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-slate-900">
                                  {item.title}
                                </span>
                                <span className="mt-0.5 block text-xs leading-5 text-slate-600">
                                  {item.message}
                                </span>
                                <span className="mt-1 block text-[11px] text-slate-400">
                                  {item.timestamp.toLocaleTimeString('ru-RU', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  compact = false,
}: {
  to: string;
  label: string;
  icon: typeof Layers;
  compact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors',
          compact ? 'py-2.5' : 'py-3',
          isActive
            ? 'bg-orange-50 text-orange-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
        )
      }
    >
      <Icon size={19} />
      {label}
    </NavLink>
  );
}
