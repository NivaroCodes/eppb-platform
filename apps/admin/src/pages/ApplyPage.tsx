import { useParams } from 'react-router-dom';
import { ApplicationWizard } from '@/components/ApplicationWizard';

export function ApplyPage() {
  const { serviceCode } = useParams<{ serviceCode: string }>();
  return (
    <div className="min-h-screen bg-bg-1">
      <ApplicationWizard
        serviceCode={serviceCode ?? ''}
        backTo={`/portal/${serviceCode ?? ''}`}
      />
    </div>
  );
}
