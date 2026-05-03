import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { CheckCircle2, ChevronDown, Download, XCircle } from 'lucide-react';
import { useFormsStore } from '@/store/services';

export function SchemaViewerPage() {
  const { forms, loadForms } = useFormsStore();
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  useEffect(() => {
    if (!selectedId && forms.length > 0) setSelectedId(forms[0].id);
  }, [forms, selectedId]);

  const selectedForm = forms.find((form) => form.id === selectedId);
  const schema = selectedForm?.schema;
  const jsonContent = schema ? JSON.stringify(schema, null, 2) : '';

  const stats = useMemo(() => {
    const steps = schema?.steps ?? [];
    const fields = steps.reduce((total, step) => total + step.fields.length, 0);
    const rules = steps.reduce(
      (total, step) =>
        total +
        step.transitions.length +
        step.fields.filter((field) => field.validation).length,
      0
    );
    return { steps: steps.length, fields, rules };
  }, [schema]);

  const validity = validateSchema(jsonContent);

  const handleExport = () => {
    if (!schema) return;
    const filename = `${schema.serviceCode}.json`;
    const blob = new Blob([JSON.stringify(schema, null, 2)], {
      type: 'application/json; charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Просмотр схем</h1>
          <p className="mt-2 text-sm text-slate-500">
            Read-only просмотр JSON Contract v2.0 для выбранной услуги
          </p>
        </div>
        <div className="relative min-w-[320px]">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.schema.title}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Stat label="Шаги" value={stats.steps} />
        <Stat label="Поля" value={stats.fields} />
        <Stat label="Правила" value={stats.rules} />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Статус</p>
          <div className="mt-2 flex items-center gap-2">
            {validity.ok ? (
              <CheckCircle2 size={20} className="text-emerald-600" />
            ) : (
              <XCircle size={20} className="text-red-600" />
            )}
            <span className="text-sm font-black text-slate-950">
              {validity.ok ? 'Валидна' : 'Ошибка'}
            </span>
          </div>
          {!validity.ok && <p className="mt-1 text-xs text-red-700">{validity.message}</p>}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="font-mono text-sm font-bold text-slate-700">
            {schema?.serviceCode ?? 'schema'}.json
          </span>
          <button
            onClick={handleExport}
            disabled={!schema}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Экспорт
          </button>
        </div>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={jsonContent}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 16 },
          }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function validateSchema(value: string): { ok: boolean; message?: string } {
  if (!value) return { ok: false, message: 'Схема не выбрана' };
  try {
    const parsed = JSON.parse(value) as { serviceCode?: unknown; steps?: unknown };
    if (typeof parsed.serviceCode !== 'string' || !parsed.serviceCode.trim()) {
      return { ok: false, message: 'Нет serviceCode' };
    }
    if (!Array.isArray(parsed.steps)) {
      return { ok: false, message: 'steps должен быть массивом' };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Invalid JSON' };
  }
}
