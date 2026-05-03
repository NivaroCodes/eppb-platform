import { Wrench, Shield, User, ScrollText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-1">Настройки системы</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Управление параметрами платформы и конфигурация Command Center
      </p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-5 border border-orange-500/20">
              <Wrench size={28} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">В разработке</h2>
            <p className="text-sm text-zinc-500 max-w-md mb-6">
              Данный раздел находится в процессе активного конструирования. Мы внедряем новые инструменты кастомизации для вашего Command Center.
            </p>
            <div className="w-full max-w-xs mb-6">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5 uppercase tracking-wider">
                <span>Progress</span>
                <span>60% initialized</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full w-[60%]" />
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              Вернуться на главную
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-[10px] text-orange-500 uppercase tracking-widest font-bold mb-1">Следующий релиз</div>
            <p className="text-xl font-bold text-white">Q2 2025</p>
            <p className="text-xs text-zinc-500 mt-1">
              Ожидается глобальное обновление API, Schema Builder v2.0
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Core System</div>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-emerald-500" />
              <span className="text-xs text-white font-medium">Безопасность</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Протоколы шифрования и ключи доступа защищены на уровне кода
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {[{ icon: User, label: 'Профиль администратора', desc: 'Управление аккаунтом' },
        { icon: Shield, label: 'Роли и доступы', desc: 'RBAC конфигурация' },
        { icon: ScrollText, label: 'Логи активности', desc: 'Аудит действий' },
        ].map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-3 p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/30 hover:bg-white/10 transition-all group text-left"
          >
            <item.icon size={18} className="text-zinc-500 group-hover:text-orange-500 transition-colors" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-[11px] text-zinc-500">{item.desc}</p>
            </div>
            <ArrowRight size={14} className="text-zinc-600 group-hover:text-orange-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
