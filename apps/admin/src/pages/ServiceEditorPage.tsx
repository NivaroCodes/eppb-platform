import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft,
  Copy,
  Download,
  Edit3,
  Eye,
  GripVertical,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exprToString } from '@/lib/expr';
import { useFormsStore } from '@/store/services';
import type { ExprNode, ExprOp, FieldType, FormField, FormStep, ServiceSchema, Transition } from '@/types/schema';

type EditorTab = 'builder' | 'json';
type FieldModalState = { mode: 'create' | 'edit'; field?: FormField; index?: number } | null;

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  string: 'Строка',
  number: 'Число',
  select: 'Список',
  file: 'Файл',
  calculated: 'Вычисляемое',
};

const OPERATORS: Array<{ label: string; value: ExprOp }> = [
  { label: '=', value: 'eq' },
  { label: '≠', value: 'neq' },
  { label: '>', value: 'gt' },
  { label: '<', value: 'lt' },
  { label: '≥', value: 'gte' },
  { label: '≤', value: 'lte' },
  { label: 'входит в список', value: 'in' },
];

export function FormEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { forms, loading, loadForms, updateForm, publishForm } = useFormsStore();
  const [tab, setTab] = useState<EditorTab>('builder');
  const [schema, setSchema] = useState<ServiceSchema | null>(null);
  const [selectedStepId, setSelectedStepId] = useState('');
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldModal, setFieldModal] = useState<FieldModalState>(null);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const form = forms.find((item) => item.id === id);

  useEffect(() => {
    if (!form) return;
    setSchema(form.schema);
    setSelectedStepId((current) => current || form.schema.steps[0]?.id || '');
  }, [form]);

  useEffect(() => {
    if (schema && tab === 'builder') {
      setJsonValue(JSON.stringify(schema, null, 2));
    }
  }, [schema, tab]);

  const selectedStep = useMemo(
    () => schema?.steps.find((step) => step.id === selectedStepId) ?? schema?.steps[0],
    [schema, selectedStepId]
  );

  if (loading && !schema) {
    return <div className="p-8 text-sm text-slate-500">Загрузка услуги...</div>;
  }

  if (!form || !schema || !selectedStep) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Услуга не найдена</p>
        <button
          onClick={() => navigate('/services')}
          className="mt-4 text-sm font-bold text-orange-700 hover:text-orange-800"
        >
          Вернуться в каталог
        </button>
      </div>
    );
  }

  const setSteps = (updater: (steps: FormStep[]) => FormStep[]) => {
    setSchema((current) => (current ? { ...current, steps: updater(current.steps) } : current));
  };

  const updateSelectedStep = (patch: Partial<FormStep>) => {
    setSteps((steps) =>
      steps.map((step) => (step.id === selectedStep.id ? { ...step, ...patch } : step))
    );
  };

  const handleAddStep = () => {
    const nextIndex = schema.steps.length + 1;
    const newStep: FormStep = {
      id: `step_${nextIndex}`,
      title: `Шаг ${nextIndex}`,
      description: '',
      fields: [],
      transitions: [],
    };
    setSteps((steps) => [...steps, newStep]);
    setSelectedStepId(newStep.id);
  };

  const handleDeleteStep = (stepId: string) => {
    const step = schema.steps.find((item) => item.id === stepId);
    if (!step) return;
    if (step.fields.length > 0 && !window.confirm('Удалить шаг вместе с полями?')) return;
    const nextSteps = schema.steps.filter((item) => item.id !== stepId);
    setSchema({ ...schema, steps: nextSteps });
    setSelectedStepId(nextSteps[0]?.id || '');
  };

  const handleSave = async () => {
    let schemaToSave = schema;
    if (tab === 'json') {
      try {
        const parsed = JSON.parse(jsonValue) as ServiceSchema;
        setJsonError(null);
        setSchema(parsed);
        schemaToSave = parsed;
      } catch (error) {
        setJsonError(error instanceof Error ? error.message : 'JSON invalid');
        return;
      }
    }
    setSaving(true);
    try {
      await updateForm(form.id, schemaToSave);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    await publishForm(form.id);
  };

  const handleJsonChange = (value: string | undefined) => {
    const nextValue = value ?? '';
    setJsonValue(nextValue);
    try {
      const parsed = JSON.parse(nextValue) as ServiceSchema;
      setJsonError(null);
      setSchema(parsed);
      setSelectedStepId((current) => parsed.steps.find((step) => step.id === current)?.id ?? parsed.steps[0]?.id ?? '');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'JSON invalid');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(schema, null, 2)], {
      type: 'application/json; charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${schema.serviceCode}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-8 py-5">
        <div className="mb-4 flex items-center gap-3 text-sm">
          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft size={16} />
            Каталог
          </button>
          <StatusBadge published={form.is_published} />
          {schema.config.auto_save && (
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
              Автосохранение включено
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-5">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Название услуги</span>
            <input
              value={schema.title}
              onChange={(event) => setSchema({ ...schema, title: event.target.value })}
              className="w-full border-0 bg-transparent p-0 text-3xl font-black tracking-tight text-slate-950 outline-none"
            />
          </label>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || (!!jsonError && tab === 'json')}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
            {!form.is_published && (
              <button
                onClick={handlePublish}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <Send size={17} />
                Опубликовать
              </button>
            )}
            <button
              onClick={() => navigate(`/services/${form.id}/preview`)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Eye size={17} />
              Превью
            </button>
            <button
              onClick={() => navigate('/schema')}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Просмотр схемы
            </button>
          </div>
        </div>

        <div className="mt-5 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <TabButton active={tab === 'builder'} onClick={() => setTab('builder')}>
            Конструктор
          </TabButton>
          <TabButton
            active={tab === 'json'}
            onClick={() => {
              setTab('json');
              setJsonValue(JSON.stringify(schema, null, 2));
            }}
          >
            JSON
          </TabButton>
        </div>
      </div>

      {tab === 'builder' ? (
        <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_300px] bg-slate-50">
          <aside className="border-r border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Шаги</h2>
              <button
                onClick={handleAddStep}
                className="rounded-lg bg-orange-50 p-2 text-orange-700 hover:bg-orange-100"
                aria-label="Добавить шаг"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {schema.steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-3 py-3 text-left',
                    selectedStep.id === step.id
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  )}
                >
                  <GripVertical size={15} className="text-slate-300" />
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {step.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{step.id}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0 overflow-auto p-6">
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-400">
                      Название шага
                    </span>
                    <input
                      value={selectedStep.title}
                      onChange={(event) => updateSelectedStep({ title: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-lg font-bold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-400">
                      Описание
                    </span>
                    <input
                      value={selectedStep.description ?? ''}
                      onChange={(event) => updateSelectedStep({ description: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      placeholder="Необязательное описание шага"
                    />
                  </label>
                </div>
                {schema.steps.length > 1 && (
                  <button
                    onClick={() => handleDeleteStep(selectedStep.id)}
                    className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50"
                    aria-label="Удалить шаг"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-950">Поля шага</h3>
                <button
                  onClick={() => setFieldModal({ mode: 'create' })}
                  className="flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700"
                >
                  <Plus size={16} />
                  Добавить поле
                </button>
              </div>

              {selectedStep.fields.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
                  <p className="text-sm font-semibold text-slate-500">Добавьте первое поле</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedStep.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-4 rounded-lg border border-slate-200 p-4"
                    >
                      <GripVertical size={16} className="text-slate-300" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">{field.label}</p>
                          <TypeBadge type={field.type} />
                          {(field.required || field.validation?.required) && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                              Обязательное
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-xs text-slate-400">{field.id}</p>
                        {field.type === 'calculated' && (
                          <p className="mt-2 rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600">
                            {exprToString(field.formula)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setFieldModal({ mode: 'edit', field, index })}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                        aria-label="Редактировать поле"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Удалить поле?')) {
                            updateSelectedStep({
                              fields: selectedStep.fields.filter((_, itemIndex) => itemIndex !== index),
                            });
                          }
                        }}
                        className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50"
                        aria-label="Удалить поле"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="overflow-auto border-l border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">
                Переходы
              </h2>
              <button
                onClick={() =>
                  updateSelectedStep({
                    transitions: [
                      ...selectedStep.transitions,
                      {
                        to: schema.steps.find((step) => step.id !== selectedStep.id)?.id ?? '',
                        condition: { type: 'op', op: 'always', args: [] },
                      },
                    ],
                  })
                }
                className="rounded-lg bg-orange-50 p-2 text-orange-700 hover:bg-orange-100"
                aria-label="Добавить переход"
              >
                <Plus size={16} />
              </button>
            </div>

            {selectedStep.transitions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Нет переходов. Такой шаг считается финальным.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedStep.transitions.map((transition, index) => (
                  <TransitionEditor
                    key={`${transition.to}-${index}`}
                    transition={transition}
                    currentStep={selectedStep}
                    steps={schema.steps}
                    onChange={(updated) =>
                      updateSelectedStep({
                        transitions: selectedStep.transitions.map((item, itemIndex) =>
                          itemIndex === index ? updated : item
                        ),
                      })
                    }
                    onDelete={() =>
                      updateSelectedStep({
                        transitions: selectedStep.transitions.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                  />
                ))}
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="min-h-0 flex-1 bg-slate-50 p-6">
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Прямое редактирование JSON. Изменения синхронизируются с конструктором.
          </div>
          {jsonError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Ошибка JSON: {jsonError}
            </div>
          )}
          <div className="flex h-[calc(100vh-285px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="font-mono text-sm font-bold text-slate-700">
                {schema.serviceCode}.json
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(jsonValue)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                  aria-label="Копировать"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={handleExport}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                  aria-label="Экспорт"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonValue}
              onChange={handleJsonChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                formatOnPaste: true,
                automaticLayout: true,
                tabSize: 2,
                padding: { top: 16 },
              }}
            />
          </div>
        </div>
      )}

      {fieldModal && (
        <FieldEditorModal
          modal={fieldModal}
          fields={selectedStep.fields}
          onClose={() => setFieldModal(null)}
          onSave={(field) => {
            const fields =
              fieldModal.mode === 'edit' && fieldModal.index !== undefined
                ? selectedStep.fields.map((item, index) => (index === fieldModal.index ? field : item))
                : [...selectedStep.fields, field];
            updateSelectedStep({ fields });
            setFieldModal(null);
          }}
        />
      )}
    </div>
  );
}

function FieldEditorModal({
  modal,
  fields,
  onClose,
  onSave,
}: {
  modal: Exclude<FieldModalState, null>;
  fields: FormField[];
  onClose: () => void;
  onSave: (field: FormField) => void;
}) {
  const source = modal.field;
  const [id, setId] = useState(source?.id ?? '');
  const [label, setLabel] = useState(source?.label ?? '');
  const [type, setType] = useState<FieldType>(source?.type ?? 'string');
  const [required, setRequired] = useState(Boolean(source?.required || source?.validation?.required));
  const [readonly, setReadonly] = useState(Boolean(source?.readonly));
  const [placeholder, setPlaceholder] = useState(source?.ui?.placeholder ?? '');
  const [helpText, setHelpText] = useState(source?.ui?.helpText ?? '');
  const [options, setOptions] = useState<string[]>(source?.options ?? []);
  const [optionDraft, setOptionDraft] = useState('');
  const [formula, setFormula] = useState<ExprNode | undefined>(
    source?.formula ?? (source?.type === 'calculated' ? { type: 'value', value: 0 } : undefined)
  );
  const [deps, setDeps] = useState((source?.deps ?? []).join(', '));
  const [min, setMin] = useState(source?.validation?.min?.toString() ?? '');
  const [max, setMax] = useState(source?.validation?.max?.toString() ?? '');
  const [pattern, setPattern] = useState(source?.validation?.pattern ?? '');
  const [minLength, setMinLength] = useState(source?.validation?.minLength?.toString() ?? '');
  const [maxLength, setMaxLength] = useState(source?.validation?.maxLength?.toString() ?? '');
  const [autofill, setAutofill] = useState(source?.autofill?.source === 'egov_mock');
  const [showFormula, setShowFormula] = useState(false);

  const idValid = /^[a-z0-9_]+$/.test(id);

  const addOption = () => {
    const next = optionDraft.trim();
    if (!next || options.includes(next)) return;
    setOptions([...options, next]);
    setOptionDraft('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!idValid || !label.trim()) return;

    const validation: FormField['validation'] = {};
    if (required) validation.required = true;
    if (type === 'number') {
      if (min) validation.min = Number(min);
      if (max) validation.max = Number(max);
    }
    if (type === 'string') {
      if (pattern) validation.pattern = pattern;
      if (minLength) validation.minLength = Number(minLength);
      if (maxLength) validation.maxLength = Number(maxLength);
    }

    const field: FormField = {
      id,
      label,
      type,
      readonly,
      required,
      ui: {
        ...(placeholder ? { placeholder } : {}),
        ...(helpText ? { helpText } : {}),
      },
      ...(Object.keys(validation).length > 0 ? { validation } : {}),
      ...(type === 'select' ? { options } : {}),
      ...(type === 'calculated'
        ? {
            readonly: true,
            formula: formula ?? { type: 'value', value: 0 },
            deps: deps
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
          }
        : {}),
      ...(type === 'string' && autofill ? { autofill: { source: 'egov_mock' } } : {}),
    };

    onSave(field);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {modal.mode === 'edit' ? 'Редактировать поле' : 'Новое поле'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Настройка поля без изменения JSON вручную</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextInput label="ID" value={id} onChange={setId} mono error={!idValid && id ? 'Только a-z, 0-9 и _' : undefined} />
          <TextInput label="Метка" value={label} onChange={setLabel} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Тип</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as FieldType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-4 pb-2">
            <Checkbox label="Обязательное" checked={required} onChange={setRequired} />
            <Checkbox label="Только чтение" checked={readonly || type === 'calculated'} onChange={setReadonly} disabled={type === 'calculated'} />
          </div>
          <TextInput label="Placeholder" value={placeholder} onChange={setPlaceholder} />
          <TextInput label="Подсказка" value={helpText} onChange={setHelpText} />
        </div>

        {type === 'select' && (
          <section className="mt-5 rounded-lg border border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Опции</h3>
            <div className="flex gap-2">
              <input
                value={optionDraft}
                onChange={(event) => setOptionDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addOption();
                  }
                }}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={addOption}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Добавить
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setOptions(options.filter((item) => item !== option))}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700"
                >
                  {option} ×
                </button>
              ))}
            </div>
          </section>
        )}

        {type === 'calculated' && (
          <section className="mt-5 rounded-lg border border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Формула</h3>
            <pre className="mb-3 rounded-lg bg-slate-950 p-3 text-sm text-slate-100">
              {formula ? exprToString(formula) : 'Формула не задана'}
            </pre>
            <button
              type="button"
              onClick={() => setShowFormula((value) => !value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Настроить формулу
            </button>
            <TextInput label="Deps" value={deps} onChange={setDeps} className="mt-4" />
            {showFormula && (
              <FormulaBuilder
                fields={fields}
                onSave={(nextFormula) => {
                  setFormula(nextFormula);
                  setShowFormula(false);
                }}
              />
            )}
          </section>
        )}

        {(type === 'string' || type === 'number') && (
          <details className="mt-5 rounded-lg border border-slate-200 p-4">
            <summary className="cursor-pointer text-sm font-black uppercase tracking-wide text-slate-500">
              Валидация
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {type === 'number' ? (
                <>
                  <TextInput label="Min" value={min} onChange={setMin} />
                  <TextInput label="Max" value={max} onChange={setMax} />
                </>
              ) : (
                <>
                  <TextInput label="Pattern" value={pattern} onChange={setPattern} />
                  <TextInput label="Min length" value={minLength} onChange={setMinLength} />
                  <TextInput label="Max length" value={maxLength} onChange={setMaxLength} />
                </>
              )}
            </div>
          </details>
        )}

        {type === 'string' && (
          <details className="mt-5 rounded-lg border border-slate-200 p-4">
            <summary className="cursor-pointer text-sm font-black uppercase tracking-wide text-slate-500">
              Автозаполнение
            </summary>
            <div className="mt-4 space-y-3">
              <Checkbox label="Автозаполнение из eGov" checked={autofill} onChange={setAutofill} />
              {autofill && (
                <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">
                  Источник: egov_mock
                </p>
              )}
            </div>
          </details>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!idValid || !label.trim()}
            className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}

function TransitionEditor({
  transition,
  currentStep,
  steps,
  onChange,
  onDelete,
}: {
  transition: Transition;
  currentStep: FormStep;
  steps: FormStep[];
  onChange: (transition: Transition) => void;
  onDelete: () => void;
}) {
  const draft = conditionToDraft(transition.condition, currentStep);
  const fields = currentStep.fields.filter((field) => field.type !== 'calculated');

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950">→ {transition.to || 'не выбран'}</p>
          <p className="truncate font-mono text-xs text-slate-500">
            {exprToString(transition.condition)}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-red-700 hover:bg-red-50"
          aria-label="Удалить переход"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-xs font-bold text-slate-500">Перейти к шагу</span>
        <select
          value={transition.to}
          onChange={(event) => onChange({ ...transition, to: event.target.value })}
          className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
        >
          <option value="">Не выбран</option>
          {steps
            .filter((step) => step.id !== currentStep.id)
            .map((step) => (
              <option key={step.id} value={step.id}>
                {step.title}
              </option>
            ))}
        </select>
      </label>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() =>
            onChange({ ...transition, condition: { type: 'op', op: 'always', args: [] } })
          }
          className={cn(
            'rounded-lg border px-2 py-2 text-xs font-bold',
            draft.mode === 'always'
              ? 'border-orange-200 bg-orange-50 text-orange-700'
              : 'border-slate-200 text-slate-600'
          )}
        >
          Всегда
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...transition,
              condition: buildCondition(fields[0]?.id ?? '', 'eq', ''),
            })
          }
          className={cn(
            'rounded-lg border px-2 py-2 text-xs font-bold',
            draft.mode === 'condition'
              ? 'border-orange-200 bg-orange-50 text-orange-700'
              : 'border-slate-200 text-slate-600'
          )}
        >
          По условию
        </button>
      </div>

      {draft.mode === 'condition' && (
        <div className="space-y-2">
          <select
            value={draft.field}
            onChange={(event) =>
              onChange({
                ...transition,
                condition: buildCondition(event.target.value, draft.op, draft.value),
              })
            }
            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
          >
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label}
              </option>
            ))}
          </select>
          <select
            value={draft.op}
            onChange={(event) =>
              onChange({
                ...transition,
                condition: buildCondition(draft.field, event.target.value as ExprOp, draft.value),
              })
            }
            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
          >
            {OPERATORS.map((operator) => (
              <option key={operator.value} value={operator.value}>
                {operator.label}
              </option>
            ))}
          </select>
          <input
            value={draft.value}
            onChange={(event) =>
              onChange({
                ...transition,
                condition: buildCondition(draft.field, draft.op, event.target.value),
              })
            }
            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
            placeholder="Значение"
          />
        </div>
      )}
    </div>
  );
}

function FormulaBuilder({
  fields,
  onSave,
}: {
  fields: FormField[];
  onSave: (formula: ExprNode) => void;
}) {
  const selectableFields = fields.filter((field) => field.type === 'number');
  const [operator, setOperator] = useState<ExprOp>('multiply');
  const [operandA, setOperandA] = useState(selectableFields[0]?.id ?? '');
  const [operandB, setOperandB] = useState(selectableFields[1]?.id ?? selectableFields[0]?.id ?? '');
  const [literalA, setLiteralA] = useState('');
  const [literalB, setLiteralB] = useState('');
  const [useLiteralA, setUseLiteralA] = useState(false);
  const [useLiteralB, setUseLiteralB] = useState(false);

  const formula: ExprNode =
    operator === 'round'
      ? { type: 'op', op: 'round', args: [operandNode(useLiteralA, operandA, literalA)] }
      : {
          type: 'op',
          op: operator,
          args: [
            operandNode(useLiteralA, operandA, literalA),
            operandNode(useLiteralB, operandB, literalB),
          ],
        };

  return (
    <div className="mt-4 rounded-lg bg-slate-50 p-4">
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-500">Оператор</span>
          <select
            value={operator}
            onChange={(event) => setOperator(event.target.value as ExprOp)}
            className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="add">+</option>
            <option value="subtract">-</option>
            <option value="multiply">×</option>
            <option value="divide">÷</option>
            <option value="round">round</option>
          </select>
        </label>
        <OperandInput
          label="Операнд A"
          fields={selectableFields}
          value={operandA}
          literal={literalA}
          useLiteral={useLiteralA}
          onValue={setOperandA}
          onLiteral={setLiteralA}
          onUseLiteral={setUseLiteralA}
        />
        {operator !== 'round' && (
          <OperandInput
            label="Операнд B"
            fields={selectableFields}
            value={operandB}
            literal={literalB}
            useLiteral={useLiteralB}
            onValue={setOperandB}
            onLiteral={setLiteralB}
            onUseLiteral={setUseLiteralB}
          />
        )}
      </div>
      <p className="mt-3 rounded bg-white px-3 py-2 font-mono text-xs text-slate-700">
        {exprToString(formula)}
      </p>
      <button
        type="button"
        onClick={() => onSave(formula)}
        className="mt-3 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700"
      >
        Сохранить формулу
      </button>
    </div>
  );
}

function OperandInput({
  label,
  fields,
  value,
  literal,
  useLiteral,
  onValue,
  onLiteral,
  onUseLiteral,
}: {
  label: string;
  fields: FormField[];
  value: string;
  literal: string;
  useLiteral: boolean;
  onValue: (value: string) => void;
  onLiteral: (value: string) => void;
  onUseLiteral: (value: boolean) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <select
        value={useLiteral ? '__literal__' : value}
        onChange={(event) => {
          const next = event.target.value;
          onUseLiteral(next === '__literal__');
          if (next !== '__literal__') onValue(next);
        }}
        className="mb-2 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
      >
        {fields.map((field) => (
          <option key={field.id} value={field.id}>
            {field.label}
          </option>
        ))}
        <option value="__literal__">Число</option>
      </select>
      {useLiteral && (
        <input
          value={literal}
          onChange={(event) => onLiteral(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
          type="number"
        />
      )}
    </label>
  );
}

function operandNode(useLiteral: boolean, field: string, literal: string): ExprNode {
  if (useLiteral) return { type: 'value', value: Number(literal || 0) };
  return { type: 'ref', field };
}

function conditionToDraft(condition: ExprNode, step: FormStep) {
  if (condition.type === 'op' && condition.op === 'always') {
    return { mode: 'always' as const, field: step.fields[0]?.id ?? '', op: 'eq' as ExprOp, value: '' };
  }
  if (condition.type === 'op') {
    const fieldNode = condition.args?.[0];
    const valueNode = condition.args?.[1];
    return {
      mode: 'condition' as const,
      field: fieldNode?.type === 'ref' ? fieldNode.field : step.fields[0]?.id ?? '',
      op: condition.op as ExprOp,
      value:
        valueNode?.type === 'value'
          ? Array.isArray(valueNode.value)
            ? valueNode.value.join(', ')
            : String(valueNode.value ?? '')
          : '',
    };
  }
  return { mode: 'condition' as const, field: step.fields[0]?.id ?? '', op: 'eq' as ExprOp, value: '' };
}

function buildCondition(field: string, op: ExprOp, value: string): ExprNode {
  const parsedValue =
    op === 'in' || op === 'not_in'
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : parseLiteral(value);
  return {
    type: 'op',
    op,
    args: [
      { type: 'ref', field },
      { type: 'value', value: parsedValue },
    ],
  };
}

function parseLiteral(value: string) {
  const numeric = Number(value);
  if (value.trim() !== '' && Number.isFinite(numeric)) return numeric;
  return value;
}

function TextInput({
  label,
  value,
  onChange,
  mono,
  error,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100',
          mono && 'font-mono',
          error ? 'border-red-300' : 'border-slate-300'
        )}
      />
      {error && <span className="mt-1 block text-xs font-semibold text-red-700">{error}</span>}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-orange-600"
      />
      {label}
    </label>
  );
}

function TypeBadge({ type }: { type: FieldType }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
      {FIELD_TYPE_LABELS[type]}
    </span>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-bold',
        published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      )}
    >
      {published ? 'Активна' : 'Черновик'}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md px-4 py-2 text-sm font-bold',
        active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
      )}
    >
      {children}
    </button>
  );
}
