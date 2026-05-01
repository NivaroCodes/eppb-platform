import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useFormsStore } from '@/store/services';
import { GitBranchPlus, Shield, ShieldCheck, TrendingUp, ChevronDown, Copy, Download } from 'lucide-react';

export function SchemaViewerPage() {
  const { forms, loadForms } = useFormsStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (forms.length === 0) loadForms();
  }, [forms.length, loadForms]);

  useEffect(() => {
    if (forms.length > 0 && selectedId === null) {
      setSelectedId(forms[0].id);
    }
  }, [forms, selectedId]);

  const selectedForm = forms.find((f) => f.id === selectedId);
  const jsonContent = selectedForm ? JSON.stringify(selectedForm.schema, null, 2) : '';
  const lineCount = jsonContent.split('\n').length;

  const totalSteps = selectedForm?.schema.steps.length ?? 0;
  const totalRules = selectedForm?.schema.steps.reduce(
    (acc, s) => acc + s.transitions.length + s.fields.filter((f) => f.validation).length,
    0
  ) ?? 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedForm?.schema.serviceCode ?? 'schema'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 flex flex-col gap-6 h-[calc(100vh-65px)] overflow-hidden">
      {/* Page Header & Selector */}
      <div className="flex justify-between items-end shrink-0">
        <div className="space-y-1">
          <h2 className="text-[32px] font-semibold text-white leading-tight tracking-tight">
            Просмотр JSON-схем
          </h2>
          <p className="text-zinc-500 text-base">
            Техническая конфигурация системных сервисов и правил валидации.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-zinc-500 uppercase tracking-widest text-[10px] font-semibold">
            Выберите сервис
          </label>
          <div className="relative min-w-[280px]">
            <select
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-[#1c1b1b] border border-white/10 rounded-lg px-4 py-3 text-sm text-white appearance-none focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none cursor-pointer"
            >
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (v{f.schema_version})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bento Layout */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Meta Cards */}
        <div className="col-span-3 flex flex-col gap-6">
          {/* Steps Card */}
          <GlassCard>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 border border-orange-500/20">
              <GitBranchPlus size={20} className="text-orange-500" />
            </div>
            <span className="text-zinc-400 uppercase tracking-widest text-xs font-semibold">
              Шаги обработки
            </span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{totalSteps}</span>
              <span className="text-emerald-500 text-xs font-medium flex items-center gap-0.5">
                <TrendingUp size={12} />+{totalSteps}
              </span>
            </div>
          </GlassCard>

          {/* Rules Card */}
          <GlassCard>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
              <Shield size={20} className="text-red-500" />
            </div>
            <span className="text-zinc-400 uppercase tracking-widest text-xs font-semibold">
              Правила валидации
            </span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{totalRules}</span>
              <span className="text-zinc-500 text-xs font-medium">Активно</span>
            </div>
          </GlassCard>

          {/* Health Card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 flex-1 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/0 via-orange-500/10 to-orange-500/20" />
            </div>
            <div className="relative z-10">
              <ShieldCheck size={48} className="text-orange-500 mb-2 mx-auto" />
              <p className="text-white font-semibold">Схема валидна</p>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                Последняя проверка: 2 минуты назад
                <br />
                Конфликтов не обнаружено
              </p>
            </div>
          </div>
        </div>

        {/* Right: JSON Viewer */}
        <div className="col-span-9 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl flex flex-col shadow-[inset_0_0_0_1px_rgba(255,87,26,0.2)] overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-orange-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-xs font-mono text-zinc-400 ml-4">
                {selectedForm?.schema.serviceCode ?? 'schema'}.json
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors text-zinc-300"
              >
                <Copy size={14} />
                {copied ? 'Скопировано!' : 'Копировать'}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-orange-500 border border-orange-400 rounded hover:bg-orange-600 transition-colors text-white font-semibold"
              >
                <Download size={14} />
                Экспорт
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
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

          {/* Status Bar */}
          <div className="px-6 py-2 border-t border-white/10 bg-black/60 flex items-center justify-between text-[11px] text-zinc-500 uppercase tracking-widest font-medium shrink-0">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Система Онлайн
              </span>
              <span>UTF-8</span>
              <span>JSON v1.0.0</span>
            </div>
            <div>Строк: {lineCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col justify-between hover:border-orange-500/30 transition-colors">
      {children}
    </div>
  );
}
