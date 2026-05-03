import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Layers, Code2, Settings, LogOut, Search, ChevronRight, FolderOpen, Bell, HelpCircle, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
          <div className="flex items-center gap-3 mb-6 p-2 rounded-lg bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              AD
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Administrator</p>
              <p className="text-[10px] text-zinc-500">Root Access</p>
            </div>
          </div>
          <button className="flex items-center gap-3 text-zinc-500 hover:text-red-400 transition-colors text-sm w-full">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex justify-between items-center w-full px-8 py-4 shrink-0">
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
              <Bell size={18} className="cursor-pointer hover:text-white transition-colors" />
              <HelpCircle size={18} className="cursor-pointer hover:text-white transition-colors" />
              <UserCircle size={20} className="cursor-pointer hover:text-white transition-colors" />
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
