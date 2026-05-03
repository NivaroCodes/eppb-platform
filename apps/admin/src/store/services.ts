import { create } from 'zustand';
import { mockForms } from '@/data/mock-services';
import { useNotificationsStore } from '@/store/notifications';
import type { FormRecord, ServiceSchema } from '@/types/schema';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...JSON_HEADERS,
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return undefined as T;
  return (await res.json()) as T;
}

function pushError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
  useNotificationsStore.getState().push({
    type: 'error',
    title: 'Ошибка',
    message,
  });
}

interface FormsState {
  forms: FormRecord[];
  loading: boolean;
  apiAvailable: boolean;
  error: string | null;

  loadForms: () => Promise<void>;
  createForm: (name: string, schema: ServiceSchema) => Promise<FormRecord>;
  updateForm: (id: string, schema: ServiceSchema) => Promise<FormRecord>;
  publishForm: (id: string) => Promise<FormRecord>;
  archiveForm: (id: string) => Promise<FormRecord>;
  getFormById: (id: string) => FormRecord | undefined;
  getFormByServiceCode: (serviceCode: string) => FormRecord | undefined;
}

export const useFormsStore = create<FormsState>((set, get) => ({
  forms: [],
  loading: false,
  apiAvailable: false,
  error: null,

  loadForms: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<FormRecord[]>('/forms/');
      set({ forms: data, loading: false, apiAvailable: true, error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      set({
        forms: mockForms,
        loading: false,
        apiAvailable: false,
        error: `Backend unavailable: ${message}`,
      });
    }
  },

  createForm: async (name, schema) => {
    try {
      const created = await apiFetch<FormRecord>('/forms/', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: schema.description,
          schema,
          schema_version: schema.version,
        }),
      });
      set((state) => ({
        forms: [created, ...state.forms],
        apiAvailable: true,
        error: null,
      }));
      return created;
    } catch (e) {
      pushError(e);
      throw e;
    }
  },

  updateForm: async (id, schema) => {
    try {
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
      useNotificationsStore.getState().push({
        type: 'success',
        title: 'Услуга сохранена',
        message: schema.title,
      });
      return updated;
    } catch (e) {
      pushError(e);
      throw e;
    }
  },

  publishForm: async (id) => {
    try {
      const updated = await apiFetch<FormRecord>(`/forms/${id}/publish`, { method: 'POST' });
      set((state) => ({
        forms: state.forms.map((f) => (f.id === id ? updated : f)),
        apiAvailable: true,
        error: null,
      }));
      useNotificationsStore.getState().push({
        type: 'success',
        title: 'Услуга опубликована',
        message: updated.schema.title,
      });
      return updated;
    } catch (e) {
      pushError(e);
      throw e;
    }
  },

  archiveForm: async (id) => {
    try {
      const form = get().forms.find((item) => item.id === id);
      const updated = await apiFetch<FormRecord>(`/forms/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          is_published: false,
        }),
      });
      const archived = { ...(form ?? updated), ...updated, is_published: false };
      set((state) => ({
        forms: state.forms.map((item) => (item.id === id ? archived : item)),
        apiAvailable: true,
        error: null,
      }));
      useNotificationsStore.getState().push({
        type: 'info',
        title: 'Услуга архивирована',
        message: archived.schema.title,
      });
      return archived;
    } catch (e) {
      pushError(e);
      throw e;
    }
  },

  getFormById: (id) => get().forms.find((form) => form.id === id),

  getFormByServiceCode: (serviceCode) =>
    get().forms.find((form) => form.schema.serviceCode === serviceCode),
}));
