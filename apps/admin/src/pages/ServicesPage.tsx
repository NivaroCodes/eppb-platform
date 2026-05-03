import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Upload, Loader2, ArrowRight, ChevronLeft, ChevronRight, UploadCloud, Code2 } from 'lucide-react';
import { useFormsStore } from '@/store/services';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

export function FormsPage() {
  const { forms, loading, apiAvailable, loadForms, createForm, deleteForm, publishForm } = useFormsStore();
  const navigate = useNavigate();
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const filtered = forms.filter((f) => {
    if (filterPublished === 'all') return true;
    if (filterPublished === 'published') return f.is_published;
    return !f.is_published;
  });

  const totalDrafts = forms.filter((f) => !f.is_published).length;
  const totalOrgs = new Set(forms.map(f => f.schema.serviceCode.split('-')[0])).size;
  const totalValidationErrors = forms.filter(f => f.schema.steps.some(s => s.fields.length === 0)).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = async () => {
    const newSchema = {
      serviceCode: `service-${Date.now()}`,
      version: '1.0.0',
      title: 'Новая услуга',
      description: '',
      config: { allowDrafts: true, autoSave: true },
      steps: [
        { id: 'step_1', title: 'Шаг 1', fields: [], transitions: [] },
      ],
    };
    const created = await createForm('Новая услуга', newSchema);
    if (created) navigate(`/form/${created.id}`);
  };

  const handleDelete = (id: string) => {
    deleteForm(id);
    setDeleteConfirm(null);
  };

  const stats = [
    { label: 'Всего услуг', value: forms.length, change: '+4%', color: 'text-orange-500' },
    { label: 'В обработке', value: totalDrafts, change: null, color: 'text-orange-500' },
    { label: 'Организации', value: totalOrgs, change: null, color: 'text-white' },
    { label: 'Ошибки валидации', value: totalValidationErrors, change: null, color: 'text-red-500' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-semibold text-white leading-tight tracking-tight">Каталог услуг</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Управление реестром электронных услуг и бизнес-процессов
            {!apiAvailable && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-500/15 text-yellow-500 text-xs rounded-full">offline</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Tabs */}
          <div className="flex bg-[#2a2a2a] p-1 rounded-xl backdrop-blur-xl bg-white/[0.03] border border-white/10">
            {(['all', 'published', 'draft'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilterPublished(f); setPage(1); }}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                  filterPublished === f ? 'bg-orange-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
                )}
              >
                {f === 'all' ? 'Все' : f === 'published' ? 'Активные' : 'Черновики'}
              </button>
            ))}
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
          >
            <Plus size={18} />
            Создать услугу
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:border-orange-500/30 transition-colors">
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">{stat.label}</span>
            <div className="flex items-end gap-2 mt-2">
              <p className={cn('text-4xl font-black', stat.color)}>{stat.value}</p>
              {stat.change && (
                <span className="text-xs text-emerald-500 font-bold mb-1.5">{stat.change}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="backdrop-blur-xl bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Название услуги</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Организация</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Категория</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Статус</th>
                <th className="text-center px-5 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Шаги</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-zinc-500 text-sm">
                    {filterPublished !== 'all'
                      ? 'Услуги не найдены. Попробуйте изменить фильтры.'
                      : 'Нет услуг. Создайте первую услугу.'}
                  </td>
                </tr>
              ) : (
                paginated.map((form) => (
                  <tr
                    key={form.id}
                    className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/form/${form.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-white group-hover:text-orange-500 transition-colors">{form.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                        {form.schema.description || 'Без описания'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-300">
                      {form.schema.serviceCode.split('-')[0].toUpperCase() || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        {form.schema.config.integrationRequired?.[0] || 'Общее'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          form.is_published ? 'bg-emerald-500' : 'bg-yellow-500'
                        )} />
                        <span className={cn(
                          'text-xs font-bold uppercase tracking-wider',
                          form.is_published ? 'text-emerald-500' : 'text-yellow-500'
                        )}>
                          {form.is_published ? 'Активна' : 'Черновик'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm text-zinc-300 font-mono">{form.schema.steps.length}</span>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => navigate(`/form/${form.id}`)}
                          className="p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-orange-500 transition-colors"
                          title="Редактировать"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/form/${form.id}/preview`)}
                          className="p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                          title="Предпросмотр"
                        >
                          <Eye size={15} />
                        </button>
                        {!form.is_published && (
                          <button
                            onClick={() => publishForm(form.id)}
                            className="p-2 rounded-lg hover:bg-emerald-500/15 text-zinc-500 hover:text-emerald-500 transition-colors"
                            title="Опубликовать"
                          >
                            <Upload size={15} />
                          </button>
                        )}
                        {deleteConfirm === form.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button onClick={() => handleDelete(form.id)} className="px-2.5 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">Да</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1 text-xs bg-white/10 text-zinc-300 rounded-md hover:bg-white/15 transition-colors">Нет</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(form.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
              <span className="text-xs text-zinc-500">
                Показано {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} из {filtered.length} услуг
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                      p === page
                        ? 'bg-orange-500 text-white font-bold'
                        : 'text-zinc-500 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Promo Cards */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-8 backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-xl p-6 flex items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
            <Code2 size={24} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Конструктор JSON-схем</h3>
            <p className="text-sm text-zinc-500 mb-3">
              Используйте визуальный редактор для настройки полей и валидаций без написания кода.
            </p>
            <button
              onClick={() => navigate('/schema')}
              className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              Перейти в конструктор <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <div className="col-span-4 backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <UploadCloud size={28} className="text-zinc-500 mb-2" />
          <h3 className="text-sm font-bold text-white mb-1">Импорт из JSON</h3>
          <p className="text-xs text-zinc-500">Перетащите файл или выберите на диске</p>
        </div>
      </div>
    </div>
  );
}
