import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useFormsStore } from '@/store/services';
import type { ServiceSchema, FormStep } from '@/types/schema';
import { cn } from '@/lib/utils';
import { exprToString } from '@/lib/expr';
import { MonoText } from '@/components/ui/MonoText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Crumb } from '@/components/ui/Crumb';
import { 
  Download, 
  Eye, 
  Save, 
  Plus, 
  GripVertical, 
  Trash2, 
  Settings,
  Code,
  History,
  AlertCircle
} from 'lucide-react';

type EditorTab = 'constructor' | 'json' | 'history';

export function FormEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { forms, updateForm, loadForms } = useFormsStore();
  const [tab, setTab] = useState<EditorTab>('constructor');
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (forms.length === 0) loadForms();
  }, [forms.length, loadForms]);

  const form = forms.find((f) => f.id === id);

  useEffect(() => {
    if (form) {
      setJsonValue(JSON.stringify(form.schema, null, 2));
    }
  }, [form]);

  if (!form) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (tab === 'json') {
        const parsed = JSON.parse(jsonValue) as ServiceSchema;
        await updateForm(form.id, parsed);
      } else {
        await updateForm(form.id, form.schema);
      }
      setTimeout(() => setIsSaving(false), 500);
    } catch (e) {
      setJsonError((e as Error).message);
      setIsSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'BUILDER', href: '/services' },
    { label: 'КАТАЛОГ', href: '/services' },
    { label: form.name.toUpperCase(), active: true },
  ];

  return (
    <div className="flex flex-col h-screen bg-bg-1">
      {/* Service Header Bar */}
      <header className="px-8 py-6 border-b border-line-2 bg-bg-2/50 backdrop-blur-md">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-4">
            <Crumb items={breadcrumbs} />
            <div className="flex items-center gap-4">
              <Badge variant={form.is_published ? 'active' : 'draft'} className="px-2 py-0.5 uppercase tracking-wider text-[9px]">
                {form.is_published ? 'АКТИВНА' : 'ЧЕРНОВИК'}
              </Badge>
              <MonoText className="text-[11px] text-fg-4 uppercase tracking-[0.15em]">
                # {form.schema.serviceCode} · v{form.schema.version}
              </MonoText>
            </div>
            <h1 className="font-display font-bold text-[32px] text-white tracking-tight leading-none">
              {form.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-10 px-4">
              <Download size={16} className="mr-2" /> Экспорт JSON
            </Button>
            <Button variant="ghost" size="sm" className="h-10 px-4" onClick={() => navigate(`/portal/${form.schema.serviceCode}`)}>
              <Eye size={16} className="mr-2" /> Превью
            </Button>
            <Button size="sm" className="h-10 px-6 font-bold" onClick={handleSave} loading={isSaving}>
              <Save size={16} className="mr-2" /> Сохранить
            </Button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex gap-8">
          <TabButton 
            active={tab === 'constructor'} 
            onClick={() => setTab('constructor')} 
            label="КОНСТРУКТОР" 
            icon={Settings}
          />
          <TabButton 
            active={tab === 'json'} 
            onClick={() => {
              setTab('json');
              setJsonValue(JSON.stringify(form.schema, null, 2));
            }} 
            label="JSON" 
            icon={Code}
          />
          <TabButton 
            active={tab === 'history'} 
            onClick={() => setTab('history')} 
            label="ИСТОРИЯ ВЕРСИЙ" 
            icon={History}
          />
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 overflow-hidden">
        {tab === 'constructor' ? (
          <div className="grid grid-cols-[280px_1fr_320px] h-full divide-x divide-line-2">
            {/* LEFT: Steps Panel */}
            <aside className="bg-bg-2 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <MonoText className="text-[11px] text-fg-3 font-bold uppercase tracking-widest">ШАГИ · {form.schema.steps.length}</MonoText>
                <button className="p-1.5 rounded-r1 bg-accent-soft text-accent hover:bg-accent hover:text-white transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-3">
                {form.schema.steps.map((step, idx) => (
                  <StepCard 
                    key={step.id} 
                    step={step} 
                    index={idx} 
                    active={idx === 0} 
                  />
                ))}
              </div>
            </aside>

            {/* CENTER: Fields Panel */}
            <section className="bg-bg-1 overflow-y-auto p-10">
              <div className="max-w-3xl mx-auto space-y-10">
                <div className="flex items-end justify-between border-b border-line-2 pb-6">
                  <div className="space-y-2 flex-1 max-w-md">
                    <MonoText className="text-[10px] text-accent font-bold uppercase tracking-widest">ТЕКУЩИЙ ШАГ</MonoText>
                    <Input 
                      defaultValue={form.schema.steps[0]?.title} 
                      className="h-10 text-xl font-bold bg-transparent border-transparent hover:border-line-3 focus:bg-bg-2 px-0 hover:px-3 focus:px-3"
                    />
                  </div>
                  <MonoText className="text-[11px] text-fg-4 mb-3">ID: {form.schema.steps[0]?.id}</MonoText>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">Поля шага · {form.schema.steps[0]?.fields.length}</h3>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold border-line-3">
                      + Добавить поле
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {form.schema.steps[0]?.fields.map((field: any) => (
                      <FieldCard key={field.id} field={field} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT: Transitions Panel */}
            <aside className="bg-bg-2 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <MonoText className="text-[11px] text-fg-3 font-bold uppercase tracking-widest">ПЕРЕХОДЫ · {form.schema.steps[0]?.transitions.length}</MonoText>
                <button className="p-1.5 rounded-r1 bg-bg-3 text-fg-2 hover:bg-accent-soft hover:text-accent transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              
              <div className="space-y-4">
                {form.schema.steps[0]?.transitions.map((t: any, idx: number) => (
                  <TransitionCard key={idx} transition={t} />
                ))}
                
                <div className="mt-12 p-5 rounded-r3 bg-accent-soft/5 border border-accent-line/10">
                  <div className="flex items-center gap-2 text-accent mb-2">
                    <AlertCircle size={14} />
                    <MonoText className="text-[9px] font-bold uppercase tracking-wider">ВЛИЯНИЕ ПУБЛИКАЦИИ</MonoText>
                  </div>
                  <p className="text-[11px] text-fg-3 leading-relaxed">
                    Изменение условий на этом шаге затронет <span className="text-white font-bold">128 активных сессий</span>.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        ) : tab === 'json' ? (
          <div className="h-full flex flex-col p-8 bg-bg-1">
            <Panel className="flex-1 flex flex-col p-0 overflow-hidden bg-bg-2 border-line-2">
              <div className="px-6 py-3 border-b border-line-2 bg-bg-3/50 flex justify-between items-center">
                <MonoText className="text-[11px] text-accent font-bold uppercase tracking-widest">schema.json</MonoText>
                {jsonError ? (
                  <Badge variant="draft" className="bg-danger-soft text-danger border-danger-line/20">ERROR</Badge>
                ) : (
                  <Badge variant="active" className="text-[10px]">VALID</Badge>
                )}
              </div>
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonValue}
                onChange={(v) => {
                  setJsonValue(v || '');
                  try { JSON.parse(v || ''); setJsonError(null); } catch(e) { setJsonError((e as Error).message); }
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  padding: { top: 20 }
                }}
              />
            </Panel>
            {jsonError && (
              <div className="mt-4 p-4 bg-danger-soft border border-danger-line/30 rounded-r2 text-danger text-xs font-mono">
                {jsonError}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-fg-4">
            <MonoText className="uppercase tracking-[0.2em]">История версий временно недоступна</MonoText>
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: any }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 pb-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all relative",
        active ? "text-accent" : "text-fg-4 hover:text-fg-2"
      )}
    >
      <Icon size={14} />
      {label}
      {active && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent" />}
    </button>
  );
}

function StepCard({ step, index, active }: { step: FormStep; index: number; active?: boolean }) {
  return (
    <Panel className={cn(
      "p-3 flex items-center gap-3 cursor-pointer transition-all border-line-2 hover:border-line-3",
      active ? "bg-accent-soft/5 border-accent-line/30 ring-1 ring-accent-line/10" : "bg-bg-3/30"
    )}>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-colors",
        active ? "bg-accent text-white border-accent shadow-lg shadow-accent/20" : "bg-bg-3 border-line-3 text-fg-4"
      )}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn("text-xs font-bold truncate", active ? "text-white" : "text-fg-3")}>{step.title}</h4>
        <MonoText className="text-[9px] text-fg-4 uppercase tracking-tighter">
          {step.id} · {step.fields.length} ПОЛЕЙ
        </MonoText>
      </div>
      <GripVertical size={14} className="text-fg-5" />
    </Panel>
  );
}

