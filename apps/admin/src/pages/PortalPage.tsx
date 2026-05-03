import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useFormsStore } from '@/store/services';

export function PortalPage() {
  const navigate = useNavigate();
  const { forms, apiAvailable, loadForms } = useFormsStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const published = useMemo(
    () =>
      forms
        .filter((form) => form.is_published)
        .filter((form) => {
          const query = search.trim().toLowerCase();
          return (
            !query ||
            form.schema.title.toLowerCase().includes(query) ||
            form.schema.description.toLowerCase().includes(query)
          );
        }),
    [forms, search]
  );

  return (
    <main>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950">
            Единый портал поддержки бизнеса
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Цифровые услуги институтов развития Казахстана
          </p>
          <div className="relative mt-8 max-w-2xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Найти услугу поддержки"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-4 pl-12 pr-4 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {!apiAvailable && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Работаем с локальными данными.
          </div>
        )}

        {published.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <p className="text-sm font-semibold text-slate-500">Опубликованные услуги не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {published.map((form) => (
              <article
                key={form.id}
                className="flex min-h-[250px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex-1">
                  <h2 className="line-clamp-2 text-lg font-black leading-6 text-slate-950">
                    {form.schema.title}
                  </h2>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                    {form.schema.description || 'Описание услуги будет добавлено администратором.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(form.schema.config.integration_required ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-slate-500">
                    {form.schema.steps.length} шагов
                  </span>
                  <button
                    onClick={() => navigate(`/portal/${form.schema.serviceCode}`)}
                    className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700"
                  >
                    Подробнее
                    <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
