import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layers, Code2, Settings, LogOut, Search, ChevronRight, FolderOpen, Bell, HelpCircle, UserCircle, CheckCircle2, AlertTriangle, FileWarning, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormsStore } from '@/store/services';

interface Notif {
  id: string;
  icon: typeof Bell;
  tone: 'success' | 'warning' | 'info';
  title: string;
  desc: string;
  time?: string;
}

const toneStyles: Record<Notif['tone'], string> = {
  success: 'text-emerald-500 bg-emerald-500/10',
  warning: 'text-yellow-500 bg-yellow-500/10',
  info: 'text-orange-500 bg-orange-500/10',
};

const sidebarNav = [
  { to: '/', icon: Layers, label: 'Services' },
  { to: '/schema', icon: Code2, label: 'JSON Schema' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const breadcrumbMap: Record<string, string> = {
  '/': 'Каталог услуг',
  '/schema': 'JSON Схемы',
  '/settings': 'Настройки',
};

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [notifPos, setNotifPos] = useState<{ top: number; right: number } | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!notifOpen || !notifBtnRef.current) return;
    const rect = notifBtnRef.current.getBoundingClientRect();
    setNotifPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }, [notifOpen]);

  const { forms, apiAvailable, loadForms } = useFormsStore();

  useEffect(() => {
    if (forms.length === 0) loadForms();
  }, [forms.length, loadForms]);

  const notifications = useMemo<Notif[]>(() => {
    const list: Notif[] = [];
    if (!apiAvailable) {
      list.push({
        id: 'backend-offline',
        icon: AlertTriangle,
        tone: 'warning',
        title: 'Backend offline',
        desc: 'Работаем в offline-режиме с mock-данными',
      });
    } else {
      list.push({
        id: 'backend-online',
        icon: CheckCircle2,
        tone: 'success',
        title: 'Backend подключён',
        desc: 'FastAPI на :8000, Swagger доступен',
      });
    }
    const drafts = forms.filter((f) => !f.is_published);
    if (drafts.length > 0) {
      list.push({
        id: `drafts-${drafts.length}`,
        icon: FileWarning,
        tone: 'info',
        title: `Черновиков: ${drafts.length}`,
        desc: 'Ожидают публикации',
      });
    }
    const published = forms.length - drafts.length;
    if (published > 0) {
      list.push({
        id: `published-${published}`,
        icon: CircleCheck,
        tone: 'success',
        title: `Опубликовано: ${published}`,
        desc: 'Активные услуги в каталоге',
      });
    }
    return list.filter((n) => !dismissed.has(n.id));
  }, [forms, apiAvailable, dismissed]);

  const hasUnread = notifications.length > 0;

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const dismissAll = () => {
    setDismissed(new Set(notifications.map((n) => n.id)));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const handleLogout = () => {
    if (window.confirm('Выйти из EPPB Admin?')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
      navigate('/');
      window.location.reload();
    }
  };

  const openHelp = () => {
    window.open('https://github.com/NivaroCodes/eppb-platform#readme', '_blank', 'noopener,noreferrer');
  };

  const currentPage = Object.entries(breadcrumbMap).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  );

  return (
    <div className="flex h-screen bg-[#131313] text-[#e5e2e1]">
      {/* Sidebar */}
      <aside className="w-[260px] bg-black/80 backdrop-blur-2xl border-r border-white/10 flex flex-col py-6 shrink-0">
        <div className="px-6 mb-10">
          <h1 className="text-orange-500 font-black text-2xl tracking-tight">EPPB Constructor</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1 font-semibold">Command Center</p>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-all duration-300',
                  isActive
                    ? 'bg-orange-500/10 text-orange-500 border-l-4 border-orange-600 font-semibold'
                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200 border-l-4 border-transparent'
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-6 border-t border-white/5 pt-6">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 mb-6 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors w-full text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              AD
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Administrator</p>
              <p className="text-[10px] text-zinc-500">Root Access</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-zinc-500 hover:text-red-400 transition-colors text-sm w-full"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="relative z-50 bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex justify-between items-center w-full px-8 py-4 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 uppercase select-none">
              EPPB Admin
            </span>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <div className="flex items-center text-zinc-400 text-sm gap-2">
              <FolderOpen size={16} />
              <span>Конструктор</span>
              <ChevronRight size={14} />
              <span className="text-orange-500 font-bold">{currentPage?.[1] ?? ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                className="bg-black border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all w-64"
                placeholder="Поиск..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <div className="relative" ref={notifRef}>
                <button
                  ref={notifBtnRef}
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative hover:text-white transition-colors"
                  aria-label="Уведомления"
                >
                  <Bell size={18} />
                  {hasUnread && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-[10px] font-black text-white flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {notifOpen && notifPos &&
                  createPortal(
                    <div
                      className="fixed w-80 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                      style={{
                        top: notifPos.top,
                        right: notifPos.right,
                        zIndex: 2147483647,
                        backgroundColor: '#1c1b1b',
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Уведомления</span>
                        {notifications.length > 0 && (
                          <button
                            onClick={dismissAll}
                            className="text-[10px] uppercase tracking-wider font-bold text-orange-500 hover:text-orange-400"
                          >
                            Очистить
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-sm text-zinc-500 text-center">Нет новых уведомлений</div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => dismiss(n.id)}
                              className="w-full px-4 py-3 text-left border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors flex items-start gap-3 group"
                            >
                              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', toneStyles[n.tone])}>
                                <n.icon size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                                <p className="text-[12px] text-zinc-500 leading-snug">{n.desc}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
              </div>
              <button
                onClick={openHelp}
                className="hover:text-white transition-colors"
                aria-label="Помощь"
              >
                <HelpCircle size={18} />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="hover:text-white transition-colors"
                aria-label="Профиль"
              >
                <UserCircle size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-[#131313]">
          <Outlet />
        </main>
      </div>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[20%] w-[400px] h-[400px] bg-red-600/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}