function FieldCard({ field }: { field: any }) {
  const isCalculated = field.type === 'calculated';
  return (
    <Panel className={cn(
      "p-4 flex items-center gap-4 bg-bg-2 border-line-2 group hover:border-line-3",
      isCalculated && "bg-accent-soft/5 border-accent-line/20"
    )}>
      <div className="cursor-grab text-fg-5 group-hover:text-fg-4"><GripVertical size={16} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-bold text-white">{field.label}</span>
          <Badge variant="draft" className="text-[9px] h-4 py-0 px-1.5 uppercase font-bold tracking-tighter opacity-60">
            {field.type}
          </Badge>
        </div>
        <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest"># {field.id}</MonoText>
        
        {isCalculated && field.formula && (
          <div className="mt-3 p-2 rounded bg-bg-3 border border-line-3">
             <code className="text-[11px] font-mono text-accent">
               {astToMono(field.formula)}
             </code>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 text-fg-4 hover:text-fg-1 transition-colors"><Settings size={14} /></button>
        <button className="p-1.5 text-fg-4 hover:text-danger transition-colors"><Trash2 size={14} /></button>
      </div>
    </Panel>
  );
}

function TransitionCard({ transition }: { transition: any }) {
  return (
    <div className="p-4 rounded-r3 bg-bg-3 border border-line-2 space-y-3 group hover:border-line-3 transition-colors">
      <div className="flex items-center justify-between">
        <MonoText className="text-[10px] text-fg-3 uppercase tracking-widest">
          IF УСЛОВИЕ → <span className="text-accent">{transition.to}</span>
        </MonoText>
        <button className="text-fg-5 hover:text-danger transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
      </div>
      
      <div className="p-3 bg-bg-1 rounded border border-line-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
        <span className="text-fg-4">if </span>
        <span className="text-fg-2">{exprToString(transition.condition)}</span>
        <br />
        <span className="text-fg-4">then </span>
        <span className="text-accent">{transition.to}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full border border-fg-5" />
        <MonoText className="text-[9px] text-fg-5 uppercase tracking-tighter">ОБНОВЛЕНО ТОЛЬКО ЧТО · NO-CODE</MonoText>
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
