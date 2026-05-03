import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApplicationWizard } from '@/components/ApplicationWizard';
import { useFormsStore } from '@/store/services';
import { MonoText } from '@/components/ui/MonoText';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

export function ServicePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { forms, loadForms } = useFormsStore();

  useEffect(() => {
    if (forms.length === 0) loadForms();
  }, [forms.length, loadForms]);

  if (forms.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-bg-1 min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  const form = forms.find((item) => item.id === id);

  if (!form) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-bg-1 min-h-[400px] gap-4">
        <MonoText className="text-fg-4 uppercase tracking-[0.2em]">404 · УСЛУГА НЕ НАЙДЕНА</MonoText>
        <Button variant="ghost" size="sm" onClick={() => navigate('/services')}>
          ← Вернуться к каталогу
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-bg-1 flex flex-col">
      {/* Preview Banner */}
      <div className="border-b border-line-2 bg-warning/10 px-8 py-3 flex items-center justify-between">
        <MonoText className="text-[11px] text-warning font-bold uppercase tracking-widest">
          ⚠ РЕЖИМ ПРЕДПРОСМОТРА — данные не сохраняются
        </MonoText>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/services/${form.id}/edit`)}
          className="text-xs"
        >
          ← Вернуться к редактору
        </Button>
      </div>
      <div className="flex-1">
        <ApplicationWizard
          serviceCode={form.schema.serviceCode}
          preview
          backTo={`/services/${form.id}/edit`}
        />
      </div>
    </div>
  );
}
