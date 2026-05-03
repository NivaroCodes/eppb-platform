import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, GitBranch, Shield, AlertTriangle, GripVertical, Plus, Copy, AlignLeft } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useFormsStore } from '@/store/services';
import type { FormRecord, ServiceSchema } from '@/types/schema';
import { cn } from '@/lib/utils';

type EditorTab = 'general' | 'json';

export function FormEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { forms, updateForm, publishForm, loadForms } = useFormsStore();
  const [tab, setTab] = useState<EditorTab>('general');
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (forms.length === 0) loadForms();
  }, [forms.length, loadForms]);

  const form = forms.find((f) => f.id === id);

  useEffect(() => {
    if (form) {
      setJsonValue(JSON.stringify(form.schema, null, 2));
    }
  }, [form]);

  if (!form) {
    return (
      <div className="p-6">
        <p className="text-zinc-400">Форма не найдена</p>
        <button onClick={() => navigate('/')} className="mt-4 text-orange-500 text-sm hover:underline">
          Вернуться к списку
        </button>
      </div>
    );
  }

  const handleSave = () => {
    if (tab === 'json') {
      try {
        const parsed = JSON.parse(jsonValue) as ServiceSchema;
        setJsonError(null);
        updateForm(form.id, parsed);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setJsonError((e as Error).message);
      }
    } else {
      updateForm(form.id, form.schema);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSchemaFieldChange = (field: keyof ServiceSchema, value: string) => {
    const updated = { ...form.schema, [field]: value };
    updateForm(form.id, updated);
  };

  const handleJsonChange = (value: string | undefined) => {
    if (value !== undefined) {
      setJsonValue(value);
      try {
        JSON.parse(value);
        setJsonError(null);
      } catch (e) {
        setJsonError((e as Error).message);
      }
    }
  };

  const handlePublish = async () => {
    await publishForm(form.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <nav className="flex text-zinc-500 text-sm mb-2 gap-2 items-center">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={14} />
              Услуги
            </button>
            <span>/</span>
            <span className="text-orange-500">Редактирование</span>
          </nav>
          <h2 className="text-[32px] font-semibold text-white leading-tight tracking-tight">
            {form.schema.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-500 font-medium animate-pulse">Сохранено!</span>}
          <div className="flex bg-[#2a2a2a] p-1 rounded-xl backdrop-blur-xl bg-white/[0.03] border border-white/10">
            <button
              onClick={() => setTab('general')}
              className={cn(
                'px-6 py-2 rounded-lg font-bold text-sm transition-all',
                tab === 'general' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'
              )}
            >
              Основные
            </button>
            <button
              onClick={() => {
                setTab('json');
                setJsonValue(JSON.stringify(form.schema, null, 2));
              }}
              className={cn(
                'px-6 py-2 rounded-lg font-medium text-sm transition-all',
                tab === 'json' ? 'bg-orange-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
              )}
            >
              JSON-схема
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!!jsonError && tab === 'json'}
            className={cn(
              'bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-orange-500/20 transition-transform active:scale-95',
              jsonError && tab === 'json' && 'opacity-50 cursor-not-allowed'
            )}
          >
            Сохранить
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'general' ? (
        <GeneralTab form={form} onChange={handleSchemaFieldChange} onPublish={handlePublish} />
      ) : (
        <JsonTab value={jsonValue} error={jsonError} onChange={handleJsonChange} />
      )}
    </div>
  );
}

/* ─── General Tab: Bento Grid ─── */

function GeneralTab({
  form,
  onChange,
  onPublish,
}: {
  form: FormRecord;
  onChange: (field: keyof ServiceSchema, value: string) => void;
  onPublish: () => void;
}) {
  const schema = form.schema;
  const totalFields = schema.steps.reduce((acc, s) => acc + s.fields.length, 0);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column — 8 cols */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {/* General Info Card */}
        <section className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-xl p-6 shadow-[0_0_15px_rgba(255,87,26,0.15)] border-[rgba(255,87,26,0.2)]">
          <div className="flex items-center gap-2 mb-6 text-orange-500">
            <Info size={20} />
            <h3 className="text-2xl font-semibold">Общая информация</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-zinc-400 text-xs font-bold uppercase mb-2">Название услуги</label>
              <input
                type="text"
                value={schema.title}
                onChange={(e) => onChange('title', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-zinc-400 text-xs font-bold uppercase mb-2">Описание</label>
              <textarea
                value={schema.description}
                onChange={(e) => onChange('description', e.target.value)}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase mb-2">Код услуги</label>
              <input
                type="text"
                value={schema.serviceCode}
                onChange={(e) => onChange('serviceCode', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase mb-2">Версия</label>
              <input
                type="text"
                value={schema.version}
                onChange={(e) => onChange('version', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Steps Card */}
        <section className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-orange-500">
              <GitBranch size={20} />
              <h3 className="text-2xl font-semibold">Этапы процесса</h3>
            </div>
            <button className="text-sm font-bold text-orange-500 flex items-center gap-1 hover:bg-orange-500/10 px-3 py-1 rounded transition-colors">
              <Plus size={16} /> Добавить этап
            </button>
          </div>
          <div className="space-y-4">
            {schema.steps.map((step, i) => (
              <div
                key={step.id}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{step.title}</p>
                  <p className="text-zinc-500 text-xs truncate">
                    {step.description || `${step.fields.length} полей · ${step.transitions.length} переходов`}
                  </p>
                </div>
                <GripVertical size={18} className="text-zinc-600 group-hover:text-zinc-400 cursor-pointer shrink-0" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right Column — 4 cols */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        {/* Status & Meta Card */}
        <section className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase mb-3">Статус услуги</label>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  form.is_published
                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                )} />
                <span className="text-white font-bold">
                  {form.is_published ? 'Опубликована' : 'Черновик'}
                </span>
                {!form.is_published && (
                  <button
                    onClick={onPublish}
                    className="ml-auto text-zinc-500 text-sm hover:text-orange-500 transition-colors"
                  >
                    Опубликовать
                  </button>
                )}
              </div>
            </div>
            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between mb-2">
                <span className="text-zinc-500 text-sm">Код</span>
                <span className="text-zinc-300 text-sm font-mono">{schema.serviceCode}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-500 text-sm">Шагов</span>
                <span className="text-zinc-300 text-sm">{schema.steps.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Версия</span>
                <span className="text-orange-500 font-bold text-sm">v{form.schema_version}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Business Rules Card */}
        <section className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6 text-orange-500">
            <Shield size={20} />
            <h3 className="text-2xl font-semibold">Бизнес-правила</h3>
          </div>
          <div className="space-y-3">
            {schema.steps.map((step) =>
              step.transitions.map((t, ti) => (
                <div key={`${step.id}-${ti}`} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-500 uppercase">Условие перехода</p>
                    <p className="text-sm text-zinc-300 mt-1">
                      {step.title} → <span className="font-mono text-orange-500">{t.to}</span>: {t.condition}
                    </p>
                  </div>
                </div>
              ))
            )}
            <button className="w-full py-3 border border-white/10 border-dashed rounded-lg text-zinc-500 text-sm font-medium hover:bg-white/5 transition-colors mt-2">
              + Добавить правило
            </button>
          </div>
        </section>

        {/* Analytics Mini Card */}
        <div className="relative overflow-hidden rounded-xl h-32 backdrop-blur-xl bg-white/[0.03] border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
          <div className="relative p-6">
            <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Всего полей</p>
            <p className="text-4xl font-black text-orange-500">{totalFields}</p>
            <div className="mt-2 h-1 bg-white/10 rounded-full w-full">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, totalFields * 5)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── JSON Tab ─── */

function JsonTab({
  value,
  error,
  onChange,
}: {
  value: string;
  error: string | null;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-500">
          <strong>Ошибка JSON:</strong> {error}
        </div>
      )}
      <div className="flex-1 backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,87,26,0.15)] border-[rgba(255,87,26,0.3)]">
        <div className="bg-black/50 px-6 py-3 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-orange-500">schema.json</span>
            {!error && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded uppercase font-bold">
                Valid
              </span>
            )}
            {error && (
              <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded uppercase font-bold">
                Error
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(value)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <Copy size={16} />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <AlignLeft size={16} />
            </button>
          </div>
        </div>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={onChange}
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
  );
}
