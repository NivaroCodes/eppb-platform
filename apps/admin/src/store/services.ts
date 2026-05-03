import { create } from 'zustand';
import type { FormRecord, ServiceSchema } from '@/types/schema';

const API_BASE = 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  // Some endpoints (DELETE) may return no body
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return undefined as unknown as T;
  return (await res.json()) as T;
}

interface FormsState {
  forms: FormRecord[];
  loading: boolean;
  apiAvailable: boolean;
  error: string | null;

  loadForms: () => Promise<void>;
  createForm: (name: string, schema: ServiceSchema) => Promise<FormRecord>;
  updateForm: (id: string, schema: ServiceSchema) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  publishForm: (id: string) => Promise<void>;
}

export const useFormsStore = create<FormsState>((set) => ({
  forms: [],
  loading: false,
  apiAvailable: false,
  error: null,

  loadForms: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<FormRecord[]>('/forms');
      set({ forms: data, loading: false, apiAvailable: true, error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      set({ loading: false, apiAvailable: false, error: `Backend unavailable: ${msg}` });
    }
  },

  createForm: async (name, schema) => {
    const created = await apiFetch<FormRecord>('/forms', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: schema.description,
        schema,
        schema_version: schema.version,
      }),
    });
    set((state) => ({ forms: [...state.forms, created], apiAvailable: true, error: null }));
    return created;
  },

  updateForm: async (id, schema) => {
    const updated = await apiFetch<FormRecord>(`/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: schema.title,
        description: schema.description,
        schema,
        schema_version: schema.version,
      }),
    });
    set((state) => ({
      forms: state.forms.map((f) => (f.id === id ? updated : f)),
      apiAvailable: true,
      error: null,
    }));
  },

  deleteForm: async (id) => {
    await apiFetch<void>(`/forms/${id}`, { method: 'DELETE' });
    set((state) => ({
      forms: state.forms.filter((f) => f.id !== id),
      apiAvailable: true,
      error: null,
    }));
  },

  publishForm: async (id) => {
    const updated = await apiFetch<FormRecord>(`/forms/${id}/publish`, { method: 'POST' });
    set((state) => ({
      forms: state.forms.map((f) => (f.id === id ? updated : f)),
      apiAvailable: true,
      error: null,
    }));
  },
}));
