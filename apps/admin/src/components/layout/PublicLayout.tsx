import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, LogOut, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications';

export function PublicLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const unreadCount = useNotificationsStore((state) => state.unreadCount());

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <button
            onClick={() => navigate('/portal')}
            className="text-left text-lg font-black text-slate-950"
          >
            ЕППБ | Байтерек
          </button>
          <nav className="flex items-center gap-2">
            <PublicNavLink to="/portal">Услуги</PublicNavLink>
            <PublicNavLink to="/portal/applications">Мои заявки</PublicNavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="relative rounded-full border border-slate-200 p-2 text-slate-500">
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-orange-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {unreadCount}
                </span>
              )}
            </span>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 md:flex">
              <UserCircle size={17} />
              {user?.name ?? 'Пользователь'}
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Выйти"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function PublicNavLink({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/portal'}
      className={({ isActive }) =>
        cn(
          'rounded-lg px-3 py-2 text-sm font-semibold',
          isActive ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-100'
        )
      }
    >
      {children}
    </NavLink>
  );
}
