import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, UserCircle, Mail, KeyRound, GitBranch, FileCode2, Boxes, Activity, CornerDownRight, Copy, Check } from 'lucide-react';
import { CONTRACT_VERSION } from '@/types/schema';

interface Invariant {
  n: number;
  icon: typeof GitBranch;
  title: string;
  body: string;
}

const invariants: Invariant[] = [
  {
    n: 1,
    icon: GitBranch,
    title: 'AST only',
    body:
      'Все condition и formula — только AST с полем type: { type: "ref", field: "<id>" }, { type: "value", value: ... }, { type: "op", op: "<имя>", args: [...] }. Строковых DSL нет; движок BE1 строки не исполняет.',
  },
  {
    n: 2,
    icon: FileCode2,
    title: 'Storage shape',
    body:
      'Схема в JSONB: корневые serviceCode, version, title, description, config, steps. Не оборачивать в { "content": {...} }. Поля config в snake_case: allow_drafts, auto_save, integration_required.',
  },
  {
    n: 3,
    icon: Boxes,
    title: 'engine/ package',
    body:
      'Пакет engine в корне монорепозитория; backend импортирует его для load_schema и workflow. FE1 пакет engine не импортирует, только воспроизводит тот же JSON wire-format в типах и моках.',
  },
  {
    n: 4,
    icon: Activity,
    title: 'AdvanceResult',
    body:
      'Runtime (портал): ответ advance — { next_step_id, errors, calculated, is_final }. Генерация схемы в админке должна сохранять валидный AST, чтобы BE1 мог вычислить переходы.',
  },
  {
    n: 5,
    icon: CornerDownRight,
    title: 'is_final_step',
    body:
      'Терминальный шаг: нет transitions ИЛИ все transitions[].to указывают на несуществующий step_id.',
  },
];

const invariantsRaw = `Контракт EPPB JSON Schema v2.0 (кратко)

1) Условия и формулы только AST: type "ref" + field; type "value" + value; type "op" + op + args.

2) Корень документа: serviceCode, version, steps; config: allow_drafts, auto_save, integration_required.

3) select.options — массив строк.

4) Runtime AdvanceResult: next_step_id, errors, calculated, is_final.`;

export function AdminProfilePage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invariantsRaw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="p-6 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex text-zinc-500 text-sm mb-2 gap-2 items-center">
        <button onClick={() => navigate('/settings')} className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft size={14} />
          Настройки
        </button>
        <span>/</span>
        <span className="text-orange-500">Профиль администратора</span>
      </nav>

      <h1 className="text-[32px] font-semibold text-white leading-tight tracking-tight mb-8">
        Профиль администратора
      </h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: user info */}
        <section className="col-span-12 lg:col-span-4 backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-orange-500/20">
              AD
            </div>
            <p className="text-lg font-bold text-white">Administrator</p>
            <span className="mt-1 text-[10px] font-bold text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded">
              Root Access
            </span>
          </div>

          <div className="mt-8 space-y-4">
            <Row icon={UserCircle} label="Имя" value="Administrator" />
            <Row icon={Mail} label="Email" value="admin@eppb.local" />
            <Row icon={Shield} label="Роль" value="SUPER_ADMIN" />
            <Row icon={KeyRound} label="Сессия" value="Активна" valueClass="text-emerald-500" />
          </div>
        </section>

        {/* Right: architecture invariants */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-xl p-6">
            <div className="flex items-start justify-between mb-2 gap-4">
              <div className="flex items-center gap-2 text-orange-500">
                <Shield size={20} />
                <h2 className="text-2xl font-semibold">Контракт платформы</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20 shrink-0">
                v{CONTRACT_VERSION}
              </span>
            </div>
            <p className="text-sm text-zinc-500 mb-6">
              Инварианты согласованы с BE1 / BE2 / FE2. Нарушать запрещено.
            </p>

            <div className="space-y-3">
              {invariants.map((inv) => (
                <div
                  key={inv.n}
                  className="p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:border-orange-500/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                      {inv.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <inv.icon size={14} className="text-orange-500 shrink-0" />
                        <h3 className="text-sm font-bold text-white">{inv.title}</h3>
                      </div>
                      <p className="text-[13px] text-zinc-400 leading-relaxed">{inv.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-500 text-sm font-semibold hover:bg-orange-500/15 transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Скопировано' : 'Скопировать инварианты как текст'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof UserCircle;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-zinc-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{label}</p>
        <p className={`text-sm font-medium ${valueClass ?? 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}
