import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { FormsPage } from '@/pages/ServicesPage';
import { FormEditorPage } from '@/pages/ServiceEditorPage';
import { SchemaViewerPage } from '@/pages/SchemaViewerPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminProfilePage } from '@/pages/AdminProfilePage';
import { LoginPage } from '@/pages/LoginPage';
import { PortalPage } from '@/pages/PortalPage';
import { ServiceDetailPage } from '@/pages/ServiceDetailPage';
import { ApplicationWizard } from '@/pages/ApplicationWizard';
import { SuccessPage } from '@/pages/SuccessPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/portal/:serviceCode" element={<ServiceDetailPage />} />
        <Route path="/portal/:serviceCode/apply" element={<ApplicationWizard />} />
        <Route path="/portal/success" element={<SuccessPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/" element={<FormsPage />} />
          <Route path="/form/:id" element={<FormEditorPage />} />
          <Route path="/schema" element={<SchemaViewerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<AdminProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
