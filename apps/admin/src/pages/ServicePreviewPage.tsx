import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApplicationWizard } from '@/components/ApplicationWizard';
import { useFormsStore } from '@/store/services';

export function ServicePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { forms, loadForms } = useFormsStore();

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const form = forms.find((item) => item.id === id);

  if (!form) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Услуга не найдена</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-8 py-4">
        <Link
          to={`/services/${form.id}/edit`}
          className="text-sm font-bold text-orange-700 hover:text-orange-800"
        >
          ← Вернуться к редактору
        </Link>
      </div>
      <ApplicationWizard
        serviceCode={form.schema.serviceCode}
        preview
        backTo={`/services/${form.id}/edit`}
      />
    </div>
  );
}
