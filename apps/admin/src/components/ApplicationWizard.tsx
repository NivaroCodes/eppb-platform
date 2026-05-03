import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE, useFormsStore } from '@/store/services';
import { useNotificationsStore } from '@/store/notifications';
import type { AdvanceResult, ExprNode, FormField, FormStep, ServiceSchema, SubmitResult } from '@/types/schema';
import { MonoText } from '@/components/ui/MonoText';
import { StepDot } from '@/components/ui/StepDot';
import { Badge } from '@/components/ui/Badge';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

interface ApplicationWizardProps {
  serviceCode: string;
  preview?: boolean;
  backTo?: string;
}

export function ApplicationWizard({ serviceCode, preview = false, backTo = '/portal' }: ApplicationWizardProps) {
  const navigate = useNavigate();
  const push = useNotificationsStore((state) => state.push);
  const { forms, loadForms } = useFormsStore();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [schema, setSchema] = useState<ServiceSchema | null>(null);
  const [currentStepId, setCurrentStepId] = useState('');
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [calculatedValues, setCalculatedValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionLost, setSessionLost] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  useEffect(() => {
    const form = forms.find((item) => item.schema.serviceCode === serviceCode);
    if (!form) {
      setLoading(forms.length === 0);
      return;
    }
    setSchema(form.schema);
    setCurrentStepId((current) => current || form.schema?.steps?.[0]?.id || '');
    setLoading(false);
  }, [forms, serviceCode]);

  const currentStep = useMemo(
    () => schema?.steps?.find((step) => step.id === currentStepId) ?? null,
    [schema, currentStepId]
  );

  const currentIndex = schema?.steps?.findIndex((step) => step.id === currentStepId) ?? -1;
  const progressPercent = schema?.steps?.length ? Math.round(((currentIndex + 1) / schema.steps.length) * 100) : 0;

  const previewCalculated = useMemo(
    () => (currentStep ? computeCalculatedPreview(currentStep, fieldValues) : {}),
    [currentStep, fieldValues]
  );

  // Set default select values
  useEffect(() => {
    if (!currentStep) return;
    const defaults: Record<string, unknown> = {};
    currentStep.fields.forEach((field) => {
      if (field.type === 'select' && field.options?.length && fieldValues[field.id] === undefined) {
        defaults[field.id] = field.options[0];
      }
    });
    if (Object.keys(defaults).length > 0) {
      setFieldValues((current) => ({ ...current, ...defaults }));
    }
  }, [currentStep, fieldValues]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!schema || !schema.steps || schema.steps.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-fg-3">Схема недоступна</p>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-fg-3">Услуга не найдена</p>
      </div>
    );
  }

  const handleFieldChange = (field: FormField, value: unknown) => {
    setFieldValues((current) => ({ ...current, [field.id]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field.id];
      return next;
    });
    setReadyToSubmit(false);
  };

  const handleAutofill = async (field: FormField) => {
    if (!field.autofill || field.autofill.source !== 'egov_mock') return;
    const rawValue = fieldValues[field.id];
    if (!rawValue) return;

    try {
      const res = await fetch(`${API_BASE}/mock/egov/profile?iin=${encodeURIComponent(String(rawValue))}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const profile = (await res.json()) as Record<string, unknown>;
      const nextValues: Record<string, unknown> = {};
      currentStep.fields.forEach((stepField) => {
        if (stepField.id !== field.id && profile[stepField.id] !== undefined) {
          nextValues[stepField.id] = profile[stepField.id];
        }
      });
      setFieldValues((current) => ({ ...current, ...nextValues }));
      setAutofillSuccess((prev) => ({ ...prev, [field.id]: true }));
    } catch (error) {
      push({
        type: 'error',
        title: 'Ошибка eGov',
        message: error instanceof Error ? error.message : 'Не удалось получить данные eGov',
      });
    }
  };

  const advance = async () => {
    if (readyToSubmit) {
      await submit();
      return;
    }

    const bodyValues = stripCalculatedValues(fieldValues, schema);
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/forms/${serviceCode}/steps/${currentStepId}/advance`,
        {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            session_id: sessionId,
            field_values: bodyValues,
          }),
        }
      );

      if (res.status === 404) {
        setSessionLost(true);
        return;
      }
      if (!res.ok) throw new Error(await res.text());

      const result = (await res.json()) as AdvanceResult;
      if (Object.keys(result.errors ?? {}).length > 0) {
        setErrors(result.errors);
        return;
      }

      setCalculatedValues((current) => ({ ...current, ...(result.calculated ?? {}) }));
      setStepHistory((current) => [...current, currentStepId]);
      setErrors({});

      if (result.is_final) {
        setReadyToSubmit(true);
        return;
      }

      if (result.next_step_id) {
        setCurrentStepId(result.next_step_id);
      }
    } catch (error) {
      push({
        type: 'error',
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось перейти к следующему шагу',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      if (preview) {
        navigate(
          `/portal/success?submissionId=PREVIEW-${Date.now()}&refId=PREVIEW&serviceCode=${schema?.serviceCode ?? ''}`
        );
        return;
      }

      const res = await fetch(`${API_BASE}/api/forms/${serviceCode}/submit`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (res.status === 404) {
        setSessionLost(true);
        return;
      }
      if (!res.ok) throw new Error(await res.text());

      const result = (await res.json()) as SubmitResult;
      push({ type: 'success', title: 'Заявка подана', message: result.ref_id });
      navigate(
        `/portal/success?submissionId=${encodeURIComponent(result.submission_id)}&refId=${encodeURIComponent(result.ref_id)}&serviceCode=${encodeURIComponent(schema?.serviceCode ?? '')}`
      );
    } catch (error) {
      push({
        type: 'error',
        title: 'Ошибка',
        message: error instanceof Error ? error.message : 'Не удалось подать заявку',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const back = () => {
    const previous = stepHistory[stepHistory.length - 1];
    if (!previous) return;
    setStepHistory((current) => current.slice(0, -1));
    setCurrentStepId(previous);
    setReadyToSubmit(false);
    setErrors({});
  };

  // ── LEFT PANEL CONTENT ─────────────────────────────────────────────────────
  const leftContent = (
    <div className="space-y-10 flex flex-col h-full">
      <section>
        <MonoText className="text-[11px] text-fg-4 uppercase tracking-[0.2em] mb-3">
          SESSION · {sessionId.substring(0, 8).toUpperCase()}
        </MonoText>
        <h2 className="font-display font-bold text-[28px] text-white tracking-tight leading-tight mb-4">
          {schema?.title || 'Без названия'}
        </h2>
        <p className="text-sm text-fg-3 leading-relaxed">
          {schema?.description || ''}
        </p>
      </section>

      {/* Progress */}
      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest font-bold">Прогресс</MonoText>
          <MonoText className="text-sm text-accent font-bold tabular-nums">
            {String(currentIndex + 1).padStart(2, '0')} / {String(schema?.steps?.length ?? 0).padStart(2, '0')}
          </MonoText>
        </div>
        <div className="h-1 bg-bg-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* Steps List */}
      <section className="space-y-6 flex-1">
        {(schema?.steps ?? []).map((step, idx) => {
          let state: 'done' | 'current' | 'pending' = 'pending';
          if (idx < currentIndex) state = 'done';
          else if (idx === currentIndex) state = 'current';

          return (
            <div key={step.id} className="flex gap-4 items-start group">
              <StepDot state={state} number={idx + 1} />
              <div className="flex-1 min-w-0">
                <MonoText className={cn(
                  "text-[10px] uppercase tracking-wider mb-0.5 block transition-colors",
                  state === 'done' ? "text-success" : state === 'current' ? "text-accent" : "text-fg-4"
                )}>
                  {state === 'done' ? '✓ ПРОЙДЕН' : state === 'current' ? 'ТЕКУЩИЙ' : 'ОЖИДАЕТ'}
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

      {/* Session info */}
      <section>
        <div className="p-3 rounded-r2 bg-bg-3/50 border border-line-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
            <MonoText className="text-[9px] text-success font-bold uppercase tracking-widest">EGOV ONLINE</MonoText>
          </div>
          <p className="text-[10px] text-fg-4 font-mono">Автозаполнение активно</p>
        </div>
      </section>
    </div>
  );

  // ── LAYOUT ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg-1 text-fg-1 font-body flex overflow-hidden">
      {/* LEFT PANE */}
      <aside className="w-[380px] flex-shrink-0 bg-bg-2 border-r border-line-2 flex flex-col overflow-y-auto">
        <div className="p-8 flex flex-col h-full">
          {/* Brand + back */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent" />
              <span className="font-display font-bold text-lg tracking-tight text-white uppercase">ЕППБ</span>
              <MonoText className="text-[11px] text-fg-3 uppercase tracking-[0.10em]">/ WIZARD</MonoText>
            </div>
            <Link
              to={backTo}
              className="text-[11px] font-mono text-fg-4 hover:text-fg-1 transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={12} /> назад
            </Link>
          </div>

          {preview && (
            <div className="mb-6 rounded-r2 border border-warning/20 bg-warning/10 px-3 py-2">
              <MonoText className="text-[10px] text-warning font-bold uppercase tracking-wider">
                PREVIEW MODE — данные не сохраняются
              </MonoText>
            </div>
          )}

          <div className="flex-1">{leftContent}</div>

          <div className="mt-8 pt-6 border-t border-line-3">
            <MonoText className="text-[9px] text-fg-5 uppercase tracking-widest">
              Безопасное соединение · v2.0.0
            </MonoText>
          </div>
        </div>
      </aside>

      {/* RIGHT PANE */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-bg-1">
        <div className="max-w-[760px] w-full mx-auto p-12">
          {/* Step header */}
          <header className="mb-10">
            <MonoText className="text-[11px] text-accent font-bold uppercase tracking-[0.2em] mb-3">
              STEP {String(currentIndex + 1).padStart(2, '0')}
            </MonoText>
            <h2 className="font-display font-bold text-[36px] text-white tracking-tight leading-tight mb-4">
              {currentStep.title}
            </h2>
            {currentStep.description && (
              <p className="text-fg-3 leading-relaxed">
                {currentStep.description}
              </p>
            )}
          </header>

          {/* Form Fields */}
          <div className="space-y-6">
            {currentStep.fields.length === 0 ? (
              <div className="rounded-r3 border border-dashed border-line-3 bg-bg-2/50 py-12 text-center">
                <MonoText className="text-fg-4 uppercase tracking-widest text-[11px]">
                  На этом шаге нет полей
                </MonoText>
                <p className="mt-2 text-xs text-fg-4">Нажмите «Далее», чтобы применить условие перехода</p>
              </div>
            ) : (
              currentStep.fields.map((field) => (
                <FieldControl
                  key={field.id}
                  field={field}
                  value={fieldValues[field.id]}
                  calculatedValue={calculatedValues[field.id] ?? previewCalculated[field.id]}
                  error={errors[field.id]}
                  autofillSuccess={autofillSuccess[field.id] ?? false}
                  onChange={(value) => handleFieldChange(field, value)}
                  onBlur={() => handleAutofill(field)}
                />
              ))
            )}
          </div>

          {errors.__step__ && (
            <div className="mt-6 flex gap-3 rounded-r2 border border-danger-line/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              {errors.__step__}
            </div>
          )}

          {/* Navigation */}
          <footer className="mt-12 pt-8 border-t border-line-2 flex items-center justify-between">
            <button
              onClick={back}
              disabled={stepHistory.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-r2 border border-line-2 bg-transparent text-sm font-bold text-fg-2 hover:bg-bg-3 hover:text-fg-1 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              <ArrowLeft size={16} /> Назад
            </button>

            <MonoText className="text-xs text-fg-4 font-bold tabular-nums">
              {currentIndex + 1} / {schema?.steps?.length ?? 0}
            </MonoText>

            <button
              onClick={advance}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-r2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                readyToSubmit
                  ? "bg-success text-white hover:bg-success/90"
                  : "bg-accent text-white hover:bg-accent-hover"
              )}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {readyToSubmit ? 'Подать заявку →' : 'Далее →'}
            </button>
          </footer>
        </div>
      </main>

      {/* Session Lost Modal */}
      {sessionLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm p-6">
          <div className="w-full max-w-md rounded-r4 bg-bg-2 border border-line-2 p-8 shadow-2xl">
            <MonoText className="text-[11px] text-danger font-bold uppercase tracking-widest mb-3">
              СЕССИЯ ИСТЕКЛА
            </MonoText>
            <h2 className="text-xl font-bold text-white mb-3">Сессия истекла</h2>
            <p className="text-sm text-fg-3 leading-relaxed mb-6">
              Данные не сохранены. Начать заполнение заново?
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-r2 bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors"
            >
              Начать заново
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── FIELD CONTROL ─────────────────────────────────────────────────────────────

function FieldControl({
  field,
  value,
  calculatedValue,
  error,
  autofillSuccess,
  onChange,
  onBlur,
}: {
  field: FormField;
  value: unknown;
  calculatedValue: unknown;
  error?: string;
  autofillSuccess: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}) {
  const inputBase = cn(
    'w-full rounded-r2 border px-3 py-2.5 text-sm outline-none transition-colors bg-bg-3 text-fg-1',
    'focus:border-accent focus:ring-1 focus:ring-accent/20',
    error ? 'border-danger-line/60 bg-danger-soft/20' : 'border-line-2 hover:border-line-3'
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={field.id} className="block text-[11px] font-bold text-fg-3 uppercase tracking-[0.08em] font-mono">
          {field.label}
          {(field.required || field.validation?.required) && (
            <span className="text-danger ml-1">*</span>
          )}
        </label>
        {autofillSuccess && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-success font-bold">
            <Check size={10} /> Заполнено через eGov
          </span>
        )}
        {field.type === 'calculated' && (
          <Badge variant="active" className="text-[9px] h-4 py-0 px-1.5 border-success-line/30">
            Авторасчёт
          </Badge>
        )}
      </div>

      {field.type === 'string' && (
        <input
          id={field.id}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={field.disabled || field.readonly}
          placeholder={field.ui?.placeholder ?? 'Введите значение...'}
          className={cn(inputBase, (field.disabled || field.readonly) && 'bg-bg-2 text-fg-3 cursor-not-allowed')}
        />
      )}

      {field.type === 'number' && (
        <input
          id={field.id}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
          className={inputBase}
          type="number"
          placeholder="0"
        />
      )}

      {field.type === 'select' && (
        <select
          id={field.id}
          value={String(value ?? field.options?.[0] ?? '')}
          onChange={(event) => onChange(event.target.value)}
          className={cn(inputBase, 'appearance-none cursor-pointer')}
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option} className="bg-bg-3">
              {option}
            </option>
          ))}
        </select>
      )}

      {field.type === 'file' && (
        <input
          id={field.id}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.files?.[0]?.name ?? '')
          }
          className={cn(inputBase, 'file:mr-3 file:py-1 file:px-3 file:rounded-r1 file:border-0 file:text-xs file:font-bold file:bg-bg-4 file:text-fg-2 hover:file:bg-bg-5 cursor-pointer')}
          type="file"
        />
      )}

      {field.type === 'calculated' && (
        <input
          id={field.id}
          value={calculatedValue === undefined || calculatedValue === null ? '' : String(calculatedValue)}
          readOnly
          className="w-full rounded-r2 border border-line-2 bg-bg-2 px-3 py-2.5 text-sm font-bold text-fg-2 outline-none cursor-not-allowed font-mono tabular-nums"
        />
      )}

      {field.ui?.helpText && (
        <p className="text-[11px] text-fg-4">{field.ui.helpText}</p>
      )}
      {error && (
        <p className="text-[12px] font-semibold text-danger mt-1">{translateError(error)}</p>
      )}
    </div>
  );
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function stripCalculatedValues(values: Record<string, unknown>, schema: ServiceSchema) {
  const calculatedIds = new Set(
    (schema?.steps ?? []).flatMap((step) =>
      (step.fields ?? []).filter((field) => field.type === 'calculated').map((field) => field.id)
    )
  );
  return Object.fromEntries(Object.entries(values).filter(([key]) => !calculatedIds.has(key)));
}

function computeCalculatedPreview(step: FormStep, values: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  step.fields
    .filter((field) => field.type === 'calculated' && field.formula)
    .forEach((field) => {
      output[field.id] = evaluateExpr(field.formula, { ...values, ...output });
    });
  return output;
}

function evaluateExpr(node: ExprNode | undefined, values: Record<string, unknown>): unknown {
  if (!node) return '';
  if (node.type === 'ref') return values[node.field] ?? 0;
  if (node.type === 'value') return node.value;
  const args = node.args?.map((arg) => evaluateExpr(arg, values)) ?? [];
  const nums = args.map((arg) => Number(arg || 0));
  switch (node.op) {
    case 'add': return nums[0] + nums[1];
    case 'subtract': return nums[0] - nums[1];
    case 'multiply': return nums[0] * nums[1];
    case 'divide': return nums[1] === 0 ? 0 : nums[0] / nums[1];
    case 'round': return Math.round(nums[0]);
    default: return '';
  }
}

function translateError(error: string) {
  if (error.includes('required')) return 'Обязательное поле';
  if (error.includes('pattern')) return 'Неверный формат';
  if (error.includes('Invalid option')) return 'Выберите значение из списка';
  if (error.includes('valid number')) return 'Введите число';
  return error;
}
