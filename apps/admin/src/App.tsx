import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PortalLayout } from '@/components/layout/PortalLayout';
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
        {/* Auth */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Home Redirect */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomeRedirect />} />
        </Route>

        {/* Admin Section */}
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

        {/* Portal Section — with sticky header */}
        <Route element={<RequireAuth />}>
          <Route element={<PortalLayout />}>
            <Route path="/portal" element={<PortalPage />} />
            <Route path="/portal/success" element={<SuccessPage />} />
            <Route path="/portal/:serviceCode" element={<ServiceDetailPage />} />
          </Route>
        </Route>

        {/* Apply wizard — full-screen, no portal header */}
        <Route element={<RequireAuth />}>
          <Route path="/portal/:serviceCode/apply" element={<ApplyPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
