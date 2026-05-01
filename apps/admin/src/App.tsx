import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { FormsPage } from '@/pages/ServicesPage';
import { FormEditorPage } from '@/pages/ServiceEditorPage';
import { SchemaViewerPage } from '@/pages/SchemaViewerPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<FormsPage />} />
          <Route path="/form/:id" element={<FormEditorPage />} />
          <Route path="/schema" element={<SchemaViewerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
