import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormsStore } from '@/store/services';
import { useNotificationsStore } from '@/store/notifications';
import type { ServiceSchema } from '@/types/schema';

type Filter = 'all' | 'published' | 'draft';

export function FormsPage() {
  const navigate = useNavigate();
  const push = useNotificationsStore((state) => state.push);
  const { forms, loading, apiAvailable, loadForms, createForm, publishForm, archiveForm } =
    useFormsStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const integrations = useMemo(
    () =>
      new Set(
        forms.flatMap((form) => form.schema.config.integration_required ?? []).filter(Boolean)
      ),
    [forms]
  );

  const filteredForms = forms.filter((form) => {
    const matchesStatus =
      filter === 'all' ||
      (filter === 'published' && form.is_published) ||
      (filter === 'draft' && !form.is_published);
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      form.schema.title.toLowerCase().includes(query) ||
      form.schema.description.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const handleArchive = async (id: string) => {
    setArchivingId(id);
    try {
      await archiveForm(id);
    } finally {
      setArchivingId(null);
    }
  };

  const handleCreate = async (schema: ServiceSchema) => {
    const created = await createForm(schema.title, schema);
    push({
      type: 'success',
      title: 'Услуга создана',
      message: schema.title,
    });
    navigate(`/services/${created.id}/edit`);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            Каталог услуг — Конструктор ЕППБ
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Управление реестром электронных услуг
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700"
        >
          <Plus size={18} />
          Создать услугу
        </button>
      </div>

      {!apiAvailable && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Работаем с локальными данными. Backend недоступен, изменения могут не сохраниться.
        </div>
      )}

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard label="Всего услуг" value={forms.length} />
        <StatCard label="Опубликовано" value={forms.filter((form) => form.is_published).length} />
        <StatCard label="Черновики" value={forms.filter((form) => !form.is_published).length} />
        <StatCard label="Интеграций" value={integrations.size} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию услуги"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          {([
            ['all', 'Все'],
            ['published', 'Активные'],
            ['draft', 'Черновики'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-bold',
                filter === value ? 'bg-orange-50 text-orange-700' : 'text-slate-500'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={26} className="animate-spin text-orange-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Название</Th>
                <Th>Статус</Th>
                <Th>Шаги</Th>
                <Th>Интеграции</Th>
                <Th align="right">Действия</Th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500">
                    Услуги не найдены
                  </td>
                </tr>
              ) : (
                filteredForms.map((form) => (
                  <tr key={form.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="max-w-xl px-6 py-4">
                      <div className="font-bold text-slate-950">{form.schema.title}</div>
                      <div className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                        {form.schema.description || 'Без описания'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge published={form.is_published} />
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {form.schema.steps.length}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(form.schema.config.integration_required ?? []).length > 0 ? (
                          form.schema.config.integration_required?.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400">Нет</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          icon={Pencil}
                          label="Редактировать"
                          onClick={() => navigate(`/services/${form.id}/edit`)}
                        />
                        <ActionButton
                          icon={Eye}
                          label="Превью"
                          onClick={() => navigate(`/services/${form.id}/preview`)}
                        />
                        {!form.is_published && (
                          <ActionButton
                            icon={Send}
                            label="Опубликовать"
                            onClick={() => publishForm(form.id)}
                          />
                        )}
                        {form.is_published && (
                          <ActionButton
                            icon={Archive}
                            label={archivingId === form.id ? 'Архивируем...' : 'Архивировать'}
                            onClick={() => handleArchive(form.id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {createOpen && (
        <CreateServiceModal
          onClose={() => setCreateOpen(false)}
          onCreate={async (schema) => {
            await handleCreate(schema);
            setCreateOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CreateServiceModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (schema: ServiceSchema) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [saving, setSaving] = useState(false);

  const generatedCode = serviceCode || slugify(title);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onCreate({
        serviceCode: generatedCode || `service-${Date.now()}`,
        version: '2.0.0',
        title: title.trim(),
        description: description.trim(),
        config: {
          allow_drafts: true,
          auto_save: false,
          integration_required: [],
        },
        steps: [
          {
            id: 'step_1',
            title: 'Шаг 1',
            fields: [],
            transitions: [
              {
                to: '',
                condition: { type: 'op', op: 'always', args: [] },
              },
            ],
          },
        ],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Создать услугу</h2>
            <p className="mt-1 text-sm text-slate-500">Новая схема JSON Contract v2.0</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Название услуги
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Описание</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-24 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Код услуги</span>
            <input
              value={generatedCode}
              onChange={(event) => setServiceCode(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </div>

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
            disabled={saving || !title.trim()}
            className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Создаём...' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
        published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      )}
    >
      {published ? 'Активна' : 'Черновик'}
    </span>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: string;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={cn(
        'px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-500',
        align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      {children}
    </th>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function slugify(value: string) {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'i',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ы: 'y',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };
  return value
    .toLowerCase()
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
