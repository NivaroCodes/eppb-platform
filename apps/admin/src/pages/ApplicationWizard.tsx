import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WizardLayout } from '@/components/layout/WizardLayout';
import { MonoText } from '@/components/ui/MonoText';
import { Button } from '@/components/ui/Button';
import { StepDot } from '@/components/ui/StepDot';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useFormsStore } from '@/store/services';
import { Check, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ApplicationWizard() {
  const { serviceCode } = useParams<{ serviceCode: string }>();
  const navigate = useNavigate();
  const { forms, loadForms } = useFormsStore();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const form = useMemo(() => 
    forms.find(f => f.schema.serviceCode === serviceCode && f.is_published),
    [forms, serviceCode]
  );

  if (!form) return null;

  const currentStep = form.schema.steps[currentStepIdx];
  const progressPercent = Math.round(((currentStepIdx + 1) / form.schema.steps.length) * 100);

  const leftContent = (
    <div className="space-y-12">
      <section>
        <MonoText className="text-[11px] text-fg-4 uppercase tracking-[0.2em] mb-3">
          SUB-9F4C2A · v2.0.0
        </MonoText>
        <h2 className="font-display font-bold text-[32px] text-white tracking-tight leading-tight mb-4">
          {form.name}
        </h2>
        <p className="text-sm text-fg-3 leading-relaxed">
          {currentStepIdx + 1} этап · {form.schema.steps.length} шагов · автозаполнение eGov
        </p>
      </section>

      {/* Progress Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest font-bold">Progress</MonoText>
          <MonoText className="text-sm text-accent font-bold tabular-nums">
            {String(currentStepIdx + 1).padStart(2, '0')} / {String(form.schema.steps.length).padStart(2, '0')}
          </MonoText>
        </div>
        <div className="h-1 bg-bg-3 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-500 ease-out-soft" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* Steps List */}
      <section className="space-y-8">
        {form.schema.steps.map((step, idx) => {
          let state: 'done' | 'current' | 'pending' = 'pending';
          if (idx < currentStepIdx) state = 'done';
          else if (idx === currentStepIdx) state = 'current';

          return (
            <div key={step.id} className="flex gap-4 items-start group">
              <StepDot state={state} number={idx + 1} />
              <div className="flex-1 min-w-0">
                <MonoText className={cn(
                  "text-[10px] uppercase tracking-wider mb-1 block transition-colors",
                  state === 'done' ? "text-success" : state === 'current' ? "text-accent" : "text-fg-4"
                )}>
                  {state === 'done' ? '✓ ПРОЙДЕН' : state === 'current' ? 'ТЕКУЩИЙ ШАГ' : 'ОЖИДАЕТ'}
                </MonoText>
                <h4 className={cn(
                  "text-sm font-bold truncate transition-colors",
                  state === 'pending' ? "text-fg-4" : "text-fg-1"
                )}>
                  {step.title}
                </h4>
              </div>
            </div>
          );
        })}
      </section>

      {/* Integrations Block */}
      <section className="mt-auto">
        <h3 className="font-mono text-[10px] text-fg-4 uppercase tracking-widest mb-4">ИНТЕГРАЦИИ</h3>
        <div className="space-y-3">
          <IntegrationItem label="eGov Data Service" status="active" />
          <IntegrationItem label="Credit Registry API" status="active" />
        </div>
      </section>
    </div>
  );

  return (
    <WizardLayout leftContent={leftContent}>
      <div className="space-y-12">
        <header>
          <MonoText className="text-[11px] text-accent font-bold uppercase tracking-[0.2em] mb-4">
            STEP {String(currentStepIdx + 1).padStart(2, '0')}
          </MonoText>
          <h2 className="font-display font-bold text-[32px] text-white tracking-tight">
            {currentStep.title}
          </h2>
          <p className="text-fg-3 mt-4 leading-relaxed">
            {currentStep.description || 'Пожалуйста, заполните все обязательные поля для продолжения оформления заявки.'}
          </p>
        </header>

        {/* Form Fields */}
        <div className="space-y-8">
          {currentStep.fields.map((field: any) => (
            <div key={field.id} className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor={field.id}>{field.label}</Label>
                {field.type === 'calculated' && (
                  <Badge variant="active" className="text-[9px] h-4 py-0 border-success-line/30">
                    ✓ Заполнено через eGov
                  </Badge>
                )}
              </div>
              
              {field.type === 'select' ? (
                <div className="relative">
                  <select 
                    className="flex h-11 w-full rounded-r2 border border-line-2 bg-bg-3 px-3 py-1 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent appearance-none"
                  >
                    <option value="" disabled selected>Выберите из списка...</option>
                    {field.options?.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-fg-4">
                    <Check size={14} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input 
                    id={field.id} 
                    type={field.type === 'number' ? 'number' : 'text'}
                    placeholder={field.type === 'number' ? '0' : 'Введите значение...'}
                    className="h-11 bg-bg-2 border-line-3 focus-visible:ring-accent-line"
                    readOnly={field.readonly}
                    defaultValue={field.type === 'calculated' ? '125 000 000' : ''}
                  />
                  {field.type === 'calculated' && field.formula && (
                    <MonoText className="text-[10px] text-fg-4 block pl-1">
                      formula: {astToMono(field.formula)}
                    </MonoText>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <footer className="pt-12 border-t border-line-2 flex items-center justify-between">
          <Button 
            variant="quiet" 
            onClick={() => setCurrentStepIdx(prev => Math.max(0, prev - 1))}
            disabled={currentStepIdx === 0}
            className="px-6"
          >
            <ArrowLeft className="mr-2" size={16} /> Назад
          </Button>

          <MonoText className="text-xs text-fg-4 font-bold tabular-nums">
            {currentStepIdx + 1} / {form.schema.steps.length}
          </MonoText>

          <Button 
            className="px-8 h-12 font-bold"
            onClick={() => {
              if (currentStepIdx < form.schema.steps.length - 1) {
                setCurrentStepIdx(prev => prev + 1);
              } else {
                navigate('/portal/success');
              }
            }}
          >
            {currentStepIdx === form.schema.steps.length - 1 ? 'Завершить →' : 'Далее →'}
          </Button>
        </footer>
      </div>
    </WizardLayout>
  );
}

function IntegrationItem({ label }: { label: string; status: 'active' | 'pending' }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-r2 border border-line-3 bg-bg-3/50">
      <span className="text-xs text-fg-2 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <MonoText className="text-[9px] text-success font-bold tracking-tighter uppercase">ONLINE</MonoText>
        <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
      </div>
    </div>
  );
}

function astToMono(node: any): string {
  if (!node) return '';
  if (node.ref) return `ref(${node.ref})`;
  if (node.value !== undefined) return typeof node.value === 'string' ? `"${node.value}"` : String(node.value);
  if (node.op) {
    return `${node.op}(${(node.args ?? []).map(astToMono).join(', ')})`;
  }
  return '';
}
