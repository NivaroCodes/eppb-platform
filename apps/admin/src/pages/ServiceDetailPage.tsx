import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { useFormsStore } from '@/store/services';

export function ServiceDetailPage() {
  const navigate = useNavigate();
  const { serviceCode } = useParams<{ serviceCode: string }>();
  const { forms, loadForms } = useFormsStore();

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const form = forms.find((item) => item.schema.serviceCode === serviceCode);
  const documents = useMemo(
    () =>
      form?.schema.steps.flatMap((step) =>
        step.fields
          .filter((field) => field.type === 'file')
          .map((field) => ({ ...field, stepTitle: step.title }))
      ) ?? [],
    [form]
  );

  if (!form) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm text-slate-500">Услуга не найдена</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/portal" className="font-semibold text-orange-700 hover:text-orange-800">
          Главная
        </Link>
        <span className="mx-2">/</span>
        <span>Услуги</span>
        <span className="mx-2">/</span>
        <span>{form.schema.title}</span>
      </nav>

      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              {form.schema.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {form.schema.description || 'Описание услуги будет добавлено администратором.'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/portal/${form.schema.serviceCode}/apply`)}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700"
          >
            Подать заявку
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
          <InfoItem label="Количество шагов" value={`${form.schema.steps.length}`} />
          <InfoItem
            label="Интеграции"
            value={(form.schema.config.integration_required ?? []).join(', ') || 'Нет'}
          />
          <InfoItem label="Версия схемы" value={form.schema.version} />
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-slate-950">Необходимые документы</h2>
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">Документы не требуются</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex gap-3 rounded-lg bg-slate-50 p-3">
                  <FileText size={18} className="mt-0.5 text-slate-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{doc.label}</p>
                    <p className="text-xs text-slate-500">{doc.stepTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-slate-950">Этапы подачи</h2>
          <ol className="space-y-3">
            {form.schema.steps.map((step, index) => (
              <li key={step.id} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-black text-orange-700">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{step.title}</p>
                  {step.description && <p className="text-xs text-slate-500">{step.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
