import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useAuthStore } from '@/store/auth';
import { LoginPage } from '@/pages/LoginPage';
import { FormsPage } from '@/pages/ServicesPage';
import { FormEditorPage } from '@/pages/ServiceEditorPage';
import { ServicePreviewPage } from '@/pages/ServicePreviewPage';
import { SchemaViewerPage } from '@/pages/SchemaViewerPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminProfilePage } from '@/pages/AdminProfilePage';
import { PortalPage } from '@/pages/PortalPage';
import { ServiceDetailPage } from '@/pages/ServiceDetailPage';
import { ApplyPage } from '@/pages/ApplyPage';
import { SuccessPage } from '@/pages/SuccessPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';

function RequireAuth() {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireAdmin() {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/portal" replace />;
  return <Outlet />;
}

function LoginRoute() {
  const user = useAuthStore((state) => state.user);
  if (user?.role === 'admin') return <Navigate to="/services" replace />;
  if (user?.role === 'user') return <Navigate to="/portal" replace />;
  return <LoginPage />;
}

function HomeRedirect() {
  const user = useAuthStore((state) => state.user);
  if (user?.role === 'user') return <Navigate to="/portal" replace />;
  return <Navigate to="/services" replace />;
}

function LegacyFormRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/services/${id ?? ''}/edit`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomeRedirect />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path="/services" element={<FormsPage />} />
            <Route path="/services/:id/edit" element={<FormEditorPage />} />
            <Route path="/services/:id/preview" element={<ServicePreviewPage />} />
            <Route path="/schema" element={<SchemaViewerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<AdminProfilePage />} />
            <Route path="/form/:id" element={<LegacyFormRedirect />} />
          </Route>
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<PublicLayout />}>
            <Route path="/portal" element={<PortalPage />} />
            <Route path="/portal/applications" element={<ApplicationsPage />} />
            <Route path="/portal/success" element={<SuccessPage />} />
            <Route path="/portal/:serviceCode" element={<ServiceDetailPage />} />
            <Route path="/portal/:serviceCode/apply" element={<ApplyPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
