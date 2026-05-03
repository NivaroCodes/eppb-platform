import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormsStore } from '@/store/services';
import { MonoText } from '@/components/ui/MonoText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Search, Plus, Edit2, Eye, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FormsPage() {
  const navigate = useNavigate();
  const { forms, loading, apiAvailable, error, loadForms, createForm, publishForm } = useFormsStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Все');

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const stats = useMemo(() => {
    const total = forms.length;
    const published = forms.filter(f => f.is_published).length;
    const drafts = total - published;
    return { total, published, drafts };
  }, [forms]);

  const filteredForms = forms.filter(f => {
      const matchesSearch = (f.name?.toLowerCase() ?? '').includes(search.toLowerCase()) || 
                          (f.schema?.serviceCode?.toLowerCase() ?? '').includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'Все' || 
                          (activeFilter === 'Активные' && f.is_published) || 
                          (activeFilter === 'Черновики' && !f.is_published);
    return matchesSearch && matchesFilter;
  });

  const handleCreate = async () => {
    const name = prompt('Введите название новой услуги:');
    if (!name) return;
    try {
      const newSchema = {
        serviceCode: `service-${Date.now()}`,
        version: '1.0.0',
        title: name,
        description: '',
        config: { allow_drafts: true, auto_save: true, integration_required: [] },
        steps: [
          { id: 'step_1', title: 'Шаг 1', description: '', fields: [], transitions: [] },
        ],
      };
      const created = await createForm(name, newSchema);
      if (created) navigate(`/services/${created.id}/edit`);
    } catch {
      alert('Ошибка при создании услуги');
    }
  };

  const handlePublish = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await publishForm(id);
    } catch {
      // error already shown via notifications
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Mock data banner */}
      {!apiAvailable && error && (
        <div className="bg-warning/10 border border-warning/20 rounded-r3 px-4 py-3 flex items-center gap-3">
          <MonoText className="text-[11px] text-warning font-bold uppercase tracking-widest">
            ⚠ Локальные данные — бэкенд недоступен. Изменения не сохраняются.
          </MonoText>
        </div>
      )}

      <header className="flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-[36px] text-white tracking-tight leading-none mb-3">
            Каталог услуг
          </h1>
          <p className="text-fg-3 text-sm">
            Реестр электронных услуг · схемы JSON Contract v2.0
          </p>
        </div>

        {/* KPI Bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            label="Всего услуг" 
            value={String(stats.total)} 
            sub="ВСЕГО В РЕЕСТРЕ" 
          />
          <KPICard 
            label="Опубликовано" 
            value={String(stats.published)} 
            sub={`${Math.round((stats.published / (stats.total || 1)) * 100)}% ОТ КАТАЛОГА`}
            subColor="text-success"
          />
          <KPICard 
            label="Черновики" 
            value={String(stats.drafts)} 
            sub="→ ТРЕБУЮТ РЕВЬЮ" 
            subColor={stats.drafts > 0 ? "text-warning" : ""}
          />
          <KPICard 
            label="API статус" 
            value={apiAvailable ? "ONLINE" : "OFFLINE"} 
            sub={apiAvailable ? "BACKEND ACTIVE" : "ЛОКАЛЬНЫЕ ДАННЫЕ"} 
            subColor={apiAvailable ? "text-success" : "text-warning"}
            featured={apiAvailable}
          />
        </div>
      </header>

      {/* Filters Row */}
      <Panel className="bg-bg-2 border-line-2 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {['Все', 'Активные', 'Черновики'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all",
                activeFilter === f 
                  ? "bg-accent text-white shadow-lg shadow-accent/20" 
                  : "text-fg-3 hover:text-fg-1 hover:bg-bg-3"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" size={14} />
            <Input 
              placeholder="Поиск по реестру..." 
              className="pl-9 h-9 bg-bg-3 border-line-3 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleCreate}>
            <Plus size={16} /> Создать услугу
          </Button>
        </div>
      </Panel>

      {/* Table Panel */}
      <Panel className="p-0 overflow-hidden bg-bg-2 border-line-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line-2 bg-bg-3/50">
              <TableTh>НАЗВАНИЕ</TableTh>
              <TableTh>СТАТУС</TableTh>
              <TableTh>ШАГИ</TableTh>
              <TableTh>ВЕРСИЯ</TableTh>
              <TableTh className="w-48">ДЕЙСТВИЯ</TableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-1">
            {loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <MonoText className="text-fg-4 uppercase tracking-widest animate-pulse">Загрузка...</MonoText>
                </td>
              </tr>
            )}
            {filteredForms.map((form) => (
              <tr 
                key={form.id} 
                className="group hover:bg-bg-3/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/services/${form.id}/edit`)}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-white group-hover:text-accent transition-colors leading-tight">
                      {form.name}
                    </span>
                    <MonoText className="text-[10px] text-fg-4 uppercase tracking-widest">
                      # {form.schema?.serviceCode ?? '---'}
                    </MonoText>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={form.is_published ? 'active' : 'draft'}>
                    {form.is_published ? 'Активна' : 'Черновик'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <MonoText className="text-xs text-fg-2">{form.schema?.steps?.length ?? 0}</MonoText>
                </td>
                <td className="px-6 py-4">
                  <MonoText className="text-[11px] text-fg-3 tabular-nums">v{form.schema?.version || '1.0.0'}</MonoText>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/services/${form.id}/edit`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-r1 bg-bg-3 hover:bg-bg-4 border border-line-2 text-fg-2 hover:text-fg-1 text-xs font-bold transition-all"
                      title="Редактировать"
                    >
                      <Edit2 size={12} /> Редактировать
                    </button>
                    <button
                      onClick={() => navigate(`/services/${form.id}/preview`)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-r1 bg-bg-3 hover:bg-bg-4 border border-line-2 text-fg-2 hover:text-fg-1 text-xs font-bold transition-all"
                      title="Превью"
                    >
                      <Eye size={12} /> Превью
                    </button>
                    {!form.is_published && (
                      <button
                        onClick={(e) => handlePublish(e, form.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-r1 bg-accent-soft hover:bg-accent border border-accent-line/30 text-accent hover:text-white text-xs font-bold transition-all"
                        title="Опубликовать"
                      >
                        <Globe size={12} /> Опубликовать
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredForms.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <MonoText className="text-fg-4 uppercase tracking-widest">Реестр пуст</MonoText>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function KPICard({ label, value, sub, subColor, featured }: { label: string; value: string; sub: string; subColor?: string; featured?: boolean }) {
  return (
    <Panel className={cn(
      "p-5 flex flex-col gap-4 bg-bg-2 border-line-2 transition-all group",
      featured && "border-success-line bg-success-soft/5 shadow-[0_0_20px_rgba(34,197,94,0.05)]"
    )}>
      <MonoText className="text-[10px] text-fg-4 uppercase tracking-[0.15em] font-bold group-hover:text-fg-2 transition-colors">
        {label}
      </MonoText>
      <div className="flex items-end justify-between">
        <span className="font-display font-bold text-[32px] text-white tracking-tight leading-none">
          {value}
        </span>
        <MonoText className={cn("text-[9px] font-bold tracking-tighter uppercase", subColor || "text-fg-4")}>
          {sub}
        </MonoText>
      </div>
    </Panel>
  );
}

function TableTh({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-6 py-3 text-[10px] font-bold text-fg-3 uppercase tracking-[0.15em]", className)}>
      {children}
    </th>
  );
}
