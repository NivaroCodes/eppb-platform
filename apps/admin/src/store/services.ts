import { create } from 'zustand';
import type { FormRecord, ServiceSchema } from '@/types/schema';
import { mockForms } from '@/data/mock-services';

const API_BASE = 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
}

interface FormsState {
  forms: FormRecord[];
  loading: boolean;
  apiAvailable: boolean;

  loadForms: () => Promise<void>;
  createForm: (name: string, schema: ServiceSchema) => Promise<FormRecord | null>;
  updateForm: (id: string, schema: ServiceSchema) => void;
  deleteForm: (id: string) => void;
  publishForm: (id: string) => Promise<boolean>;
}

export const useFormsStore = create<FormsState>((set, get) => ({
  forms: [],
  loading: false,
  apiAvailable: false,

  loadForms: async () => {
    set({ loading: true });
    const data = await apiFetch<FormRecord[]>('/forms');
    if (data) {
      set({ forms: data, loading: false, apiAvailable: true });
    } else {
      set({ forms: mockForms, loading: false, apiAvailable: false });
    }
  },

  createForm: async (name, schema) => {
    const { apiAvailable } = get();
    if (apiAvailable) {
      const created = await apiFetch<FormRecord>('/forms', {
        method: 'POST',
        body: JSON.stringify({ name, description: schema.description, schema, schema_version: schema.version }),
      });
      if (created) {
        set((state) => ({ forms: [...state.forms, created] }));
        return created;
      }
    }
    const newForm: FormRecord = {
      id: String(Date.now()),
      name,
      description: schema.description,
      schema,
      schema_version: schema.version,
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({ forms: [...state.forms, newForm] }));
    return newForm;
  },

  updateForm: (id, schema) => {
    const { apiAvailable } = get();
    if (apiAvailable) {
      apiFetch(`/forms/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: schema.title, description: schema.description, schema, schema_version: schema.version }),
      });
    }
    set((state) => ({
      forms: state.forms.map((f) =>
        f.id === id
          ? { ...f, schema, name: schema.title, schema_version: schema.version, updated_at: new Date().toISOString() }
          : f
      ),
    }));
  },

  deleteForm: (id) => {
    set((state) => ({
      forms: state.forms.filter((f) => f.id !== id),
    }));
  },

  publishForm: async (id) => {
    const { apiAvailable } = get();
    if (apiAvailable) {
      const result = await apiFetch(`/forms/${id}/publish`, { method: 'POST' });
      if (result) {
        set((state) => ({
          forms: state.forms.map((f) =>
            f.id === id ? { ...f, is_published: true } : f
          ),
        }));
        return true;
      }
    }
    set((state) => ({
      forms: state.forms.map((f) =>
        f.id === id ? { ...f, is_published: true } : f
      ),
    }));
    return true;
  },
}));
