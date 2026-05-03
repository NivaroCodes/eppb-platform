import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, type UserRole } from '@/store/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [tab, setTab] = useState<UserRole>('admin');
  const [adminLogin, setAdminLogin] = useState('admin@baiterek.kz');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [bin, setBin] = useState('123456789012');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (tab === 'admin') {
      login('admin', adminLogin || 'Администратор');
      navigate('/services', { replace: true });
      return;
    }
    login('user', `БИН ${bin || '123456789012'}`);
    navigate('/portal', { replace: true });
  };

  return (
    <main className="flex min-h-screen bg-slate-950 text-white">
      <section className="hidden flex-1 flex-col justify-between bg-[linear-gradient(135deg,#111827,#1e293b_55%,#7c2d12)] p-12 lg:flex">
        <div>
          <div className="text-2xl font-black">EPPB | Байтерек</div>
          <p className="mt-3 max-w-lg text-lg leading-8 text-slate-200">
            Единый портал поддержки бизнеса для быстрого запуска и подачи электронных услуг.
          </p>
        </div>
        <div className="grid max-w-2xl grid-cols-3 gap-4">
          {['70+ мер поддержки', 'No-code формы', 'Интеграция ЕИШ'].map((item) => (
            <div key={item} className="rounded-lg border border-white/15 bg-white/10 p-4">
              <p className="text-sm font-semibold text-white">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-6 text-slate-900 lg:w-[480px]">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
              <Building2 size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-950">EPPB | Байтерек</h1>
            <p className="mt-2 text-sm text-slate-500">Вход в платформу</p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab('admin')}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-bold transition-colors',
                tab === 'admin' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
              )}
            >
              Администратор
            </button>
            <button
              type="button"
              onClick={() => setTab('user')}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-bold transition-colors',
                tab === 'user' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
              )}
            >
              Предприниматель
            </button>
          </div>

          {tab === 'admin' ? (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Логин</span>
                <input
                  value={adminLogin}
                  onChange={(event) => setAdminLogin(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  type="email"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Пароль</span>
                <input
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  type="password"
                />
              </label>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700"
              >
                <KeyRound size={18} />
                Войти
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">БИН</span>
                <input
                  value={bin}
                  onChange={(event) => setBin(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  inputMode="numeric"
                />
              </label>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                <UserRound size={18} />
                Войти через eGov
              </button>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
