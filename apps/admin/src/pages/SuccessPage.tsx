import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useFormsStore } from '@/store/services';
import { useNotificationsStore } from '@/store/notifications';

export function SuccessPage() {
  const [params] = useSearchParams();
  const pushed = useRef(false);
  const push = useNotificationsStore((state) => state.push);
  const forms = useFormsStore((state) => state.forms);
  const submissionId = params.get('submissionId') ?? '—';
  const refId = params.get('refId') ?? '—';
  const serviceCode = params.get('serviceCode') ?? '';
  const serviceTitle =
    forms.find((form) => form.schema.serviceCode === serviceCode)?.schema.title ?? serviceCode;

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    push({
      type: 'success',
      title: 'Заявка принята',
      message: refId,
    });
  }, [push, refId]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 size={70} className="mx-auto text-emerald-600" />
        <h1 className="mt-5 text-3xl font-black text-slate-950">Заявка принята</h1>
        <p className="mt-2 text-sm text-slate-500">{serviceTitle}</p>

        <div className="mt-8 grid gap-3 text-left">
          <InfoRow label="Submission ID" value={submissionId} />
          <InfoRow label="ЕИШ референс" value={refId} />
          <InfoRow label="Статус" value="На рассмотрении" />
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/portal"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Вернуться к услугам
          </Link>
          <Link
            to="/portal/applications"
            className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700"
          >
            Мои заявки
          </Link>
        </div>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="font-mono text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}
