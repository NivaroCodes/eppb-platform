import { useNavigate, useSearchParams } from 'react-router-dom';
import { MonoText } from '@/components/ui/MonoText';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Crumb } from '@/components/ui/Crumb';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId') ?? 'N/A';
  const refId = searchParams.get('refId') ?? 'N/A';

  const dateStr = new Date().toLocaleString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const breadcrumbs = [
    { label: 'ЕППБ', href: '/portal' },
    { label: 'ЗАЯВКИ', href: '/portal' },
    { label: submissionId, active: true },
  ];

  return (
    <div className="bg-bg-1 min-h-screen">
      {/* Topbar with breadcrumb */}
      <div className="h-12 px-8 flex items-center border-b border-line-2 bg-bg-1/50 backdrop-blur-md">
        <Crumb items={breadcrumbs} />
      </div>

      <div className="max-w-[800px] mx-auto px-8 py-24 flex flex-col items-center text-center">
        {/* Status Indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2.5 h-2.5 rounded-full bg-success pulse-dot" />
          <MonoText className="text-[11px] text-success font-bold uppercase tracking-[0.2em]">
            SUBMISSION ACCEPTED · {dateStr}
          </MonoText>
        </div>

        <h1 className="font-display font-bold text-[64px] leading-[1.05] text-white tracking-tight mb-8">
          Заявка принята.
        </h1>

        <p className="text-xl text-fg-2 font-body leading-relaxed max-w-2xl mb-12">
          Ваша заявка успешно прошла предварительную валидацию и направлена на рассмотрение. Мы уведомим вас об изменении статуса.
        </p>

        <Panel className="w-full bg-bg-2/50 border-line-3 grid grid-cols-1 md:grid-cols-3 gap-8 py-8 px-10 mb-12">
          <div className="flex flex-col gap-2">
            <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest">SUBMISSION ID</MonoText>
            <MonoText className="text-sm text-white font-bold break-all">{submissionId}</MonoText>
          </div>
          <div className="flex flex-col gap-2">
            <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest">REF ID</MonoText>
            <MonoText className="text-sm text-white font-bold">{refId}</MonoText>
          </div>
          <div className="flex flex-col gap-2">
            <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest">СТАТУС</MonoText>
            <span className="text-sm text-success font-bold">На рассмотрении</span>
          </div>
        </Panel>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mb-16 opacity-60">
          <StatusStep label="ВАЛИДАЦИЯ" active />
          <StatusStep label="INTEGRATION-LAYER" active />
          <StatusStep label="ОЦЕНКА РИСК-МЕНЕДЖМЕНТА" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button 
            className="flex-1 h-12 font-bold" 
            onClick={() => navigate('/portal')}
          >
            К услугам <ArrowRight className="ml-2" size={18} />
          </Button>
          <Button 
            variant="ghost" 
            className="flex-1 h-12 font-bold"
            onClick={() => navigate('/portal')}
          >
            На главную
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusStep({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-3 h-3 rounded-full border flex items-center justify-center transition-colors",
        active ? "bg-success border-success" : "border-line-3"
      )}>
        {active && <CheckCircle2 size={10} className="text-white" />}
      </div>
      <MonoText className={cn(
        "text-[10px] uppercase tracking-widest font-bold",
        active ? "text-fg-2" : "text-fg-4"
      )}>
        {label}
      </MonoText>
    </div>
  );
}
