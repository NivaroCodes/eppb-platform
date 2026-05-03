import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE, useFormsStore } from '@/store/services';
import { useNotificationsStore } from '@/store/notifications';
import type { AdvanceResult, ExprNode, FormField, FormStep, ServiceSchema, SubmitResult } from '@/types/schema';

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
    setCurrentStepId((current) => current || form.schema.steps[0]?.id || '');
    setLoading(false);
  }, [forms, serviceCode]);

  const currentStep = useMemo(
    () => schema?.steps.find((step) => step.id === currentStepId) ?? null,
    [schema, currentStepId]
  );

  const currentIndex = schema?.steps.findIndex((step) => step.id === currentStepId) ?? -1;
  const previewCalculated = useMemo(
    () => (currentStep ? computeCalculatedPreview(currentStep, fieldValues) : {}),
    [currentStep, fieldValues]
  );

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
        <Loader2 size={28} className="animate-spin text-orange-600" />
      </div>
    );
  }

  if (!schema || !currentStep) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-slate-500">Услуга не найдена</p>
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
    } catch (error) {
      push({
        type: 'error',
        title: 'Ошибка',
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
          `/portal/success?submissionId=PREVIEW-${Date.now()}&refId=PREVIEW&serviceCode=${schema.serviceCode}`
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
      navigate(
        `/portal/success?submissionId=${encodeURIComponent(result.submission_id)}&refId=${encodeURIComponent(result.ref_id)}&serviceCode=${encodeURIComponent(schema.serviceCode)}`
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

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {preview && (
        <div className="mb-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-900">
          РЕЖИМ ПРЕДПРОСМОТРА — данные не сохраняются
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link
            to={backTo}
            className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Назад к услугам
          </Link>
          <h1 className="text-2xl font-black text-slate-950">{schema.title}</h1>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">
          Шаг {Math.max(currentIndex + 1, 1)} из {schema.steps.length}
        </span>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-orange-600"
            style={{ width: `${((currentIndex + 1) / schema.steps.length) * 100}%` }}
          />
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${schema.steps.length}, minmax(0, 1fr))` }}>
          {schema.steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'truncate text-xs font-bold',
                index <= currentIndex ? 'text-orange-700' : 'text-slate-400'
              )}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">{currentStep.title}</h2>
        {currentStep.description && (
          <p className="mt-2 text-sm leading-6 text-slate-600">{currentStep.description}</p>
        )}

        <div className="mt-6 space-y-5">
          {currentStep.fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm font-semibold text-slate-500">
              На этом шаге нет полей. Нажмите “Далее”, чтобы применить условие перехода.
            </div>
          ) : (
            currentStep.fields.map((field) => (
              <FieldControl
                key={field.id}
                field={field}
                value={fieldValues[field.id]}
                calculatedValue={calculatedValues[field.id] ?? previewCalculated[field.id]}
                error={errors[field.id]}
                onChange={(value) => handleFieldChange(field, value)}
                onBlur={() => handleAutofill(field)}
              />
            ))
          )}
        </div>

        {errors.__step__ && (
          <div className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertTriangle size={18} />
            {errors.__step__}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={back}
            disabled={stepHistory.length === 0}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Назад
          </button>
          <button
            onClick={advance}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={17} className="animate-spin" />}
            {readyToSubmit ? 'Подать заявку' : 'Далее'}
          </button>
        </div>
      </section>

      {sessionLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-slate-950">Сессия истекла</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Данные не сохранены. Начать заполнение заново?
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
            >
              Начать заново
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldControl({
  field,
  value,
  calculatedValue,
  error,
  onChange,
  onBlur,
}: {
  field: FormField;
  value: unknown;
  calculatedValue: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}) {
  const baseClass = cn(
    'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100',
    error ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
  );

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-800">
        {field.label}
        {(field.required || field.validation?.required) && <span className="text-red-600"> *</span>}
      </span>

      {field.type === 'string' && (
        <input
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={field.disabled || field.readonly}
          placeholder={field.ui?.placeholder}
          className={cn(baseClass, (field.disabled || field.readonly) && 'bg-slate-100 text-slate-500')}
        />
      )}

      {field.type === 'number' && (
        <input
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
          className={baseClass}
          type="number"
        />
      )}

      {field.type === 'select' && (
        <select
          value={String(value ?? field.options?.[0] ?? '')}
          onChange={(event) => onChange(event.target.value)}
          className={baseClass}
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      {field.type === 'file' && (
        <input
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.files?.[0]?.name ?? '')
          }
          className={baseClass}
          type="file"
        />
      )}

      {field.type === 'calculated' && (
        <input
          value={calculatedValue === undefined || calculatedValue === null ? '' : String(calculatedValue)}
          readOnly
          className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-700 outline-none"
        />
      )}

      {field.ui?.helpText && <span className="mt-1 block text-xs text-slate-500">{field.ui.helpText}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-red-700">{translateError(error)}</span>}
    </label>
  );
}

function stripCalculatedValues(values: Record<string, unknown>, schema: ServiceSchema) {
  const calculatedIds = new Set(
    schema.steps.flatMap((step) =>
      step.fields.filter((field) => field.type === 'calculated').map((field) => field.id)
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
    case 'add':
      return nums[0] + nums[1];
    case 'subtract':
      return nums[0] - nums[1];
    case 'multiply':
      return nums[0] * nums[1];
    case 'divide':
      return nums[1] === 0 ? 0 : nums[0] / nums[1];
    case 'round':
      return Math.round(nums[0]);
    default:
      return '';
  }
}

function translateError(error: string) {
  if (error.includes('required')) return 'Обязательное поле';
  if (error.includes('pattern')) return 'Неверный формат';
  if (error.includes('Invalid option')) return 'Выберите значение из списка';
  if (error.includes('valid number')) return 'Введите число';
  return error;
}
