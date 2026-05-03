// ===== JSON CONTRACT v1.0 (согласованный) =====

export type FieldType = 'string' | 'number' | 'select' | 'file' | 'calculated';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedFormats?: string[];
  maxSizeMB?: number;
}

export interface FieldUI {
  placeholder?: string;
  helpText?: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  defaultValue?: string | number | boolean | null;
  ui?: FieldUI;
  validation?: FieldValidation;
  options?: FieldOption[];
  formula?: string;
  readonly?: boolean;
}

export interface Transition {
  to: string;
  condition: string;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  transitions: Transition[];
}

export interface ServiceConfig {
  allowDrafts?: boolean;
  autoSave?: boolean;
  integrationRequired?: string[];
}

export interface ServiceSchema {
  serviceCode: string;
  version: string;
  title: string;
  description: string;
  config: ServiceConfig;
  steps: FormStep[];
}

// ===== Backend API types =====

export interface FormRecord {
  id: string;
  name: string;
  description?: string;
  schema: ServiceSchema;
  schema_version: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}
