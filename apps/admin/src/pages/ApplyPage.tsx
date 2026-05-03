import { useParams } from 'react-router-dom';
import { ApplicationWizard } from '@/components/ApplicationWizard';

export function ApplyPage() {
  const { serviceCode } = useParams<{ serviceCode: string }>();
  return <ApplicationWizard serviceCode={serviceCode ?? ''} />;
}
