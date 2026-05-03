import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonoText } from '@/components/ui/MonoText';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Crumb } from '@/components/ui/Crumb';
import { StepDot } from '@/components/ui/StepDot';
import { Badge } from '@/components/ui/Badge';
import { useFormsStore } from '@/store/services';
import { FileText, Clock, Layers, GitBranch, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ServiceDetailPage() {
  const { serviceCode } = useParams<{ serviceCode: string }>();
  const navigate = useNavigate();
  const { forms, loadForms } = useFormsStore();

  useEffect(() => {
    if (forms.length === 0) loadForms();
  }, [forms.length, loadForms]);

  const form = useMemo(() => 
    forms.find(f => f.schema?.serviceCode === serviceCode && f.is_published),
    [forms, serviceCode]
  );

  // Still loading
  if (forms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <MonoText className="text-fg-4 uppercase tracking-[0.2em] mb-4">404 · SERVICE NOT FOUND</MonoText>
        <Button onClick={() => navigate('/portal')} variant="ghost">Вернуться в каталог</Button>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'ЕППБ', href: '/portal' },
    { label: 'УСЛУГИ', href: '/portal' },
    { label: (form.name || '').toUpperCase(), active: true },
  ];

  return (
    <div className="bg-bg-1 min-h-screen">
      {/* Topbar with breadcrumb */}
      <div className="h-12 px-8 flex items-center border-b border-line-2 bg-bg-1/50 backdrop-blur-md">
        <Crumb items={breadcrumbs} />
      </div>

      <div className="max-w-[1200px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Hero & Info */}
          <div className="lg:col-span-8 space-y-12">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="accent" className="text-[10px] py-0 px-2 uppercase tracking-wider rounded-r1 border-accent-line/30">
                  АКТИВНА
                </Badge>
                <MonoText className="text-[11px] text-fg-3 uppercase tracking-widest">
                  # {form.schema?.serviceCode ?? '---'} · v{form.schema_version || '1.0.0'}
                </MonoText>
              </div>
              
              <h1 className="font-display font-bold text-[48px] leading-[1.1] text-white tracking-tight mb-6">
                {form.name}
              </h1>
              
              <p className="text-lg text-fg-2 font-body leading-relaxed max-w-2xl mb-10">
                {form.schema?.description || 'Обеспечение доступности мер государственной поддержки для субъектов частного предпринимательства.'}
              </p>

              <Button 
                size="lg" 
                className="h-14 px-8 text-base font-bold shadow-xl shadow-accent/20"
                onClick={() => navigate(`/portal/${serviceCode}/apply`)}
              >
                Подать заявку <ArrowRight className="ml-2" size={20} />
              </Button>
            </section>

            {/* Meta Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetaCard icon={Layers} label="Шагов" value={String(form.schema?.steps?.length ?? 0)} />
              <MetaCard icon={GitBranch} label="Интеграций" value={String(form.schema?.config?.integration_required?.length || 0)} />
              <MetaCard icon={Clock} label="Среднее время" value="15 мин" />
              <MetaCard icon={FileText} label="Версия схемы" value={form.schema_version || '1.0.0'} isMono />
            </div>

            {/* Steps List */}
            <section>
              <h3 className="font-mono text-[11px] text-fg-3 uppercase tracking-[0.2em] mb-8 border-b border-line-2 pb-2">
                Этапы подачи заявки
              </h3>
              <div className="space-y-6">
                {(form.schema?.steps ?? []).map((step: any, idx: number) => (
                  <div key={step.id} className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <StepDot state="pending" number={idx + 1} className="group-hover:border-accent transition-colors" />
                      {idx < (form.schema?.steps?.length ?? 0) - 1 && (
                        <div className="w-[1px] h-full bg-line-3 my-2" />
                      )}
                    </div>
                    <div className="pb-8">
                      <h4 className="text-white font-bold mb-1 group-hover:text-accent transition-colors">{step.title}</h4>
                      <p className="text-sm text-fg-3 leading-relaxed">
                        {step.description || 'Процесс заполнения необходимых данных для данного этапа.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Sidebar Info */}
          <div className="lg:col-span-4 space-y-8">
            <Panel className="bg-bg-2/50 border-line-3">
              <h3 className="font-mono text-[11px] text-fg-3 uppercase tracking-[0.2em] mb-6">
                Документы к загрузке
              </h3>
              <div className="space-y-4">
                <DocItem number="01" label="Удостоверение личности" />
                <DocItem number="02" label="Свидетельство о регистрации" />
                <DocItem number="03" label="Финансовая отчетность за год" />
                <DocItem number="04" label="Бизнес-план проекта" />
              </div>
            </Panel>

            <Panel className="bg-accent-soft/5 border-accent-line/20">
              <div className="flex items-center gap-2 mb-4 text-accent">
                <MonoText className="text-[10px] font-bold uppercase tracking-widest">HELP · ПОМОЩЬ</MonoText>
              </div>
              <p className="text-sm text-fg-2 leading-relaxed mb-6">
                Если у вас возникли вопросы по данной услуге, наши консультанты готовы помочь.
              </p>
              <Button variant="quiet" className="w-full text-xs font-bold uppercase tracking-wider">
                Связаться с куратором
              </Button>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaCard({ icon: Icon, label, value, isMono }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string; isMono?: boolean }) {
  return (
    <Panel className="p-4 flex flex-col gap-3 bg-bg-2 border-line-2 group hover:border-line-3 transition-colors">
      <div className="w-8 h-8 rounded-r1 bg-bg-3 flex items-center justify-center text-fg-3 group-hover:text-accent transition-colors">
        <Icon size={16} />
      </div>
      <div>
        <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest block mb-1">{label}</MonoText>
        <span className={cn(
          "font-display font-bold text-white",
          isMono && "font-mono text-sm tabular-nums"
        )}>
          {value}
        </span>
      </div>
    </Panel>
  );
}

function DocItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <MonoText className="text-xs text-fg-4 group-hover:text-accent transition-colors">{number}</MonoText>
      <span className="text-sm text-fg-2 group-hover:text-fg-1 transition-colors">{label}</span>
    </div>
  );
}

